
-- Table to store Google Drive OAuth tokens
CREATE TABLE public.google_drive_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.google_drive_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own drive tokens"
  ON public.google_drive_tokens FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own drive tokens"
  ON public.google_drive_tokens FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own drive tokens"
  ON public.google_drive_tokens FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own drive tokens"
  ON public.google_drive_tokens FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Auto-update updated_at
CREATE TRIGGER update_google_drive_tokens_updated_at
  BEFORE UPDATE ON public.google_drive_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
