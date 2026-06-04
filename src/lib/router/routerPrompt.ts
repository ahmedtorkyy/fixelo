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
