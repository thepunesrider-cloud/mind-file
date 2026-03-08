import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, FileText, AlertCircle, Download, Eye, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const SharedFilePage = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<{ fileName: string; fileType: string; signedUrl: string } | null>(null);

  useEffect(() => {
    if (!token) return;
    loadSharedFile();
  }, [token]);

  const loadSharedFile = async () => {
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-shared-file?token=${encodeURIComponent(token!)}`,
      );
      const data = await resp.json();

      if (!resp.ok) {
        setError(data.error || "This link is invalid or has expired.");
        return;
      }

      setFile(data);
    } catch {
      setError("Something went wrong. Please try again.");
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
        <h1 className="text-xl font-bold mb-1">{file?.fileName}</h1>
        <p className="text-muted-foreground text-sm mb-6">Shared file</p>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => window.open(file?.signedUrl, "_blank")}
            className="rounded-xl gap-2"
          >
            <Eye className="w-4 h-4" /> View
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (!file) return;
              const a = document.createElement("a");
              a.href = file.signedUrl;
              a.download = file.fileName;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }}
            className="rounded-xl gap-2"
          >
            <Download className="w-4 h-4" /> Download
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SharedFilePage;
