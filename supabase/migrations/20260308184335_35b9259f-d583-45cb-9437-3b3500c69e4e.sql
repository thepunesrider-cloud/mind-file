-- Analytics events table to track user activity
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL, -- 'upload', 'search', 'view', 'share', 'download'
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient queries
CREATE INDEX idx_analytics_user_date ON public.analytics_events (user_id, created_at DESC);
CREATE INDEX idx_analytics_type ON public.analytics_events (event_type);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own analytics
CREATE POLICY "Users can view own analytics" ON public.analytics_events
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own analytics
CREATE POLICY "Users can insert own analytics" ON public.analytics_events
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admins can view all analytics
CREATE POLICY "Admins can view all analytics" ON public.analytics_events
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Notifications table for expiry alerts
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'expiry_warning', 'expiry_today', 'system'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON public.notifications (user_id, read, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Teams/Workspaces table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Team members junction table
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member', 'viewer'
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

CREATE INDEX idx_team_members_user ON public.team_members (user_id);
CREATE INDEX idx_team_members_team ON public.team_members (team_id);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Shared folders within teams
CREATE TABLE public.team_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.team_folders ENABLE ROW LEVEL SECURITY;

-- Files in team folders
CREATE TABLE public.team_folder_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID REFERENCES public.team_folders(id) ON DELETE CASCADE NOT NULL,
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE NOT NULL,
  added_by UUID NOT NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(folder_id, file_id)
);

ALTER TABLE public.team_folder_files ENABLE ROW LEVEL SECURITY;

-- RLS for teams - members can view their teams
CREATE POLICY "Team members can view team" ON public.teams
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.team_members WHERE team_id = teams.id AND user_id = auth.uid())
  );

CREATE POLICY "Owners can update team" ON public.teams
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can create teams" ON public.teams
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can delete team" ON public.teams
  FOR DELETE USING (owner_id = auth.uid());

-- RLS for team_members
CREATE POLICY "Team members can view members" ON public.team_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid())
  );

CREATE POLICY "Team admins can manage members" ON public.team_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin'))
  );

-- RLS for team_folders
CREATE POLICY "Team members can view folders" ON public.team_folders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.team_members WHERE team_id = team_folders.team_id AND user_id = auth.uid())
  );

CREATE POLICY "Team members can create folders" ON public.team_folders
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.team_members WHERE team_id = team_folders.team_id AND user_id = auth.uid() AND role IN ('owner', 'admin', 'member'))
  );

-- RLS for team_folder_files
CREATE POLICY "Team members can view folder files" ON public.team_folder_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_folders tf
      JOIN public.team_members tm ON tm.team_id = tf.team_id
      WHERE tf.id = team_folder_files.folder_id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can add files to folders" ON public.team_folder_files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_folders tf
      JOIN public.team_members tm ON tm.team_id = tf.team_id
      WHERE tf.id = team_folder_files.folder_id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin', 'member')
    )
  );