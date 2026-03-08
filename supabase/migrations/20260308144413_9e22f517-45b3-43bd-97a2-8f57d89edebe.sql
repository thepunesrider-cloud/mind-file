
-- Table to link WhatsApp phone numbers to user accounts
CREATE TABLE public.whatsapp_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  phone_number text NOT NULL UNIQUE,
  verified boolean NOT NULL DEFAULT false,
  verification_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own WhatsApp links"
  ON public.whatsapp_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own WhatsApp links"
  ON public.whatsapp_users FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own WhatsApp links"
  ON public.whatsapp_users FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own WhatsApp links"
  ON public.whatsapp_users FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Allow service role / edge functions to query by phone number
CREATE POLICY "Service can read by phone"
  ON public.whatsapp_users FOR SELECT
  TO anon
  USING (true);

-- Session state for multi-step WhatsApp conversations
CREATE TABLE public.whatsapp_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  session_type text NOT NULL DEFAULT 'idle',
  session_data jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;

-- Edge functions access via service role, anon for webhook
CREATE POLICY "Webhook can manage sessions"
  ON public.whatsapp_sessions FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
