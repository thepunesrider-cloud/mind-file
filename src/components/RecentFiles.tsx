import { motion } from "framer-motion";
import { mockFiles, getFileIcon, getFileColor, tagColors } from "@/data/mockFiles";
import type { MockFile } from "@/data/mockFiles";
import { cn } from "@/lib/utils";

const RecentFiles = () => {
  const recent = [...mockFiles]
    .sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())
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
          const Icon = getFileIcon(file.type);
          const color = getFileColor(file.type);
          return (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
            >
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center bg-secondary", color)}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{file.size} · {file.uploadDate}</p>
              </div>
              <div className="flex gap-1">
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
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default RecentFiles;
