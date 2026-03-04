
-- Add entities column to store extracted entities (names, amounts, IDs, dates, companies)
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS entities jsonb DEFAULT '[]'::jsonb;

-- Add full-text search index on key text columns
CREATE INDEX IF NOT EXISTS idx_files_fts ON public.files USING GIN (
  to_tsvector('english', coalesce(file_name, '') || ' ' || coalesce(ai_summary, '') || ' ' || coalesce(ai_description, '') || ' ' || coalesce(extracted_text, ''))
);
