import { getAllToolSlugs } from "@/lib/toolConfigs"

export interface ToolSuggestion {
  slug: string
  confidence: number
}

const KEYWORD_TO_SLUG: Record<string, string[]> = {
  "slow": ["slow-pc-fix"],
  "lag": ["slow-pc-fix", "gaming-boost"],
  "laggy": ["slow-pc-fix"],
  "sluggish": ["slow-pc-fix"],
  "stutter": ["slow-pc-fix", "gaming-boost"],
  "stuttering": ["slow-pc-fix", "gaming-boost"],
  "startup": ["startup-manager", "slow-pc-fix"],
  "boot": ["startup-manager", "slow-pc-fix"],
  "temp": ["slow-pc-fix", "monthly-maintenance"],
  "cache": ["slow-pc-fix", "monthly-maintenance"],
  "power": ["slow-pc-fix", "battery-optimizer"],
  "gaming": ["gaming-boost"],
  "game": ["gaming-boost"],
  "fps": ["gaming-boost"],
  "gpu": ["gaming-boost"],
  "network": ["network-optimizer", "wifi-network-fixer"],
  "wifi": ["wifi-network-fixer"],
  "dns": ["network-optimizer", "wifi-network-fixer"],
  "internet": ["network-optimizer", "wifi-network-fixer"],
  "audio": ["audio-fix"],
  "sound": ["audio-fix"],
  "speaker": ["audio-fix"],
  "printer": ["printer-fix"],
  "print": ["printer-fix"],
  "usb": ["usb-device-fix"],
  "blue screen": ["blue-screen-recovery"],
  "bsod": ["blue-screen-recovery"],
  "crash": ["blue-screen-recovery", "corrupted-files-fix"],
  "update": ["windows-update-fixer"],
  "disk": ["disk-error-fix", "ssd-optimizer"],
  "drive": ["disk-error-fix"],
  "ssd": ["ssd-optimizer"],
  "battery": ["battery-optimizer"],
  "screen": ["display-resolution-fix"],
  "display": ["display-resolution-fix"],
  "resolution": ["display-resolution-fix"],
  "corrupted": ["corrupted-files-fix"],
  "corrupt": ["corrupted-files-fix"],
  "sfc": ["corrupted-files-fix"],
  "dism": ["corrupted-files-fix"],
  "privacy": ["privacy-protector"],
  "telemetry": ["privacy-protector"],
  "bloatware": ["new-pc-setup"],
  "dark": ["dark-mode-setup"],
  "taskbar": ["taskbar-customizer"],
  "shutdown": ["auto-shutdown"],
  "backup": ["auto-backup"],
  "driver": ["driver-manager"],
  "parental": ["parental-controls"],
  "child": ["parental-controls"],
}

const STOP_WORDS = new Set([
  "my", "the", "a", "an", "is", "are", "was", "were", "it", "its", "i",
  "me", "we", "us", "our", "am", "been", "being", "have", "has", "had",
  "do", "does", "did", "will", "would", "shall", "should", "may", "might",
  "can", "could", "to", "of", "in", "for", "on", "with", "at", "by", "from",
  "that", "this", "these", "those", "and", "or", "but", "not", "no", "so",
  "if", "then", "than", "too", "very", "just", "about", "also", "really",
  "keeps", "keep", "getting", "got", "always", "still", "very", "quite",
  "some", "any", "all", "each", "every", "much", "more", "most",
  "pc", "computer", "laptop", "desktop", "windows", "please", "help",
  "fix", "issue", "problem", "error", "not", "wont", "cant", "dont",
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w))
}

function containsAllTokens(text: string, phrase: string): boolean {
  const lower = text.toLowerCase()
  return tokenize(phrase).every((t) => lower.includes(t))
}

export function suggestTools(problem: string): ToolSuggestion[] {
  const tokens = tokenize(problem)
  if (tokens.length === 0) return []

  const slugScores = new Map<string, number>()

  for (const [keyword, slugs] of Object.entries(KEYWORD_TO_SLUG)) {
    if (containsAllTokens(problem, keyword)) {
      const increment = keyword.includes(" ") ? 3 : 1
      for (const slug of slugs) {
        slugScores.set(slug, (slugScores.get(slug) ?? 0) + increment)
      }
    }
  }

  // Boost for exact match with tool title
  const allSlugs = getAllToolSlugs()
  for (const slug of allSlugs) {
    const titleWords = slug.replace(/-/g, " ")
    const kwTokens = tokenize(titleWords)
    const matchCount = kwTokens.filter((t) => tokens.includes(t)).length
    if (matchCount > 0) {
      slugScores.set(slug, (slugScores.get(slug) ?? 0) + matchCount)
    }
  }

  return [...slugScores.entries()]
    .map(([slug, score]) => ({ slug, confidence: Math.min(1, score / 5) }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3)
}
