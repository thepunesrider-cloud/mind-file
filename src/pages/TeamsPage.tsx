import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Plus, FolderPlus, UserPlus, Crown, Shield, User, ChevronRight } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useTeams, useTeamMembers, useTeamFolders, useCreateTeam, useCreateTeamFolder } from "@/hooks/useTeams";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const roleIcons: Record<string, any> = { owner: Crown, admin: Shield, member: User, viewer: User };
const roleColors: Record<string, string> = { owner: "text-warning", admin: "text-primary", member: "text-muted-foreground", viewer: "text-muted-foreground" };

const TeamsPage = () => {
  const { data: teams, isLoading } = useTeams();
  const createTeam = useCreateTeam();
  const createFolder = useCreateTeamFolder();
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const { data: members } = useTeamMembers(selectedTeam);
  const { data: folders } = useTeamFolders(selectedTeam);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    try {
      await createTeam.mutateAsync(newTeamName.trim());
      setNewTeamName("");
      setShowCreate(false);
      toast.success("Team created!");
    } catch (e: any) {
      toast.error(e.message || "Failed to create team");
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !selectedTeam) return;
    try {
      await createFolder.mutateAsync({ teamId: selectedTeam, name: newFolderName.trim() });
      setNewFolderName("");
      toast.success("Folder created!");
    } catch (e: any) {
      toast.error(e.message || "Failed to create folder");
    }
  };

  const activeTeam = teams?.find((t) => t.id === selectedTeam);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Users className="w-6 h-6 text-primary" />
                <h1 className="text-2xl sm:text-3xl font-bold">Teams</h1>
              </div>
              <p className="text-muted-foreground text-sm">Collaborate with your team on shared folders</p>
            </div>
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> New Team</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create a Team</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <Input placeholder="Team name" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreateTeam()} />
                  <Button onClick={handleCreateTeam} disabled={createTeam.isPending} className="w-full">
                    {createTeam.isPending ? "Creating..." : "Create Team"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Teams list */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Your Teams</h3>
            {isLoading ? (
              <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-16 rounded-lg bg-secondary/50 animate-pulse" />)}</div>
            ) : teams && teams.length > 0 ? (
              teams.map((team) => (
                <motion.button
                  key={team.id}
                  onClick={() => setSelectedTeam(team.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left",
                    selectedTeam === team.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"
                  )}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{team.name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(team.created_at).toLocaleDateString()}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              ))
            ) : (
              <div className="text-center py-12 rounded-xl border border-dashed border-border">
                <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No teams yet</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowCreate(true)}>Create your first team</Button>
              </div>
            )}
          </div>

          {/* Team detail */}
          <div className="lg:col-span-2">
            {activeTeam ? (
              <div className="space-y-6">
                {/* Members */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm flex items-center gap-2"><UserPlus className="w-4 h-4" /> Members</h3>
                    <Button size="sm" variant="outline" className="gap-1 text-xs"><UserPlus className="w-3 h-3" /> Invite</Button>
                  </div>
                  {members && members.length > 0 ? (
                    <div className="space-y-2">
                      {members.map((m) => {
                        const RoleIcon = roleIcons[m.role] || User;
                        return (
                          <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30">
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                              <RoleIcon className={cn("w-3.5 h-3.5", roleColors[m.role])} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{m.user_id.slice(0, 8)}...</p>
                              <p className="text-xs text-muted-foreground capitalize">{m.role}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No members loaded</p>
                  )}
                </motion.div>

                {/* Folders */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm flex items-center gap-2"><FolderPlus className="w-4 h-4" /> Shared Folders</h3>
                  </div>
                  <div className="flex gap-2 mb-4">
                    <Input placeholder="New folder name" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()} className="flex-1" />
                    <Button size="sm" onClick={handleCreateFolder} disabled={createFolder.isPending}>Create</Button>
                  </div>
                  {folders && folders.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {folders.map((f) => (
                        <div key={f.id} className="flex items-center gap-2 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer">
                          <FolderPlus className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium truncate">{f.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No folders yet</p>
                  )}
                </motion.div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 rounded-xl border border-dashed border-border">
                <p className="text-sm text-muted-foreground">Select a team to see details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default TeamsPage;
