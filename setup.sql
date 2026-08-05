CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT,
    metadata JSONB,
    embedding VECTOR(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE OR REPLACE FUNCTION match_knowledge_base(
    query_text text,
    filter jsonb DEFAULT '{}'
) RETURNS TABLE (
    id uuid,
    content text,
    metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT kb.id, kb.content, kb.metadata
    FROM knowledge_base kb
    WHERE filter = '{}'::jsonb OR kb.metadata @> filter
    LIMIT 5;
END;
$$;
