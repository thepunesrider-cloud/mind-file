import { motion } from "framer-motion";
import { Clock, AlertTriangle } from "lucide-react";
import { useFiles } from "@/hooks/useFiles";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const ExpiringDocs = () => {
  const { data: files } = useFiles();
  const navigate = useNavigate();

  const expiring = (files || [])
    .filter((f) => f.expiry_date)
    .sort((a, b) => new Date(a.expiry_date!).getTime() - new Date(b.expiry_date!).getTime())
    .slice(0, 4);

  const getDaysUntil = (date: string) => {
    return Math.ceil((new Date(date).getTime() - Date.now()) / 864e5);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" />
          <h3 className="font-semibold text-sm">Expiring Soon</h3>
        </div>
        <button onClick={() => navigate("/reminders")} className="text-xs text-primary hover:underline">
          View All
        </button>
      </div>
      <div className="space-y-2">
        {expiring.map((file) => {
          const days = getDaysUntil(file.expiry_date!);
          const isUrgent = days <= 30;
          return (
            <div key={file.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{file.file_name}</p>
                <p className="text-xs text-muted-foreground">{new Date(file.expiry_date!).toLocaleDateString()}</p>
              </div>
              <div className={cn(
                "flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ml-3",
                isUrgent ? "text-destructive" : "text-warning"
              )}>
                <Clock className="w-3 h-3" />
                {days > 0 ? `${days}d left` : "Expired"}
              </div>
            </div>
          );
        })}
        {expiring.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No expiring documents</p>
        )}
      </div>
    </motion.div>
  );
};

export default ExpiringDocs;
