import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FileEntity {
  type: string;
  value: string;
  label: string;
}

export interface FileWithTags {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  upload_date: string;
  extracted_text: string | null;
  ai_summary: string | null;
  ai_description: string | null;
  expiry_date: string | null;
  entities: FileEntity[];
  semantic_keywords: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  tags: { name: string; confidence: number }[];
}

async function fetchFiles(): Promise<FileWithTags[]> {
  const { data: files, error } = await supabase
    .from("files")
    .select("*")
    .order("upload_date", { ascending: false });

  if (error) throw error;
  if (!files) return [];

  // Fetch tags for all files
  const fileIds = files.map((f) => f.id);
  const { data: fileTags } = await supabase
    .from("file_tags")
    .select("file_id, confidence, tag_id, tags(name)")
    .in("file_id", fileIds);

  const tagMap = new Map<string, { name: string; confidence: number }[]>();
  if (fileTags) {
    for (const ft of fileTags) {
      const tagName = (ft as any).tags?.name;
      if (!tagName) continue;
      if (!tagMap.has(ft.file_id)) tagMap.set(ft.file_id, []);
      tagMap.get(ft.file_id)!.push({ name: tagName, confidence: ft.confidence });
    }
  }

  return files.map((f) => ({
    ...f,
    entities: (Array.isArray(f.entities) ? f.entities : []) as unknown as FileEntity[],
    tags: tagMap.get(f.id) || [],
  }));
}

export function useFiles() {
  return useQuery({
    queryKey: ["files"],
    queryFn: fetchFiles,
  });
}
