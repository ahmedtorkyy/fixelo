import type { FixResult, DiagnosisResult, DiagnosisReport, HealthCard, VerifyResult } from "@/types/fix"
import type { ErrorTranslation, ScriptScanResult } from "@/types/scanner"
import { buildFixPrompt } from "@/lib/prompts/fixPrompt"
import { buildBatchFixPrompt, type BatchIssue } from "@/lib/prompts/batchFixPrompt"
import { buildDiagnosisPrompt } from "@/lib/prompts/diagnosisPrompt"
import { buildToolPrompt } from "@/lib/prompts/toolPrompt"
import { buildDiagnosisReportPrompt } from "@/lib/prompts/diagnosisReportPrompt"
import { buildErrorTranslatorPrompt } from "@/lib/prompts/errorTranslatorPrompt"
import { buildScriptScannerPrompt } from "@/lib/prompts/scriptScannerPrompt"
import { buildVerifyPrompt } from "@/lib/prompts/verifyPrompt"
import { buildExplainPrompt } from "@/lib/prompts/explainPrompt"
import { generateContent } from "@/lib/gemini"
import type { ToolConfig } from "@/lib/toolConfigs"

const FABRICATED_CMDLETS = [
  "Set-DefaultAudioDevice",
  "Set-Volume -Level",
  "Set-Volume -Permanent",
  'Get-Process -Name "System Sounds"',
  "Get-Process -Name 'System Sounds'",
  "Get-AudioDevice",
  "Win32_Volume.SetVolume",
  "AudioDeviceCmdlets",
  "MSiTunes_Sound_Device",
  "Get-Startups",
  "Disable-StartupProgram",
  "Get-TempFiles",
  "Get-SystemCaches",
  "Clear-SystemCache",
  "Set-PowerPlan",
  "Disable-VisualEffects",
  "Empty-RecycleBin",
  ".Delete()",
  ".Activate()",
  '.Recycle.Bin',
  'USERPROFILE\\.Recycle',
] as const

function validateScriptForBadCmdlets(script: string): void {
  const found = FABRICATED_CMDLETS.filter((bad) =>
    script.includes(bad)
  )
  if (found.length > 0) {
    console.warn(`[Script Validation] Fabricated cmdlets detected in generated script: ${found.join(", ")}`)
    throw new Error(
      `The AI generated a script containing non-existent PowerShell cmdlets (${found.join(", ")}). ` +
      "Please try again — the fix will be regenerated with stricter rules."
    )
  }
}

export function cleanJsonResponse(raw: string): string {
  let cleaned = raw.trim()

  // Strip markdown code fences
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, "")
  cleaned = cleaned.replace(/\n?```\s*$/i, "")

  // If it already starts with { and ends with }, return it
  const trimmed = cleaned.trim()
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed

  // Gemini often adds text before/after the JSON. Find the outermost { } pair.
  const firstBrace = cleaned.indexOf("{")
  if (firstBrace === -1) return trimmed

  // Walk forward from the first { to find the matching closing }
  let depth = 0
  let inString = false
  let escape = false
  for (let i = firstBrace; i < cleaned.length; i++) {
    const ch = cleaned[i]
    if (escape) { escape = false; continue }
    if (ch === "\\") { escape = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue
    if (ch === "{") depth++
    if (ch === "}") {
      depth--
      if (depth === 0) {
        return cleaned.substring(firstBrace, i + 1)
      }
    }
  }

  // Fallback: return from first { to end
  return cleaned.substring(firstBrace)
}

function parseFixResult(json: Record<string, unknown>): FixResult {
  return {
    problemSummary: String(json.problemSummary ?? ""),
    whatItDoes: String(json.whatItDoes ?? ""),
    whatItDoesNotTouch: String(json.whatItDoesNotTouch ?? ""),
    fixScript: String(json.fixScript ?? ""),
    undoScript: String(json.undoScript ?? ""),
    scriptSafetyNotes: String(json.scriptSafetyNotes ?? ""),
  }
}

async function attemptWithRetry(
  buildPrompt: () => string
): Promise<FixResult> {
  const tryGenerate = async (attempt: number): Promise<FixResult> => {
    let prompt = buildPrompt()
    if (attempt === 2) {
      prompt += "\n\nIMPORTANT: Your previous response contained non-existent PowerShell cmdlets. Use ONLY the proven cmdlets listed in the rules above. Do NOT invent cmdlet names. If you are unsure, use reg.exe, netsh, sc.exe, or COM objects."
    }
    if (attempt === 3) {
      prompt += "\n\nSECOND RETRY: You MUST use only the proven commands from the rules. No Set-DefaultAudioDevice, no Set-Volume, no Get-Process -Name 'System Sounds', no fabricated cmdlets of any kind. Use netsh, reg.exe, sc.exe, Get-Service, Get-PnpDevice, ipconfig, or COM objects. If you use a made-up cmdlet the script will be rejected again."
    }
    let raw: string
    try {
      raw = await generateContent(prompt)
    } catch (err) {
      // Provider/model errors — no point retrying, throw immediately
      throw err
    }
    const cleaned = cleanJsonResponse(raw)

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      console.warn(`[JSON Parse Error] Attempt ${attempt} — raw response (first 500 chars):`, raw.slice(0, 500))
      if (attempt < 3) return tryGenerate(attempt + 1)
      throw new Error("Failed to parse AI response. The AI returned invalid JSON. Please try again.")
    }

    const result = parseFixResult(parsed)
    try {
      validateScriptForBadCmdlets(result.fixScript)
      validateScriptForBadCmdlets(result.undoScript)
      return result
    } catch (err) {
      if (attempt < 3) return tryGenerate(attempt + 1)
      throw err
    }
  }

  return tryGenerate(1)
}

export async function generateFix(problemDescription: string): Promise<FixResult> {
  return attemptWithRetry(() => buildFixPrompt(problemDescription))
}

export async function generateBatchFix(issues: BatchIssue[]): Promise<FixResult> {
  return attemptWithRetry(() => buildBatchFixPrompt(issues))
}

function parseDiagnosisResult(json: Record<string, unknown>): DiagnosisResult {
  return {
    status: json.status === "resolved" ? "resolved" : "needs-fix",
    retryStrategy: String(json.retryStrategy ?? ""),
    whatSucceeded: String(json.whatSucceeded ?? ""),
    whatFailed: String(json.whatFailed ?? ""),
    whyItFailed: String(json.whyItFailed ?? ""),
    whatNextFixDoesDifferently: String(json.whatNextFixDoesDifferently ?? ""),
    nextFixScript: String(json.nextFixScript ?? ""),
    nextUndoScript: String(json.nextUndoScript ?? ""),
    nextScriptSafetyNotes: String(json.nextScriptSafetyNotes ?? json.scriptSafetyNotes ?? ""),
  }
}

export async function generateDiagnosis(
  userDescription: string,
  logContent: string,
  originalProblem: string,
  originalFixSummary: string,
  originalFixScript: string
): Promise<DiagnosisResult> {
  const prompt = buildDiagnosisPrompt(userDescription, logContent, originalProblem, originalFixSummary, originalFixScript)
  const raw = await generateContent(prompt)
  const cleaned = cleanJsonResponse(raw)

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error("Failed to parse diagnosis response. Please try again.")
  }

  const result = parseDiagnosisResult(parsed)
  if (result.nextFixScript) validateScriptForBadCmdlets(result.nextFixScript)
  if (result.nextUndoScript) validateScriptForBadCmdlets(result.nextUndoScript)
  return result
}

export async function generateToolScript(
  tool: ToolConfig,
  selectedOptions: string[],
  inputValues?: Record<string, string>
): Promise<FixResult> {
  return attemptWithRetry(() => buildToolPrompt(tool, selectedOptions, inputValues))
}

function parseHealthCard(json: Record<string, unknown>): HealthCard {
  return {
    category: String(json.category ?? "System"),
    status: (["green", "yellow", "red"].includes(String(json.status)) ? String(json.status) : "green") as HealthCard["status"],
    title: String(json.title ?? ""),
    description: String(json.description ?? ""),
    recommendation: String(json.recommendation ?? ""),
    fixAvailable: Boolean(json.fixAvailable),
    fixPrompt: String(json.fixPrompt ?? ""),
  }
}

function parseDiagnosisReport(json: Record<string, unknown>): DiagnosisReport {
  const cards = Array.isArray(json.cards) ? json.cards.map((c: unknown) => parseHealthCard(c as Record<string, unknown>)) : []
  return {
    summary: String(json.summary ?? ""),
    cards,
  }
}

export async function generateDiagnosisReport(report: string): Promise<DiagnosisReport> {
  const prompt = buildDiagnosisReportPrompt(report)
  const raw = await generateContent(prompt)
  const cleaned = cleanJsonResponse(raw)

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error("Failed to parse diagnostic report. Please try again.")
  }

  return parseDiagnosisReport(parsed)
}

export async function translateError(errorInput: string): Promise<ErrorTranslation> {
  const prompt = buildErrorTranslatorPrompt(errorInput)
  const raw = await generateContent(prompt)
  const cleaned = cleanJsonResponse(raw)

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error("Failed to analyze the error. Please try again.")
  }

  return {
    errorName: String(parsed.errorName ?? "Unknown Error"),
    plainExplanation: String(parsed.plainExplanation ?? ""),
    commonCauses: Array.isArray(parsed.commonCauses) ? parsed.commonCauses.map(String) : [],
    severity: (["low", "medium", "high"].includes(String(parsed.severity)) ? parsed.severity : "medium") as ErrorTranslation["severity"],
    canFix: Boolean(parsed.canFix),
    fixDescription: String(parsed.fixDescription ?? ""),
  }
}

export async function scanScript(script: string): Promise<ScriptScanResult> {
  const prompt = buildScriptScannerPrompt(script)
  const raw = await generateContent(prompt)
  const cleaned = cleanJsonResponse(raw)

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error("Failed to scan the script. Please try again.")
  }

  const rating = Math.min(5, Math.max(1, Number(parsed.safetyRating) || 3))
  const validLabels = ["Safe", "Use With Caution", "Potentially Dangerous", "Dangerous"]
  const label = validLabels.includes(String(parsed.safetyLabel)) ? String(parsed.safetyLabel) : "Use With Caution"

  return {
    whatItDoes: String(parsed.whatItDoes ?? ""),
    operations: Array.isArray(parsed.operations)
      ? parsed.operations.map((op: unknown) => ({
          action: String((op as Record<string, unknown>).action ?? ""),
          safe: Boolean((op as Record<string, unknown>).safe),
        }))
      : [],
    dangerousItems: Array.isArray(parsed.dangerousItems) ? parsed.dangerousItems.map(String) : [],
    safetyRating: rating,
    safetyLabel: label as ScriptScanResult["safetyLabel"],
    recommendation: String(parsed.recommendation ?? ""),
  }
}

export async function explainScript(script: string): Promise<string> {
  const prompt = buildExplainPrompt(script)
  return await generateContent(prompt)
}

export async function verifyFix(intendedAction: string, log: string): Promise<VerifyResult> {
  const prompt = buildVerifyPrompt(intendedAction, log)
  const raw = await generateContent(prompt)
  const cleaned = cleanJsonResponse(raw)

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error("Failed to read the log. Please try again.")
  }

  return {
    verified: Boolean(parsed.verified),
    summary: String(parsed.summary ?? ""),
    details: String(parsed.details ?? ""),
  }
}