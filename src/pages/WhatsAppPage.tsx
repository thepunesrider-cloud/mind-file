import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Phone, Loader2, CheckCircle, Send, Unlink, RefreshCw, ShieldCheck, Plus, Trash2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LinkedPhone {
  id: string;
  phone_number: string;
  verified: boolean;
  verification_code: string | null;
}

const WhatsAppPage = () => {
  const [phone, setPhone] = useState("");
  const [linkedPhones, setLinkedPhones] = useState<LinkedPhone[]>([]);
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [checkLoading, setCheckLoading] = useState(true);

  useEffect(() => {
    checkWhatsAppLinks();
  }, []);

  const checkWhatsAppLinks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("whatsapp_users")
        .select("id, phone_number, verified, verification_code")
        .eq("user_id", user.id);

      if (data) {
        setLinkedPhones(data);
      }
    } finally {
      setCheckLoading(false);
    }
  };

  const sendOtpToWhatsApp = async (phoneNumber: string, code: string) => {
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

    // Check if already linked
    if (linkedPhones.some((p) => p.phone_number === cleanPhone)) {
      toast.error("This number is already linked");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const code = String(Math.floor(100000 + Math.random() * 900000));

      const { data, error } = await supabase
        .from("whatsapp_users")
        .insert({
          user_id: user.id,
          phone_number: cleanPhone,
          verified: false,
          verification_code: code,
        })
        .select("id, phone_number, verified, verification_code")
        .single();

      if (error) throw error;

      await sendOtpToWhatsApp(cleanPhone, code);

      setLinkedPhones((prev) => [...prev, data]);
      setPhone("");
      toast.success("Verification code sent to your WhatsApp!");
    } catch (err: any) {
      toast.error(err.message || "Failed to link");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (linkedPhone: LinkedPhone) => {
    const otp = otpInputs[linkedPhone.id] || "";
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setVerifyingId(linkedPhone.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { data } = await supabase
        .from("whatsapp_users")
        .select("id, verification_code")
        .eq("id", linkedPhone.id)
        .single();

      if (!data || data.verification_code !== otp) {
        toast.error("Invalid code. Please try again.");
        return;
      }

      await supabase
        .from("whatsapp_users")
        .update({ verified: true, verification_code: null })
        .eq("id", data.id);

      setLinkedPhones((prev) =>
        prev.map((p) => (p.id === linkedPhone.id ? { ...p, verified: true, verification_code: null } : p))
      );
      setOtpInputs((prev) => ({ ...prev, [linkedPhone.id]: "" }));
      toast.success("WhatsApp linked successfully! 🎉");
    } catch (err: any) {
      toast.error(err.message || "Verification failed");
    } finally {
      setVerifyingId(null);
    }
  };

  const resendCode = async (linkedPhone: LinkedPhone) => {
    setLoading(true);
    try {
      const code = String(Math.floor(100000 + Math.random() * 900000));

      await supabase
        .from("whatsapp_users")
        .update({ verification_code: code, verified: false })
        .eq("id", linkedPhone.id);

      await sendOtpToWhatsApp(linkedPhone.phone_number, code);

      setLinkedPhones((prev) =>
        prev.map((p) => (p.id === linkedPhone.id ? { ...p, verified: false, verification_code: code } : p))
      );
      toast.success("New code sent to your WhatsApp!");
    } catch (err: any) {
      toast.error(err.message || "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  const unlinkPhone = async (linkedPhone: LinkedPhone) => {
    setLoading(true);
    try {
      await supabase
        .from("whatsapp_users")
        .delete()
        .eq("id", linkedPhone.id);

      setLinkedPhones((prev) => prev.filter((p) => p.id !== linkedPhone.id));
      toast.success("WhatsApp number unlinked");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">WhatsApp Integration</h1>
          <p className="text-muted-foreground text-sm mb-8">Link your WhatsApp numbers to search & upload files via chat</p>
        </motion.div>

        {checkLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm p-6">
            <Loader2 className="w-4 h-4 animate-spin" />
            Checking linked numbers...
          </div>
        ) : (
          <div className="space-y-4">
            {/* Linked numbers */}
            {linkedPhones.map((lp) => (
              <motion.div
                key={lp.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-2xl p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${lp.verified ? "bg-accent/10" : "bg-primary/10"}`}>
                    <MessageCircle className={`w-5 h-5 ${lp.verified ? "text-accent" : "text-primary"}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">+{lp.phone_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {lp.verified ? "✅ Verified & Connected" : "⏳ Verification pending"}
                    </p>
                  </div>
                </div>

                {lp.verified ? (
                  <div className="space-y-3">
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
                      <Button onClick={() => resendCode(lp)} variant="outline" size="sm" className="gap-2" disabled={loading}>
                        <RefreshCw className="w-3.5 h-3.5" />
                        Re-verify
                      </Button>
                      <Button
                        onClick={() => unlinkPhone(lp)}
                        variant="outline"
                        size="sm"
                        className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                        disabled={loading}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                      <Send className="w-4 h-4 text-primary shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        Check your WhatsApp and enter the 6-digit code
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter 6-digit code"
                        value={otpInputs[lp.id] || ""}
                        onChange={(e) =>
                          setOtpInputs((prev) => ({
                            ...prev,
                            [lp.id]: e.target.value.replace(/\D/g, "").slice(0, 6),
                          }))
                        }
                        className="flex-1 text-center text-lg tracking-[0.3em] font-mono"
                        maxLength={6}
                        onKeyDown={(e) => e.key === "Enter" && verifyCode(lp)}
                      />
                      <Button
                        onClick={() => verifyCode(lp)}
                        disabled={verifyingId === lp.id || (otpInputs[lp.id] || "").length !== 6}
                        className="gap-2"
                      >
                        {verifyingId === lp.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                        Verify
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => resendCode(lp)} variant="outline" size="sm" className="gap-2" disabled={loading}>
                        <RefreshCw className="w-3.5 h-3.5" />
                        Resend Code
                      </Button>
                      <Button
                        onClick={() => unlinkPhone(lp)}
                        variant="outline"
                        size="sm"
                        className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                        disabled={loading}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}

            {/* Add new number */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-2xl p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Add WhatsApp Number</h2>
                  <p className="text-xs text-muted-foreground">Link another phone number</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="91XXXXXXXXXX (with country code)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10"
                    onKeyDown={(e) => e.key === "Enter" && linkWhatsApp()}
                  />
                </div>
                <Button onClick={linkWhatsApp} disabled={loading || !phone} className="gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                  Link
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default WhatsAppPage;
