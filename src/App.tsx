import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UploadPage from "./pages/UploadPage";
import FilesPage from "./pages/FilesPage";
import SearchPage from "./pages/SearchPage";
import RemindersPage from "./pages/RemindersPage";
import ChatPage from "./pages/ChatPage";
import SmartFoldersPage from "./pages/SmartFoldersPage";
import ComparePage from "./pages/ComparePage";
import SharedFilePage from "./pages/SharedFilePage";
import NotFound from "./pages/NotFound";
import AuthGuard from "./components/AuthGuard";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
            <Route path="/upload" element={<AuthGuard><UploadPage /></AuthGuard>} />
            <Route path="/files" element={<AuthGuard><FilesPage /></AuthGuard>} />
            <Route path="/search" element={<AuthGuard><SearchPage /></AuthGuard>} />
            <Route path="/reminders" element={<AuthGuard><RemindersPage /></AuthGuard>} />
            <Route path="/chat" element={<AuthGuard><ChatPage /></AuthGuard>} />
            <Route path="/smart-folders" element={<AuthGuard><SmartFoldersPage /></AuthGuard>} />
            <Route path="/compare" element={<AuthGuard><ComparePage /></AuthGuard>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
