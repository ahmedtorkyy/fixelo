import { getSystemPrompt } from "./systemPrompt"

export function buildFixPrompt(problemDescription: string): string {
  return `${getSystemPrompt()}

The user's Windows problem is: "${problemDescription}"

Generate a fix for this problem. Remember to:
1. Start with a system scan relevant to the problem
2. Capture all original settings before making changes
3. Log every action with timestamps
4. Copy the log to clipboard when done
5. Include a complete undo script
6. Use only friendly plain English messages
7. Request admin privileges if needed

Respond with ONLY the JSON object. No other text. No preamble, no explanation, no markdown. Start with { and end with }.`
}