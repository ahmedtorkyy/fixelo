import { getSystemPrompt } from "./systemPrompt"

export function buildDiagnosisReportPrompt(report: string): string {
  return `${getSystemPrompt()}

A user has run the Fixelo PC diagnostic tool and pasted the report below. Your job is to analyze the report and identify any issues, then present them as health cards.

When you identify problems, each card should include a fixPrompt field — a short plain English description of the problem that can be fed back into the fix generator to create a targeted BAT file.

---REPORT START---
${report}
---REPORT END---

Respond with ONLY a JSON object in this exact format:

{
  "summary": "A friendly 1-2 sentence summary of the PC's overall health",
  "cards": [
    {
      "category": "One of: System, Disk, Network, Security, Performance, Updates, Startup, GPU",
      "status": "green for good, yellow for warning, red for critical",
      "title": "Short plain English title for this finding",
      "description": "Plain English explanation of what was found and why it matters",
      "recommendation": "What the user should do about it in plain English",
      "fixAvailable": true or false,
      "fixPrompt": "If fixAvailable is true, a short plain English description of the problem that can be used to generate a fix script. Example: 'WiFi keeps disconnecting randomly' or 'Windows Update is stuck and won't download updates'"
    }
  ]
}

Rules for cards:
- Always include at least 3 cards, up to 8
- Include green cards for things that are healthy (e.g. "No critical errors", "Disk space is fine")
- Use yellow cards for warnings that could be improved (e.g. "High startup program count", "Telemetry services running")
- Use red cards for critical issues that need attention (e.g. "Disk nearly full", "Multiple system errors")
- If a problem can be fixed by a script, set fixAvailable to true and provide a clear fixPrompt
- If it's just informational (like "System is up to date"), set fixAvailable to false
- Be concise in descriptions — the user is not technical

Respond with ONLY the JSON object. No other text. No preamble, no explanation, no markdown. Start with { and end with }.`
}