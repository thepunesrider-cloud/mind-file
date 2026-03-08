import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Captures Google OAuth provider tokens and persists them
 * for Drive API import/export.
 */
export function useGoogleDriveToken() {
  useEffect(() => {
    const persistDriveToken = async (session: any) => {
      if (!session?.provider_token || !session?.user?.id) return;

      try {
        const userId = session.user.id;

        // Keep existing refresh token if Google doesn't return a new one on subsequent logins
        const { data: existing } = await supabase
          .from("google_drive_tokens")
          .select("refresh_token")
          .eq("user_id", userId)
          .maybeSingle();

        const refreshToken = session.provider_refresh_token ?? existing?.refresh_token ?? null;

        const { error } = await supabase
          .from("google_drive_tokens")
          .upsert(
            {
              user_id: userId,
              access_token: session.provider_token,
              refresh_token: refreshToken,
              expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
            },
            { onConflict: "user_id" }
          );

        if (error) {
          console.error("Failed to store Drive token:", error);
        }
      } catch (err) {
        console.error("Drive token storage error:", err);
      }
    };

    // Try once on mount (handles callback/initial session)
    supabase.auth.getSession().then(({ data: { session } }) => {
      void persistDriveToken(session);
    });

    // Keep token updated on all auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void persistDriveToken(session);
    });

    return () => subscription.unsubscribe();
  }, []);
}
