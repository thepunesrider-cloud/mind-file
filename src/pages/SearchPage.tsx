import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search as SearchIcon, SlidersHorizontal, Loader2, Sparkles, Wand2, RefreshCw } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { useFiles } from "@/hooks/useFiles";
import type { FileWithTags } from "@/hooks/useFiles";
import { getFileIcon, getFileColor, tagColors } from "@/data/mockFiles";
import FileDetailPanel from "@/components/FileDetailPanel";
import SearchFilters from "@/components/search/SearchFilters";
import SearchResultCard from "@/components/search/SearchResultCard";
import { SearchAutocomplete } from "@/components/search/SearchAutocomplete";
import { cn } from "@/lib/utils";
import { tokenize, scoreFile, highlightText, extractDateFilter, extractEntityQuery } from "@/lib/searchEngine";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

function mapFileType(mimeType: string): "pdf" | "image" | "docx" | "spreadsheet" {
  if (mimeType.includes("pdf")) return "pdf";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.includes("word") || mimeType.includes("document")) return "docx";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "spreadsheet";
  return "pdf";
}

function toDetailFile(f: FileWithTags) {
  return {
    id: f.id,
    name: f.file_name,
    type: mapFileType(f.file_type),
    size: `${(f.file_size / (1024 * 1024)).toFixed(1)} MB`,
    uploadDate: new Date(f.upload_date).toLocaleDateString(),
    tags: f.tags,
    summary: f.ai_summary || "Processing...",
    expiryDate: f.expiry_date || undefined,
    extractedText: f.extracted_text || "",
    aiDescription: f.ai_description || "",
    versions: 1,
    lastAccessed: new Date(f.updated_at).toLocaleDateString(),
    fileUrl: f.file_url,
    fileType: f.file_type,
  };
}

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);
  const [semanticEnabled, setSemanticEnabled] = useState(false);
  const [semanticTerms, setSemanticTerms] = useState<string[]>([]);
  const [semanticLoading, setSemanticLoading] = useState(false);
  const [smartResults, setSmartResults] = useState<{ fileId: string; reason: string; confidence: number }[]>([]);
  const [smartLoading, setSmartLoading] = useState(false);
  const [bulkReanalyzing, setBulkReanalyzing] = useState(false);
  const [reanalyzeProgress, setReanalyzeProgress] = useState<{ done: number; total: number } | null>(null);
  const { data: files, isLoading } = useFiles();
  const queryClient = useQueryClient();

  // Debounced semantic expansion
  const expandQuery = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 3) {
      setSemanticTerms([]);
      return;
    }
    setSemanticLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("semantic-search", {
        body: { query: q },
      });
      if (error) throw error;
      setSemanticTerms(data?.expanded || []);
    } catch (e) {
      console.error("Semantic expansion error:", e);
      setSemanticTerms([]);
    } finally {
      setSemanticLoading(false);
    }
  }, []);

  const handleReanalyzeAll = useCallback(async () => {
    const fileList = files || [];
    if (fileList.length === 0) {
      toast.error("No files found to re-analyze");
      return;
    }

    setBulkReanalyzing(true);
    setReanalyzeProgress({ done: 0, total: fileList.length });

    let successCount = 0;
    let failureCount = 0;

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        setReanalyzeProgress({ done: i, total: fileList.length });

        const { error } = await supabase.functions.invoke("analyze-file", {
          body: {
            fileId: file.id,
            fileName: file.file_name,
            fileType: file.file_type,
          },
        });

        if (error) {
          failureCount++;
          console.error(`Re-analyze failed for ${file.file_name}:`, error);
        } else {
          successCount++;
        }
      }

      setReanalyzeProgress({ done: fileList.length, total: fileList.length });
      await queryClient.invalidateQueries({ queryKey: ["files"] });

      if (failureCount === 0) {
        toast.success(`Re-analyzed ${successCount} files successfully`);
      } else {
        toast.warning(`Re-analyzed ${successCount} files, ${failureCount} failed`);
      }
    } catch (e) {
      console.error("Bulk re-analyze error:", e);
      toast.error("Bulk re-analyze failed");
    } finally {
      setBulkReanalyzing(false);
      setTimeout(() => setReanalyzeProgress(null), 1200);
    }
  }, [files, queryClient]);

  const allTags = Array.from(new Set((files || []).flatMap((f) => f.tags.map((t) => t.name))));

  const autocompleteSuggestions = useMemo(() => {
    const baseSuggestions = [
      { icon: "📄", label: "Show all invoices", tag: "Finance" },
      { icon: "📋", label: "Find all contracts", tag: "Legal" },
      { icon: "🏥", label: "Show health-related documents", tag: "Insurance · Health" },
      { icon: "💰", label: "Find GST documents", tag: "Tax · Finance" },
      { icon: "⚖️", label: "Legal agreements and documents", tag: "Legal" },
      { icon: "📊", label: "Show all reports", tag: "Analytics" },
      { icon: "🔔", label: "Files expiring soon", tag: "Reminders" },
      { icon: "🏢", label: "Vendor agreements", tag: "Vendors" },
      { icon: "📅", label: "Files from last month", tag: "Date Range" },
    ];

    const dynamicSuggestions = allTags.slice(0, 5).map((tag) => ({
      icon: "🏷️",
      label: `Show all ${tag.toLowerCase()} files`,
      tag: `Tag: ${tag}`,
    }));

    return [...baseSuggestions, ...dynamicSuggestions];
  }, [allTags]);

  const filteredSuggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return autocompleteSuggestions.filter(
      (s) => s.label.toLowerCase().includes(q) || s.tag.toLowerCase().includes(q)
    );
  }, [query, autocompleteSuggestions]);

  const parsedQuery = useMemo(() => {
    let cleanQuery = query;
    let dateFilter: { from?: Date; to?: Date } | undefined;
    let entityFilter: { entityType?: string; value?: string } | undefined;

    const dateResult = extractDateFilter(cleanQuery);
    if (dateResult) {
      dateFilter = { from: dateResult.from, to: dateResult.to };
      cleanQuery = dateResult.cleanQuery;
    }

    if (dateFrom || dateTo) {
      dateFilter = {
        from: dateFrom ? new Date(dateFrom) : undefined,
        to: dateTo ? new Date(dateTo) : undefined,
      };
    }

    const entityResult = extractEntityQuery(cleanQuery);
    if (entityResult) {
      entityFilter = { entityType: entityResult.entityType, value: entityResult.value };
      cleanQuery = entityResult.cleanQuery;
    }

    const tokens = tokenize(cleanQuery);
    return { tokens, dateFilter, entityFilter, cleanQuery };
  }, [query, dateFrom, dateTo]);

  const results = useMemo(() => {
    const allTokens = semanticEnabled && semanticTerms.length > 0
      ? [...parsedQuery.tokens, ...semanticTerms.flatMap(t => tokenize(t))]
      : parsedQuery.tokens;

    const scored = (files || [])
      .map((f) => {
        const score = scoreFile(f, allTokens, parsedQuery.dateFilter, parsedQuery.entityFilter, parsedQuery.cleanQuery);
        const matchesTags = selectedTags.length === 0 || f.tags.some((t) => selectedTags.includes(t.name));
        const ft = mapFileType(f.file_type);
        const matchesType = selectedTypes.length === 0 || selectedTypes.includes(ft);
        return { file: f, score, matchesTags, matchesType };
      })
      .filter((r) => r.score > 0 && r.matchesTags && r.matchesType);

    scored.sort((a, b) => b.score - a.score);
    return scored;
  }, [files, parsedQuery, selectedTags, selectedTypes, semanticEnabled, semanticTerms]);

  const toggleTag = (tag: string) => setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  const toggleType = (type: string) => setSelectedTypes((prev) => prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]);

  const activeSmartFilters: string[] = [];
  if (parsedQuery.dateFilter) activeSmartFilters.push("📅 Date filter active");
  if (parsedQuery.entityFilter) activeSmartFilters.push(`🔍 Entity: ${parsedQuery.entityFilter.entityType}`);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold">Smart Search</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Search by name, content, tags, or just describe what you're looking for
              </p>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              <button
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-card text-foreground border border-border hover:bg-primary/10 transition text-sm font-medium disabled:opacity-60"
                onClick={handleReanalyzeAll}
                disabled={bulkReanalyzing || !files?.length}
                aria-label="Re-analyze all files"
              >
                {bulkReanalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {bulkReanalyzing ? "Re-analyzing..." : "Re-analyze All"}
              </button>
              <button
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-md border transition text-sm font-medium",
                  semanticEnabled
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:bg-primary/10"
                )}
                onClick={() => {
                  const next = !semanticEnabled;
                  setSemanticEnabled(next);
                  if (next && query.trim().length >= 3) {
                    expandQuery(query);
                  }
                  if (!next) setSemanticTerms([]);
                }}
                aria-label="Toggle deep search"
              >
                <Wand2 className="w-4 h-4" />
                {semanticLoading ? "Thinking..." : "Deep Search"}
              </button>
              <button
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-card text-foreground border border-border hover:bg-primary/10 transition text-sm font-medium"
                onClick={() => setShowFilters((v) => !v)}
                aria-label="Toggle filters"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <SearchAutocomplete
            value={query}
            onChange={(val) => {
              setQuery(val);
              setSmartResults([]);
              if (semanticEnabled && val.trim().length >= 3) {
                clearTimeout((window as any).__semanticTimer);
                (window as any).__semanticTimer = setTimeout(() => expandQuery(val), 600);
              }
            }}
            onSelect={(suggestion) => {
              setQuery(suggestion);
              setAutocompleteOpen(false);
              if (semanticEnabled) expandQuery(suggestion);
            }}
            suggestions={filteredSuggestions}
            isOpen={autocompleteOpen && filteredSuggestions.length > 0}
            onOpenChange={setAutocompleteOpen}
          />

          {/* Smart filter indicators */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {query && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="w-3 h-3 text-primary" />
                <span>Searching names, summaries, content, tags & entities</span>
              </div>
            )}
            {semanticEnabled && semanticTerms.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs">
                <Wand2 className="w-3 h-3 text-primary" />
                <span className="text-muted-foreground">Deep search finds related:</span>
                {semanticTerms.slice(0, 8).map((t) => (
                  <span key={t} className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[11px] font-medium">{t}</span>
                ))}
                {semanticTerms.length > 8 && (
                  <span className="text-muted-foreground text-[11px]">+{semanticTerms.length - 8} more</span>
                )}
              </div>
            )}
            {semanticEnabled && semanticLoading && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Finding related terms with AI…</span>
              </div>
            )}
            {activeSmartFilters.map((f) => (
              <span key={f} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{f}</span>
            ))}
          </div>
        </motion.div>

        <AnimatePresence>
          {showFilters && (
            <SearchFilters
              allTags={allTags}
              selectedTags={selectedTags}
              toggleTag={toggleTag}
              selectedTypes={selectedTypes}
              toggleType={toggleType}
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
            />
          )}
        </AnimatePresence>

        <div className="flex gap-6">
          <div className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  {results.length} result{results.length !== 1 ? "s" : ""}
                  {query && <span className="text-primary ml-1">· sorted by relevance</span>}
                </p>
                {results.length === 0 && query && !smartLoading && smartResults.length === 0 && (
                  <div className="text-center py-16">
                    <SearchIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">No exact matches found.</p>
                    <p className="text-muted-foreground/60 text-xs mt-1 mb-4">Let AI find related files for you.</p>
                    <button
                      onClick={async () => {
                        if (!files || files.length === 0) return;
                        setSmartLoading(true);
                        try {
                          const fileSummaries = files.map(f => ({
                            id: f.id,
                            name: f.file_name,
                            summary: (f.ai_summary || "").substring(0, 200),
                            tags: f.tags.map(t => t.name).join(", "),
                            entities: (f.entities || []).map((e: any) => `${e.label}: ${e.value}`).join(", ").substring(0, 200),
                          }));
                          const { data, error } = await supabase.functions.invoke("smart-search", {
                            body: { query, fileSummaries },
                          });
                          if (error) throw error;
                          setSmartResults(data?.suggestions || []);
                        } catch (e) {
                          console.error("Smart search error:", e);
                          toast.error("AI search failed");
                        } finally {
                          setSmartLoading(false);
                        }
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition"
                    >
                      <Wand2 className="w-4 h-4" />
                      Find Related Files with AI
                    </button>
                  </div>
                )}
                {smartLoading && (
                  <div className="text-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">AI is analyzing your files to find related documents...</p>
                  </div>
                )}
                {results.length === 0 && smartResults.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Wand2 className="w-4 h-4 text-primary" />
                      <p className="text-sm font-medium text-primary">AI found related files</p>
                    </div>
                    <div className="space-y-3">
                      {smartResults.map((suggestion) => {
                        const file = (files || []).find(f => f.id === suggestion.fileId);
                        if (!file) return null;
                        const detail = toDetailFile(file);
                        return (
                          <div key={suggestion.fileId}>
                            <SearchResultCard
                              file={file}
                              detail={detail}
                              snippet={suggestion.reason}
                              isSelected={selectedFile?.id === file.id}
                              index={0}
                              onClick={() => setSelectedFile(detail)}
                            />
                            <p className="text-xs text-muted-foreground ml-4 mt-1 italic">
                              💡 {suggestion.reason}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="space-y-3">
                  {results.map(({ file }, i) => {
                    const detail = toDetailFile(file);
                    const snippet = query
                      ? highlightText(file.ai_summary || file.ai_description || file.extracted_text || "", parsedQuery.tokens)
                      : detail.summary?.slice(0, 150);
                    return (
                      <SearchResultCard
                        key={file.id}
                        file={file}
                        detail={detail}
                        snippet={snippet}
                        isSelected={selectedFile?.id === file.id}
                        index={i}
                        onClick={() => setSelectedFile(detail)}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </div>
          <AnimatePresence>
            {selectedFile && <FileDetailPanel file={selectedFile} onClose={() => setSelectedFile(null)} />}
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  );
};

export default SearchPage;
