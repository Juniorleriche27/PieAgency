-- ============================================================
-- RAG (Retrieval-Augmented Generation) — WhatsApp Campus France
-- Cohere embed-multilingual-v3.0 produces 1024-dim vectors
-- Run this in Supabase SQL Editor ONCE before ingestion
-- ============================================================

-- 1. Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. RAG chunks table
CREATE TABLE IF NOT EXISTS public.rag_chunks (
  id        bigserial PRIMARY KEY,
  content   text        NOT NULL,
  embedding vector(1024),
  source    text        NOT NULL DEFAULT 'whatsapp_campus_france',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- 3. IVFFlat index for fast cosine similarity (tune lists = sqrt(row_count))
CREATE INDEX IF NOT EXISTS idx_rag_chunks_embedding
  ON public.rag_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- 4. RLS: allow anon reads, service-role writes
ALTER TABLE public.rag_chunks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'rag_chunks'
      AND policyname = 'rag_chunks_read_anon'
  ) THEN
    EXECUTE 'CREATE POLICY rag_chunks_read_anon ON public.rag_chunks FOR SELECT USING (true)';
  END IF;
END $$;

-- 5. Similarity-search helper function
CREATE OR REPLACE FUNCTION public.match_rag_chunks(
  query_embedding vector(1024),
  match_threshold float DEFAULT 0.4,
  match_count     int   DEFAULT 5
)
RETURNS TABLE (
  id         bigint,
  content    text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    content,
    1 - (embedding <=> query_embedding) AS similarity
  FROM public.rag_chunks
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
