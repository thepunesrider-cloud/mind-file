import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, ArrowLeftRight, Loader2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useFiles } from "@/hooks/useFiles";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";

const ComparePage = () => {
  const { data: files } = useFiles();
  const [searchParams] = useSearchParams();
  const [fileA, setFileA] = useState<string | null>(null);
  const [fileB, setFileB] = useState<string | null>(null);
  const [picking, setPicking] = useState<"a" | "b" | null>(null);

  // Auto-select file from URL query param
  useEffect(() => {
    const paramFileA = searchParams.get("fileA");
    if (paramFileA && files?.some(f => f.id === paramFileA) && !fileA) {
      setFileA(paramFileA);
    }
  }, [searchParams, files]);

  const docA = files?.find(f => f.id === fileA);
  const docB = files?.find(f => f.id === fileB);

  const renderDiff = (textA: string, textB: string) => {
    const linesA = textA.split("\n").filter(Boolean);
    const linesB = textB.split("\n").filter(Boolean);
    const setB = new Set(linesB.map(l => l.trim().toLowerCase()));
    const setA = new Set(linesA.map(l => l.trim().toLowerCase()));

    return { linesA, linesB, setA, setB };
  };

  const diff = docA && docB && docA.extracted_text && docB.extracted_text
    ? renderDiff(docA.extracted_text, docB.extracted_text)
    : null;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Document Comparison</h1>
          <p className="text-muted-foreground text-sm mt-1">Compare text content side by side</p>
        </motion.div>

        {/* Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {(["a", "b"] as const).map(side => {
            const selected = side === "a" ? docA : docB;
            const fileId = side === "a" ? fileA : fileB;
            return (
              <div key={side}>
                <Button
                  variant="outline"
                  onClick={() => setPicking(picking === side ? null : side)}
                  className="w-full justify-start gap-2 rounded-xl h-12"
                >
                  <FileText className="w-4 h-4" />
                  {selected ? selected.file_name : `Select Document ${side.toUpperCase()}`}
                </Button>
                {picking === side && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-border bg-card p-2 space-y-1"
                  >
                    {(files || []).filter(f => f.id !== (side === "a" ? fileB : fileA)).map(f => (
                      <button
                        key={f.id}
                        onClick={() => {
                          if (side === "a") setFileA(f.id);
                          else setFileB(f.id);
                          setPicking(null);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                          f.id === fileId ? "bg-primary/10 text-primary" : "hover:bg-secondary"
                        )}
                      >
                        {f.file_name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>

        {/* Comparison view */}
        {docA && docB ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Summaries */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-semibold text-sm mb-2 text-primary">{docA.file_name}</h3>
              <p className="text-xs text-muted-foreground mb-3">{docA.ai_summary || "No summary"}</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {docA.tags.map(t => (
                  <span key={t.name} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{t.name}</span>
                ))}
              </div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">EXTRACTED TEXT</h4>
              <div className="space-y-0.5 max-h-96 overflow-y-auto">
                {diff ? diff.linesA.map((line, i) => (
                  <p key={i} className={cn(
                    "text-xs px-2 py-0.5 rounded",
                    !diff.setB.has(line.trim().toLowerCase())
                      ? "bg-destructive/10 text-destructive"
                      : ""
                  )}>
                    {line}
                  </p>
                )) : <p className="text-xs text-muted-foreground">No extracted text</p>}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-semibold text-sm mb-2 text-accent">{docB.file_name}</h3>
              <p className="text-xs text-muted-foreground mb-3">{docB.ai_summary || "No summary"}</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {docB.tags.map(t => (
                  <span key={t.name} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">{t.name}</span>
                ))}
              </div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">EXTRACTED TEXT</h4>
              <div className="space-y-0.5 max-h-96 overflow-y-auto">
                {diff ? diff.linesB.map((line, i) => (
                  <p key={i} className={cn(
                    "text-xs px-2 py-0.5 rounded",
                    !diff.setA.has(line.trim().toLowerCase())
                      ? "bg-primary/10 text-primary"
                      : ""
                  )}>
                    {line}
                  </p>
                )) : <p className="text-xs text-muted-foreground">No extracted text</p>}
              </div>
            </div>

            {/* Stats */}
            <div className="lg:col-span-2 rounded-xl border border-border bg-card p-4">
              <h3 className="font-semibold text-sm mb-3">Comparison Summary</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Lines in A", value: diff?.linesA.length || 0 },
                  { label: "Lines in B", value: diff?.linesB.length || 0 },
                  { label: "Unique to A", value: diff ? diff.linesA.filter(l => !diff.setB.has(l.trim().toLowerCase())).length : 0, color: "text-destructive" },
                  { label: "Unique to B", value: diff ? diff.linesB.filter(l => !diff.setA.has(l.trim().toLowerCase())).length : 0, color: "text-primary" },
                ].map(s => (
                  <div key={s.label} className="text-center p-3 rounded-lg bg-secondary/30">
                    <p className={cn("text-2xl font-bold", s.color || "")}>{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <ArrowLeftRight className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Select two documents to compare</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ComparePage;
