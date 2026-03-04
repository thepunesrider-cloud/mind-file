import { motion } from "framer-motion";
import { Clock, AlertTriangle } from "lucide-react";
import { mockFiles } from "@/data/mockFiles";

const ExpiringDocs = () => {
  const expiring = mockFiles
    .filter((f) => f.expiryDate)
    .sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime())
    .slice(0, 4);

  const getDaysUntil = (date: string) => {
    const diff = new Date(date).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass rounded-xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-4 h-4 text-warning" />
        <h3 className="font-semibold text-sm">Expiring Soon</h3>
      </div>
      <div className="space-y-3">
        {expiring.map((file) => {
          const days = getDaysUntil(file.expiryDate!);
          const isUrgent = days <= 30;
          return (
            <div key={file.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{file.expiryDate}</p>
              </div>
              <div className={`flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ml-3 ${isUrgent ? "text-destructive" : "text-warning"}`}>
                <Clock className="w-3 h-3" />
                {days > 0 ? `${days}d left` : "Expired"}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ExpiringDocs;
