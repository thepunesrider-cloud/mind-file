import { motion } from "framer-motion";
import { BarChart3, Upload, Search, Eye, Share2, Download, TrendingUp, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import AppLayout from "@/components/AppLayout";
import { useAnalyticsSummary } from "@/hooks/useAnalytics";
import { cn } from "@/lib/utils";

const iconMap: Record<string, any> = {
  upload: Upload,
  search: Search,
  view: Eye,
  share: Share2,
  download: Download,
};

const AnalyticsPage = () => {
  const { data, isLoading } = useAnalyticsSummary(30);

  const statCards = [
    { key: "upload", label: "Uploads", color: "text-primary", bg: "bg-primary/10" },
    { key: "search", label: "Searches", color: "text-accent", bg: "bg-accent/10" },
    { key: "view", label: "Views", color: "text-info", bg: "bg-info/10" },
    { key: "share", label: "Shares", color: "text-warning", bg: "bg-warning/10" },
    { key: "download", label: "Downloads", color: "text-destructive", bg: "bg-destructive/10" },
  ];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <BarChart3 className="w-6 h-6 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold">Analytics</h1>
          </div>
          <p className="text-muted-foreground text-sm">Track your activity over the last 30 days</p>
        </motion.div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {statCards.map((s, i) => {
            const Icon = iconMap[s.key] || Activity;
            const val = data?.totals?.[s.key as keyof typeof data.totals] || 0;
            return (
              <motion.div
                key={s.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-2", s.bg)}>
                  <Icon className={cn("w-4 h-4", s.color)} />
                </div>
                <p className="text-2xl font-bold">{val}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Activity chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl border border-border bg-card p-5 mb-6"
        >
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Activity Over Time
          </h3>
          {data?.daily && data.daily.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.daily}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                <Area type="monotone" dataKey="uploads" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.3)" />
                <Area type="monotone" dataKey="searches" stackId="1" stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.3)" />
                <Area type="monotone" dataKey="views" stackId="1" stroke="hsl(var(--info))" fill="hsl(var(--info) / 0.3)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-16 text-muted-foreground text-sm">
              {isLoading ? "Loading analytics..." : "No activity yet. Start uploading and searching to see trends."}
            </div>
          )}
        </motion.div>

        {/* Recent events */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-border bg-card p-5"
        >
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent" /> Recent Activity
          </h3>
          {data?.recentEvents && data.recentEvents.length > 0 ? (
            <div className="space-y-2">
              {data.recentEvents.map((ev: any) => {
                const Icon = iconMap[ev.event_type] || Activity;
                return (
                  <div key={ev.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium capitalize">{ev.event_type}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {ev.event_data?.fileName || ev.event_data?.query || ""}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(ev.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default AnalyticsPage;
