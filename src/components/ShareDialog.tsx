import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Copy, Check, Link2, Clock, Eye, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileId: string;
  fileName: string;
}

const EXPIRY_OPTIONS = [
  { value: "5", label: "5 minutes" },
  { value: "10", label: "10 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "60", label: "1 hour" },
  { value: "1440", label: "1 day" },
  { value: "none", label: "No expiry" },
];

const ShareDialog = ({ open, onOpenChange, fileId, fileName }: ShareDialogProps) => {
  const [expiry, setExpiry] = useState("60");
  const [viewOnce, setViewOnce] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateLink = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { toast.error("Please log in"); return; }

      const expiresAt = expiry !== "none"
        ? new Date(Date.now() + parseInt(expiry) * 60 * 1000).toISOString()
        : null;

      const { data, error } = await supabase
        .from("shared_links")
        .insert({
          file_id: fileId,
          user_id: session.user.id,
          expires_at: expiresAt,
          view_once: viewOnce,
        })
        .select("token")
        .single();

      if (error) throw error;

      // Use published domain if available, otherwise current origin
      const origin = window.location.hostname.includes("preview")
        ? window.location.origin.replace(/id-preview--[^.]+\.lovable\.app/, "mind-file.lovable.app")
        : window.location.origin;
      const link = `${origin}/shared/${data.token}`;
      setShareLink(link);
      toast.success("Share link created!");
    } catch (e) {
      toast.error("Failed to create share link");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setShareLink(null);
      setCopied(false);
      setExpiry("60");
      setViewOnce(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            Share File
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground truncate">
          {fileName}
        </p>

        {!shareLink ? (
          <div className="space-y-5 pt-2">
            {/* Expiry duration */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Clock className="w-4 h-4 text-muted-foreground" />
                Link expires after
              </Label>
              <Select value={expiry} onValueChange={setExpiry}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* View once toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border/50">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">View once</Label>
                  <p className="text-xs text-muted-foreground">Link becomes invalid after first view</p>
                </div>
              </div>
              <Switch checked={viewOnce} onCheckedChange={setViewOnce} />
            </div>

            <Button onClick={generateLink} disabled={loading} className="w-full rounded-xl gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              Generate Share Link
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* Generated link */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 border border-border/50">
              <input
                readOnly
                value={shareLink}
                className="flex-1 bg-transparent text-sm text-foreground outline-none truncate"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={copyLink}
                className={cn("rounded-lg shrink-0 gap-1.5", copied && "text-green-500 border-green-500/50")}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>

            {/* Info badges */}
            <div className="flex flex-wrap gap-2">
              {expiry !== "none" && (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-warning/10 text-warning font-medium">
                  <Clock className="w-3 h-3" />
                  Expires in {EXPIRY_OPTIONS.find(o => o.value === expiry)?.label}
                </span>
              )}
              {viewOnce && (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-info/10 text-info font-medium">
                  <Eye className="w-3 h-3" />
                  View once
                </span>
              )}
            </div>

            <Button variant="outline" onClick={() => setShareLink(null)} className="w-full rounded-xl">
              Create Another Link
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
