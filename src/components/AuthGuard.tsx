import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useGoogleDriveToken } from "@/hooks/useGoogleDriveToken";

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-capture Google Drive token on sign-in
  useGoogleDriveToken();

  useEffect(() => {
    let mounted = true;

    const redirectToLogin = () => {
      navigate("/login", { replace: true });
    };

    const check = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setAuthenticated(false);
          redirectToLogin();
          return;
        }

        setAuthenticated(true);

        // Check onboarding status (skip if already on onboarding page)
        if (location.pathname !== "/onboarding") {
          const { data: profile } = await supabase
            .from("profiles")
            .select("onboarding_completed")
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (!profile || !profile.onboarding_completed) {
            navigate("/onboarding", { replace: true });
            return;
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    check();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setAuthenticated(false);
        redirectToLogin();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return authenticated ? <>{children}</> : null;
};

export default AuthGuard;

