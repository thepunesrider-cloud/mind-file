import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Upload,
  FolderOpen,
  Search,
  Bell,
  Settings,
  Zap,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/upload", icon: Upload, label: "Upload" },
  { to: "/files", icon: FolderOpen, label: "Files" },
  { to: "/search", icon: Search, label: "Search" },
  { to: "/reminders", icon: Bell, label: "Reminders" },
];

const AppSidebar = () => {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 flex flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center glow">
          <Zap className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-sm font-bold gradient-text">Smart Storage</h1>
          <p className="text-[10px] text-muted-foreground">AI File Manager</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <RouterNavLink
              key={item.to}
              to={item.to}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon className="w-4 h-4" />
              {item.label}
            </RouterNavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {isDark ? "Light Mode" : "Dark Mode"}
        </button>
        <RouterNavLink
          to="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
        >
          <Settings className="w-4 h-4" />
          Settings
        </RouterNavLink>
        <RouterNavLink
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </RouterNavLink>
      </div>
    </aside>
  );
};

export default AppSidebar;
