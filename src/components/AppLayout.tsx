import { ReactNode, useState } from "react";
import { Menu } from "lucide-react";
import AppSidebar from "./AppSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import BottomNavBar from "@/components/ui/bottom-nav-bar";
import { SupportChat } from "@/components/SupportChat";
import { NotificationBell } from "@/components/NotificationBell";

const AppLayout = ({ children }: { children: ReactNode }) => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile */}
      {!isMobile && (
        <div>
          <AppSidebar onClose={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Mobile sidebar drawer */}
      {isMobile && (
        <div
          className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <AppSidebar onClose={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main */}
      <main className={`flex-1 ${isMobile ? "pb-20" : "ml-64"} p-4 sm:p-6 lg:p-8 min-w-0 overflow-x-hidden`}>
        {isMobile && !sidebarOpen && (
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2.5 rounded-xl bg-card border border-border hover:bg-secondary transition-colors active:scale-95"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <NotificationBell />
          </div>
        )}
        {!isMobile && (
          <div className="flex justify-end mb-2">
            <NotificationBell />
          </div>
        )}
        {children}
      </main>

      {/* Mobile bottom nav */}
      {isMobile && <BottomNavBar />}

      <SupportChat />
    </div>
  );
};

export default AppLayout;

