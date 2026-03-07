import { motion } from "framer-motion";
import { Download, Eye } from "lucide-react";
import { useFiles } from "@/hooks/useFiles";
import { getFileIcon, getFileColor, tagColors } from "@/data/mockFiles";
import { cn } from "@/lib/utils";
import { downloadFile, viewFile } from "@/lib/fileUrl";

function mapFileType(mimeType: string): "pdf" | "image" | "docx" | "spreadsheet" {
  if (mimeType.includes("pdf")) return "pdf";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.includes("word") || mimeType.includes("document")) return "docx";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "spreadsheet";
  return "pdf";
}

const RecentFiles = () => {
  const { data: files } = useFiles();

  const recent = (files || [])
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass rounded-xl p-5"
    >
      <h3 className="font-semibold text-sm mb-4">Recently Accessed</h3>
      <div className="space-y-2">
        {recent.map((file) => {
          const type = mapFileType(file.file_type);
          const Icon = getFileIcon(type);
          const color = getFileColor(type);
          const size = `${(file.file_size / (1024 * 1024)).toFixed(1)} MB`;
          return (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center bg-secondary", color)}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{file.file_name}</p>
                <p className="text-xs text-muted-foreground">{size} · {new Date(file.upload_date).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                {file.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag.name}
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-medium",
                      tagColors[tag.name] || "bg-secondary text-muted-foreground"
                    )}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
              {file.file_url && (
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => viewFile(file.file_url)}
                    title="View"
                    className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => downloadFile(file.file_url, file.file_name)}
                    title="Download"
                    className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {recent.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No files yet. Upload some to get started.</p>
        )}
      </div>
    </motion.div>
  );
};

export default RecentFiles;
