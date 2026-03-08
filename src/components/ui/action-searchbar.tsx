"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Send,
  Upload,
  FolderOpen,
  MessageCircle,
  FolderTree,
  ArrowLeftRight,
  Bell,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}

interface Action {
  id: string
  label: string
  icon: React.ReactNode
  description?: string
  short?: string
  end?: string
  to?: string
}

const allActions: Action[] = [
  {
    id: "1",
    label: "Upload File",
    icon: <Upload className="h-4 w-4 text-primary" />,
    description: "Add documents",
    short: "",
    end: "Action",
    to: "/upload",
  },
  {
    id: "2",
    label: "Browse Files",
    icon: <FolderOpen className="h-4 w-4 text-accent" />,
    description: "View all files",
    short: "",
    end: "Navigate",
    to: "/files",
  },
  {
    id: "3",
    label: "AI Chat",
    icon: <MessageCircle className="h-4 w-4 text-primary" />,
    description: "Chat with docs",
    short: "",
    end: "AI",
    to: "/chat",
  },
  {
    id: "4",
    label: "Smart Folders",
    icon: <FolderTree className="h-4 w-4 text-accent" />,
    description: "Auto-organize",
    short: "",
    end: "AI",
    to: "/smart-folders",
  },
  {
    id: "5",
    label: "Compare Docs",
    icon: <ArrowLeftRight className="h-4 w-4 text-primary" />,
    description: "Side by side",
    short: "",
    end: "Tool",
    to: "/compare",
  },
  {
    id: "6",
    label: "Reminders",
    icon: <Bell className="h-4 w-4 text-warning" />,
    description: "Expiry alerts",
    short: "",
    end: "Navigate",
    to: "/reminders",
  },
]

export function ActionSearchbar({ actions = allActions }: { actions?: Action[] }) {
  const [query, setQuery] = useState("")
  const [result, setResult] = useState<{ actions: Action[] } | null>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [selectedAction, setSelectedAction] = useState<Action | null>(null)
  const debouncedQuery = useDebounce(query, 200)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isFocused) {
      setResult(null)
      return
    }
    if (!debouncedQuery) {
      setResult({ actions })
      return
    }
    const normalizedQuery = debouncedQuery.toLowerCase().trim()
    const filtered = actions.filter((a) =>
      a.label.toLowerCase().includes(normalizedQuery)
    )
    setResult({ actions: filtered })
  }, [debouncedQuery, isFocused, actions])

  const handleSelect = (action: Action) => {
    setSelectedAction(action)
    setIsFocused(false)
    setQuery("")
    if (action.to) navigate(action.to)
  }

  const container = {
    hidden: { opacity: 0, height: 0 },
    show: {
      opacity: 1,
      height: "auto",
      transition: { height: { duration: 0.4 }, staggerChildren: 0.06 },
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: { height: { duration: 0.3 }, opacity: { duration: 0.2 } },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="relative flex flex-col items-center">
        <div className="w-full">
          <div className="relative">
            <input
              type="text"
              placeholder="Search commands, navigate..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => { setSelectedAction(null); setIsFocused(true) }}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              className="w-full h-11 pl-4 pr-10 text-sm rounded-xl border border-border bg-card/80 backdrop-blur-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-muted-foreground/60"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4">
              <AnimatePresence mode="popLayout">
                {query.length > 0 ? (
                  <motion.div
                    key="send"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Send className="w-4 h-4 text-muted-foreground" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="search"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Search className="w-4 h-4 text-muted-foreground" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="w-full relative z-20">
          <AnimatePresence>
            {isFocused && result && !selectedAction && (
              <motion.div
                className="w-full border border-border rounded-xl shadow-lg overflow-hidden bg-card/95 backdrop-blur-xl mt-2 absolute top-0 left-0"
                variants={container}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                <motion.ul className="py-1">
                  {result.actions.map((action) => (
                    <motion.li
                      key={action.id}
                      className="px-3 py-2.5 flex items-center justify-between hover:bg-secondary/60 cursor-pointer rounded-lg mx-1 transition-colors"
                      variants={item}
                      layout
                      onClick={() => handleSelect(action)}
                    >
                      <div className="flex items-center gap-3">
                        <span>{action.icon}</span>
                        <span className="text-sm font-medium text-foreground">{action.label}</span>
                        <span className="text-xs text-muted-foreground">{action.description}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground/70 font-medium px-2 py-0.5 rounded-md bg-secondary/60">
                        {action.end}
                      </span>
                    </motion.li>
                  ))}
                </motion.ul>
                <div className="px-3 py-2 border-t border-border">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Type to filter · Click to navigate</span>
                    <span>ESC to close</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
