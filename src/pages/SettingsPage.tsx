import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  HardDrive,
  ArrowRight,
  LogOut,
  User,
  Lock,
  Sun,
  Moon,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Save,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "sonner";
import { useFiles } from "@/hooks/useFiles";

const PLAN_LIMITS: Record<string, number> = {
  free: 100 * 1024 * 1024,       // 100MB
  starter: 1024 * 1024 * 1024,   // 1GB
  pro: 50 * 1024 * 1024 * 1024,  // 50GB
  business: 1024 * 1024 * 1024 * 1024, // 1TB
  enterprise: Infinity,
};

function formatSize(bytes: number) {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(1)} KB`;
  return `${bytes} B`;
}

const SettingsPage = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { data: files } = useFiles();

  const [profile, setProfile] = useState({ full_name: "", company_name: "", phone_number: "", plan: "free" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserEmail(user.email || "");

      const { data } = await supabase
        .from("profiles")
        .select("full_name, company_name, phone_number, plan")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setProfile({
          full_name: data.full_name || "",
          company_name: data.company_name || "",
          phone_number: data.phone_number || "",
          plan: data.plan || "free",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          company_name: profile.company_name,
          phone_number: profile.phone_number,
        })
        .eq("user_id", user.id);

      if (error) throw error;
      toast.success("Profile updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  // Storage usage
  const totalUsed = files?.reduce((sum, f) => sum + f.file_size, 0) || 0;
  const storageLimit = PLAN_LIMITS[profile.plan] || PLAN_LIMITS.free;
  const usagePercent = storageLimit === Infinity ? 0 : Math.min((totalUsed / storageLimit) * 100, 100);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">Settings</h1>
          <p className="text-muted-foreground text-sm mb-8">Manage your account and preferences</p>
        </motion.div>

        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Profile</h2>
              <p className="text-xs text-muted-foreground">{userEmail}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Full Name</Label>
              <Input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} placeholder="Your name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Company</Label>
                <Input value={profile.company_name} onChange={(e) => setProfile({ ...profile, company_name: e.target.value })} placeholder="Company name" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone</Label>
                <Input value={profile.phone_number} onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })} placeholder="+91 ..." />
              </div>
            </div>
            <Button onClick={saveProfile} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </motion.div>

        {/* Storage & Plan */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Storage & Plan</h2>
              <p className="text-xs text-muted-foreground capitalize">{profile.plan} plan</p>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">
                {formatSize(totalUsed)} of {storageLimit === Infinity ? "Unlimited" : formatSize(storageLimit)} used
              </span>
              <span className="font-medium">{usagePercent.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${usagePercent > 90 ? "bg-destructive" : usagePercent > 70 ? "bg-amber-500" : "bg-primary"}`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>

          <Button onClick={() => navigate("/pricing")} variant="outline" className="gap-2">
            Upgrade Plan <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>

        {/* Appearance */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                {isDark ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
              </div>
              <div>
                <h2 className="text-lg font-semibold">Appearance</h2>
                <p className="text-xs text-muted-foreground">{isDark ? "Dark" : "Light"} mode</p>
              </div>
            </div>
            <Switch checked={isDark} onCheckedChange={toggleTheme} />
          </div>
        </motion.div>

        {/* Change Password */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Change Password</h2>
              <p className="text-xs text-muted-foreground">Update your account password</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">New Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                  minLength={6}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Confirm Password</Label>
              <Input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
              />
            </div>
            <Button onClick={handleChangePassword} disabled={changingPassword || !newPassword} variant="outline" className="gap-2">
              {changingPassword ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </motion.div>

        <Separator />

        {/* Danger Zone */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="space-y-3">
          <Button onClick={handleSignOut} variant="outline" className="w-full gap-2 text-destructive hover:text-destructive">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
