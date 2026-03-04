import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Suggestion {
  icon: string;
  label: string;
  tag: string;
}

interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: string) => void;
  suggestions: Suggestion[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SearchAutocomplete = ({
  value,
  onChange,
  onSelect,
  suggestions,
  isOpen,
  onOpenChange,
}: AutocompleteProps) => {
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onOpenChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    onChange(newVal);
    onOpenChange(newVal.trim().length > 0 && suggestions.length > 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIdx((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIdx((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIdx >= 0 && suggestions[focusedIdx]) {
        onSelect(suggestions[focusedIdx].label);
        onOpenChange(false);
      }
    }
  };

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    onSelect(suggestion.label);
    onOpenChange(false);
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="font-semibold text-teal-600">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => onOpenChange(value.trim().length > 0 && suggestions.length > 0)}
        placeholder="Show all invoices from last month…"
        className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
      />

      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden"
          >
            <div className="px-4 py-2 text-xs font-semibold text-teal-600 uppercase tracking-wider border-b border-gray-100">
              Suggestions
            </div>

            <div className="max-h-96 overflow-y-auto">
              {suggestions.map((suggestion, idx) => (
                <motion.div
                  key={idx}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  onMouseEnter={() => setFocusedIdx(idx)}
                  className={cn(
                    "px-4 py-3 cursor-pointer flex items-center gap-3 transition-colors",
                    focusedIdx === idx ? "bg-blue-50" : "hover:bg-gray-50"
                  )}
                >
                  <div className="flex-shrink-0 text-lg">{suggestion.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">
                      {highlightMatch(suggestion.label, value)}
                    </div>
                    <div className="text-xs text-gray-500">{suggestion.tag}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-600 flex items-center gap-2">
              <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs">
                ↑↓
              </kbd>
              <span>navigate</span>
              <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs">
                ↵
              </kbd>
              <span>select</span>
              <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs">
                Esc
              </kbd>
              <span>close</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
