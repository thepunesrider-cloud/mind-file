"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Send,
  FileText,
  Image,
  FileSpreadsheet,
  File,
  Brain,
  Clock,
  ArrowRight,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"

function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}

interface FileResult {
  id: string
  file_name: string
  file_type: string
  ai_summary: string | null
  upload_date: string
  file_size: number
}

function getFileIcon(mime: string) {
  if (mime.includes("pdf")) return <FileText className="h-4 w-4 text-destructive" />
  if (mime.startsWith("image/")) return <Image className="h-4 w-4 text-success" />
  if (mime.includes("sheet") || mime.includes("excel")) return <FileSpreadsheet className="h-4 w-4 text-warning" />
  if (mime.includes("word") || mime.includes("document")) return <FileText className="h-4 w-4 text-info" />
  return <File className="h-4 w-4 text-muted-foreground" />
}

function formatSize(bytes: number) {
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(0)} KB`
  return `${bytes} B`
}

export function ActionSearchbar() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<FileResult[]>([])
  const [recentFiles, setRecentFiles] = useState<FileResult[]>([])
  const [isFocused, setIsFocused] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const debouncedQuery = useDebounce(query, 250)
  const navigate = useNavigate()

  // Load recent files on mount
  useEffect(() => {
    const loadRecent = async () => {
      const { data } = await supabase
        .from("files")
        .select("id, file_name, file_type, ai_summary, upload_date, file_size")
        .order("updated_at", { ascending: false })
        .limit(5)
      if (data) setRecentFiles(data)
    }
    loadRecent()
  }, [])

  // Search files when query changes
  useEffect(() => {
    if (!isFocused) return

    if (!debouncedQuery.trim()) {
      setResults([])
      setIsSearching(false)
      return
    }

    const searchFiles = async () => {
      setIsSearching(true)
      const term = `%${debouncedQuery.trim()}%`
      const { data } = await supabase
        .from("files")
        .select("id, file_name, file_type, ai_summary, upload_date, file_size")
        .or(
          `file_name.ilike.${term},ai_summary.ilike.${term},extracted_text.ilike.${term},ai_description.ilike.${term},semantic_keywords.ilike.${term}`
        )
        .order("updated_at", { ascending: false })
        .limit(8)
      setResults(data || [])
      setIsSearching(false)
    }
    searchFiles()
  }, [debouncedQuery, isFocused])

  const handleSelect = (file: FileResult) => {
    setIsFocused(false)
    setQuery("")
    navigate(`/files`)
  }

  const handleDeepSearch = () => {
    setIsFocused(false)
    navigate(`/search?q=${encodeURIComponent(query)}`)
    setQuery("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.trim()) {
      handleDeepSearch()
    }
    if (e.key === "Escape") {
      setIsFocused(false)
    }
  }

  const displayResults = query.trim() ? results : recentFiles
  const showDropdown = isFocused && (displayResults.length > 0 || isSearching || query.trim())

  const container = {
    hidden: { opacity: 0, height: 0 },
    show: {
      opacity: 1,
      height: "auto",
      transition: { height: { duration: 0.3 }, staggerChildren: 0.04 },
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: { height: { duration: 0.25 }, opacity: { duration: 0.15 } },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="relative flex flex-col items-center">
        <div className="w-full">
          <div className="relative">
            <input
              type="text"
              placeholder="Search your documents — names, content, tags..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              onKeyDown={handleKeyDown}
              className="w-full h-12 pl-11 pr-10 text-sm rounded-xl border border-border bg-card/80 backdrop-blur-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-muted-foreground/60"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4">
              <AnimatePresence mode="popLayout">
                {query.length > 0 ? (
                  <motion.div
                    key="send"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="cursor-pointer"
                    onClick={handleDeepSearch}
                  >
                    <Send className="w-4 h-4 text-primary" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="brain"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Brain className="w-4 h-4 text-muted-foreground/50" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="w-full relative z-20">
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                className="w-full border border-border rounded-xl shadow-lg overflow-hidden bg-card/95 backdrop-blur-xl mt-2 absolute top-0 left-0"
                variants={container}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                {/* Section Label */}
                <div className="px-3 pt-2.5 pb-1">
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/70 flex items-center gap-1.5">
                    {query.trim() ? (
                      <>{isSearching ? "Searching..." : `${results.length} result${results.length !== 1 ? "s" : ""}`}</>
                    ) : (
                      <><Clock className="w-3 h-3" /> Recent Documents</>
                    )}
                  </span>
                </div>

                <motion.ul className="py-1 max-h-[280px] overflow-y-auto">
                  {displayResults.map((file) => (
                    <motion.li
                      key={file.id}
                      className="px-3 py-2.5 flex items-center gap-3 hover:bg-secondary/60 cursor-pointer rounded-lg mx-1 transition-colors"
                      variants={item}
                      layout
                      onClick={() => handleSelect(file)}
                    >
                      <span className="shrink-0">{getFileIcon(file.file_type)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{file.file_name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {file.ai_summary?.slice(0, 80) || "No summary"}
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground/70 shrink-0">
                        {formatSize(file.file_size)}
                      </span>
                    </motion.li>
                  ))}
                </motion.ul>

                {/* Footer */}
                <div className="px-3 py-2 border-t border-border">
                  {query.trim() ? (
                    <button
                      onClick={handleDeepSearch}
                      className="w-full flex items-center justify-between text-xs text-primary hover:text-primary/80 transition-colors py-1"
                    >
                      <span className="flex items-center gap-1.5">
                        <Brain className="w-3 h-3" />
                        Deep Search for "{query}"
                      </span>
                      <span className="flex items-center gap-1">
                        Enter <ArrowRight className="w-3 h-3" />
                      </span>
                    </button>
                  ) : (
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Type to search across all documents</span>
                      <span>Enter for deep search</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
