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
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import AppLayout from "@/components/AppLayout";
import StatCard from "@/components/StatCard";
import ExpiringDocs from "@/components/ExpiringDocs";
import RecentFiles from "@/components/RecentFiles";

const typeData = [
  { name: "PDF", value: 4, color: "hsl(0, 72%, 51%)" },
  { name: "Images", value: 2, color: "hsl(160, 60%, 45%)" },
  { name: "DOCX", value: 1, color: "hsl(210, 100%, 56%)" },
  { name: "Spreadsheet", value: 1, color: "hsl(38, 92%, 50%)" },
];

const tagData = [
  { name: "Work", count: 4 },
  { name: "Personal", count: 3 },
  { name: "Finance", count: 3 },
  { name: "Insurance", count: 2 },
  { name: "Travel", count: 1 },
  { name: "Legal", count: 1 },
];

const Dashboard = () => {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Overview of your smart file storage</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Files} value={8} title="Total Files" trend={{ value: "12%", positive: true }} />
          <StatCard icon={Upload} value={3} title="Uploaded This Month" subtitle="Feb 2025" />
          <StatCard icon={Clock} value={4} title="Expiring Soon" iconClassName="bg-warning/10" />
          <StatCard icon={Tag} value={11} title="AI Tags Generated" iconClassName="bg-accent/10" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* File Type Chart */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass rounded-xl p-5"
          >
            <h3 className="font-semibold text-sm mb-4">File Types</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {typeData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {typeData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  {d.name}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Tag Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-xl p-5 lg:col-span-2"
          >
            <h3 className="font-semibold text-sm mb-4">Tag Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={tagData} layout="vertical" margin={{ left: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 12, fill: "hsl(215, 20%, 55%)" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(222, 44%, 10%)", border: "1px solid hsl(222, 30%, 16%)", borderRadius: "8px", fontSize: "12px" }}
                  cursor={{ fill: "hsl(222, 30%, 12%)" }}
                />
                <Bar dataKey="count" fill="hsl(187, 80%, 52%)" radius={[0, 6, 6, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentFiles />
          <ExpiringDocs />
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
