import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Phone, Loader2, CheckCircle, XCircle, Send, Unlink } from "lucide-react";
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
  const [loading, setLoading] = useState(false);
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
      }
    } finally {
      setCheckLoading(false);
    }
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

      // Generate 6-digit code
      const code = String(Math.floor(100000 + Math.random() * 900000));

      // Upsert WhatsApp user
      const { error } = await supabase
        .from("whatsapp_users")
        .upsert({
          user_id: user.id,
          phone_number: cleanPhone,
          verified: false,
          verification_code: code,
        }, { onConflict: "phone_number" });

      if (error) throw error;

      setLinked(true);
      setLinkedPhone(cleanPhone);
      setCodeSent(true);
      toast.success(`Verification code: ${code}`, {
        description: "Send this code to Sortify on WhatsApp to verify",
        duration: 15000,
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to link");
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

        {/* WhatsApp Integration Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-green-500" />
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
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Connected: +{linkedPhone}</p>
                  <p className="text-xs text-muted-foreground">You can search and upload files via WhatsApp</p>
                </div>
              </div>
              <div className="bg-secondary/30 rounded-xl p-4 space-y-2">
                <p className="text-sm font-medium">How to use:</p>
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li>🔍 <strong>Search:</strong> Just type what you're looking for</li>
                  <li>📤 <strong>Upload:</strong> Send any document or image</li>
                  <li>📊 <strong>Stats:</strong> Type "stats" for file count</li>
                  <li>❓ <strong>Help:</strong> Type "help" for all commands</li>
                </ul>
              </div>
              <Button onClick={unlinkWhatsApp} variant="outline" size="sm" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10" disabled={loading}>
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlink className="w-3.5 h-3.5" />}
                Unlink WhatsApp
              </Button>
            </div>
          ) : linked && codeSent ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                <Send className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium">Verification pending</p>
                  <p className="text-xs text-muted-foreground">
                    Send the 6-digit code shown above to Sortify's WhatsApp number to complete linking
                  </p>
                </div>
              </div>
              <Button onClick={checkWhatsAppLink} variant="outline" size="sm" className="gap-2">
                <Loader2 className="w-3.5 h-3.5" />
                Check Status
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Link your WhatsApp number to search files, upload documents, and get instant access to your files — all from WhatsApp.
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
