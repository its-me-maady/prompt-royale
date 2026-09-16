-- Add host_player_id and last_resolved_round columns to squads
ALTER TABLE squads ADD COLUMN IF NOT EXISTS host_player_id VARCHAR(100);
ALTER TABLE squads ADD COLUMN IF NOT EXISTS last_resolved_round INTEGER NOT NULL DEFAULT 0;

-- Function to start raid atomically (squads + squad_members) with server-side validation
CREATE OR REPLACE FUNCTION start_raid(
    target_squad_id UUID,
    host_id VARCHAR(100),
    member_ids VARCHAR(100)[],
    member_names VARCHAR(100)[]
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    num_members INTEGER;
    i INTEGER;
BEGIN
    -- Validate host_id
    IF host_id IS NULL OR length(trim(host_id)) = 0 THEN
        RAISE EXCEPTION 'Invalid host_id: host_id must be non-empty';
    END IF;

    -- Validate member arrays
    num_members := array_length(member_ids, 1);
    IF num_members IS NULL OR num_members < 2 THEN
        RAISE EXCEPTION 'Invalid member_ids: minimum of 2 members required to start raid';
    END IF;

    IF array_length(member_names, 1) IS DISTINCT FROM num_members THEN
        RAISE EXCEPTION 'Mismatched member arrays: member_ids and member_names must have the same length';
    END IF;

    -- 1. Insert squads row
    INSERT INTO squads (id, status, boss_hp, boss_max_hp, host_player_id, last_resolved_round)
    VALUES (target_squad_id, 'active', 1000, 1000, host_id, 0);

    -- 2. Insert squad_members rows
    FOR i IN 1..num_members LOOP
        INSERT INTO squad_members (squad_id, player_id, name, hp, status)
        VALUES (target_squad_id, member_ids[i], member_names[i], 100, 'alive');
    END LOOP;

    RETURN jsonb_build_object(
        'squad_id', target_squad_id,
        'status', 'active',
        'host_player_id', host_id,
        'member_count', num_members
    );
END;
$$;

-- Update resolve_raid_round with advisory locking and idempotency guard on last_resolved_round
CREATE OR REPLACE FUNCTION resolve_raid_round(
    target_squad_id UUID,
    current_round INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    squad_rec RECORD;
    correct_count INTEGER;
    total_alive INTEGER;
    boss_damage INTEGER := 0;
    player_damage INTEGER := 0;
    all_player_damage INTEGER := 0;
    updated_boss_hp INTEGER;
    result_status VARCHAR(50);
BEGIN
    -- a) Take advisory transaction lock scoped to squad so concurrent calls serialize
    PERFORM pg_advisory_xact_lock(hashtextextended(target_squad_id::text, 0));

    -- Fetch current squad state
    SELECT id, boss_hp, boss_max_hp, status, last_resolved_round
    INTO squad_rec
    FROM squads
    WHERE id = target_squad_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Squad not found: %', target_squad_id;
    END IF;

    -- b) Check if round has already been resolved; if so, short-circuit and return state unchanged
    IF squad_rec.last_resolved_round >= current_round THEN
        RETURN jsonb_build_object(
            'squad_id', target_squad_id,
            'status', squad_rec.status,
            'boss', jsonb_build_object('hp', squad_rec.boss_hp, 'maxHp', squad_rec.boss_max_hp),
            'players', (
                SELECT jsonb_agg(jsonb_build_object('id', player_id, 'hp', hp, 'status', status))
                FROM squad_members
                WHERE squad_id = target_squad_id
            )
        );
    END IF;

    -- 1. Count votes for the current round
    SELECT COUNT(*) INTO correct_count 
    FROM squad_votes 
    WHERE squad_id = target_squad_id AND round_number = current_round AND is_correct = TRUE;

    -- 2. Count alive players
    SELECT COUNT(*) INTO total_alive 
    FROM squad_members 
    WHERE squad_id = target_squad_id AND status = 'alive';

    -- Avoid division by zero
    IF total_alive = 0 THEN
        total_alive := 1;
    END IF;

    -- 3. Calculate damage profiles based on consensus ratio
    IF correct_count = total_alive THEN
        boss_damage := 100;
    ELSIF correct_count >= (total_alive * 0.75) THEN
        boss_damage := 60;
        player_damage := 25;
    ELSIF correct_count >= (total_alive * 0.5) THEN
        boss_damage := 25;
        player_damage := 25;
    ELSIF correct_count > 0 THEN
        boss_damage := 10;
        player_damage := 25;
    ELSE
        boss_damage := 0;
        all_player_damage := 30;
    END IF;

    -- 4. Apply boss damage
    UPDATE squads 
    SET boss_hp = GREATEST(0, boss_hp - boss_damage)
    WHERE id = target_squad_id
    RETURNING boss_hp INTO updated_boss_hp;

    -- 5. Apply player damage to players who voted incorrectly or did not vote
    UPDATE squad_members sm
    SET hp = GREATEST(0, sm.hp - (CASE WHEN all_player_damage > 0 THEN all_player_damage ELSE player_damage END)),
        status = CASE WHEN sm.hp - (CASE WHEN all_player_damage > 0 THEN all_player_damage ELSE player_damage END) <= 0 THEN 'dead' ELSE 'alive' END
    WHERE sm.squad_id = target_squad_id 
      AND sm.status = 'alive' 
      AND sm.player_id NOT IN (
          SELECT player_id FROM squad_votes 
          WHERE squad_id = target_squad_id AND round_number = current_round AND is_correct = TRUE
      );

    -- 6. Evaluate game transitions
    IF updated_boss_hp = 0 THEN
        result_status := 'victory';
    ELSIF NOT EXISTS (SELECT 1 FROM squad_members WHERE squad_id = target_squad_id AND status = 'alive') THEN
        result_status := 'revive';
    ELSE
        result_status := 'active';
    END IF;

    -- c) Set last_resolved_round = current_round and status in the same update
    UPDATE squads 
    SET status = result_status,
        last_resolved_round = current_round
    WHERE id = target_squad_id;

    -- 7. Clean up ephemeral votes for this round
    DELETE FROM squad_votes WHERE squad_id = target_squad_id AND round_number = current_round;

    -- 8. Return JSON payload matching GameState schema
    RETURN jsonb_build_object(
        'squad_id', target_squad_id,
        'status', result_status,
        'boss', jsonb_build_object('hp', updated_boss_hp, 'maxHp', 1000),
        'players', (
            SELECT jsonb_agg(jsonb_build_object('id', player_id, 'hp', hp, 'status', status))
            FROM squad_members
            WHERE squad_id = target_squad_id
        )
    );
END;
$$;

-- Drop public insert policies on squads and squad_members (all inserts now run server-side via start_raid RPC)
DROP POLICY IF EXISTS "Allow public insert on squads" ON squads;
DROP POLICY IF EXISTS "Allow public insert on squad_members" ON squad_members;
