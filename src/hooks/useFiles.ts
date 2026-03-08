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
  // Fetch files in pages to avoid 1000-row limit
  const allFiles: any[] = [];
  const pageSize = 1000;
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const { data: files, error } = await supabase
      .from("files")
      .select("*")
      .order("upload_date", { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) throw error;
    if (!files || files.length === 0) {
      hasMore = false;
    } else {
      allFiles.push(...files);
      hasMore = files.length === pageSize;
      page++;
    }
  }

  if (allFiles.length === 0) return [];

  // Fetch tags for all files (also paginated)
  const fileIds = allFiles.map((f) => f.id);
  const allFileTags: any[] = [];

  // Process in chunks of 500 IDs to avoid query limits
  for (let i = 0; i < fileIds.length; i += 500) {
    const chunk = fileIds.slice(i, i + 500);
    const { data: fileTags } = await supabase
      .from("file_tags")
      .select("file_id, confidence, tag_id, tags(name)")
      .in("file_id", chunk);

    if (fileTags) allFileTags.push(...fileTags);
  }

  const tagMap = new Map<string, { name: string; confidence: number }[]>();
  for (const ft of allFileTags) {
    const tagName = (ft as any).tags?.name;
    if (!tagName) continue;
    if (!tagMap.has(ft.file_id)) tagMap.set(ft.file_id, []);
    tagMap.get(ft.file_id)!.push({ name: tagName, confidence: ft.confidence });
  }

  return allFiles.map((f) => ({
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
