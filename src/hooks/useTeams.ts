import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Team {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

export interface TeamFolder {
  id: string;
  team_id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export function useTeams() {
  return useQuery({
    queryKey: ["teams"],
    queryFn: async (): Promise<Team[]> => {
      const { data, error } = await supabase.from("teams").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Team[];
    },
  });
}

export function useTeamMembers(teamId: string | null) {
  return useQuery({
    queryKey: ["team-members", teamId],
    enabled: !!teamId,
    queryFn: async (): Promise<TeamMember[]> => {
      const { data, error } = await supabase.from("team_members").select("*").eq("team_id", teamId!);
      if (error) throw error;
      return (data || []) as TeamMember[];
    },
  });
}

export function useTeamFolders(teamId: string | null) {
  return useQuery({
    queryKey: ["team-folders", teamId],
    enabled: !!teamId,
    queryFn: async (): Promise<TeamFolder[]> => {
      const { data, error } = await supabase.from("team_folders").select("*").eq("team_id", teamId!).order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as TeamFolder[];
    },
  });
}

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: team, error } = await supabase
        .from("teams")
        .insert({ name, owner_id: user.id })
        .select()
        .single();
      if (error) throw error;

      // Add creator as owner member
      await supabase.from("team_members").insert({
        team_id: (team as Team).id,
        user_id: user.id,
        role: "owner",
      });

      return team as Team;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teams"] }),
  });
}

export function useCreateTeamFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ teamId, name }: { teamId: string; name: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("team_folders")
        .insert({ team_id: teamId, name, created_by: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as TeamFolder;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["team-folders", vars.teamId] }),
  });
}

export function useInviteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ teamId, userId, role = "member" }: { teamId: string; userId: string; role?: string }) => {
      const { error } = await supabase.from("team_members").insert({ team_id: teamId, user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["team-members", vars.teamId] }),
  });
}
