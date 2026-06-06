// Builds the prompt for the "smarter retry" diagnosis flow.
import { getSystemPrompt } from "./systemPrompt"

export function buildDiagnosisPrompt(
  userDescription: string,
  logContent: string,
  originalProblem: string,
  originalFixSummary: string,
  originalFixScript: string
): string {
  const descriptionBlock = userDescription.trim()
    ? `In their own words, here is what happened when they ran the fix:

---WHAT THE USER SAID START---
${userDescription.trim()}
---WHAT THE USER SAID END---
`
    : ""

  const logBlock = logContent.trim()
    ? `They also pasted the log output that the fix script copied to their clipboard:

---LOG START---
${logContent.trim()}
---LOG END---
`
    : ""

  const firstFixBlock = originalFixScript.trim()
    ? `Here is EXACTLY what the first fix attempt did. You must read it so you do not blindly repeat it or silently reset the same settings back to their defaults.

Plain-English summary of the first fix:
${originalFixSummary.trim() || "(no summary provided)"}

The first fix script:
---FIRST FIX SCRIPT START---
${originalFixScript.trim()}
---FIRST FIX SCRIPT END---
`
    : ""

  const hasLog = logContent.trim().length > 0
  const sourceGuidance = hasLog
    ? "Prioritise concrete evidence from the log, and use the user's description for context about symptoms the log may not capture."
    : "No technical log was provided, so reason carefully from the user's plain-language description and the original problem. Be conservative and keep the new fix safe and reversible."

  return `${getSystemPrompt()}

The user originally had this Windows problem: "${originalProblem}"

They ran the first fix script but it did not solve their problem.

${firstFixBlock}${descriptionBlock}${logBlock}
FIRST, read the log and the user's description and decide whether the problem is ALREADY RESOLVED. CRITICAL: If the log contains a "RESULT: SUCCESS" line at the end, treat it as resolved — Fixelo scripts always verify the actual end state and log this line honestly; scattered intermediate "Error" lines may come from optional sub-steps that don't affect the result. If the log clearly shows the fix completed and the problem is fixed (success messages, verification lines, passing checks, a RESULT: SUCCESS/FAILED/PARTIAL line, no truly blocking errors), set "status" to "resolved", explain in "whatSucceeded" why you believe it is fixed, and leave "nextFixScript" and "nextUndoScript" as empty strings — do NOT invent another fix.

ONLY if the problem genuinely still failed, set "status" to "needs-fix" and decide the best recovery strategy. You can see exactly what the first fix already did, so choose ONE of these and state which you chose:

- "revert-first": If the first fix changed settings that did not help (or may have made things worse), the new script should FIRST restore those specific settings to what they were before the first fix, and THEN apply a genuinely different approach to the original problem.
- "build-on": If the first fix's changes were correct but incomplete, KEEP them and have the new script add the additional steps needed to fully solve the problem.

CRITICAL: Do NOT simply reset the affected settings to Windows defaults unless resetting to default is genuinely the correct fix for the original problem. The user noticed the last retry "switched everything back to how it was before" — never silently revert without it being a deliberate, explained part of solving the problem. Whatever you choose, the new approach must be meaningfully DIFFERENT from the first fix, not a repeat of it.

${sourceGuidance}

Your response must be ONLY a JSON object in this format:

{
  "status": "Either the exact word resolved (if the log already shows the problem is fixed and no new fix is needed) or the exact word needs-fix (if it still failed)",
  "retryStrategy": "A short, friendly one-line label of the strategy you chose and why, in plain English. Example: 'Undid the first DNS change, then rebuilt the network stack instead' or 'Kept the first fix and added the missing driver reset it was missing'.",
  "whatSucceeded": "What parts of the first fix likely worked correctly",
  "whatFailed": "What specifically failed or did not resolve the problem",
  "whyItFailed": "The most likely reason the first fix failed, explained in plain English",
  "whatNextFixDoesDifferently": "How this new fix is different from the first one and why it should work",
  "nextFixScript": "The complete new BAT file content as a string, following your chosen strategy.",
  "nextUndoScript": "The complete undo BAT file content as a string that reverses everything the new fix does.",
  "scriptSafetyNotes": "Any important warnings or notes"
}

Respond with ONLY the JSON object. No other text. No preamble, no explanation, no markdown. Start with { and end with }.`
}
