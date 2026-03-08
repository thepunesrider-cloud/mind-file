import { motion } from "framer-motion";
import {
  Files,
  Upload,
  Clock,
  Tag,
  FileText,
  Image,
  File,
  FileSpreadsheet,
  HardDrive,
  TrendingUp,
  FolderOpen,
  Search,
  Download,
  Eye,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import AppLayout from "@/components/AppLayout";
import { useFiles } from "@/hooks/useFiles";
import { useNavigate } from "react-router-dom";
import { downloadFile, viewFile } from "@/lib/fileUrl";
import { getFileIcon, getFileColor } from "@/data/mockFiles";
import { cn } from "@/lib/utils";
import { ActionSearchbar } from "@/components/ui/action-searchbar";

function mapType(mime: string) {
  if (mime.includes("pdf")) return "pdf" as const;
  if (mime.startsWith("image/")) return "image" as const;
  if (mime.includes("word") || mime.includes("document")) return "docx" as const;
  if (mime.includes("sheet") || mime.includes("excel")) return "spreadsheet" as const;
  return "pdf" as const;
}

function formatSize(bytes: number) {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(1)} KB`;
  return `${bytes} B`;
}

const typeColors: Record<string, string> = {
  pdf: "hsl(0, 72%, 51%)",
  image: "hsl(152, 56%, 46%)",
  docx: "hsl(230, 72%, 58%)",
  spreadsheet: "hsl(38, 92%, 50%)",
};

const Dashboard = () => {
  const { data: files, isLoading } = useFiles();
  const navigate = useNavigate();
  const allFiles = files || [];

  // Compute stats
  const totalFiles = allFiles.length;
  const totalSize = allFiles.reduce((s, f) => s + f.file_size, 0);
  const now = new Date();
  const thisMonth = allFiles.filter((f) => {
    const d = new Date(f.upload_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const expiringSoon = allFiles.filter((f) => {
    if (!f.expiry_date) return false;
    const days = Math.ceil((new Date(f.expiry_date).getTime() - Date.now()) / 864e5);
    return days > 0 && days <= 30;
  }).length;

  const allTags = allFiles.flatMap((f) => f.tags.map((t) => t.name));
  const uniqueTags = new Set(allTags).size;

  // Type breakdown
  const typeCounts: Record<string, number> = {};
  allFiles.forEach((f) => {
    const t = mapType(f.file_type);
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  const typeData = Object.entries(typeCounts).map(([name, value]) => ({
    name: name.toUpperCase(),
    value,
    color: typeColors[name] || "hsl(240, 10%, 50%)",
  }));

  // Recent files
  const recent = [...allFiles]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 6);

  // Quick actions
  const quickActions = [
    { label: "Upload File", icon: Upload, to: "/upload", gradient: "from-primary to-accent" },
    { label: "Browse Files", icon: FolderOpen, to: "/files", gradient: "from-primary to-info" },
    { label: "Search", icon: Search, to: "/search", gradient: "from-accent to-primary" },
  ];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header + Command Search */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">
            Welcome back
          </h1>
          <p className="text-muted-foreground text-sm mt-1 mb-5">Here's what's happening with your files</p>

          {/* Action Searchbar with gradient glow */}
          <div className="relative max-w-xl">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 blur-lg opacity-70 pointer-events-none" />
            <div className="relative">
              <ActionSearchbar />
            </div>
          </div>
        </motion.div>

        {/* Storage overview bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-border bg-card p-4 sm:p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <HardDrive className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Storage Used</p>
                <p className="text-2xl font-bold">{formatSize(totalSize)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-6">
              {typeData.map((t) => (
                <div key={t.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: t.color }} />
                  <span className="text-xs text-muted-foreground">{t.name}</span>
                  <span className="text-xs font-semibold">{t.value}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-4 h-2 rounded-full bg-secondary overflow-hidden flex">
            {typeData.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ width: 0 }}
                animate={{ width: `${totalFiles > 0 ? (t.value / totalFiles) * 100 : 0}%` }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.6 }}
                className="h-full first:rounded-l-full last:rounded-r-full"
                style={{ background: t.color }}
              />
            ))}
          </div>
        </motion.div>

        {/* Stat cards grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[
            { icon: Files, value: totalFiles, label: "Total Files", color: "text-primary", bg: "bg-primary/10" },
            { icon: Upload, value: thisMonth, label: "This Month", color: "text-accent", bg: "bg-accent/10" },
            { icon: Clock, value: expiringSoon, label: "Expiring Soon", color: "text-warning", bg: "bg-warning/10" },
            { icon: Tag, value: uniqueTags, label: "Unique Tags", color: "text-info", bg: "bg-info/10" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-3", stat.bg)}>
                <stat.icon className={cn("w-4 h-4", stat.color)} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick actions + Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          {/* Quick actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <h3 className="font-semibold text-sm mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.to)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors text-left group"
                >
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center`}>
                    <action.icon className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="text-sm font-medium group-hover:text-primary transition-colors">{action.label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* File type chart */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-xl border border-border bg-card p-5 lg:col-span-2"
          >
            <h3 className="font-semibold text-sm mb-4">File Distribution</h3>
            {typeData.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {typeData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 grid grid-cols-2 gap-3">
                  {typeData.map((d) => (
                    <div key={d.name} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/50">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: d.color }} />
                      <div>
                        <p className="text-sm font-medium">{d.name}</p>
                        <p className="text-xs text-muted-foreground">{d.value} file{d.value !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Upload files to see distribution</p>
            )}
          </motion.div>
        </div>

        {/* Recent files */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-border bg-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Recent Files</h3>
            <button
              onClick={() => navigate("/files")}
              className="text-xs text-primary hover:underline"
            >
              View All
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-lg bg-secondary/50 animate-pulse" />
              ))}
            </div>
          ) : recent.length > 0 ? (
            <div className="space-y-1">
              {recent.map((file) => {
                const type = mapType(file.file_type);
                const Icon = getFileIcon(type);
                const color = getFileColor(type);
                return (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors group"
                  >
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-secondary shrink-0", color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{file.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatSize(file.file_size)} · {new Date(file.upload_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="hidden sm:flex gap-1 shrink-0">
                      {file.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag.name}
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => viewFile(file.file_url)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        title="View"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => downloadFile(file.file_url, file.file_name)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <FolderOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No files yet</p>
              <button
                onClick={() => navigate("/upload")}
                className="mt-3 text-sm text-primary hover:underline"
              >
                Upload your first file
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
