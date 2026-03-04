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
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { data: files, isLoading } = useFiles();

  // Get unique categories/tags
  const categories = ["all", ...Array.from(new Set((files || []).flatMap((f) => f.tags.map((t) => t.name))))];

  const filtered = (files || []).filter(
    (f) => {
      const matchesSearch =
        f.file_name.toLowerCase().includes(filter.toLowerCase()) ||
        f.tags.some((t) => t.name.toLowerCase().includes(filter.toLowerCase()));
      const matchesCategory = selectedCategory === "all" || f.tags.some((t) => t.name === selectedCategory);
      return matchesSearch && matchesCategory;
    }
  );

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto flex gap-8">
        {/* Left Sidebar - Categories - Sticky */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-52 flex-shrink-0 sticky top-6 h-fit"
        >
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

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 min-w-0"
        >
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="flex items-center justify-between mb-6"
            >
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Files</h1>
                <p className="text-muted-foreground text-sm mt-2">{filtered.length} files · AI processed</p>
              </div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="flex items-center gap-3"
              >
                <div className="relative">
                  <Input
                    placeholder="Search files..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-64 h-10 bg-secondary/50 border-border/40 rounded-2xl pl-4 text-sm placeholder:text-muted-foreground/60 focus:bg-secondary focus:border-primary/50 transition-all"
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
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center py-24"
              >
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                  <Loader2 className="w-8 h-8 text-primary" />
                </motion.div>
              </motion.div>
            ) : filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-24"
              >
                <div className="text-muted-foreground">
                  <Loader2 className="w-12 h-12 opacity-20 mx-auto mb-4" />
                  <p className="text-lg">No files found</p>
                  <p className="text-sm opacity-70">Try adjusting your filters or upload some files</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.05, delayChildren: 0.2 }}
                className="flex gap-6"
              >
                <div className="flex-1">
                  {view === "grid" ? (
                    <motion.div
                      layout
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                    >
                      {filtered.map((file, i) => {
                        const detail = toDetailFile(file);
                        const Icon = getFileIcon(detail.type);
                        const color = getFileColor(detail.type);
                        return (
                          <motion.div
                            key={file.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3 }}
                            whileHover={{ y: -8, transition: { duration: 0.2 } }}
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
                                <p className="text-sm font-semibold truncate text-foreground">{file.file_name}</p>
                                <p className="text-xs text-muted-foreground/80">{detail.size} · {detail.uploadDate}</p>
                              </div>
                              {file.file_url && (
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadFile(file.file_url, file.file_name);
                                  }}
                                  title="Download"
                                  className="shrink-0 p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                                >
                                  <Download className="w-4 h-4" />
                                </motion.button>
                              )}
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
                        );
                      })}
                    </motion.div>
                  ) : (
                    <motion.div
                      layout
                      className="space-y-3"
                    >
                      {filtered.map((file, i) => {
                        const detail = toDetailFile(file);
                        const Icon = getFileIcon(detail.type);
                        const color = getFileColor(detail.type);
                        return (
                          <motion.div
                            key={file.id}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            onClick={() => setSelectedFile(detail)}
                            whileHover={{ x: 8, transition: { duration: 0.2 } }}
                            className={cn(
                              "group relative bg-gradient-to-r from-card to-card/80 rounded-3xl px-5 py-3.5 flex items-center gap-4 cursor-pointer border border-border/30 transition-all duration-300",
                              selectedFile?.id === file.id
                                ? "border-primary/50 shadow-lg shadow-primary/10 bg-primary/5"
                                : "hover:border-primary/40 hover:shadow-md hover:shadow-primary/5"
                            )}
                          >
                            <motion.div
                              whileHover={{ scale: 1.1, rotate: -5 }}
                              className={cn("w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br", color)}
                            >
                              <Icon className="w-4 h-4" />
                            </motion.div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold truncate text-foreground">{file.file_name}</p>
                            </div>
                            <div className="flex gap-2 shrink-0">
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
                            <span className="text-xs text-muted-foreground/70 shrink-0 whitespace-nowrap">{detail.size}</span>
                            <span className="text-xs text-muted-foreground/70 shrink-0 whitespace-nowrap">{detail.uploadDate}</span>
                            {file.file_url && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadFile(file.file_url, file.file_name);
                                }}
                                title="Download"
                                className="shrink-0 p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                              >
                                <Download className="w-4 h-4" />
                              </motion.button>
                            )}
                          </motion.div>
                        );
                      })}
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
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default FilesPage;