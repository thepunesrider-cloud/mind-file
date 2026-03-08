import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Folder, FolderOpen, ChevronRight, Loader2, Sparkles, FileText, Briefcase, Heart, Shield, Car, Home, Receipt, Image, IdCard, RefreshCw } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useFiles } from "@/hooks/useFiles";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SubFolder {
  name: string;
  fileIds: string[];
}

interface SmartFolder {
  name: string;
  icon: string;
  subfolders: SubFolder[];
}

const iconMap: Record<string, any> = {
  folder: Folder, briefcase: Briefcase, heart: Heart, shield: Shield,
  car: Car, home: Home, receipt: Receipt, "file-text": FileText, image: Image, "id-card": IdCard,
};

const SMART_FOLDERS_KEY = "sortify_smart_folders";
const SMART_FOLDERS_FILE_COUNT_KEY = "sortify_smart_folders_count";

function loadSmartFolders(): SmartFolder[] {
  try { return JSON.parse(localStorage.getItem(SMART_FOLDERS_KEY) || "[]"); }
  catch { return []; }
}

function saveSmartFolders(folders: SmartFolder[], fileCount: number) {
  localStorage.setItem(SMART_FOLDERS_KEY, JSON.stringify(folders));
  localStorage.setItem(SMART_FOLDERS_FILE_COUNT_KEY, String(fileCount));
}

function getSavedFileCount(): number {
  return parseInt(localStorage.getItem(SMART_FOLDERS_FILE_COUNT_KEY) || "0", 10);
}

const SmartFoldersPage = () => {
  const { data: files } = useFiles();
  const [folders, setFolders] = useState<SmartFolder[]>(loadSmartFolders);
  const [loading, setLoading] = useState(false);
  const [expandedFolder, setExpandedFolder] = useState<string | null>(null);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);

  const currentFileCount = files?.length || 0;
  const savedFileCount = getSavedFileCount();
  const hasNewFiles = currentFileCount > savedFileCount && folders.length > 0;

  // Auto-organize on first visit if files exist but no folders saved
  useEffect(() => {
    if (files && files.length > 0 && folders.length === 0) {
      categorize();
    }
  }, [files]);

  const categorize = async () => {
    if (!files || files.length === 0) {
      toast.error("Upload some files first");
      return;
    }
    setLoading(true);
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
      if (!resp.ok) throw new Error("Failed to categorize");
      const data = await resp.json();
      const newFolders = data.folders || [];
      setFolders(newFolders);
      saveSmartFolders(newFolders, currentFileCount);
      toast.success("Files organized into smart folders!");
    } catch (e) {
      toast.error("Failed to categorize files");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Smart Folders</h1>
              <p className="text-muted-foreground text-sm mt-1">AI automatically organizes your files</p>
            </div>
            <Button onClick={categorize} disabled={loading} className="rounded-xl gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {hasNewFiles ? `Sync ${currentFileCount - savedFileCount} new files` : "Sync"}
            </Button>
          </div>
          {hasNewFiles && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-accent mt-2 font-medium"
            >
              {currentFileCount - savedFileCount} new file(s) detected — click Sync to update folders
            </motion.p>
          )}
        </motion.div>

        {loading && (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">AI is analyzing and organizing your files...</p>
          </div>
        )}

        {!loading && folders.length === 0 && (
          <div className="text-center py-16">
            <Folder className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No files uploaded yet. Upload files to see smart folders.</p>
          </div>
        )}

        <div className="space-y-3">
          <AnimatePresence>
            {!loading && folders.map((folder, i) => {
              const Icon = iconMap[folder.icon] || Folder;
              const isExpanded = expandedFolder === folder.name;
              const totalFiles = folder.subfolders.reduce((s, sf) => s + sf.fileIds.length, 0);

              return (
                <motion.div
                  key={folder.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <button
                    onClick={() => setExpandedFolder(isExpanded ? null : folder.name)}
                    className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-secondary/30 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      {isExpanded ? <FolderOpen className="w-5 h-5 text-primary" /> : <Icon className="w-5 h-5 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{folder.name}</p>
                      <p className="text-xs text-muted-foreground">{totalFiles} files · {folder.subfolders.length} subfolders</p>
                    </div>
                    <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform", isExpanded && "rotate-90")} />
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden ml-6 mt-1 space-y-1"
                      >
                        {folder.subfolders.map(sub => {
                          const subKey = `${folder.name}/${sub.name}`;
                          const subExpanded = expandedSub === subKey;
                          return (
                            <div key={sub.name}>
                              <button
                                onClick={() => setExpandedSub(subExpanded ? null : subKey)}
                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/30 transition-colors text-left"
                              >
                                <Folder className="w-4 h-4 text-accent" />
                                <span className="text-sm font-medium flex-1">{sub.name}</span>
                                <span className="text-xs text-muted-foreground">{sub.fileIds.length}</span>
                                <ChevronRight className={cn("w-3 h-3 text-muted-foreground transition-transform", subExpanded && "rotate-90")} />
                              </button>
                              <AnimatePresence>
                                {subExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden ml-7 space-y-0.5"
                                  >
                                    {sub.fileIds.map(fid => {
                                      const file = files?.find(f => f.id === fid);
                                      return file ? (
                                        <div key={fid} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary/20 text-sm">
                                          <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                                          <span className="truncate">{file.file_name}</span>
                                        </div>
                                      ) : null;
                                    })}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  );
};

export default SmartFoldersPage;
