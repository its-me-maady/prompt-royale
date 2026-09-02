-- Supabase Initial Schema Migration (ADR-0010)
-- agent-notes: { ctx: "Initial Database Migration Schema for Prompt Royale", deps: ["docs/adrs/0010-database-migration-isolation.md"], state: "canonical", last: "sato@2026-09-02" }

CREATE EXTENSION IF NOT EXISTS vector;

-- Knowledge Base Table for RAG embeddings
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT,
    metadata JSONB,
    embedding VECTOR(768),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Distributed Rate Limiting Table
CREATE TABLE IF NOT EXISTS rate_limits (
    key VARCHAR(255) PRIMARY KEY,
    count INTEGER DEFAULT 1,
    reset_time BIGINT NOT NULL
);

-- RAG Vector Match RPC Function
CREATE OR REPLACE FUNCTION match_knowledge_base(
    query_embedding vector(768),
    match_threshold float DEFAULT 0.0,
    match_count int DEFAULT 5,
    filter jsonb DEFAULT '{}'
) RETURNS TABLE (
    id uuid,
    content text,
    metadata jsonb,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        kb.id,
        kb.content,
        kb.metadata,
        1 - (kb.embedding <=> query_embedding) AS similarity
    FROM knowledge_base kb
    WHERE (filter = '{}'::jsonb OR kb.metadata @> filter)
      AND 1 - (kb.embedding <=> query_embedding) > match_threshold
    ORDER BY kb.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Squads Table storing game state
CREATE TABLE IF NOT EXISTS squads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR(50) DEFAULT 'lobby' NOT NULL, -- 'lobby' | 'active' | 'victory' | 'defeat' | 'revive'
    boss_hp INTEGER DEFAULT 1000 NOT NULL,
    boss_max_hp INTEGER DEFAULT 1000 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Squad Members Table tracking health and status
CREATE TABLE IF NOT EXISTS squad_members (
    squad_id UUID REFERENCES squads(id) ON DELETE CASCADE,
    player_id VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    hp INTEGER DEFAULT 100 NOT NULL,
    status VARCHAR(50) DEFAULT 'alive' NOT NULL, -- 'alive' | 'dead'
    PRIMARY KEY (squad_id, player_id)
);

-- Ephemeral Squad Votes Table for round answers
CREATE TABLE IF NOT EXISTS squad_votes (
    squad_id UUID REFERENCES squads(id) ON DELETE CASCADE,
    player_id VARCHAR(100) NOT NULL,
    round_number INTEGER NOT NULL,
    is_correct BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (squad_id, player_id, round_number)
);

-- Resolve Round RPC Function
CREATE OR REPLACE FUNCTION resolve_raid_round(
    target_squad_id UUID,
    current_round INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    correct_count INTEGER;
    total_alive INTEGER;
    boss_damage INTEGER := 0;
    player_damage INTEGER := 0;
    all_player_damage INTEGER := 0;
    updated_boss_hp INTEGER;
    result_status VARCHAR(50);
BEGIN
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

    UPDATE squads 
    SET status = result_status 
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

-- Enable Realtime publication safely if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE squads;
    ALTER PUBLICATION supabase_realtime ADD TABLE squad_members;
  END IF;
END $$;

-- Enable Row Level Security (RLS)
ALTER TABLE squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_votes ENABLE ROW LEVEL SECURITY;

-- Create Policies to allow client-side anonymous presence read/write access
DROP POLICY IF EXISTS "Allow public select on squads" ON squads;
CREATE POLICY "Allow public select on squads" ON squads FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on squads" ON squads;
CREATE POLICY "Allow public insert on squads" ON squads FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on squads" ON squads;
CREATE POLICY "Allow public update on squads" ON squads FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public select on squad_members" ON squad_members;
CREATE POLICY "Allow public select on squad_members" ON squad_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on squad_members" ON squad_members;
CREATE POLICY "Allow public insert on squad_members" ON squad_members FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on squad_members" ON squad_members;
CREATE POLICY "Allow public update on squad_members" ON squad_members FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public select on squad_votes" ON squad_votes;
CREATE POLICY "Allow public select on squad_votes" ON squad_votes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on squad_votes" ON squad_votes;
CREATE POLICY "Allow public insert on squad_votes" ON squad_votes FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on squad_votes" ON squad_votes;
CREATE POLICY "Allow public update on squad_votes" ON squad_votes FOR UPDATE USING (true);
