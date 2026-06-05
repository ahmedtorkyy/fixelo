import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "fs"
import { resolve, dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = resolve(__dirname, "..", "dist")
const indexPath = join(distDir, "index.html")

if (!existsSync(indexPath)) {
  console.error("dist/index.html not found. Run vite build first.")
  process.exit(1)
}

const indexHtml = readFileSync(indexPath, "utf-8")

const toolConfigPath = resolve(__dirname, "..", "src", "lib", "toolConfigs.ts")

function extractToolSlugs(filePath) {
  if (existsSync(filePath)) {
    const content = readFileSync(filePath, "utf-8")
    const slugs = [...content.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1])
    return [...new Set(slugs)]
  }
  return []
}

const toolSlugs = extractToolSlugs(toolConfigPath)

const routeDirs = [
  "",
  "history",
  "tools",
  ...toolSlugs.map((s) => `tools/${s}`),
  "diagnose",
  "community",
  "agent",
  "error-translator",
  "script-scanner",
  "terms",
  "privacy",
  "disclaimer",
]

let count = 0
for (const route of routeDirs) {
  if (!route) continue
  const dir = join(distDir, route)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, "index.html"), indexHtml, "utf-8")
  count++
}

console.log(`Prerendered ${count} route directories`)
