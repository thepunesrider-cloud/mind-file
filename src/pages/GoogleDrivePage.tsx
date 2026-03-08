import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HardDrive, FolderOpen, FileText, Image, Sheet, Presentation, Download, Upload, Search, ChevronRight, Loader2, ArrowLeft, RefreshCw } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useFiles } from "@/hooks/useFiles";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  iconLink?: string;
  thumbnailLink?: string;
}

const getMimeIcon = (mimeType: string) => {
  if (mimeType === "application/vnd.google-apps.folder") return FolderOpen;
  if (mimeType.includes("spreadsheet") || mimeType.includes("sheet")) return Sheet;
  if (mimeType.includes("presentation") || mimeType.includes("slide")) return Presentation;
  if (mimeType.startsWith("image/")) return Image;
  return FileText;
};

const GoogleDrivePage = () => {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<Record<string, boolean>>({});
  const [exporting, setExporting] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [folderStack, setFolderStack] = useState<{ id: string; name: string }[]>([
    { id: "root", name: "My Drive" },
  ]);
  const [activeTab, setActiveTab] = useState<"import" | "export">("import");
  const [connecting, setConnecting] = useState(false);
  const [exchangeLoading, setExchangeLoading] = useState(false);

  const { data: appFiles } = useFiles();
  const queryClient = useQueryClient();

  const currentFolder = folderStack[folderStack.length - 1];

  const checkConnection = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setConnected(false);
      return;
    }

    const { data } = await supabase
      .from("google_drive_tokens")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    setConnected(!!data);
  };

  const listDriveFiles = async (query?: string) => {
    setLoading(true);
    try {
      const resp = await supabase.functions.invoke("gdrive-api", {
        body: { action: "list", folderId: currentFolder.id, query: query || searchQuery },
      });

      if (resp.error) throw new Error(resp.error.message);
      setDriveFiles(resp.data?.files || []);
    } catch (err: any) {
      console.error("List error:", err);
      setConnected(false);
      toast.error(err?.message || "Failed to load Drive files");
    } finally {
      setLoading(false);
    }
  };

  const exchangeCodeForToken = async (code: string) => {
    setExchangeLoading(true);
    try {
      const redirectUri = `${window.location.origin}/google-drive`;
      const resp = await supabase.functions.invoke("gdrive-api", {
        body: { action: "exchange-code", code, redirectUri },
      });

      if (resp.error) throw new Error(resp.error.message);

      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("code");
      cleanUrl.searchParams.delete("scope");
      cleanUrl.searchParams.delete("authuser");
      cleanUrl.searchParams.delete("prompt");
      window.history.replaceState({}, "", cleanUrl.pathname);

      toast.success("Google Drive connected successfully");
      setConnected(true);
      await listDriveFiles();
    } catch (err: any) {
      toast.error(err?.message || "Failed to connect Google Drive");
      setConnected(false);
    } finally {
      setExchangeLoading(false);
    }
  };

  const startDriveConnect = async () => {
    setConnecting(true);
    try {
      const redirectUri = `${window.location.origin}/google-drive`;
      const resp = await supabase.functions.invoke("gdrive-api", {
        body: { action: "auth-url", redirectUri },
      });

      if (resp.error) throw new Error(resp.error.message);
      if (!resp.data?.url) throw new Error("Failed to start Google Drive connection");

      window.location.href = resp.data.url as string;
    } catch (err: any) {
      toast.error(err?.message || "Failed to start Google Drive connection");
      setConnecting(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      void exchangeCodeForToken(code);
      return;
    }

    void checkConnection();
  }, []);

  useEffect(() => {
    if (connected && activeTab === "import") {
      void listDriveFiles();
    }
  }, [connected, currentFolder.id, activeTab]);

  const handleImport = async (file: DriveFile) => {
    setImporting((prev) => ({ ...prev, [file.id]: true }));
    try {
      const resp = await supabase.functions.invoke("gdrive-api", {
        body: {
          action: "import",
          fileId: file.id,
          fileName: file.name,
          mimeType: file.mimeType,
        },
      });

      if (resp.error) throw new Error(resp.error.message);
      toast.success(`"${resp.data?.fileName || file.name}" imported successfully!`);
      queryClient.invalidateQueries({ queryKey: ["files"] });
    } catch (err: any) {
      toast.error(`Failed to import "${file.name}": ${err.message}`);
    } finally {
      setImporting((prev) => ({ ...prev, [file.id]: false }));
    }
  };

  const handleExport = async (fileId: string, fileName: string) => {
    setExporting((prev) => ({ ...prev, [fileId]: true }));
    try {
      const resp = await supabase.functions.invoke("gdrive-api", {
        body: { action: "export", fileId },
      });

      if (resp.error) throw new Error(resp.error.message);
      toast.success(`"${fileName}" exported to Google Drive!`);
    } catch (err: any) {
      toast.error(`Failed to export "${fileName}": ${err.message}`);
    } finally {
      setExporting((prev) => ({ ...prev, [fileId]: false }));
    }
  };

  const openFolder = (file: DriveFile) => {
    if (file.mimeType === "application/vnd.google-apps.folder") {
      setFolderStack((prev) => [...prev, { id: file.id, name: file.name }]);
    }
  };

  const goBack = () => {
    if (folderStack.length > 1) {
      setFolderStack((prev) => prev.slice(0, -1));
    }
  };

  if (connected === null || exchangeLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Connecting Google Drive...</p>
        </div>
      </AppLayout>
    );
  }

  if (!connected) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mb-6">
            <HardDrive className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Connect Google Drive</h1>
          <p className="text-muted-foreground max-w-md mb-6">
            Connect once, then import/export files directly between your Drive and Smart Storage.
          </p>
          <Button onClick={startDriveConnect} disabled={connecting} className="gap-2">
            {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {connecting ? "Redirecting to Google..." : "Connect Google Drive"}
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <HardDrive className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Google Drive</h1>
          </div>
          <p className="text-muted-foreground text-sm">Import files from Drive or export your files to Drive</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "import" ? "default" : "outline"}
            onClick={() => setActiveTab("import")}
            className="rounded-xl gap-2"
          >
            <Download className="w-4 h-4" /> Import from Drive
          </Button>
          <Button
            variant={activeTab === "export" ? "default" : "outline"}
            onClick={() => setActiveTab("export")}
            className="rounded-xl gap-2"
          >
            <Upload className="w-4 h-4" /> Export to Drive
          </Button>
        </div>

        {activeTab === "import" && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 mb-4 text-sm flex-wrap">
              {folderStack.map((folder, i) => (
                <div key={folder.id} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                  <button
                    onClick={() => setFolderStack((prev) => prev.slice(0, i + 1))}
                    className={cn(
                      "hover:text-primary transition-colors",
                      i === folderStack.length - 1 ? "font-medium text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {folder.name}
                  </button>
                </div>
              ))}
            </div>

            {/* Search + Refresh */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search Drive files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && listDriveFiles()}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => listDriveFiles()} disabled={loading}>
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              </Button>
              {folderStack.length > 1 && (
                <Button variant="outline" size="icon" onClick={goBack}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* File List */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : driveFiles.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <p>No files found in this folder.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {driveFiles.map((file) => {
                    const Icon = getMimeIcon(file.mimeType);
                    const isFolder = file.mimeType === "application/vnd.google-apps.folder";
                    return (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors cursor-pointer"
                        onClick={() => isFolder && openFolder(file)}
                      >
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {file.size ? `${(parseInt(file.size) / 1024 / 1024).toFixed(1)} MB` : ""}
                            {file.modifiedTime ? ` · ${new Date(file.modifiedTime).toLocaleDateString()}` : ""}
                          </p>
                        </div>
                        {!isFolder && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg gap-1.5 shrink-0"
                            disabled={importing[file.id]}
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleImport(file);
                            }}
                          >
                            {importing[file.id] ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                            Import
                          </Button>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "export" && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
            {!appFiles?.length ? (
              <div className="text-center py-20 text-muted-foreground">
                <p>No files to export. Upload files first.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {appFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
                  >
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.file_size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg gap-1.5 shrink-0"
                      disabled={exporting[file.id]}
                      onClick={() => void handleExport(file.id, file.file_name)}
                    >
                      {exporting[file.id] ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      Export
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
};

export default GoogleDrivePage;
