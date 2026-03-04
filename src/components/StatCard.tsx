import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  className?: string;
  iconClassName?: string;
}

const StatCard = ({ title, value, subtitle, icon: Icon, trend, className, iconClassName }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn("glass rounded-xl p-5 glass-hover", className)}
  >
    <div className="flex items-start justify-between mb-3">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10", iconClassName)}>
        <Icon className="w-5 h-5 text-primary" />
      </div>
      {trend && (
        <span className={cn(
          "text-xs font-medium px-2 py-1 rounded-full",
          trend.positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
        )}>
          {trend.positive ? "+" : ""}{trend.value}
        </span>
      )}
    </div>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-sm text-muted-foreground mt-1">{title}</p>
    {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
  </motion.div>
);

export default StatCard;
