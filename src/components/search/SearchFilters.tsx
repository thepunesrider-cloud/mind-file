import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { tagColors } from "@/data/mockFiles";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";

interface SearchFiltersProps {
  allTags: string[];
  selectedTags: string[];
  toggleTag: (tag: string) => void;
  selectedTypes: string[];
  toggleType: (type: string) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
}

const fileTypes = ["pdf", "image", "docx", "spreadsheet"] as const;

const SearchFilters = ({
  allTags, selectedTags, toggleTag,
  selectedTypes, toggleType,
  dateFrom, dateTo, onDateFromChange, onDateToChange,
}: SearchFiltersProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="glass rounded-xl p-4 mb-6 overflow-hidden"
    >
      {/* Tags */}
      <div className="mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tags</p>
        <div className="flex flex-wrap gap-1.5">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={cn(
                "text-xs px-3 py-1 rounded-full font-medium transition-colors",
                selectedTags.includes(tag) ? "bg-primary text-primary-foreground" : tagColors[tag] || "bg-secondary text-muted-foreground"
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* File Type */}
      <div className="mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">File Type</p>
        <div className="flex gap-1.5">
          {fileTypes.map((type) => (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={cn(
                "text-xs px-3 py-1 rounded-full font-medium transition-colors capitalize",
                selectedTypes.includes(type) ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          <Calendar className="w-3 h-3 inline mr-1" />
          Date Range
        </p>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="h-8 text-xs bg-secondary border-border w-36"
            placeholder="From"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="h-8 text-xs bg-secondary border-border w-36"
            placeholder="To"
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { onDateFromChange(""); onDateToChange(""); }}
              className="text-xs text-destructive hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SearchFilters;
