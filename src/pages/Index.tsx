import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (!profile || !profile.onboarding_completed) {
          navigate("/onboarding", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
        return;
      }
      // Not logged in → go to static landing page
      window.location.href = "/landing.html";
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("onboarding_completed")
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (!profile || !profile.onboarding_completed) {
            navigate("/onboarding", { replace: true });
          } else {
            navigate("/dashboard", { replace: true });
          }
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-sm text-muted-foreground">Loading Sortify...</p>
      </div>
    </div>
  );
};

export default Index;
