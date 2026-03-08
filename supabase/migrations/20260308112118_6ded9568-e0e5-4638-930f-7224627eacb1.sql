
-- Add semantic_keywords column for AI-generated semantic concepts/synonyms
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS semantic_keywords text DEFAULT '';
