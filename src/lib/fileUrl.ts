import { supabase } from "@/integrations/supabase/client";

/**
 * Given the stored file_url (which is a storage path like "userId/filename.pdf"),
 * returns a temporary signed URL valid for 60 seconds.
 */
export async function getSignedUrl(storagePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("files")
    .createSignedUrl(storagePath, 60);
  if (error || !data?.signedUrl) {
    console.error("getSignedUrl error:", error);
    return null;
  }
  return data.signedUrl;
}

export async function downloadFile(storagePath: string, fileName: string) {
  const url = await getSignedUrl(storagePath);
  if (!url) return;
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export async function viewFile(storagePath: string) {
  const url = await getSignedUrl(storagePath);
  if (!url) return;
  window.open(url, "_blank");
}
