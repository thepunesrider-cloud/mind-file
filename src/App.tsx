import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import ErrorBoundary from "@/components/ErrorBoundary";
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
import SettingsPage from "./pages/SettingsPage";
import WhatsAppPage from "./pages/WhatsAppPage";
import SharedFilePage from "./pages/SharedFilePage";
import PricingPage from "./pages/PricingPage";
import OnboardingPage from "./pages/OnboardingPage";
import AdminPage from "./pages/AdminPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import TeamsPage from "./pages/TeamsPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsPage from "./pages/TermsPage";
import NotFound from "./pages/NotFound";
import AuthGuard from "./components/AuthGuard";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
              <Route path="/upload" element={<AuthGuard><UploadPage /></AuthGuard>} />
              <Route path="/files" element={<AuthGuard><FilesPage /></AuthGuard>} />
              <Route path="/search" element={<AuthGuard><SearchPage /></AuthGuard>} />
              <Route path="/reminders" element={<AuthGuard><RemindersPage /></AuthGuard>} />
              <Route path="/chat" element={<AuthGuard><ChatPage /></AuthGuard>} />
              <Route path="/smart-folders" element={<AuthGuard><SmartFoldersPage /></AuthGuard>} />
              <Route path="/compare" element={<AuthGuard><ComparePage /></AuthGuard>} />
              <Route path="/settings" element={<AuthGuard><SettingsPage /></AuthGuard>} />
              <Route path="/whatsapp" element={<AuthGuard><WhatsAppPage /></AuthGuard>} />
              <Route path="/onboarding" element={<AuthGuard><OnboardingPage /></AuthGuard>} />
              <Route path="/admin" element={<AuthGuard><AdminPage /></AuthGuard>} />
              <Route path="/shared/:token" element={<SharedFilePage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
