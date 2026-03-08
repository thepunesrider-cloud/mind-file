import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const SESSION_TIMEOUT_MS = 7000;

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs = SESSION_TIMEOUT_MS): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("auth_timeout")), timeoutMs)),
  ]);
};

const Index = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    const redirectToLanding = () => {
      window.location.replace("/landing.html");
    };

    const routeByOnboarding = async (userId: string) => {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileError) {
        navigate("/dashboard", { replace: true });
        return;
      }

      if (!profile || !profile.onboarding_completed) {
        navigate("/onboarding", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    };

    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await withTimeout(supabase.auth.getSession());

        if (!session) {
          redirectToLanding();
          return;
        }

        const {
          data: { user },
          error: userError,
        } = await withTimeout(supabase.auth.getUser());

        if (userError || !user) {
          await supabase.auth.signOut();
          navigate("/login", { replace: true });
          return;
        }

        await routeByOnboarding(user.id);
      } catch {
        navigate("/login", { replace: true });
      } finally {
        if (mounted) setChecking(false);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        redirectToLanding();
        return;
      }

      if (event === "SIGNED_IN") {
        await routeByOnboarding(session.user.id);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (!checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-6">
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">Still loading? Continue manually.</p>
          <Button onClick={() => navigate("/login")}>Go to Login</Button>
        </div>
      </div>
    );
  }

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

