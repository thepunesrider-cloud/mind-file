import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import LandingPage from "./LandingPage";

const Index = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "landing" | "redirecting">("checking");

  useEffect(() => {
    let mounted = true;

    const routeByOnboarding = async (userId: string) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", userId)
        .maybeSingle();

      if (!profile || !profile.onboarding_completed) {
        navigate("/onboarding", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    };

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (mounted) setStatus("landing");
          return;
        }
        if (mounted) setStatus("redirecting");
        await routeByOnboarding(session.user.id);
      } catch {
        if (mounted) setStatus("landing");
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        await routeByOnboarding(session.user.id);
      }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [navigate]);

  if (status === "landing") {
    return <LandingPage />;
  }

  // Show a brief loading state while checking auth
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Loading Sortify...</p>
      </div>
    </div>
  );
};

export default Index;
