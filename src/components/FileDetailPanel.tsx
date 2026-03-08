import { useState } from "react";
import { motion } from "framer-motion";
import { X, Tag, Brain, Calendar, FileText, History, Download, Eye, RefreshCw, Loader2, MessageCircle } from "lucide-react";
import type { MockFile } from "@/data/mockFiles";
import { getFileIcon, getFileColor, tagColors } from "@/data/mockFiles";
import { cn } from "@/lib/utils";
import { downloadFile, viewFile } from "@/lib/fileUrl";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Props {
  file: MockFile & { id?: string; fileType?: string };
  onClose: () => void;
}

const FileDetailPanel = ({ file, onClose }: Props) => {
  const Icon = getFileIcon(file.type);
  const color = getFileColor(file.type);
  const [reanalyzing, setReanalyzing] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleReanalyze = async () => {
    if (!file.id) return;
    setReanalyzing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-file`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ fileId: file.id, fileName: file.name, fileType: file.fileType || file.type }),
      });
      if (!resp.ok) throw new Error("Failed");
      await queryClient.invalidateQueries({ queryKey: ["files"] });
      toast.success("File re-analyzed successfully!");
    } catch {
      toast.error("Failed to re-analyze file");
    } finally {
      setReanalyzing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, width: 0 }}
      animate={{ opacity: 1, x: 0, width: "auto" }}
      exit={{ opacity: 0, x: 20, width: 0 }}
      className="shrink-0 glass rounded-xl overflow-hidden w-full sm:w-[340px] lg:w-[380px] fixed sm:relative inset-0 sm:inset-auto z-50 sm:z-auto bg-background sm:bg-transparent"
    >
      <div className="p-4 sm:p-5 h-full overflow-y-auto max-h-screen sm:max-h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn("w-11 h-11 rounded-lg flex items-center justify-center bg-secondary shrink-0", color)}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{file.size} · {file.type.toUpperCase()}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {file.fileUrl && (
            <>
              <button
                onClick={() => downloadFile(file.fileUrl!, file.name)}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
              <button
                onClick={() => viewFile(file.fileUrl!)}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-secondary text-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                View
              </button>
            </>
          )}
          {file.id && (
            <>
              <button
                onClick={() => navigate(`/chat?fileId=${file.id}`)}
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-accent/10 text-accent text-xs font-semibold hover:bg-accent/20 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Chat
              </button>
              <button
                onClick={handleReanalyze}
                disabled={reanalyzing}
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-accent/10 text-accent text-xs font-semibold hover:bg-accent/20 transition-colors disabled:opacity-50"
              >
                {reanalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Re-analyze
              </button>
            </>
          )}
        </div>

        {/* AI Summary */}
        <Section icon={Brain} title="AI Summary" color="text-primary">
          <p className="text-sm text-muted-foreground leading-relaxed">{file.summary}</p>
        </Section>

        {/* Tags */}
        <Section icon={Tag} title="AI Tags" color="text-accent">
          <div className="flex flex-wrap gap-1.5">
            {file.tags.map((tag) => (
              <span
                key={tag.name}
                className={cn("text-xs px-2.5 py-1 rounded-full font-medium", tagColors[tag.name] || "bg-secondary text-muted-foreground")}
              >
                {tag.name}
                <span className="ml-1 opacity-60">{Math.round(tag.confidence * 100)}%</span>
              </span>
            ))}
          </div>
        </Section>

        {/* AI Description */}
        <Section icon={FileText} title="Description" color="text-info">
          <p className="text-sm text-muted-foreground">{file.aiDescription}</p>
        </Section>

        {/* Metadata */}
        <Section icon={Calendar} title="Metadata" color="text-warning">
          <div className="space-y-2">
            <MetaRow label="Uploaded" value={file.uploadDate} />
            <MetaRow label="Last Accessed" value={file.lastAccessed} />
            {file.expiryDate && <MetaRow label="Expiry Date" value={file.expiryDate} highlight />}
          </div>
        </Section>

        {/* Version History */}
        <Section icon={History} title="Versions" color="text-success">
          <p className="text-sm text-muted-foreground">{file.versions} version{file.versions > 1 ? "s" : ""} tracked</p>
        </Section>

        {/* Extracted Text Preview */}
        {file.extractedText && (
          <Section icon={FileText} title="Extracted Text" color="text-muted-foreground">
            <div className="p-3 rounded-lg bg-secondary/50 font-mono text-xs text-muted-foreground leading-relaxed max-h-32 overflow-hidden">
              {file.extractedText}
            </div>
          </Section>
        )}
      </div>
    </motion.div>
  );
};

const Section = ({ icon: Icon, title, color, children }: { icon: any; title: string; color: string; children: React.ReactNode }) => (
  <div className="mb-5">
    <div className="flex items-center gap-2 mb-2.5">
      <Icon className={cn("w-3.5 h-3.5", color)} />
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
    </div>
    {children}
  </div>
);

const MetaRow = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className={highlight ? "text-warning font-medium" : ""}>{value}</span>
  </div>
);

export default FileDetailPanel;
