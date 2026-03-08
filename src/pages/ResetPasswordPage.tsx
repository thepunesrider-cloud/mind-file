import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    // Also check hash for type=recovery
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      toast.success("Password updated successfully!");
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center p-8">
          <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Password Updated!</h2>
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </motion.div>
      </div>
    );
  }

  if (!isRecovery) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center p-8 max-w-md">
          <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Invalid Reset Link</h2>
          <p className="text-muted-foreground mb-6">This link is invalid or expired. Please request a new password reset.</p>
          <Button onClick={() => navigate("/login")} className="gap-2">
            Back to Login
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-center mb-2">Set New Password</h2>
          <p className="text-muted-foreground text-center text-sm mb-8">Enter your new password below.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-secondary border-border pr-10"
                  required
                  minLength={6}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-12 bg-secondary border-border"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-12 gap-2 font-semibold">
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
