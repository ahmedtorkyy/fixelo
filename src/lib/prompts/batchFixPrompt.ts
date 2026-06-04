// Builds the prompt for fixing several diagnosed issues in ONE consolidated script.
import { getSystemPrompt } from "./systemPrompt"

export interface BatchIssue {
  title: string
  fixPrompt: string
}

export function buildBatchFixPrompt(issues: BatchIssue[]): string {
  const list = issues
    .map((it, i) => `${i + 1}. ${it.title}\n   What needs fixing: ${it.fixPrompt}`)
    .join("\n")

  return `${getSystemPrompt()}

The user ran a PC health scan and chose to fix the following ${issues.length} issue(s) together in ONE combined script:

${list}

Generate a SINGLE consolidated fix that addresses ALL of the issues listed above. Requirements:
1. Set up the elevation and Write-Log boilerplate ONCE at the top — do not repeat it per issue.
2. Handle each issue as its own clearly-commented, INDEPENDENT section. Wrap each section in its own try/catch so that if one section fails, the remaining sections still run.
3. Begin each section with a friendly Write-Log message that names the issue, e.g. Write-Log "Fixing: Slow startup..." "Cyan".
4. Capture the original settings BEFORE changing anything, in every section.
5. The undoScript must reverse EVERY change made by ALL sections, also split into independent try/catch sections so a single failure does not block the rest.
6. "problemSummary" must briefly list all the issues being fixed. "whatItDoes" must explain, issue by issue, what the script will do. "whatItDoesNotTouch" must reassure the user across all of the sections.
7. Keep the combined script readable and self-contained. Do not invent cmdlets; follow every safety rule above.

Respond with ONLY the JSON object in the required format. No other text. No preamble, no explanation, no markdown. Start with { and end with }.`
}
