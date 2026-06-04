export function buildScriptScannerPrompt(script: string): string {
  return `You are a Windows security expert. Analyze this script for a non-technical user and tell them exactly what it does and whether it is safe.

---SCRIPT START---
${script.slice(0, 8000)}
---SCRIPT END---

Respond with ONLY a JSON object in this exact format:

{
  "whatItDoes": "A plain English summary of what this script does overall. 2-3 sentences. No jargon.",
  "operations": [
    { "action": "Plain English description of one specific thing the script does", "safe": true or false }
  ],
  "dangerousItems": ["Description of a specific dangerous line or operation found — leave as empty array [] if none"],
  "safetyRating": a number from 1 to 5 (1 = very dangerous, 3 = use with caution, 5 = completely safe),
  "safetyLabel": "Safe" or "Use With Caution" or "Potentially Dangerous" or "Dangerous",
  "recommendation": "One plain English sentence telling the user whether to run this script or not and why."
}

Safety rating guide:
- 5 (Safe): reads system info only, no changes
- 4 (Safe): makes minor reversible changes like clearing caches
- 3 (Use With Caution): modifies registry, services, or startup — reversible but significant
- 2 (Potentially Dangerous): deletes files, modifies system settings, downloads executables
- 1 (Dangerous): disables security, accesses personal files, uses obfuscated/encoded commands

Be fair — a script that clears temp files or optimizes settings is not dangerous.
Flag encoded commands, access to personal documents/passwords, disabling Windows Defender, or downloading executables from unknown URLs.

Respond with ONLY the JSON object. No markdown, no code fences, no extra text.`
}
