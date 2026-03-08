import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Folder, FolderOpen, ChevronRight, Loader2, FileText, Briefcase, Heart, Shield,
  Car, Home, Receipt, Image, IdCard, RefreshCw, Star, Eye, Download, GripVertical,
  Layers, MessageCircle,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useFiles, FileWithTags } from "@/hooks/useFiles";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { viewFile, downloadFile } from "@/lib/fileUrl";
import { useNavigate } from "react-router-dom";

// --- Types ---
interface SubFolder {
  name: string;
  fileIds: string[];
  subfolders?: SubFolder[]; // deep categorization
}

interface SmartFolder {
  name: string;
  icon: string;
  subfolders: SubFolder[];
}

// --- Icon map ---
const iconMap: Record<string, any> = {
  folder: Folder, briefcase: Briefcase, heart: Heart, shield: Shield,
  car: Car, home: Home, receipt: Receipt, "file-text": FileText, image: Image, "id-card": IdCard,
};

// --- Storage keys ---
const SMART_FOLDERS_KEY = "sortify_smart_folders";
const SMART_FOLDERS_FILE_COUNT_KEY = "sortify_smart_folders_count";
const PINNED_FOLDERS_KEY = "sortify_pinned_folders";

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

function loadPinnedFolders(): string[] {
  try { return JSON.parse(localStorage.getItem(PINNED_FOLDERS_KEY) || "[]"); }
  catch { return []; }
}

function savePinnedFolders(pinned: string[]) {
  localStorage.setItem(PINNED_FOLDERS_KEY, JSON.stringify(pinned));
}

// --- File Item Component ---
const FileItem = ({ file, provided }: { file: FileWithTags; provided?: any }) => {
  const navigate = useNavigate();

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary/30 text-sm group transition-colors"
    >
      {provided && (
        <div {...(provided?.dragHandleProps || {})} className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-60 transition-opacity">
          <GripVertical className="w-3 h-3 text-muted-foreground" />
        </div>
      )}
      <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <span className="truncate flex-1">{file.file_name}</span>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/chat?fileId=${file.id}`); }}
          title="Chat"
          className="p-1.5 rounded-md text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" />
        </button>
        {file.file_url && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); viewFile(file.file_url); }}
              title="View"
              className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); downloadFile(file.file_url, file.file_name); }}
              title="Download"
              className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// --- Deep SubFolder Component ---
const DeepSubFolder = ({ sub, files }: { sub: SubFolder; files: FileWithTags[] | undefined }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="ml-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/20 transition-colors text-left"
      >
        <Folder className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-medium flex-1">{sub.name}</span>
        <span className="text-[10px] text-muted-foreground">{sub.fileIds.length}</span>
        <ChevronRight className={cn("w-3 h-3 text-muted-foreground transition-transform", expanded && "rotate-90")} />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden ml-4"
          >
            {sub.fileIds.map(fid => {
              const file = files?.find(f => f.id === fid);
              return file ? <FileItem key={fid} file={file} /> : null;
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- SubFolder Component with Deep Categorize ---
const SubFolderItem = ({
  sub, folderName, files, folders, setFolders, currentFileCount,
  dragState, setDragState,
}: {
  sub: SubFolder;
  folderName: string;
  files: FileWithTags[] | undefined;
  folders: SmartFolder[];
  setFolders: (f: SmartFolder[]) => void;
  currentFileCount: number;
  dragState: DragState | null;
  setDragState: (s: DragState | null) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [deepLoading, setDeepLoading] = useState(false);
  const subKey = `${folderName}/${sub.name}`;

  const deepCategorize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sub.fileIds.length < 2) {
      toast.info("Need at least 2 files to deep categorize");
      return;
    }
    setDeepLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deep-categorize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ folderName, subfolderName: sub.name, fileIds: sub.fileIds }),
      });
      if (!resp.ok) throw new Error("Failed");
      const data = await resp.json();
      if (data.subfolders && data.subfolders.length > 0) {
        const updated = folders.map(f => {
          if (f.name !== folderName) return f;
          return {
            ...f,
            subfolders: f.subfolders.map(sf => {
              if (sf.name !== sub.name) return sf;
              return { ...sf, subfolders: data.subfolders };
            }),
          };
        });
        setFolders(updated);
        saveSmartFolders(updated, currentFileCount);
        toast.success(`"${sub.name}" broken into ${data.subfolders.length} sub-categories!`);
        setExpanded(true);
      }
    } catch {
      toast.error("Failed to deep categorize");
    } finally {
      setDeepLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove("ring-2", "ring-primary/40");
    if (!dragState) return;

    const { fileId, fromFolder, fromSub } = dragState;
    if (fromFolder === folderName && fromSub === sub.name) return;

    const updated = folders.map(f => {
      const newSubfolders = f.subfolders.map(sf => {
        // Remove from source
        if (f.name === fromFolder && sf.name === fromSub) {
          return { ...sf, fileIds: sf.fileIds.filter(id => id !== fileId) };
        }
        // Add to target
        if (f.name === folderName && sf.name === sub.name && !sf.fileIds.includes(fileId)) {
          return { ...sf, fileIds: [...sf.fileIds, fileId] };
        }
        return sf;
      });
      return { ...f, subfolders: newSubfolders };
    });

    setFolders(updated);
    saveSmartFolders(updated, currentFileCount);
    setDragState(null);
    toast.success("File moved!");
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("ring-2", "ring-primary/40"); }}
      onDragLeave={(e) => { e.currentTarget.classList.remove("ring-2", "ring-primary/40"); }}
      onDrop={handleDrop}
      className="rounded-lg transition-all"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/30 transition-colors text-left"
      >
        <Folder className="w-4 h-4 text-accent" />
        <span className="text-sm font-medium flex-1">{sub.name}</span>
        <span className="text-xs text-muted-foreground">{sub.fileIds.length}</span>
        {sub.fileIds.length >= 2 && (
          <button
            onClick={deepCategorize}
            disabled={deepLoading}
            title="Deep categorize this subfolder"
            className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            {deepLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
          </button>
        )}
        <ChevronRight className={cn("w-3 h-3 text-muted-foreground transition-transform", expanded && "rotate-90")} />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden ml-7 space-y-0.5"
          >
            {/* Deep sub-categories if they exist */}
            {sub.subfolders && sub.subfolders.length > 0 ? (
              sub.subfolders.map(deepSub => (
                <DeepSubFolder key={deepSub.name} sub={deepSub} files={files} />
              ))
            ) : (
              sub.fileIds.map(fid => {
                const file = files?.find(f => f.id === fid);
                return file ? (
                  <div
                    key={fid}
                    draggable
                    onDragStart={() => setDragState({ fileId: fid, fromFolder: folderName, fromSub: sub.name })}
                    onDragEnd={() => setDragState(null)}
                  >
                    <FileItem file={file} provided={{ dragHandleProps: {} }} />
                  </div>
                ) : null;
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Drag state ---
interface DragState {
  fileId: string;
  fromFolder: string;
  fromSub: string;
}

// --- Main Page ---
const SmartFoldersPage = () => {
  const { data: files } = useFiles();
  const [folders, setFolders] = useState<SmartFolder[]>(loadSmartFolders);
  const [loading, setLoading] = useState(false);
  const [expandedFolder, setExpandedFolder] = useState<string | null>(null);
  const [pinnedFolders, setPinnedFolders] = useState<string[]>(loadPinnedFolders);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const navigate = useNavigate();

  const currentFileCount = files?.length || 0;
  const savedFileCount = getSavedFileCount();
  const hasNewFiles = currentFileCount > savedFileCount && folders.length > 0;

  useEffect(() => {
    if (files && files.length > 0 && folders.length === 0) {
      categorize();
    }
  }, [files]);

  const togglePin = useCallback((folderName: string) => {
    setPinnedFolders(prev => {
      const next = prev.includes(folderName)
        ? prev.filter(n => n !== folderName)
        : [...prev, folderName];
      savePinnedFolders(next);
      return next;
    });
  }, []);

  const sortedFolders = [...folders].sort((a, b) => {
    const aP = pinnedFolders.includes(a.name) ? 0 : 1;
    const bP = pinnedFolders.includes(b.name) ? 0 : 1;
    return aP - bP;
  });

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
    } catch {
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
              <p className="text-muted-foreground text-sm mt-1">AI organizes your files · drag to move · ⭐ to pin</p>
            </div>
            <Button onClick={categorize} disabled={loading} className="rounded-xl gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {hasNewFiles ? `Sync ${currentFileCount - savedFileCount} new` : "Sync"}
            </Button>
          </div>
          {hasNewFiles && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-accent mt-2 font-medium"
            >
              {currentFileCount - savedFileCount} new file(s) detected — click Sync to update
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
            {!loading && sortedFolders.map((folder, i) => {
              const Icon = iconMap[folder.icon] || Folder;
              const isExpanded = expandedFolder === folder.name;
              const totalFiles = folder.subfolders.reduce((s, sf) => s + sf.fileIds.length, 0);
              const isPinned = pinnedFolders.includes(folder.name);

              return (
                <motion.div
                  key={folder.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => togglePin(folder.name)}
                      className={cn(
                        "p-2 rounded-lg transition-colors shrink-0",
                        isPinned ? "text-yellow-500" : "text-muted-foreground/30 hover:text-yellow-500/60"
                      )}
                      title={isPinned ? "Unpin folder" : "Pin folder"}
                    >
                      <Star className={cn("w-4 h-4", isPinned && "fill-current")} />
                    </button>
                    <button
                      onClick={() => setExpandedFolder(isExpanded ? null : folder.name)}
                      className="flex-1 flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-secondary/30 transition-colors text-left"
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
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden ml-10 mt-1 space-y-1"
                      >
                        {folder.subfolders.map(sub => (
                          <SubFolderItem
                            key={sub.name}
                            sub={sub}
                            folderName={folder.name}
                            files={files}
                            folders={folders}
                            setFolders={setFolders}
                            currentFileCount={currentFileCount}
                            dragState={dragState}
                            setDragState={setDragState}
                          />
                        ))}
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
