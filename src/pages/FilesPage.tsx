import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Grid3X3, List, Loader2, Download } from "lucide-react";
import { downloadFile } from "@/lib/fileUrl";
import AppLayout from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { useFiles } from "@/hooks/useFiles";
import type { FileWithTags } from "@/hooks/useFiles";
import FileDetailPanel from "@/components/FileDetailPanel";
import { cn } from "@/lib/utils";
import { getFileIcon, getFileColor, tagColors } from "@/data/mockFiles";

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
  };
}

const FilesPage = () => {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [filter, setFilter] = useState("");
  const { data: files, isLoading } = useFiles();

  const filtered = (files || []).filter(
    (f) =>
      f.file_name.toLowerCase().includes(filter.toLowerCase()) ||
      f.tags.some((t) => t.name.toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Files</h1>
            <p className="text-muted-foreground text-sm mt-1">{files?.length || 0} files · AI processed</p>
          </div>
          <div className="flex items-center gap-2">
            <Input placeholder="Filter files..." value={filter} onChange={(e) => setFilter(e.target.value)} className="w-56 h-9 bg-secondary border-border text-sm" />
            <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary">
              <button onClick={() => setView("grid")} className={cn("p-1.5 rounded-md transition-colors", view === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground")}>
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button onClick={() => setView("list")} className={cn("p-1.5 rounded-md transition-colors", view === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground")}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p>No files yet. Upload some files to get started!</p>
          </div>
        ) : (
          <div className="flex gap-6">
            <div className="flex-1">
              {view === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((file, i) => {
                    const detail = toDetailFile(file);
                    const Icon = getFileIcon(detail.type);
                    const color = getFileColor(detail.type);
                    return (
                      <motion.div key={file.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        onClick={() => setSelectedFile(detail)}
                        className={cn("glass rounded-xl p-4 cursor-pointer glass-hover", selectedFile?.id === file.id && "border-primary/40")}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-secondary", color)}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{file.file_name}</p>
                            <p className="text-xs text-muted-foreground">{detail.size} · {detail.uploadDate}</p>
                          </div>
                          {file.file_url && (
                            <button
                              onClick={(e) => { e.stopPropagation(); downloadFile(file.file_url, file.file_name); }}
                              title="Download"
                              className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{detail.summary}</p>
                        <div className="flex flex-wrap gap-1">
                          {file.tags.map((tag) => (
                            <span key={tag.name} className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", tagColors[tag.name] || "bg-secondary text-muted-foreground")}>{tag.name}</span>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((file, i) => {
                    const detail = toDetailFile(file);
                    const Icon = getFileIcon(detail.type);
                    const color = getFileColor(detail.type);
                    return (
                      <motion.div key={file.id} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                        onClick={() => setSelectedFile(detail)}
                        className={cn("glass rounded-lg p-3 flex items-center gap-4 cursor-pointer glass-hover", selectedFile?.id === file.id && "border-primary/40")}
                      >
                        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center bg-secondary shrink-0", color)}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1"><p className="text-sm font-medium truncate">{file.file_name}</p></div>
                        <div className="flex gap-1 shrink-0">
                          {file.tags.slice(0, 2).map((tag) => (
                            <span key={tag.name} className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", tagColors[tag.name] || "bg-secondary text-muted-foreground")}>{tag.name}</span>
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{detail.size}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{detail.uploadDate}</span>
                        {file.file_url && (
                          <button
                            onClick={(e) => { e.stopPropagation(); downloadFile(file.file_url, file.file_name); }}
                            title="Download"
                            className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
            <AnimatePresence>
              {selectedFile && <FileDetailPanel file={selectedFile} onClose={() => setSelectedFile(null)} />}
            </AnimatePresence>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default FilesPage;
