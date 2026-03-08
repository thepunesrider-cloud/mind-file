import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Phone, Loader2, CheckCircle, Send, Unlink, RefreshCw, ShieldCheck } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SettingsPage = () => {
  const [phone, setPhone] = useState("");
  const [linked, setLinked] = useState(false);
  const [linkedPhone, setLinkedPhone] = useState("");
  const [verified, setVerified] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [checkLoading, setCheckLoading] = useState(true);

  useEffect(() => {
    checkWhatsAppLink();
  }, []);

  const checkWhatsAppLink = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("whatsapp_users")
        .select("phone_number, verified")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setLinked(true);
        setLinkedPhone(data.phone_number);
        setVerified(data.verified);
        if (!data.verified) setCodeSent(true);
      }
    } finally {
      setCheckLoading(false);
    }
  };

  const sendOtpToWhatsApp = async (phoneNumber: string, code: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    await supabase.functions.invoke("send-whatsapp-otp", {
      body: { phone: phoneNumber, code },
    });
  };

  const linkWhatsApp = async () => {
    const cleanPhone = phone.replace(/[\s+\-()]/g, "");
    if (cleanPhone.length < 10) {
      toast.error("Enter a valid phone number with country code");
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const code = String(Math.floor(100000 + Math.random() * 900000));

      const { error } = await supabase
        .from("whatsapp_users")
        .upsert({
          user_id: user.id,
          phone_number: cleanPhone,
          verified: false,
          verification_code: code,
        }, { onConflict: "phone_number" });

      if (error) throw error;

      // Send code to WhatsApp
      await sendOtpToWhatsApp(cleanPhone, code);

      setLinked(true);
      setLinkedPhone(cleanPhone);
      setCodeSent(true);
      setOtpInput("");
      toast.success("Verification code sent to your WhatsApp!");
    } catch (err: any) {
      toast.error(err.message || "Failed to link");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (otpInput.length !== 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setVerifying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      // Check code in DB
      const { data } = await supabase
        .from("whatsapp_users")
        .select("id, verification_code")
        .eq("user_id", user.id)
        .single();

      if (!data || data.verification_code !== otpInput) {
        toast.error("Invalid code. Please try again.");
        return;
      }

      // Mark verified
      await supabase
        .from("whatsapp_users")
        .update({ verified: true, verification_code: null })
        .eq("id", data.id);

      setVerified(true);
      setCodeSent(false);
      setOtpInput("");
      toast.success("WhatsApp linked successfully! 🎉");
    } catch (err: any) {
      toast.error(err.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const regenerateCode = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const code = String(Math.floor(100000 + Math.random() * 900000));

      const { error } = await supabase
        .from("whatsapp_users")
        .update({ verification_code: code, verified: false })
        .eq("user_id", user.id);

      if (error) throw error;

      // Send new code to WhatsApp
      await sendOtpToWhatsApp(linkedPhone, code);

      setVerified(false);
      setCodeSent(true);
      setOtpInput("");
      toast.success("New code sent to your WhatsApp!");
    } catch (err: any) {
      toast.error(err.message || "Failed to regenerate code");
    } finally {
      setLoading(false);
    }
  };

  const unlinkWhatsApp = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("whatsapp_users")
        .delete()
        .eq("user_id", user.id);

      setLinked(false);
      setLinkedPhone("");
      setVerified(false);
      setCodeSent(false);
      setPhone("");
      setOtpInput("");
      toast.success("WhatsApp unlinked");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">Settings</h1>
          <p className="text-muted-foreground text-sm mb-8">Manage your account and integrations</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">WhatsApp Integration</h2>
              <p className="text-xs text-muted-foreground">Search & upload files via WhatsApp</p>
            </div>
          </div>

          {checkLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking...
            </div>
          ) : linked && verified ? (
            /* --- CONNECTED STATE --- */
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-accent/5 border border-accent/20">
                <CheckCircle className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-sm font-medium">Connected: +{linkedPhone}</p>
                  <p className="text-xs text-muted-foreground">You can search and upload files via WhatsApp</p>
                </div>
              </div>
              <div className="bg-secondary/30 rounded-xl p-4 space-y-2">
                <p className="text-sm font-medium">How to use:</p>
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li>💬 Type <strong>sort</strong> to see the menu</li>
                  <li>🔍 <strong>Search:</strong> Select option 1, then type your query</li>
                  <li>📤 <strong>Upload:</strong> Send any document or image</li>
                  <li>📊 <strong>Stats:</strong> Select option 3</li>
                </ul>
              </div>
              <div className="flex gap-2">
                <Button onClick={regenerateCode} variant="outline" size="sm" className="gap-2" disabled={loading}>
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Re-verify
                </Button>
                <Button onClick={unlinkWhatsApp} variant="outline" size="sm" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10" disabled={loading}>
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlink className="w-3.5 h-3.5" />}
                  Unlink
                </Button>
              </div>
            </div>
          ) : linked && codeSent ? (
            /* --- VERIFICATION PENDING STATE --- */
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <Send className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Code sent to +{linkedPhone}</p>
                  <p className="text-xs text-muted-foreground">
                    Check your WhatsApp and enter the 6-digit code below
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter 6-digit code"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="flex-1 text-center text-lg tracking-[0.3em] font-mono"
                  maxLength={6}
                  onKeyDown={(e) => e.key === "Enter" && verifyCode()}
                />
                <Button onClick={verifyCode} disabled={verifying || otpInput.length !== 6} className="gap-2">
                  {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  Verify
                </Button>
              </div>
              <div className="flex gap-2">
                <Button onClick={regenerateCode} variant="outline" size="sm" className="gap-2" disabled={loading}>
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Resend Code
                </Button>
              </div>
            </div>
          ) : (
            /* --- INITIAL LINK STATE --- */
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Link your WhatsApp number to search files, upload documents, and get instant access — all from WhatsApp.
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="91XXXXXXXXXX (with country code)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={linkWhatsApp} disabled={loading || !phone} className="gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                  Link
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
