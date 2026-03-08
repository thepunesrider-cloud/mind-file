import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { trackEvent } from "@/hooks/useAnalytics";

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

const PLAN_LIMITS: Record<string, number> = {
  free: 100 * 1024 * 1024,       // 100MB
  starter: 1024 * 1024 * 1024,   // 1GB
  pro: 50 * 1024 * 1024 * 1024,  // 50GB
  business: 1024 * 1024 * 1024 * 1024, // 1TB
  enterprise: Infinity,
};

function formatSize(bytes: number) {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${(bytes / 1e3).toFixed(1)} KB`;
}

export function useFileUpload() {
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const queryClient = useQueryClient();

  const checkStorageQuota = useCallback(async (fileSize: number): Promise<{ allowed: boolean; message?: string }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { allowed: false, message: "Not logged in" };

      // Get user plan
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("user_id", user.id)
        .maybeSingle();

      const plan = profile?.plan || "free";
      const limit = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

      if (limit === Infinity) return { allowed: true };

      // Get current storage usage
      const { data: filesData } = await supabase
        .from("files")
        .select("file_size")
        .eq("user_id", user.id);

      const currentUsage = filesData?.reduce((sum, f) => sum + f.file_size, 0) || 0;

      if (currentUsage + fileSize > limit) {
        return {
          allowed: false,
          message: `Storage limit reached (${formatSize(currentUsage)} / ${formatSize(limit)}). Upgrade your plan for more storage.`,
        };
      }

      return { allowed: true };
    } catch {
      return { allowed: true }; // Don't block uploads on quota check failure
    }
  }, []);

  const uploadFile = useCallback(async (uploadFile: UploadingFile) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setFiles((prev) => prev.map((f) => f.id === uploadFile.id ? { ...f, status: "error" as const, errorMessage: "Not logged in" } : f));
        return;
      }

      // Check storage quota
      const quotaCheck = await checkStorageQuota(uploadFile.file.size);
      if (!quotaCheck.allowed) {
        setFiles((prev) => prev.map((f) => f.id === uploadFile.id ? { ...f, status: "error" as const, errorMessage: quotaCheck.message } : f));
        toast.error(quotaCheck.message || "Storage limit reached");
        return;
      }

      // Check for duplicate filename
      const { data: existing } = await supabase
        .from("files")
        .select("id")
        .eq("user_id", user.id)
        .eq("file_name", uploadFile.file.name)
        .maybeSingle();

      if (existing) {
        // Append timestamp to make filename unique
        const ext = uploadFile.file.name.lastIndexOf(".");
        const baseName = ext > -1 ? uploadFile.file.name.slice(0, ext) : uploadFile.file.name;
        const extension = ext > -1 ? uploadFile.file.name.slice(ext) : "";
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, "-");
        const newName = `${baseName}_${timestamp}${extension}`;

        // Create a new File with the modified name
        const renamedFile = new File([uploadFile.file], newName, { type: uploadFile.file.type });
        uploadFile = { ...uploadFile, file: renamedFile };
        toast.info(`File renamed to "${newName}" to avoid overwriting the existing file.`);
      }

      // Upload to storage
      const filePath = `${user.id}/${uploadFile.file.name}`;
      setFiles((prev) => prev.map((f) => f.id === uploadFile.id ? { ...f, progress: 30 } : f));

      const { error: storageError } = await supabase.storage
        .from("files")
        .upload(filePath, uploadFile.file, { upsert: false });

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
  }, [queryClient, checkStorageQuota]);

  const handleFiles = useCallback((fileList: FileList) => {
    const newFiles: UploadingFile[] = Array.from(fileList).map((file) => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: file.size > MAX_SIZE ? "error" as const : "uploading" as const,
      errorMessage: file.size > MAX_SIZE ? "File too large (max 25MB)" : undefined,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
    // Rate limit: upload max 3 files concurrently
    const toUpload = newFiles.filter((f) => f.status === "uploading");
    const batchSize = 3;
    let i = 0;
    const uploadBatch = () => {
      const batch = toUpload.slice(i, i + batchSize);
      batch.forEach(uploadFile);
      i += batchSize;
      if (i < toUpload.length) {
        setTimeout(uploadBatch, 2000); // 2s gap between batches
      }
    };
    uploadBatch();
  }, [uploadFile]);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  return { files, handleFiles, removeFile };
}
