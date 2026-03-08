import { ReactNode, useState } from "react";
import { Menu, X } from "lucide-react";
import AppSidebar from "./AppSidebar";
import { useIsMobile } from "@/hooks/use-mobile";

const AppLayout = ({ children }: { children: ReactNode }) => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Auto-close sidebar when switching to mobile


  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={
          isMobile
            ? `fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`
            : ""
        }
      >
        <AppSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main */}
      <main className={`flex-1 ${isMobile ? "" : "ml-64"} p-4 sm:p-6 lg:p-8 min-w-0 overflow-x-hidden`}>
        {isMobile && !sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="mb-4 p-2.5 rounded-xl bg-card border border-border hover:bg-secondary transition-colors active:scale-95"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
