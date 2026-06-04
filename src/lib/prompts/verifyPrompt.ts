export function buildVerifyPrompt(intendedAction: string, log: string): string {
  return `You are Fixelo's verification assistant. A user ran a Windows fix script and pasted the log it produced. Read the log and tell the user, in plain friendly English, whether the script actually did what they wanted.

What the user wanted to achieve: "${intendedAction}"

---LOG START---
${log}
---LOG END---

Read the log carefully. Look for explicit "Verified:" lines, success messages, and any errors. Decide whether the intended action was actually completed.

Respond ONLY with a JSON object in this exact format:
{
  "verified": true or false (true ONLY if the log clearly shows the intended action completed successfully),
  "summary": "One short, friendly sentence with the result. Example: 'Confirmed — the French keyboard was added successfully.' or 'The script ran, but the keyboard step reported an error.'",
  "details": "A brief plain-English explanation of what in the log led to your conclusion. If it failed, say what the user should do next."
}

Respond with ONLY the JSON object. No other text. No preamble, no explanation, no markdown. Start with { and end with }.`
}