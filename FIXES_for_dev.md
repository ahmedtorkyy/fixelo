# Fixelo — Fixes for Developer (with code)

## Status: the files in `Desktop\fixelo` are STILL broken — they were not updated

I re-checked. The source files have **not** been modified since before — timestamps are unchanged (e.g. `gemini.ts` 06-03 20:01, `Home.tsx` 06-03 12:35). `npm run build` still fails with the same errors, and `gemini.ts` still ends mid-word: `"[AI] Cloudflare proxy not deployed — f`. One file (`routerPrompt.ts`) is now full of null bytes (452 "Invalid character" errors).

**Root cause: this is a file-transfer corruption, not a coding mistake.** The fixed files either never reached this folder, or the way they were copied truncated them and filled `routerPrompt.ts` with null bytes. Pasting code through chat apps does this. **Please re-send the whole project as a single ZIP** (or via a shared drive), and confirm `npm run build` passes on your machine before sending.

---

## Part 1 — Files truncated/corrupted in transfer (restore from your working copy)

These are cut off at the end (missing closing braces / backticks / exports) or corrupted. Re-send the complete versions:

- `src/lib/gemini.ts` — truncated; **missing `generateContent` export** (see Part 2, FIX 2 for a clean replacement).
- `src/lib/router/routerPrompt.ts` — corrupted with null bytes (see Part 2, FIX 3 for exact content).
- `src/lib/prompts/safetyRules.ts` — truncated; missing rest of rules array + `formatSafetyRules()` export.
- `src/lib/prompts/systemPrompt.ts` — truncated; missing closing backtick + `getSystemPrompt()` export.
- `src/lib/scriptGenerator.ts` — truncated near line 303.
- `src/types/fix.ts` — truncated near line 53 (see Part 2, FIX 4 for full content).
- `src/hooks/useScriptGenerator.ts` — truncated near line 118.
- `src/hooks/useToolGenerator.ts` — truncated near line 91.
- `src/pages/Home.tsx` — truncated near line 95 (JSX not closed).

---

## Part 2 — Actual corrected code

For four files I can give you the full, correct content. Paste these in exactly.

### FIX 1 — `src/lib/cache/scriptShell.ts` (fixes 4 real bugs)

Replace the whole file. This fixes: the `%RANDOM%` double-expansion bug, the fragile `echo.` script-building, the missing UAC auto-elevation, and the missing log (Desktop file + clipboard) that the "not fixed" follow-up flow depends on. It reuses the proven embedding pattern already in `systemPrompt.ts`.

```ts
// Builds a self-contained .bat that auto-elevates (UAC), runs the embedded
// PowerShell, logs every step, and saves the log to Desktop + clipboard.

// Logging preamble injected at the top of every script.
// (Kept under the old name so existing callers don't need changing.)
export function psRequireAdmin(): string {
  return `$script:log = ""
function Write-Log([string]$msg, [string]$color = "White") {
    Write-Host $msg -ForegroundColor $color
    $script:log += "[$(Get-Date -Format 'HH:mm:ss')] $msg" + [Environment]::NewLine
}`
}

const PS_FOOTER = `$logPath = "$env:USERPROFILE\\Desktop\\Fixelo_Log.txt"
[IO.File]::WriteAllText($logPath, $script:log, [Text.Encoding]::UTF8)
try { Set-Clipboard -Value $script:log } catch {}
Write-Log "Log saved to your Desktop as Fixelo_Log.txt" "Green"
Read-Host "Press Enter to close"`

export function wrapPsInBat(title: string, psBody: string): string {
  // Append the log-saving footer so every script always writes its log.
  const fullPs = `${psBody}

${PS_FOOTER}`

  return `@echo off
title Fixelo - ${title}
net session >nul 2>&1
if %errorLevel% neq 0 (
powershell -NoProfile -Command "Start-Process '%~sf0' -Verb RunAs"
exit /b
)
set "PSFILE=%TEMP%\\Fixelo_%RANDOM%.ps1"
powershell -NoProfile -Command "$raw=[IO.File]::ReadAllText('%~f0');$idx=$raw.LastIndexOf('__PSSCRIPT__');$ps=$raw.Substring($idx+12).TrimStart([char]13,[char]10);[IO.File]::WriteAllText('%PSFILE%',$ps,[Text.Encoding]::UTF8)"
powershell -NoProfile -ExecutionPolicy Bypass -File "%PSFILE%"
del /f /q "%PSFILE%" 2>nul
exit /b
__PSSCRIPT__
${fullPs}`
}
```

**Companion change (so the log is actually useful):** in `src/lib/cache/toolBlocks.ts` and `src/lib/cache/cachedFixes.ts`, replace `Write-Host` with `Write-Log` inside the block scripts, so each step is captured in the log that the second-fix flow reads. Also add a verify-after-change line per block (re-check the change, then `Write-Log "Verified: ..."`), per safety rule #13.

### FIX 2 — `src/lib/gemini.ts` (restores `generateContent` AND finishes the security fix)

Replace the whole file. All AI calls now go through the Cloudflare function `/api/ai`; the `VITE_` provider keys and direct browser calls are removed, so keys are no longer compiled into the client bundle. (After this, delete `VITE_OPENROUTER_API_KEY` / `VITE_GROQ_API_KEY` from `.env.local`, keep them only as Cloudflare secrets, and rotate the old ones.)

```ts
// All AI calls go through the Cloudflare Pages Function at /api/ai,
// which holds the provider keys server-side. No keys in the client bundle.

async function callProxy(prompt: string, provider: "openrouter" | "groq"): Promise<string> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: prompt }],
      provider,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`AI proxy ${res.status}: ${body.slice(0, 200)}`)
  }

  const data = await res.json()
  const content: string = data?.content ?? ""
  if (!content.trim()) throw new Error("Empty response from AI proxy")

  const t = content.trim()
  if (t.startsWith("<") || t.startsWith("<!DOCTYPE")) {
    throw new Error("Returned HTML error page")
  }

  return content
}

export async function generateContent(prompt: string): Promise<string> {
  const errors: string[] = []
  for (const provider of ["openrouter", "groq"] as const) {
    try {
      const result = await callProxy(prompt, provider)
      console.log(`[AI] ${provider} responded`)
      return result
    } catch (err) {
      errors.push(`${provider}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
  throw new Error(`All AI providers failed:\n${errors.join("\n")}`)
}

export const MODEL_ID = "Cloudflare proxy (OpenRouter + Groq)"
```

Note: this removes the `groq-sdk` browser import. That dependency is no longer needed in the client (the function calls Groq's REST API directly), so you can drop it from the client imports.

### FIX 3 — `src/lib/router/routerPrompt.ts` (currently null-corrupted — replace entirely)

```ts
const TOOL_SLUGS = [
  "slow-pc-fix", "gaming-boost", "startup-manager", "network-optimizer",
  "wifi-network-fixer", "audio-fix", "printer-fix", "usb-device-fix",
  "blue-screen-recovery", "windows-update-fixer", "disk-error-fix",
  "corrupted-files-fix", "display-resolution-fix", "battery-optimizer",
  "ssd-optimizer", "privacy-protector", "parental-controls",
  "monthly-maintenance", "dark-mode-setup", "taskbar-customizer",
  "auto-shutdown", "auto-backup", "driver-manager", "new-pc-setup",
  "winget-installer", "dev-environment",
]

export function buildRouterPrompt(problem: string): string {
  return `You are a classifier for a PC troubleshooting tool. Given a user's problem description, pick the SINGLE most relevant tool from the list below, or return "custom" if no tool fits well.

Tools:
${TOOL_SLUGS.map((s) => `  - ${s.replace(/-/g, " ")}`).join("\n")}

Rules:
- Match the problem to the tool's purpose, not its name.
- "custom" means the user needs a novel, one-off fix not covered by any tool.
- If the problem mentions multiple areas, pick the one that's the primary issue.

Respond with ONLY valid JSON, no preamble, no markdown:
{"slug":"tool-slug-or-custom","reason":"one-sentence explanation"}

Problem: "${problem}"`
}
```

### FIX 4 — `src/types/fix.ts` (full content; adds the `"suggestion"` flow step)

Replace the whole file. The only logical addition is `"suggestion"` in `FixFlowStep` (used by the new router flow in `Home.tsx`).

```ts
export interface FixResult {
  problemSummary: string
  whatItDoes: string
  whatItDoesNotTouch: string
  fixScript: string
  undoScript: string
  scriptSafetyNotes: string
}

export interface DiagnosisResult {
  status: "resolved" | "needs-fix"
  retryStrategy: string
  whatSucceeded: string
  whatFailed: string
  whyItFailed: string
  whatNextFixDoesDifferently: string
  nextFixScript: string
  nextUndoScript: string
  nextScriptSafetyNotes: string
}

export interface HealthCard {
  category: string
  status: "green" | "yellow" | "red"
  title: string
  description: string
  recommendation: string
  fixAvailable: boolean
  fixPrompt: string
}

export interface DiagnosisReport {
  summary: string
  cards: HealthCard[]
}

export interface HistoryEntry {
  id: string
  timestamp: number
  problemDescription: string
  fixResult: FixResult
  status: "success" | "failed" | "unknown"
}

export type FixFlowStep =
  | "input"
  | "loading"
  | "result"
  | "suggestion"
  | "failure-input"
  | "diagnosis-loading"
  | "diagnosis-result"

export interface VerifyResult {
  verified: boolean
  summary: string
  details: string
}
```

---

## Part 3 — Final check

After restoring the Part 1 files and applying the Part 2 code:

1. `npm run build` — must finish with **zero** TypeScript errors.
2. Test one assembled tool script (e.g. `slow-pc-fix`, 2 boxes ticked) on a Windows VM: it should auto-elevate (UAC prompt), run, save `Fixelo_Log.txt` to the Desktop, and the undo should restore the changes.
3. Confirm the built bundle in `dist/` contains **no** API keys (search the JS for `gsk_` / `sk-or-`).
