import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Clock, AlertTriangle, Calendar, FileText, Download, Eye, CheckCircle } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useFiles } from "@/hooks/useFiles";
import { Button } from "@/components/ui/button";
import { downloadFile, viewFile } from "@/lib/fileUrl";
import { cn } from "@/lib/utils";

const RemindersPage = () => {
  const { data: files, isLoading } = useFiles();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const expiringFiles = (files || [])
    .filter((f) => f.expiry_date)
    .map((f) => {
      const days = Math.ceil((new Date(f.expiry_date!).getTime() - Date.now()) / 864e5);
      return { ...f, daysUntil: days };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const expired = expiringFiles.filter((f) => f.daysUntil <= 0 && !dismissedIds.has(f.id));
  const urgent = expiringFiles.filter((f) => f.daysUntil > 0 && f.daysUntil <= 30 && !dismissedIds.has(f.id));
  const upcoming = expiringFiles.filter((f) => f.daysUntil > 30 && f.daysUntil <= 90 && !dismissedIds.has(f.id));
  const later = expiringFiles.filter((f) => f.daysUntil > 90 && !dismissedIds.has(f.id));

  const summaryCards = [
    { icon: AlertTriangle, label: "Expired", count: expired.length, color: "text-destructive", bg: "bg-destructive/10" },
    { icon: Clock, label: "Within 30 days", count: urgent.length, color: "text-warning", bg: "bg-warning/10" },
    { icon: Calendar, label: "Within 90 days", count: upcoming.length, color: "text-primary", bg: "bg-primary/10" },
    { icon: CheckCircle, label: "Total tracked", count: expiringFiles.length, color: "text-success", bg: "bg-success/10" },
  ];

  const renderSection = (title: string, items: typeof expiringFiles, severity: "expired" | "urgent" | "normal") => {
    if (items.length === 0) return null;
    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{title}</h3>
        <div className="space-y-2">
          {items.map((file, i) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={cn(
                "rounded-xl border bg-card p-4 transition-colors hover:bg-secondary/30",
                severity === "expired" && "border-destructive/30",
                severity === "urgent" && "border-warning/30",
                severity === "normal" && "border-border"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    severity === "expired" ? "bg-destructive/10" : severity === "urgent" ? "bg-warning/10" : "bg-primary/10"
                  )}>
                    {severity === "expired" ? (
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                    ) : severity === "urgent" ? (
                      <Clock className="w-5 h-5 text-warning" />
                    ) : (
                      <Calendar className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{file.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Expires: {new Date(file.expiry_date!).toLocaleDateString()} ·{" "}
                      <span className={cn(
                        severity === "expired" ? "text-destructive font-medium" :
                        severity === "urgent" ? "text-warning font-medium" : "text-muted-foreground"
                      )}>
                        {file.daysUntil > 0 ? `${file.daysUntil} days left` : `Expired ${Math.abs(file.daysUntil)} days ago`}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
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
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs text-muted-foreground"
                    onClick={() => setDismissedIds((prev) => new Set(prev).add(file.id))}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Reminders</h1>
          <p className="text-muted-foreground text-sm mt-1">Document expiry alerts and notifications</p>
        </motion.div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {summaryCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border bg-card p-4 text-center"
            >
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mx-auto mb-2", card.bg)}>
                <card.icon className={cn("w-4 h-4", card.color)} />
              </div>
              <p className="text-2xl font-bold">{card.count}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Sections */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-secondary/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {renderSection("Expired", expired, "expired")}
            {renderSection("Expiring within 30 days", urgent, "urgent")}
            {renderSection("Expiring within 90 days", upcoming, "normal")}
            {renderSection("Later", later, "normal")}
            {expiringFiles.length === 0 && (
              <div className="text-center py-16">
                <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No documents with expiry dates found</p>
                <p className="text-xs text-muted-foreground mt-1">Upload documents with expiry dates to see reminders here</p>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default RemindersPage;
