import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getFileIcon, getFileColor, tagColors } from "@/data/mockFiles";
import { Download } from "lucide-react";
import type { FileWithTags } from "@/hooks/useFiles";
import { downloadFile } from "@/lib/fileUrl";

interface SearchResultCardProps {
  file: FileWithTags;
  detail: any;
  snippet: string;
  isSelected: boolean;
  index: number;
  onClick: () => void;
}

const SearchResultCard = ({ file, detail, snippet, isSelected, index, onClick }: SearchResultCardProps) => {
  const Icon = getFileIcon(detail.type);
  const color = getFileColor(detail.type);
  const entities = (file as any).entities || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
      className={cn("glass rounded-xl p-4 cursor-pointer glass-hover", isSelected && "border-primary/40")}
    >
      <div className="flex items-start gap-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-secondary shrink-0", color)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{file.file_name}</p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{snippet}</p>
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
        {file.file_url && (
          <button
            onClick={(e) => { e.stopPropagation(); downloadFile(file.file_url, file.file_name); }}
            title="Download"
            className="shrink-0 p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors self-center"
          >
            <Download className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default SearchResultCard;
