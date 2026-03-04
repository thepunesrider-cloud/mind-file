import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "processing" | "complete" | "error";
  errorMessage?: string;
  aiTags?: string[];
  aiSummary?: string;
}

const MAX_SIZE = 25 * 1024 * 1024;

export function useFileUpload() {
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const queryClient = useQueryClient();

  const uploadFile = useCallback(async (uploadFile: UploadingFile) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setFiles((prev) => prev.map((f) => f.id === uploadFile.id ? { ...f, status: "error" as const, errorMessage: "Not logged in" } : f));
        return;
      }

      // Upload to storage
      const filePath = `${user.id}/${uploadFile.file.name}`;
      setFiles((prev) => prev.map((f) => f.id === uploadFile.id ? { ...f, progress: 30 } : f));

      const { error: storageError } = await supabase.storage
        .from("files")
        .upload(filePath, uploadFile.file, { upsert: true });

      if (storageError) throw storageError;

      setFiles((prev) => prev.map((f) => f.id === uploadFile.id ? { ...f, progress: 60 } : f));

      // Create file record
      const { data: fileRecord, error: insertError } = await supabase
        .from("files")
        .insert({
          user_id: user.id,
          file_name: uploadFile.file.name,
          file_url: filePath,
          file_type: uploadFile.file.type || "unknown",
          file_size: uploadFile.file.size,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      setFiles((prev) => prev.map((f) => f.id === uploadFile.id ? { ...f, progress: 80, status: "processing" as const } : f));

      // Trigger AI analysis
      const { data: aiData, error: aiError } = await supabase.functions.invoke("analyze-file", {
        body: { fileId: fileRecord.id, fileName: uploadFile.file.name, fileType: uploadFile.file.type },
      });

      if (aiError) {
        console.error("AI analysis error:", aiError);
        // File uploaded but AI failed - still mark as complete
        setFiles((prev) => prev.map((f) => f.id === uploadFile.id ? {
          ...f, progress: 100, status: "complete" as const,
          aiSummary: "AI analysis failed - file saved successfully",
        } : f));
      } else {
        const metadata = aiData?.metadata;
        setFiles((prev) => prev.map((f) => f.id === uploadFile.id ? {
          ...f, progress: 100, status: "complete" as const,
          aiTags: metadata?.tags?.map((t: any) => t.name) || [],
          aiSummary: metadata?.summary || "Analysis complete",
        } : f));
      }

      queryClient.invalidateQueries({ queryKey: ["files"] });
    } catch (err: any) {
      console.error("Upload error:", err);
      setFiles((prev) => prev.map((f) => f.id === uploadFile.id ? {
        ...f, status: "error" as const, errorMessage: err.message || "Upload failed",
      } : f));
      toast.error("Upload failed: " + (err.message || "Unknown error"));
    }
  }, [queryClient]);

  const handleFiles = useCallback((fileList: FileList) => {
    const newFiles: UploadingFile[] = Array.from(fileList).map((file) => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: file.size > MAX_SIZE ? "error" as const : "uploading" as const,
      errorMessage: file.size > MAX_SIZE ? "File too large (max 25MB)" : undefined,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
    newFiles.filter((f) => f.status === "uploading").forEach(uploadFile);
  }, [uploadFile]);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  return { files, handleFiles, removeFile };
}
