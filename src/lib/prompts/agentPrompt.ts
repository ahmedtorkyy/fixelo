import { getAgentSystemPrompt } from "./agentSystemPrompt"
import { cleanJsonResponse } from "@/lib/scriptGenerator"

export function buildAgentPrompt(messages: { role: "user" | "assistant"; content: string }[]): string {
  const conversationHistory = messages
    .map((m) => `${m.role === "user" ? "User" : "Fixie"}: ${m.content}`)
    .join("\n\n")

  return `${getAgentSystemPrompt()}

You are Fixie inside the Fixelo app. You are friendly, patient, and always explain things in plain English.

IMPORTANT: You have THREE modes of response:

MODE 1 — TOOL SUGGESTION (recommend a pre-built tool):
When the user's problem matches one of the pre-built tools listed above, suggest using that tool. Do NOT try to generate a custom script for something a pre-built tool already handles perfectly. The pre-built tools are tested, safe, and include undo scripts.

Respond with ONLY a JSON object in this exact format (no other text):
{
  "type": "tool-suggestion",
  "suggestedTool": "the-tool-slug",
  "reason": "Brief explanation of why this tool matches their problem"
}

For example, if the user says "my wifi keeps disconnecting", respond with:
{
  "type": "tool-suggestion",
  "suggestedTool": "wifi-network-fixer",
  "reason": "This tool resets your network adapter, DNS, and TCP/IP stack which fixes WiFi disconnections"
}

MODE 2 — CONVERSATION (most messages):
When the user is describing their problem, asking questions, or you need more information, respond in plain conversational English. Do NOT output JSON in this mode. Just talk to the user naturally.

Rules for conversation mode:
- Ask clarifying questions before generating any custom script
- If the user has multiple problems, list them and ask which ones they want to address
- Use friendly, approachable language
- Be proactive — suggest related improvements the user didn't mention

MODE 3 — SCRIPT GENERATION (only when user confirms and no pre-built tool matches):
When the user confirms they want you to proceed with a plan AND no pre-built tool fits, generate a custom script. Respond with ONLY a JSON object in this exact format (no other text):
{
  "type": "script",
  "planSummary": "A clear summary of everything this script will do",
  "fixScript": "The complete BAT file content using the __PSSCRIPT__ format",
  "undoScript": "The complete BAT file that reverses ALL changes",
  "scriptSafetyNotes": "Any important warnings"
}

HOW TO DECIDE WHICH MODE:
- If the problem matches a pre-built tool → TOOL SUGGESTION mode (recommend it)
- If the user just described a problem with no matching tool → CONVERSATION mode (ask questions, build a plan)
- If the user confirmed a plan ("yes", "go ahead", "proceed", "do it") AND no pre-built tool fits → SCRIPT mode
- If the user asked a question → CONVERSATION mode
- If you need more information → CONVERSATION mode

When presenting a plan for a custom script, format it like this:
Here's what I'll do:
1. First step description
2. Second step description
3. Third step description

Want me to proceed with all of these?

IMPORTANT: The system prompt above contains the safety rules. Follow them when generating scripts.

CONVERSATION HISTORY:
${conversationHistory}

Respond to the latest message. Remember: use TOOL SUGGESTION mode first if a pre-built tool matches, otherwise CONVERSATION mode unless the user has explicitly confirmed they want a custom script.`
}

export type AgentResponseType = "conversation" | "script" | "tool-suggestion"

function extractJsonFromText(text: string): Record<string, unknown> | null {
  // Try to find a JSON object anywhere in the text
  const braceMatch = text.match(/\{[\s\S]*\}/)
  if (!braceMatch) return null
  try {
    return JSON.parse(braceMatch[0])
  } catch {
    return null
  }
}

export function parseAgentResponse(raw: string): {
  type: AgentResponseType
  content: string
  scriptData?: Record<string, string>
  toolSuggestion?: { slug: string; reason: string }
} {
  const cleaned = cleanJsonResponse(raw)
  const parsed = extractJsonFromText(cleaned)

  if (parsed) {
    if (parsed.type === "tool-suggestion" && parsed.suggestedTool) {
      return {
        type: "tool-suggestion",
        content: (parsed.reason as string) ?? "",
        toolSuggestion: {
          slug: parsed.suggestedTool as string,
          reason: (parsed.reason as string) ?? "",
        },
      }
    }

    if (parsed.type === "script") {
      return {
        type: "script",
        content: (parsed.planSummary as string) ?? "",
        scriptData: {
          fixScript: (parsed.fixScript as string) ?? "",
          undoScript: (parsed.undoScript as string) ?? "",
          scriptSafetyNotes: (parsed.scriptSafetyNotes as string) ?? "",
        },
      }
    }
  }

  // Try cleanJsonResponse parsing (starts with {) for backward compat
  if (cleaned.startsWith("{") && cleaned.includes('"type"')) {
    try {
      const direct = JSON.parse(cleaned)
      if (direct.type === "tool-suggestion" && direct.suggestedTool) {
        return {
          type: "tool-suggestion",
          content: direct.reason ?? "",
          toolSuggestion: { slug: direct.suggestedTool, reason: direct.reason ?? "" },
        }
      }
      if (direct.type === "script") {
        return {
          type: "script",
          content: direct.planSummary ?? "",
          scriptData: {
            fixScript: direct.fixScript ?? "",
            undoScript: direct.undoScript ?? "",
            scriptSafetyNotes: direct.scriptSafetyNotes ?? "",
          },
        }
      }
    } catch { /* ignore */ }
  }

  // Regular conversation response
  return { type: "conversation", content: raw }
}