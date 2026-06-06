import type { FixResult } from "@/types/fix"
import { CACHED_FIXES } from "./cachedFixes"

const STOP_WORDS = new Set([
  "my", "the", "a", "an", "is", "are", "was", "were", "it", "its", "i",
  "me", "we", "us", "our", "am", "been", "being", "have", "has", "had",
  "do", "does", "did", "will", "would", "shall", "should", "may", "might",
  "can", "could", "to", "of", "in", "for", "on", "with", "at", "by", "from",
  "that", "this", "these", "those", "and", "or", "but", "not", "no", "so",
  "if", "then", "than", "too", "very", "just", "about", "also", "really",
  "keeps", "keep", "getting", "got", "always", "still", "very", "quite",
  "some", "any", "all", "each", "every", "much", "more", "most", "pc",
  "computer", "laptop", "desktop", "windows", "please", "help", "fix",
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w))
}

function containsAllTokens(text: string, tokens: string[]): boolean {
  const lower = text.toLowerCase()
  return tokens.every((t) => lower.includes(t))
}

export function lookupCachedFix(problem: string): FixResult | null {
  const inputTokens = tokenize(problem)
  if (inputTokens.length === 0) return null

  let bestScore = 0
  let best: FixResult | null = null
  let bestKeywordHadSpace = false

  for (const entry of CACHED_FIXES) {
    for (const kw of entry.keywords) {
      if (containsAllTokens(problem, tokenize(kw))) {
        const kwTokens = tokenize(kw)
        const score = kwTokens.filter((t) => inputTokens.includes(t)).length
        if (score > bestScore) {
          bestScore = score
          best = entry.result
          bestKeywordHadSpace = kw.includes(" ")
        }
      }
    }
  }

  if (bestScore >= 2 || bestKeywordHadSpace) return best
  return null
}
