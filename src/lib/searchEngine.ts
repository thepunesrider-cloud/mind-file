import type { FileWithTags } from "@/hooks/useFiles";

/** Tokenize query into lowercase words */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^\w₹$€@.]/g, ""))
    .filter((w) => w.length > 0);
}

// Natural language date phrases → date range
const NL_DATE_PATTERNS: { pattern: RegExp; getRange: () => { from: Date; to: Date } }[] = [
  {
    pattern: /\b(?:last|past)\s+month\b/i,
    getRange: () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from, to };
    },
  },
  {
    pattern: /\b(?:this)\s+month\b/i,
    getRange: () => {
      const now = new Date();
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
    },
  },
  {
    pattern: /\b(?:this)\s+(?:quarter|qtr)\b/i,
    getRange: () => {
      const now = new Date();
      const q = Math.floor(now.getMonth() / 3);
      return { from: new Date(now.getFullYear(), q * 3, 1), to: now };
    },
  },
  {
    pattern: /\b(?:last|past)\s+(?:quarter|qtr)\b/i,
    getRange: () => {
      const now = new Date();
      const q = Math.floor(now.getMonth() / 3);
      const from = new Date(now.getFullYear(), (q - 1) * 3, 1);
      const to = new Date(now.getFullYear(), q * 3, 0);
      return { from, to };
    },
  },
  {
    pattern: /\b(?:this)\s+year\b/i,
    getRange: () => {
      const now = new Date();
      return { from: new Date(now.getFullYear(), 0, 1), to: now };
    },
  },
  {
    pattern: /\b(?:last|past)\s+year\b/i,
    getRange: () => {
      const now = new Date();
      return { from: new Date(now.getFullYear() - 1, 0, 1), to: new Date(now.getFullYear() - 1, 11, 31) };
    },
  },
  {
    pattern: /\bexpir(?:ing|es?)\s+(?:this|next)\s+(?:month|quarter)\b/i,
    getRange: () => {
      const now = new Date();
      return { from: now, to: new Date(now.getFullYear(), now.getMonth() + 3, 0) };
    },
  },
];

/** Extract natural language date intent from query */
export function extractDateFilter(query: string): { from?: Date; to?: Date; cleanQuery: string } | null {
  const yearMatch = query.match(/\b(?:from|in|of)\s+(\d{4})\b/i);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    return {
      from: new Date(year, 0, 1),
      to: new Date(year, 11, 31),
      cleanQuery: query.replace(yearMatch[0], "").trim(),
    };
  }

  for (const { pattern, getRange } of NL_DATE_PATTERNS) {
    if (pattern.test(query)) {
      const { from, to } = getRange();
      return { from, to, cleanQuery: query.replace(pattern, "").trim() };
    }
  }

  const expiryMatch = query.match(/\bexpir(?:ing|es?)\s+before\s+(\w+)\b/i);
  if (expiryMatch) {
    const months = ["january","february","march","april","may","june","july","august","september","october","november","december"];
    const monthIdx = months.findIndex(m => m.startsWith(expiryMatch[1].toLowerCase()));
    if (monthIdx >= 0) {
      const now = new Date();
      return { from: now, to: new Date(now.getFullYear(), monthIdx + 1, 0), cleanQuery: query.replace(expiryMatch[0], "").trim() };
    }
  }

  return null;
}

/** Detect entity-specific queries */
export function extractEntityQuery(query: string): { entityType?: string; value?: string; cleanQuery: string } | null {
  const amountMatch = query.match(/\b(?:above|over|greater\s+than|more\s+than|exceeding)\s+[₹$€]?\s*([\d,]+)\b/i);
  if (amountMatch) {
    return { entityType: "amount", value: amountMatch[1].replace(/,/g, ""), cleanQuery: query.replace(amountMatch[0], "").trim() };
  }

  const panMatch = query.match(/\b([A-Z]{5}\d{4}[A-Z])\b/);
  if (panMatch) return { entityType: "pan", value: panMatch[1], cleanQuery: query.replace(panMatch[0], "").trim() };

  const gstMatch = query.match(/\b(\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z\d]{2})\b/);
  if (gstMatch) return { entityType: "gst", value: gstMatch[1], cleanQuery: query.replace(gstMatch[0], "").trim() };

  return null;
}

/** Score how well a file matches the query. Higher = better. 0 = no match. */
export function scoreFile(
  file: FileWithTags,
  queryTokens: string[],
  dateFilter?: { from?: Date; to?: Date },
  entityFilter?: { entityType?: string; value?: string },
  rawQuery?: string
): number {
  // Date filter check
  if (dateFilter?.from || dateFilter?.to) {
    const uploadDate = new Date(file.upload_date);
    const expiryDate = file.expiry_date ? new Date(file.expiry_date) : null;
    const uploadInRange = (!dateFilter.from || uploadDate >= dateFilter.from) && (!dateFilter.to || uploadDate <= dateFilter.to);
    const expiryInRange = expiryDate && (!dateFilter.from || expiryDate >= dateFilter.from) && (!dateFilter.to || expiryDate <= dateFilter.to);
    if (!uploadInRange && !expiryInRange) return 0;
  }

  // Entity filter check
  if (entityFilter?.entityType && entityFilter?.value) {
    const entities = file.entities || [];
    const entityMatch = entities.some((e) => {
      if (entityFilter.entityType === "amount") {
        const numValue = parseFloat(e.value?.replace(/[^\d.]/g, "") || "0");
        return e.type === "amount" && numValue >= parseFloat(entityFilter.value!);
      }
      return e.type === entityFilter.entityType && e.value?.toLowerCase().includes(entityFilter.value!.toLowerCase());
    });
    if (!entityMatch && entities.length > 0) return 0;
  }

  if (queryTokens.length === 0) return 1;

  const entityText = (file.entities || [])
    .map((e) => `${e.label} ${e.value}`)
    .join(" ")
    .toLowerCase();

  const fields = {
    fileName: (file.file_name || "").toLowerCase(),
    summary: (file.ai_summary || "").toLowerCase(),
    description: (file.ai_description || "").toLowerCase(),
    extractedText: (file.extracted_text || "").toLowerCase(),
    tags: file.tags.map((t) => t.name.toLowerCase()).join(" "),
    entities: entityText,
    semanticKeywords: (file.semantic_keywords || "").toLowerCase(),
  };

  const weights: Record<string, number> = {
    fileName: 10,
    summary: 9,
    entities: 8,
    description: 7,
    tags: 7,
    extractedText: 8,
    semanticKeywords: 6,
  };

  let totalScore = 0;
  let matchedTokens = 0;

  // ── PHASE 0: Exact identifier/number match in entities (massive boost) ──
  const numbersInQuery = (rawQuery || "").match(/\d{4,}/g) || [];
  if (numbersInQuery.length > 0) {
    const fileEntities = file.entities || [];
    for (const num of numbersInQuery) {
      const cleanNum = num.replace(/[\s\-]/g, "");
      for (const entity of fileEntities) {
        const cleanVal = (entity.value || "").replace(/[\s\-]/g, "");
        if (cleanVal.includes(cleanNum) || cleanNum.includes(cleanVal)) {
          totalScore += 100;
        }
      }
      if ((file.extracted_text || "").includes(cleanNum)) totalScore += 20;
      if ((file.file_name || "").includes(cleanNum)) totalScore += 30;
    }
  }

  // ── PHASE 1: Exact phrase match (huge bonus) ──
  // If the raw query (multi-word) appears as a contiguous phrase in any field
  const phraseQuery = (rawQuery || queryTokens.join(" ")).toLowerCase().trim();
  if (phraseQuery.length > 3 && queryTokens.length >= 2) {
    for (const [field, text] of Object.entries(fields)) {
      if (!text) continue;
      if (text.includes(phraseQuery)) {
        const weight = weights[field] || 1;
        // Massive bonus for exact phrase match
        totalScore += weight * 5;
        // Count of phrase occurrences
        const count = text.split(phraseQuery).length - 1;
        if (count > 1) totalScore += Math.min(count, 3) * weight;
      }
    }
  }

  // ── PHASE 2: Sliding n-gram phrase matching ──
  // For queries with 3+ tokens, check contiguous subsequences
  if (queryTokens.length >= 3) {
    for (let n = queryTokens.length - 1; n >= 2; n--) {
      for (let start = 0; start <= queryTokens.length - n; start++) {
        const subPhrase = queryTokens.slice(start, start + n).join(" ");
        for (const [field, text] of Object.entries(fields)) {
          if (!text) continue;
          if (text.includes(subPhrase)) {
            totalScore += (weights[field] || 1) * (n / queryTokens.length) * 3;
          }
        }
      }
    }
  }

  // ── PHASE 3: Individual token matching with field weights ──
  for (const token of queryTokens) {
    let tokenScore = 0;

    for (const [field, text] of Object.entries(fields)) {
      if (!text) continue;
      
      if (text.includes(token)) {
        const weight = weights[field] || 1;
        const wordBoundary = new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
        const exactMatch = wordBoundary.test(text) ? 1.5 : 1;

        // Position bonus for summary and extractedText
        if (field === "summary" || field === "extractedText") {
          const pos = text.indexOf(token);
          const posBonus = pos < 50 ? 1.3 : pos < 200 ? 1.1 : 1;
          tokenScore += weight * exactMatch * posBonus;
        } else {
          tokenScore += weight * exactMatch;
        }

        // Frequency bonus
        const count = text.split(token).length - 1;
        if (count > 1) tokenScore += Math.min(count, 5) * 0.5;
      }

      // Fuzzy match for typos (tokens > 3 chars)
      if (!text.includes(token) && token.length > 3) {
        const words = text.split(/\s+/);
        for (const word of words) {
          if (Math.abs(word.length - token.length) <= 1 && levenshtein(token, word) <= 1) {
            tokenScore += (weights[field] || 1) * 0.5;
            break;
          }
        }
      }
    }

    if (tokenScore > 0) {
      matchedTokens++;
      totalScore += tokenScore;
    }
  }

  // Relaxed OR matching: allow partial token matches but penalize incompleteness
  if (matchedTokens === 0 && totalScore === 0) return 0;
  
  const matchRatio = queryTokens.length > 0 ? matchedTokens / queryTokens.length : 1;
  if (matchRatio < 0.4 && totalScore < 10) return 0;
  
  const completenessBonus = matchRatio === 1 ? 2.5 : matchRatio >= 0.75 ? 1.5 : matchRatio >= 0.5 ? 1 : 0.6;
  return totalScore * completenessBonus;
}

/** Simple Levenshtein distance */
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/** Find the best snippet window containing the most matches */
export function highlightText(text: string, tokens: string[], maxLen = 180): string {
  if (!text || tokens.length === 0) return text?.slice(0, maxLen) || "";

  const lower = text.toLowerCase();
  let bestPos = 0;
  let bestScore = 0;

  for (let pos = 0; pos < Math.min(text.length, 3000); pos += 15) {
    const window = lower.slice(pos, pos + maxLen);
    let score = 0;
    for (const token of tokens) {
      if (window.includes(token)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestPos = pos;
    }
  }

  const snippet = text.slice(bestPos, bestPos + maxLen);
  return (bestPos > 0 ? "..." : "") + snippet + (bestPos + maxLen < text.length ? "..." : "");
}
