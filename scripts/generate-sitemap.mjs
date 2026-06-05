import { writeFileSync, existsSync, readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = resolve(__dirname, "..", "public")
const toolConfigPath = resolve(__dirname, "..", "src", "lib", "toolConfigs.ts")

const SITE_URL = "https://fixelo.pages.dev"

const staticRoutes = [
  { path: "", priority: "1.0", changefreq: "weekly" },
  { path: "tools", priority: "0.9", changefreq: "weekly" },
  { path: "diagnose", priority: "0.8", changefreq: "monthly" },
  { path: "agent", priority: "0.8", changefreq: "monthly" },
  { path: "community", priority: "0.7", changefreq: "weekly" },
  { path: "history", priority: "0.5", changefreq: "monthly" },
  { path: "error-translator", priority: "0.7", changefreq: "monthly" },
  { path: "script-scanner", priority: "0.7", changefreq: "monthly" },
  { path: "terms", priority: "0.3", changefreq: "yearly" },
  { path: "privacy", priority: "0.3", changefreq: "yearly" },
  { path: "disclaimer", priority: "0.3", changefreq: "yearly" },
]

function extractToolSlugs(filePath) {
  if (!existsSync(filePath)) {
    console.warn("toolConfigs.ts not found at", filePath, "- using hardcoded list")
    return [
      "gaming-boost", "privacy-protector", "new-pc-setup", "startup-manager",
      "network-optimizer", "monthly-maintenance", "wifi-network-fixer",
      "windows-update-fixer", "slow-pc-fix", "blue-screen-recovery", "audio-fix",
      "display-resolution-fix", "corrupted-files-fix", "disk-error-fix", "printer-fix",
      "usb-device-fix", "battery-optimizer", "ssd-optimizer", "dark-mode-setup",
      "taskbar-customizer", "auto-shutdown", "auto-backup", "driver-manager",
      "winget-installer", "dev-environment", "parental-controls", "virus-scanner",
      "windows-search-fix", "bluetooth-fix", "explorer-fix", "clock-sync",
      "troubleshooter-runner", "store-fix", "network-stack-reset", "activation-fix",
      "keyboard-mouse-fix", "camera-fix", "runtime-installer", "font-cache-fix",
      "windows-hello-fix", "date-time-format-fix", "windows-apps-repair",
      "file-association-guardian", "context-menu-cleaner", "system-tweaks",
      "free-up-space", "restore-point-manager", "microphone-fix", "power-sleep-fix",
      "onedrive-fix", "software-installer", "dll-runtime-fix",
    ]
  }
  const content = readFileSync(filePath, "utf-8")
  const slugs = [...content.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1])
  return [...new Set(slugs)]
}

const toolSlugs = extractToolSlugs(toolConfigPath)

const urls = [
  ...staticRoutes.map(
    (r) => `  <url>
    <loc>${SITE_URL}/${r.path}</loc>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
  ),
  ...toolSlugs.map(
    (slug) => `  <url>
    <loc>${SITE_URL}/tools/${slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
  ),
]

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`

const outPath = resolve(publicDir, "sitemap.xml")
writeFileSync(outPath, sitemap, "utf-8")
console.log(`Sitemap generated at ${outPath} (${urls.length} URLs)`)
