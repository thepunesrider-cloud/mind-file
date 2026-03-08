import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  Crown,
  Loader2,
  ChevronDown,
  HardDrive,
  FileText,
  Calendar,
  Shield,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  company_name: string;
  industry: string;
  plan: string;
  city: string;
  state: string;
  team_size: string;
  estimated_monthly_docs: string;
  onboarding_completed: boolean;
  created_at: string;
}

interface UserFileStats {
  user_id: string;
  file_count: number;
  total_size: number;
}

const planColors: Record<string, string> = {
  free: "bg-secondary text-secondary-foreground",
  starter: "bg-blue-500/10 text-blue-600",
  pro: "bg-primary/10 text-primary",
  business: "bg-amber-500/10 text-amber-600",
  enterprise: "bg-purple-500/10 text-purple-600",
};

const planLabels: Record<string, string> = {
  free: "Free",
  starter: "Starter ₹299",
  pro: "Pro ₹799",
  business: "Business ₹2,499",
  enterprise: "Enterprise",
};

function formatSize(bytes: number) {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(1)} KB`;
  return `${bytes} B`;
}

const AdminPage = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [fileStats, setFileStats] = useState<Record<string, UserFileStats>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const adminRole = roles?.find((r) => r.role === "admin");
      if (!adminRole) {
        setCheckingRole(false);
        return;
      }

      setIsAdmin(true);
      setCheckingRole(false);

      // Fetch all profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profiles) setUsers(profiles as UserProfile[]);

      // Fetch file stats per user
      const { data: files } = await supabase
        .from("files")
        .select("user_id, file_size");

      if (files) {
        const stats: Record<string, UserFileStats> = {};
        files.forEach((f) => {
          if (!stats[f.user_id]) {
            stats[f.user_id] = { user_id: f.user_id, file_count: 0, total_size: 0 };
          }
          stats[f.user_id].file_count++;
          stats[f.user_id].total_size += f.file_size;
        });
        setFileStats(stats);
      }
    } finally {
      setLoading(false);
    }
  };

  const updatePlan = async (profile: UserProfile, newPlan: string) => {
    setUpdatingId(profile.id);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ plan: newPlan })
        .eq("id", profile.id);

      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) => (u.id === profile.id ? { ...u, plan: newPlan } : u))
      );
      toast.success(`${profile.full_name || "User"} updated to ${planLabels[newPlan]}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update plan");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      !searchQuery ||
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchPlan = filterPlan === "all" || u.plan === filterPlan;
    return matchSearch && matchPlan;
  });

  const totalUsers = users.length;
  const paidUsers = users.filter((u) => u.plan !== "free").length;
  const completedOnboarding = users.filter((u) => u.onboarding_completed).length;

  if (checkingRole) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Shield className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have admin privileges.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm mb-6">Manage users and plan assignments</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { icon: Users, label: "Total Users", value: totalUsers, color: "text-primary", bg: "bg-primary/10" },
            { icon: Crown, label: "Paid Users", value: paidUsers, color: "text-amber-500", bg: "bg-amber-500/10" },
            { icon: FileText, label: "Onboarded", value: completedOnboarding, color: "text-accent", bg: "bg-accent/10" },
            { icon: HardDrive, label: "Total Files", value: Object.values(fileStats).reduce((s, f) => s + f.file_count, 0), color: "text-info", bg: "bg-info/10" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-2", stat.bg)}>
                <stat.icon className={cn("w-4 h-4", stat.color)} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name, company, city..."
              className="pl-10"
            />
          </div>
          <Select value={filterPlan} onValueChange={setFilterPlan}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Filter by plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* User List */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl border border-border bg-card overflow-hidden"
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              No users found
            </div>
          ) : (
            <div className="divide-y divide-border">
              {/* Header */}
              <div className="hidden sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3 px-5 py-3 bg-muted/30 text-xs font-medium text-muted-foreground">
                <span>User</span>
                <span>Industry</span>
                <span>Files / Storage</span>
                <span>Joined</span>
                <span>Plan</span>
              </div>

              {filtered.map((user) => {
                const stats = fileStats[user.user_id];
                return (
                  <div
                    key={user.id}
                    className="flex flex-col sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-2 sm:gap-3 px-5 py-4 hover:bg-muted/20 transition-colors items-start sm:items-center"
                  >
                    {/* User */}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.full_name || "—"}
                        {!user.onboarding_completed && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                            Not onboarded
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.company_name || "No company"}{user.city ? ` · ${user.city}` : ""}
                      </p>
                    </div>

                    {/* Industry */}
                    <p className="text-xs text-muted-foreground truncate">
                      {user.industry || "—"}
                    </p>

                    {/* Files */}
                    <div className="text-xs">
                      <span className="font-medium">{stats?.file_count || 0}</span>
                      <span className="text-muted-foreground"> files</span>
                      {stats?.total_size ? (
                        <p className="text-muted-foreground">{formatSize(stats.total_size)}</p>
                      ) : null}
                    </div>

                    {/* Joined */}
                    <p className="text-xs text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>

                    {/* Plan */}
                    <Select
                      value={user.plan}
                      onValueChange={(v) => updatePlan(user, v)}
                      disabled={updatingId === user.id}
                    >
                      <SelectTrigger className={cn("h-8 text-xs font-medium w-full", planColors[user.plan])}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="starter">Starter ₹299</SelectItem>
                        <SelectItem value="pro">Pro ₹799</SelectItem>
                        <SelectItem value="business">Business ₹2,499</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default AdminPage;
