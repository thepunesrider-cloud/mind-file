import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Grid3X3, List, Loader2, Download, Eye, FolderPlus, Folder, ChevronRight, ChevronLeft, MessageCircle, ArrowLeft, Trash2, FolderInput, RefreshCw, FileText, ArrowLeftRight, Info, Sparkles, Plus, Share2, PanelLeftClose, PanelLeft } from "lucide-react";
import { downloadFile, viewFile } from "@/lib/fileUrl";
import AppLayout from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { useFiles } from "@/hooks/useFiles";
import type { FileWithTags } from "@/hooks/useFiles";
import FileDetailPanel from "@/components/FileDetailPanel";
import { cn } from "@/lib/utils";
import { getFileIcon, getFileColor, tagColors } from "@/data/mockFiles";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ShareDialog from "@/components/ShareDialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuLabel,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

function mapFileType(mimeType: string): "pdf" | "image" | "docx" | "spreadsheet" {
  if (mimeType.includes("pdf")) return "pdf";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.includes("word") || mimeType.includes("document")) return "docx";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "spreadsheet";
  return "pdf";
}

function toDetailFile(f: FileWithTags) {
  return {
    id: f.id,
    name: f.file_name,
    type: mapFileType(f.file_type),
    size: `${(f.file_size / (1024 * 1024)).toFixed(1)} MB`,
    uploadDate: new Date(f.upload_date).toLocaleDateString(),
    tags: f.tags,
    summary: f.ai_summary || "Processing...",
    expiryDate: f.expiry_date || undefined,
    extractedText: f.extracted_text || "",
    aiDescription: f.ai_description || "",
    versions: 1,
    lastAccessed: new Date(f.updated_at).toLocaleDateString(),
    fileUrl: f.file_url,
    fileType: f.file_type,
  };
}

interface UserFolder {
  name: string;
  fileIds: string[];
}

const FOLDERS_KEY = "sortify_user_folders";

function loadFolders(): UserFolder[] {
  try {
    return JSON.parse(localStorage.getItem(FOLDERS_KEY) || "[]");
  } catch { return []; }
}

function saveFolders(folders: UserFolder[]) {
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
}

const FilesPage = () => {
  const [view, setView] = useState<"grid" | "list">("list");
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [filter, setFilter] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { data: files, isLoading } = useFiles();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Folder management
  const [folders, setFolders] = useState<UserFolder[]>(loadFolders);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [shareFile, setShareFile] = useState<{ id: string; name: string } | null>(null);

  const createFolder = () => {
    if (!newFolderName.trim()) return;
    const updated = [...folders, { name: newFolderName.trim(), fileIds: [] }];
    setFolders(updated);
    saveFolders(updated);
    setNewFolderName("");
    setShowNewFolder(false);
  };

  const addFileToFolder = (folderName: string, fileId: string) => {
    const updated = folders.map(f =>
      f.name === folderName && !f.fileIds.includes(fileId)
        ? { ...f, fileIds: [...f.fileIds, fileId] }
        : f
    );
    setFolders(updated);
    saveFolders(updated);
    toast.success(`Added to "${folderName}"`);
  };

  const removeFileFromFolder = (folderName: string, fileId: string) => {
    const updated = folders.map(f =>
      f.name === folderName ? { ...f, fileIds: f.fileIds.filter(id => id !== fileId) } : f
    );
    setFolders(updated);
    saveFolders(updated);
    toast.success(`Removed from "${folderName}"`);
  };

  const deleteFolder = (folderName: string) => {
    const updated = folders.filter(f => f.name !== folderName);
    setFolders(updated);
    saveFolders(updated);
    if (activeFolder === folderName) setActiveFolder(null);
    toast.success(`Folder "${folderName}" deleted`);
  };

  const renameFolder = (oldName: string, newName: string) => {
    if (!newName.trim() || newName === oldName) { setRenamingFolder(null); return; }
    const updated = folders.map(f => f.name === oldName ? { ...f, name: newName.trim() } : f);
    setFolders(updated);
    saveFolders(updated);
    if (activeFolder === oldName) setActiveFolder(newName.trim());
    setRenamingFolder(null);
    toast.success(`Renamed to "${newName.trim()}"`);
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    try {
      const { error } = await supabase.from("files").delete().eq("id", fileId);
      if (error) throw error;
      // Remove from all folders
      const updated = folders.map(f => ({ ...f, fileIds: f.fileIds.filter(id => id !== fileId) }));
      setFolders(updated);
      saveFolders(updated);
      queryClient.invalidateQueries({ queryKey: ["files"] });
      if (selectedFile?.id === fileId) setSelectedFile(null);
      toast.success(`"${fileName}" deleted`);
    } catch {
      toast.error("Failed to delete file");
    }
  };

  const handleReanalyze = async (fileId: string, fileName: string, fileType: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-file`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ fileId, fileName, fileType }),
      });
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast.success("Re-analysis started!");
    } catch {
      toast.error("Failed to re-analyze");
    }
  };

  // Get unique categories/tags
  const categories = ["all", ...Array.from(new Set((files || []).flatMap((f) => f.tags.map((t) => t.name))))];

  const activeFolderData = folders.find(f => f.name === activeFolder);

  const filtered = (files || []).filter((f) => {
    if (activeFolder && activeFolderData) {
      if (!activeFolderData.fileIds.includes(f.id)) return false;
    }
    const matchesSearch =
      f.file_name.toLowerCase().includes(filter.toLowerCase()) ||
      f.tags.some((t) => t.name.toLowerCase().includes(filter.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || f.tags.some((t) => t.name === selectedCategory);
    return matchesSearch && matchesCategory;
  });

  // Context menu wrapper for file items
  const FileContextMenu = ({ file, children }: { file: FileWithTags; children: React.ReactNode }) => {
    const detail = toDetailFile(file);
    const fileFolders = folders.filter(f => f.fileIds.includes(file.id));
    const availableFolders = folders.filter(f => !f.fileIds.includes(file.id));

    return (
      <ContextMenu>
        <ContextMenuContent className="w-56">
          <ContextMenuLabel className="flex items-center gap-2 text-xs truncate">
            <FileText className="w-3 h-3" />
            {file.file_name}
          </ContextMenuLabel>
          <ContextMenuSeparator />

          <ContextMenuItem onClick={() => setSelectedFile(detail)} className="gap-2 cursor-pointer">
            <Info className="w-4 h-4" />
            Open Details
          </ContextMenuItem>

          {file.file_url && (
            <>
              <ContextMenuItem onClick={() => viewFile(file.file_url)} className="gap-2 cursor-pointer">
                <Eye className="w-4 h-4" />
                Preview
              </ContextMenuItem>
              <ContextMenuItem onClick={() => downloadFile(file.file_url, file.file_name)} className="gap-2 cursor-pointer">
                <Download className="w-4 h-4" />
                Download
              </ContextMenuItem>
              <ContextMenuItem onClick={() => setShareFile({ id: file.id, name: file.file_name })} className="gap-2 cursor-pointer">
                <Share2 className="w-4 h-4" />
                Share Link
              </ContextMenuItem>
            </>
          )}

          <ContextMenuSeparator />

          <ContextMenuItem onClick={() => navigate(`/chat?fileId=${file.id}`)} className="gap-2 cursor-pointer">
            <MessageCircle className="w-4 h-4" />
            Chat with Document
          </ContextMenuItem>

          <ContextMenuItem onClick={() => navigate(`/compare?fileA=${file.id}`)} className="gap-2 cursor-pointer">
            <ArrowLeftRight className="w-4 h-4" />
            Compare with...
          </ContextMenuItem>

          <ContextMenuItem onClick={() => handleReanalyze(file.id, file.file_name, file.file_type)} className="gap-2 cursor-pointer">
            <RefreshCw className="w-4 h-4" />
            Re-analyze with AI
          </ContextMenuItem>

          <ContextMenuSeparator />

          {/* Add to submenu */}
          <ContextMenuSub>
            <ContextMenuSubTrigger className="gap-2 cursor-pointer">
              <FolderInput className="w-4 h-4" />
              Add to
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-52">
              {/* To a Folder - shows available folders */}
              {availableFolders.length > 0 ? (
                <ContextMenuSub>
                  <ContextMenuSubTrigger className="gap-2 cursor-pointer">
                    <Folder className="w-4 h-4" />
                    To a Folder
                  </ContextMenuSubTrigger>
                  <ContextMenuSubContent className="w-48">
                    {availableFolders.map(folder => (
                      <ContextMenuItem
                        key={folder.name}
                        onClick={() => addFileToFolder(folder.name, file.id)}
                        className="gap-2 cursor-pointer"
                      >
                        <Folder className="w-3.5 h-3.5" />
                        {folder.name}
                      </ContextMenuItem>
                    ))}
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      onClick={() => setShowNewFolder(true)}
                      className="gap-2 cursor-pointer text-primary"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      New Folder
                    </ContextMenuItem>
                  </ContextMenuSubContent>
                </ContextMenuSub>
              ) : (
                <ContextMenuItem
                  onClick={() => setShowNewFolder(true)}
                  className="gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Create a Folder first
                </ContextMenuItem>
              )}

              <ContextMenuSeparator />

              {/* Auto Categorize */}
              <ContextMenuItem
                onClick={() => navigate("/smart-folders")}
                className="gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Auto Categorize
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>

          {/* Remove from current folder */}
          {activeFolder && (
            <ContextMenuItem
              onClick={() => removeFileFromFolder(activeFolder, file.id)}
              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
            >
              <Folder className="w-4 h-4" />
              Remove from Folder
            </ContextMenuItem>
          )}

          {fileFolders.length > 0 && !activeFolder && (
            <ContextMenuSub>
              <ContextMenuSubTrigger className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                <Folder className="w-4 h-4" />
                Remove from...
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-48">
                {fileFolders.map(folder => (
                  <ContextMenuItem
                    key={folder.name}
                    onClick={() => removeFileFromFolder(folder.name, file.id)}
                    className="gap-2 cursor-pointer"
                  >
                    <Folder className="w-3.5 h-3.5" />
                    {folder.name}
                  </ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>
          )}

          <ContextMenuSeparator />

          <ContextMenuItem
            onClick={() => handleDeleteFile(file.id, file.file_name)}
            className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
        <ContextMenuTrigger className="contents">
          {children}
        </ContextMenuTrigger>
      </ContextMenu>
    );
  };

  // Folder context menu
  const FolderContextMenu = ({ folder, children }: { folder: UserFolder; children: React.ReactNode }) => (
    <ContextMenu>
      <ContextMenuContent className="w-48">
        <ContextMenuLabel className="text-xs">{folder.name}</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => { setRenamingFolder(folder.name); setRenameValue(folder.name); }}
          className="gap-2 cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          Rename
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => deleteFolder(folder.name)}
          className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <Trash2 className="w-4 h-4" />
          Delete Folder
        </ContextMenuItem>
      </ContextMenuContent>
      <ContextMenuTrigger className="contents">
        {children}
      </ContextMenuTrigger>
    </ContextMenu>
  );

  const renderFileCard = (file: FileWithTags, i: number) => {
    const detail = toDetailFile(file);
    const Icon = getFileIcon(detail.type);
    const color = getFileColor(detail.type);
    return (
      <FileContextMenu key={file.id} file={file}>
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          whileHover={{ y: -8, transition: { duration: 0.2 } }}
          draggable
          onDragStart={(e: any) => { e.dataTransfer?.setData?.("text/plain", file.id); }}
          onClick={() => setSelectedFile(detail)}
          className={cn(
            "group relative bg-gradient-to-br from-card to-card/80 rounded-3xl p-5 cursor-pointer border border-border/30 backdrop-blur-sm transition-all duration-300",
            selectedFile?.id === file.id
              ? "border-primary/50 shadow-xl shadow-primary/10 bg-primary/5"
              : "hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/0 to-primary/0 group-hover:to-primary/5 rounded-3xl transition-all duration-500 pointer-events-none" />
          <div className="relative flex items-start gap-3 mb-3">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={cn("w-11 h-11 rounded-2xl flex items-center justify-center bg-gradient-to-br flex-shrink-0", color)}
            >
              <Icon className="w-5 h-5" />
            </motion.div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate max-w-full text-foreground">{file.file_name}</p>
              <p className="text-xs text-muted-foreground/80 truncate">{detail.size} · {detail.uploadDate}</p>
            </div>
            <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={(e) => { e.stopPropagation(); navigate(`/chat?fileId=${file.id}`); }}
                title="Chat"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10 transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={(e) => { e.stopPropagation(); setShareFile({ id: file.id, name: file.file_name }); }}
                title="Share"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
              >
                <Share2 className="w-3.5 h-3.5" />
              </motion.button>
              {file.file_url && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => { e.stopPropagation(); viewFile(file.file_url); }}
                  title="View"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                >
                  <Eye className="w-3.5 h-3.5" />
                </motion.button>
              )}
            </div>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-xs text-muted-foreground/80 line-clamp-2 mb-3"
          >
            {detail.summary}
          </motion.p>
          <div className="flex flex-wrap gap-2">
            {file.tags.map((tag, idx) => (
              <motion.span
                key={tag.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  "text-[10px] px-2.5 py-1 rounded-full font-semibold transition-all",
                  tagColors[tag.name] || "bg-secondary/60 text-muted-foreground"
                )}
              >
                {tag.name}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </FileContextMenu>
    );
  };

  const renderFileRow = (file: FileWithTags, i: number) => {
    const detail = toDetailFile(file);
    const Icon = getFileIcon(detail.type);
    const color = getFileColor(detail.type);
    return (
      <FileContextMenu key={file.id} file={file}>
        <motion.div
          layout
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          draggable
          onDragStart={(e: any) => { e.dataTransfer?.setData?.("text/plain", file.id); }}
          onClick={() => setSelectedFile(detail)}
          whileHover={{ x: 8, transition: { duration: 0.2 } }}
          className={cn(
            "group relative bg-gradient-to-r from-card to-card/80 rounded-3xl px-5 py-3.5 flex items-center gap-4 cursor-pointer border border-border/30 transition-all duration-300",
            selectedFile?.id === file.id
              ? "border-primary/50 shadow-lg shadow-primary/10 bg-primary/5"
              : "hover:border-primary/40 hover:shadow-md hover:shadow-primary/5"
          )}>

          <motion.div
            whileHover={{ scale: 1.1, rotate: -5 }}
            className={cn("w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br", color)}
          >
            <Icon className="w-4 h-4" />
          </motion.div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="text-sm font-semibold truncate text-foreground">{file.file_name}</p>
            <p className="text-xs text-muted-foreground/70 truncate sm:hidden">{detail.size} · {detail.uploadDate}</p>
          </div>
          <div className="hidden sm:flex gap-2 shrink-0">
            {file.tags.slice(0, 2).map((tag) => (
              <motion.span
                key={tag.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                  "text-[10px] px-2.5 py-1 rounded-xl font-semibold",
                  tagColors[tag.name] || "bg-secondary/60 text-muted-foreground"
                )}
              >
                {tag.name}
              </motion.span>
            ))}
          </div>
          <span className="hidden md:inline text-xs text-muted-foreground/70 shrink-0 whitespace-nowrap">{detail.size}</span>
          <span className="hidden md:inline text-xs text-muted-foreground/70 shrink-0 whitespace-nowrap">{detail.uploadDate}</span>
          <div className="flex items-center gap-0.5 shrink-0">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => { e.stopPropagation(); navigate(`/chat?fileId=${file.id}`); }}
              title="Chat with document"
              className="p-2 rounded-xl text-muted-foreground hover:text-accent hover:bg-accent/10 transition-all duration-200"
            >
              <MessageCircle className="w-4 h-4" />
            </motion.button>
            {file.file_url && (
              <>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => { e.stopPropagation(); viewFile(file.file_url); }}
                  title="View"
                  className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                >
                  <Eye className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => { e.stopPropagation(); downloadFile(file.file_url, file.file_name); }}
                  title="Download"
                  className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                >
                  <Download className="w-4 h-4" />
                </motion.button>
              </>
            )}
          </div>
        </motion.div>
      </FileContextMenu>
    );
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 md:gap-8">
        {/* Left Sidebar - Categories & Folders */}
        {!sidebarCollapsed && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="hidden md:block w-52 flex-shrink-0 sticky top-6 h-fit space-y-4"
        >
          {/* Folders Section */}
          <div className="bg-gradient-to-br from-card to-card/80 rounded-3xl p-6 shadow-sm backdrop-blur-sm border border-border/30">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base text-foreground">Folders</h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNewFolder(true)}
                className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                title="New folder"
              >
                <FolderPlus className="w-4 h-4" />
              </motion.button>
            </div>

            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => setActiveFolder(null)}
              className={cn(
                "w-full text-left px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-300 mb-1",
                activeFolder === null
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              )}
            >
              All Files
            </motion.button>

            {folders.map((folder) => (
              <FolderContextMenu key={folder.name} folder={folder}>
                <motion.button
                  whileHover={{ x: 4 }}
                  onDragOver={(e) => { e.preventDefault(); setDragOverFolder(folder.name); }}
                  onDragLeave={() => setDragOverFolder(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverFolder(null);
                    const fileId = e.dataTransfer.getData("text/plain");
                    if (fileId) addFileToFolder(folder.name, fileId);
                  }}
                  onClick={() => setActiveFolder(activeFolder === folder.name ? null : folder.name)}
                  className={cn(
                    "w-full text-left px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-300 flex items-center gap-2",
                    activeFolder === folder.name
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                      : dragOverFolder === folder.name
                      ? "bg-accent/20 border-2 border-dashed border-accent text-accent"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  )}
                >
                  <Folder className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate flex-1">{folder.name}</span>
                  <span className={cn("text-xs px-1.5 rounded-lg", activeFolder === folder.name ? "bg-primary-foreground/20" : "bg-muted/50")}>
                    {folder.fileIds.length}
                  </span>
                </motion.button>
              </FolderContextMenu>
            ))}

            {folders.length === 0 && (
              <p className="text-xs text-muted-foreground/60 text-center py-2">Create folders to organize files</p>
            )}
          </div>

          {/* Categories */}
          <div className="bg-gradient-to-br from-card to-card/80 rounded-3xl p-6 shadow-sm backdrop-blur-sm border border-border/30">
            <h2 className="font-bold text-base mb-5 text-foreground">Categories</h2>
            <div className="space-y-2.5">
              {categories.map((cat, idx) => (
                <motion.button
                  key={cat}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                  whileHover={{ x: 4 }}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "w-full text-left px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-300",
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground hover:shadow-md"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="capitalize">{cat}</span>
                    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-lg", selectedCategory === cat ? "bg-primary-foreground/20" : "bg-muted/50")}>
                      {files?.filter((f) => cat === "all" || f.tags.some((t) => t.name === cat)).length}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
        )}

        {/* Mobile: Horizontal folder/category scroller */}
        <div className="md:hidden mb-4 space-y-3">
          {/* Folders */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setShowNewFolder(true)}
              className="shrink-0 p-2 rounded-xl border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveFolder(null)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
                activeFolder === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              All Files
            </button>
            {folders.map((folder) => (
              <button
                key={folder.name}
                onClick={() => setActiveFolder(activeFolder === folder.name ? null : folder.name)}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5",
                  activeFolder === folder.name
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                <Folder className="w-3 h-3" />
                {folder.name}
                <span className="text-[10px] opacity-70">({folder.fileIds.length})</span>
              </button>
            ))}
          </div>
          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all",
                  selectedCategory === cat
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary/60 text-muted-foreground"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 min-w-0"
        >
          <div className="mb-6 md:mb-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6"
            >
              <div>
                {activeFolder ? (
                  <div className="flex items-center gap-2">
                    <button onClick={() => setActiveFolder(null)} className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <Folder className="w-5 h-5 text-primary" />
                        <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{activeFolder}</h1>
                      </div>
                      <p className="text-muted-foreground text-sm mt-1">{filtered.length} files · Right-click for more options</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Files</h1>
                    <p className="text-muted-foreground text-sm mt-2">{filtered.length} files · Right-click for more options</p>
                  </>
                )}
              </div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="flex items-center gap-2 sm:gap-3"
              >
                {/* Sidebar toggle (desktop only) */}
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="hidden md:flex p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
                >
                  {sidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                </button>
                <div className="relative">
                  <Input
                    placeholder="Search files..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full sm:w-64 h-10 bg-secondary/50 border-border/40 rounded-2xl pl-4 text-sm placeholder:text-muted-foreground/60 focus:bg-secondary focus:border-primary/50 transition-all"
                  />
                </div>
                <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-secondary/40 border border-border/30 backdrop-blur-sm">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setView("grid")}
                    className={cn(
                      "p-2 rounded-xl transition-all duration-300",
                      view === "grid"
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setView("list")}
                    className={cn(
                      "p-2 rounded-xl transition-all duration-300",
                      view === "list"
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    <List className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>

            {isLoading ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center py-24">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                  <Loader2 className="w-8 h-8 text-primary" />
                </motion.div>
              </motion.div>
            ) : filtered.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-24">
                <div className="text-muted-foreground">
                  <Loader2 className="w-12 h-12 opacity-20 mx-auto mb-4" />
                  <p className="text-lg">No files found</p>
                  <p className="text-sm opacity-70">Try adjusting your filters or upload some files</p>
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-6">
                <div className="flex-1">
                  {view === "grid" ? (
                    <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {filtered.map((file, i) => renderFileCard(file, i))}
                    </motion.div>
                  ) : (
                    <motion.div layout className="space-y-3">
                      {filtered.map((file, i) => renderFileRow(file, i))}
                    </motion.div>
                  )}
                </div>
                <AnimatePresence>
                  {selectedFile && (
                    <FileDetailPanel file={selectedFile} onClose={() => setSelectedFile(null)} />
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* New Folder Dialog */}
      <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name..."
            onKeyDown={(e) => e.key === "Enter" && createFolder()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolder(false)}>Cancel</Button>
            <Button onClick={createFolder} disabled={!newFolderName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Folder Dialog */}
      <Dialog open={!!renamingFolder} onOpenChange={(open) => { if (!open) setRenamingFolder(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="New folder name..."
            onKeyDown={(e) => e.key === "Enter" && renamingFolder && renameFolder(renamingFolder, renameValue)}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenamingFolder(null)}>Cancel</Button>
            <Button onClick={() => renamingFolder && renameFolder(renamingFolder, renameValue)} disabled={!renameValue.trim()}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <ShareDialog
        open={!!shareFile}
        onOpenChange={(open) => { if (!open) setShareFile(null); }}
        fileId={shareFile?.id || ""}
        fileName={shareFile?.name || ""}
      />
    </AppLayout>
  );
};

export default FilesPage;
