import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Clock, CheckCircle, AlertTriangle, Calendar } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { mockFiles } from "@/data/mockFiles";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const RemindersPage = () => {
  const expiringFiles = mockFiles.filter((f) => f.expiryDate).map((f) => {
    const days = Math.ceil((new Date(f.expiryDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return { ...f, daysUntil: days };
  }).sort((a, b) => a.daysUntil - b.daysUntil);

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <h1 className="text-2xl font-bold">Reminders</h1>
          <p className="text-muted-foreground text-sm mt-1">Document expiry alerts and notifications</p>
        </motion.div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-4 text-center">
            <AlertTriangle className="w-5 h-5 text-destructive mx-auto mb-2" />
            <p className="text-2xl font-bold">{expiringFiles.filter((f) => f.daysUntil <= 30).length}</p>
            <p className="text-xs text-muted-foreground">Within 30 days</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-xl p-4 text-center">
            <Clock className="w-5 h-5 text-warning mx-auto mb-2" />
            <p className="text-2xl font-bold">{expiringFiles.filter((f) => f.daysUntil <= 90 && f.daysUntil > 30).length}</p>
            <p className="text-xs text-muted-foreground">Within 90 days</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-xl p-4 text-center">
            <Calendar className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{expiringFiles.length}</p>
            <p className="text-xs text-muted-foreground">Total tracked</p>
          </motion.div>
        </div>

        {/* Reminders List */}
        <div className="space-y-3">
          {expiringFiles.map((file, i) => {
            const isUrgent = file.daysUntil <= 30;
            const isDismissed = dismissedIds.has(file.id);
            if (isDismissed) return null;

            return (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "glass rounded-xl p-4",
                  isUrgent && "border-destructive/30"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      isUrgent ? "bg-destructive/10" : "bg-warning/10"
                    )}>
                      {isUrgent ? (
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                      ) : (
                        <Clock className="w-5 h-5 text-warning" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Expires: {file.expiryDate} ·{" "}
                        <span className={isUrgent ? "text-destructive font-medium" : "text-warning"}>
                          {file.daysUntil > 0 ? `${file.daysUntil} days left` : "Expired"}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setDismissedIds((prev) => new Set(prev).add(file.id))}>
                      Dismiss
                    </Button>
                    <Button size="sm" className="h-8 text-xs text-primary-foreground">
                      <Bell className="w-3 h-3 mr-1" />
                      Set Alert
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};

export default RemindersPage;
