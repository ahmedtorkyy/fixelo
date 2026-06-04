import type { ToolConfig } from "@/lib/toolConfigs"
import type { FixResult } from "@/types/fix"
import { TOOL_BLOCKS } from "./toolBlocks"
import { wrapPsInBat, psRequireAdmin } from "./scriptShell"

export function assembleToolScript(
  tool: ToolConfig,
  selectedOptions: string[]
): FixResult | null {
  const blocks = TOOL_BLOCKS[tool.slug]
  if (!blocks) return null

  const selectedBlocks = blocks.filter((b) => selectedOptions.includes(b.id))
  if (selectedBlocks.length === 0) return null

  // Only use cache if ALL selected options have a cached block
  const blockIds = new Set(selectedBlocks.map((b) => b.id))
  const missingOptions = selectedOptions.filter((id) => !blockIds.has(id))
  if (missingOptions.length > 0) return null

  const wrapBlock = (script: string, label: string): string => {
    const safeLabel = label.replace(/"/g, '`"')
    return `try {\n${script.trim()}\n} catch {\n  Write-Log "Error in ${safeLabel}: $($_.Exception.Message)" "Red"\n}`
  }

  const combinedScript = selectedBlocks.map((b) => wrapBlock(b.script, b.label)).join("\n\n")
  const combinedUndo = selectedBlocks.map((b) => wrapBlock(b.undoScript, b.label)).join("\n\n")

  const steps = selectedBlocks.map((b) => `  - ${b.label}`).join("\n")
  const descriptions = selectedBlocks.map((b) => b.description).join("; ")

  const whatItDoes = `This script will:\n${steps}\n\nEach step will be executed in order. Admin rights are required.`

  const touchedAreas = [...new Set(selectedBlocks.flatMap((b) => b.touches ?? []))]
  const whatItDoesNotTouch = touchedAreas.length > 0
    ? `This script modifies: ${touchedAreas.join(", ")}. Everything else on your system is untouched.`
    : `This script only touches the items listed in the steps above. Nothing else is modified.`

  const scriptSafetyNotes = `Always download the Undo script as well — you can revert all changes by running it. If you're unsure about any option, leave it unchecked.`

  const psBody = `${psRequireAdmin()}

# ── Fixelo: ${tool.title} ──────────────────────────
${combinedScript}

Write-Log ""
Write-Log "All selected ${tool.title} tasks completed." "Green"`

  const psUndoBody = `${psRequireAdmin()}

# ── Fixelo: Undo ${tool.title} ─────────────────────
${combinedUndo}

Write-Log ""
Write-Log "Undo completed." "Yellow"`

  return {
    problemSummary: descriptions,
    whatItDoes,
    whatItDoesNotTouch,
    fixScript: wrapPsInBat(tool.title, psBody),
    undoScript: wrapPsInBat("Undo " + tool.title, psUndoBody),
    scriptSafetyNotes,
  }
}
