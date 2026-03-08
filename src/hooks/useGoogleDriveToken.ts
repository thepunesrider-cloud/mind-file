import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Listens for Google OAuth sign-in and stores the provider_token
 * for Google Drive API access.
 */
export function useGoogleDriveToken() {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (
          (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") &&
          session?.provider_token
        ) {
          try {
            const userId = session.user.id;
            const providerToken = session.provider_token;
            const providerRefreshToken = session.provider_refresh_token || null;

            // Check if user signed in with Google
            const provider = session.user.app_metadata?.provider;
            if (provider !== "google") return;

            // Upsert the token
            const { error } = await supabase
              .from("google_drive_tokens")
              .upsert(
                {
                  user_id: userId,
                  access_token: providerToken,
                  refresh_token: providerRefreshToken,
                  expires_at: new Date(Date.now() + 3600 * 1000).toISOString(), // ~1hr
                },
                { onConflict: "user_id" }
              );

            if (error) {
              console.error("Failed to store Drive token:", error);
            } else {
              console.log("Google Drive token stored successfully");
            }
          } catch (err) {
            console.error("Drive token storage error:", err);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);
}
