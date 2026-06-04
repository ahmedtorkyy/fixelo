import type { FixResult } from "@/types/fix"
import { lookupCachedFix } from "@/lib/cache/lookupCachedFix"
import { suggestTools, type ToolSuggestion } from "./keywordMap"
import { getToolConfig } from "@/lib/toolConfigs"

export interface RouteResult {
  type: "cached" | "tool-suggestion" | "ai"
  fixResult?: FixResult
  toolSuggestions?: ToolSuggestion[]
}

export function routeProblem(problem: string): RouteResult {
  const trimmed = problem.trim()
  if (!trimmed) return { type: "ai" }

  // 1. Try keyword-based tool suggestions first
  const suggestions = suggestTools(trimmed)
  if (suggestions.length > 0 && suggestions[0].confidence >= 0.4) {
    return { type: "tool-suggestion", toolSuggestions: suggestions }
  }

  // 2. Try exact cached fix (zero AI cost)
  const cached = lookupCachedFix(trimmed)
  if (cached) {
    return { type: "cached", fixResult: cached }
  }

  // 3. Fall back to AI
  return { type: "ai" }
}

export async function routeProblemWithAI(
  problem: string,
  classifyWithAI: (prompt: string) => Promise<string>
): Promise<RouteResult> {
  const trimmed = problem.trim()
  if (!trimmed) return { type: "ai" }

  // 1. Try keyword suggestions first
  const suggestions = suggestTools(trimmed)
  if (suggestions.length > 0 && suggestions[0].confidence >= 0.6) {
    return { type: "tool-suggestion", toolSuggestions: suggestions }
  }

  // 2. Try exact cached fix
  const cached = lookupCachedFix(trimmed)
  if (cached) return { type: "cached", fixResult: cached }

  // 3. If weak keyword match, try cheap AI classification
  if (suggestions.length > 0 && suggestions[0].confidence >= 0.2) {
    try {
      const { buildRouterPrompt } = await import("./routerPrompt")
      const aiResponse = await classifyWithAI(buildRouterPrompt(trimmed))
      const parsed = JSON.parse(aiResponse)
      if (parsed.slug && parsed.slug !== "custom") {
        const cfg = getToolConfig(parsed.slug)
        if (cfg) {
          return {
            type: "tool-suggestion",
            toolSuggestions: [{ slug: parsed.slug, confidence: 1 }],
          }
        }
      }
    } catch {
      // AI classification failed, fall through to full AI
    }
  }

  return { type: "ai" }
}
