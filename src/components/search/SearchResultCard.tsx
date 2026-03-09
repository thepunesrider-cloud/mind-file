import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getFileIcon, getFileColor, tagColors } from "@/data/mockFiles";
import { Download, Eye, MessageCircle } from "lucide-react";
import type { FileWithTags } from "@/hooks/useFiles";
import { downloadFile, viewFile } from "@/lib/fileUrl";
import { useNavigate } from "react-router-dom";

interface SearchResultCardProps {
  file: FileWithTags;
  detail: any;
  snippet: string;
  isSelected: boolean;
  index: number;
  onClick: () => void;
  isTopResult?: boolean;
}

const SearchResultCard = ({ file, detail, snippet, isSelected, index, onClick, isTopResult }: SearchResultCardProps) => {
  const Icon = getFileIcon(detail.type);
  const color = getFileColor(detail.type);
  const entities = (file as any).entities || [];
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
      className={cn(
        "rounded-xl cursor-pointer transition-all",
        isTopResult
          ? "glass p-5 border-2 border-primary/30 bg-primary/5 shadow-lg shadow-primary/5 ring-1 ring-primary/10"
          : "glass p-4 glass-hover",
        isSelected && "border-primary/40"
      )}
    >
      {isTopResult && (
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary">
            ✨ Best Match
          </span>
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className={cn(
          "rounded-lg flex items-center justify-center bg-secondary shrink-0",
          isTopResult ? "w-12 h-12" : "w-10 h-10",
          color
        )}>
          <Icon className={isTopResult ? "w-6 h-6" : "w-5 h-5"} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn("font-medium", isTopResult ? "text-base" : "text-sm")}>{file.file_name}</p>
          <p className={cn("text-muted-foreground mt-1", isTopResult ? "text-sm line-clamp-3" : "text-xs line-clamp-2")}>{snippet}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <div className="flex gap-1">
              {file.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.name}
                  className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", tagColors[tag.name] || "bg-secondary text-muted-foreground")}
                >
                  {tag.name}
                </span>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">· {detail.size} · {detail.uploadDate}</span>
            {entities.length > 0 && (
              <span className="text-[10px] text-primary/70">· {entities.length} entities</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 self-center">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/chat?fileId=${file.id}`); }}
            title="Chat with document"
            className="p-2 rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
          {file.file_url && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); viewFile(file.file_url); }}
                title="View"
                className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); downloadFile(file.file_url, file.file_name); }}
                title="Download"
                className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SearchResultCard;
