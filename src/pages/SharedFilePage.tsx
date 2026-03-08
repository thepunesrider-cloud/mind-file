import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText, AlertCircle, Clock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { viewFile, downloadFile } from "@/lib/fileUrl";

const SharedFilePage = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<{ file_name: string; file_url: string; file_type: string } | null>(null);

  useEffect(() => {
    if (!token) return;
    loadSharedFile();
  }, [token]);

  const loadSharedFile = async () => {
    try {
      // Fetch shared link
      const { data: link, error: linkErr } = await supabase
        .from("shared_links")
        .select("*, files(file_name, file_url, file_type)")
        .eq("token", token!)
        .single();

      if (linkErr || !link) {
        setError("This link is invalid or has been removed.");
        return;
      }

      // Check expiry
      if (link.expires_at && new Date(link.expires_at) < new Date()) {
        setError("This link has expired.");
        return;
      }

      // Check view once
      if (link.view_once && link.viewed) {
        setError("This link has already been viewed and is no longer available.");
        return;
      }

      const fileData = (link as any).files;
      if (!fileData) {
        setError("File not found.");
        return;
      }

      setFile(fileData);

      // Mark as viewed if view_once
      if (link.view_once) {
        await supabase
          .from("shared_links")
          .update({ viewed: true })
          .eq("id", link.id);
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading shared file...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-sm mx-auto px-4">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-xl font-bold mb-2">Link Unavailable</h1>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-sm mx-auto px-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-xl font-bold mb-1">{file?.file_name}</h1>
        <p className="text-muted-foreground text-sm mb-6">Shared file</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => file && viewFile(file.file_url)} className="rounded-xl gap-2">
            <Eye className="w-4 h-4" /> View
          </Button>
          <Button variant="outline" onClick={() => file && downloadFile(file.file_url, file.file_name)} className="rounded-xl gap-2">
            Download
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SharedFilePage;
