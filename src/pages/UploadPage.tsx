import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, FileText, Image, File, CheckCircle, AlertCircle, FolderUp, Sparkles, Loader2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const UploadPage = () => {
  const { files, handleFiles, removeFile } = useFileUpload();
  const [isDragging, setIsDragging] = useState(false);
  const [categorizing, setCategorizing] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const getIcon = (type: string) => {
    if (type.startsWith("image/")) return Image;
    if (type.includes("pdf")) return FileText;
    return File;
  };

  const openFilePicker = (multiple: boolean) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = multiple;
    input.accept = ".pdf,.jpg,.jpeg,.png,.docx";
    // Allow folder selection for bulk
    if (multiple) {
      input.setAttribute("webkitdirectory", "");
      input.setAttribute("directory", "");
    }
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) handleFiles(target.files);
    };
    input.click();
  };

  const handleBulkUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = ".pdf,.jpg,.jpeg,.png,.docx";
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) handleFiles(target.files);
    };
    input.click();
  };

  const autoCategorize = async () => {
    setCategorizing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/categorize-files`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({}),
      });
      if (!resp.ok) throw new Error("Failed");
      toast.success("Files auto-categorized! Check Smart Folders.");
    } catch {
      toast.error("Failed to auto-categorize files");
    } finally {
      setCategorizing(false);
    }
  };

  const completedCount = files.filter(f => f.status === "complete").length;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <h1 className="text-2xl font-bold">Upload Files</h1>
          <p className="text-muted-foreground text-sm mt-1">Drag & drop files for AI-powered analysis</p>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <Button onClick={handleBulkUpload} variant="outline" className="rounded-xl gap-2">
            <FolderUp className="w-4 h-4" />
            Bulk Upload
          </Button>
          <Button
            onClick={autoCategorize}
            disabled={categorizing}
            variant="outline"
            className="rounded-xl gap-2"
          >
            {categorizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Auto-Categorize All
          </Button>
        </div>

        {/* Drop Zone */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer",
            isDragging
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border hover:border-primary/40 hover:bg-card/50"
          )}
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.multiple = true;
            input.accept = ".pdf,.jpg,.jpeg,.png,.docx";
            input.onchange = (e) => {
              const target = e.target as HTMLInputElement;
              if (target.files) handleFiles(target.files);
            };
            input.click();
          }}
        >
          <div className="flex flex-col items-center gap-4">
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center transition-colors",
              isDragging ? "bg-primary/20" : "bg-secondary"
            )}>
              <Upload className={cn("w-7 h-7", isDragging ? "text-primary" : "text-muted-foreground")} />
            </div>
            <div>
              <p className="font-semibold mb-1">
                {isDragging ? "Drop files here" : "Click or drag files to upload"}
              </p>
              <p className="text-sm text-muted-foreground">PDF, JPG, PNG, DOCX · Max 25MB</p>
            </div>
          </div>
        </motion.div>

        {/* File List */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-6 space-y-3">
              {completedCount > 0 && (
                <div className="flex items-center justify-between px-1 mb-2">
                  <span className="text-xs text-muted-foreground">{completedCount} of {files.length} uploaded</span>
                </div>
              )}
              {files.map((f) => {
                const Icon = getIcon(f.file.type);
                return (
                  <motion.div key={f.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="glass rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{f.file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(f.file.size / (1024 * 1024)).toFixed(1)} MB ·{" "}
                          {f.status === "uploading" && "Uploading..."}
                          {f.status === "processing" && "AI Processing..."}
                          {f.status === "complete" && "Complete"}
                          {f.status === "error" && (f.errorMessage || "Error")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {f.status === "complete" && <CheckCircle className="w-5 h-5 text-success" />}
                        {f.status === "error" && <AlertCircle className="w-5 h-5 text-destructive" />}
                        <button onClick={() => removeFile(f.id)} className="text-muted-foreground hover:text-foreground">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {(f.status === "uploading" || f.status === "processing") && (
                      <div className="mt-3">
                        <Progress value={f.status === "processing" ? 100 : f.progress} className="h-1.5" />
                      </div>
                    )}
                    {f.status === "complete" && f.aiTags && (
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-3 p-3 rounded-lg bg-secondary/50">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-primary">AI Analysis</span>
                        </div>
                        <div className="flex gap-1.5 mb-2">
                          {f.aiTags.map((tag) => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{tag}</span>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">{f.aiSummary}</p>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
};

export default UploadPage;
