
-- Create all security definer functions first
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = _user_id AND team_id = _team_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_team_admin(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = _user_id AND team_id = _team_id AND role IN ('owner', 'admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.owner_id_matches(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams
    WHERE id = _team_id AND owner_id = _user_id
  )
$$;

-- Now create policies using those functions
CREATE POLICY "Team members can view members v2" ON public.team_members
  FOR SELECT TO authenticated
  USING (public.is_team_member(auth.uid(), team_id));

CREATE POLICY "Team admins can insert members v2" ON public.team_members
  FOR INSERT TO authenticated
  WITH CHECK (public.is_team_admin(auth.uid(), team_id) OR public.owner_id_matches(auth.uid(), team_id));

CREATE POLICY "Team admins can update members v2" ON public.team_members
  FOR UPDATE TO authenticated
  USING (public.is_team_admin(auth.uid(), team_id));

CREATE POLICY "Team admins can delete members v2" ON public.team_members
  FOR DELETE TO authenticated
  USING (public.is_team_admin(auth.uid(), team_id));

CREATE POLICY "Team members can view team v2" ON public.teams
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.is_team_member(auth.uid(), id));

CREATE POLICY "Team members can view folders v2" ON public.team_folders
  FOR SELECT TO authenticated
  USING (public.is_team_member(auth.uid(), team_id));

CREATE POLICY "Team members can create folders v2" ON public.team_folders
  FOR INSERT TO authenticated
  WITH CHECK (public.is_team_member(auth.uid(), team_id));

CREATE POLICY "Team members can view folder files v2" ON public.team_folder_files
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.team_folders tf WHERE tf.id = folder_id AND public.is_team_member(auth.uid(), tf.team_id)
  ));

CREATE POLICY "Team members can add files to folders v2" ON public.team_folder_files
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.team_folders tf WHERE tf.id = folder_id AND public.is_team_member(auth.uid(), tf.team_id)
  ));
