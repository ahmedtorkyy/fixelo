import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs"
import { resolve, dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = resolve(__dirname, "..", "dist")
const indexPath = join(distDir, "index.html")

if (!existsSync(indexPath)) {
  console.error("dist/index.html not found. Run vite build first.")
  process.exit(1)
}

const SITE = "https://fixelo.pages.dev"
const OG_IMAGE = "https://fixelo.pages.dev/social-share.png"

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

// Read the Vite-built HTML and extract the body content + post-head/pre-head-close parts
const viteHtml = readFileSync(indexPath, "utf-8")

// Split at the <title> tag so we can preserve everything Vite adds (script tags, etc.)
// Strategy: find </head> and <body>, rebuild only the head meta while preserving body + scripts
function injectMeta(baseHtml, title, description, canonical) {
  const fullTitle = `${title} | Fixelo`
  const url = `${SITE}${canonical}`

  // Remove old title, meta description, og/twitter tags, and canonical link
  // Then inject new ones after <head> opening
  let result = baseHtml

  // Remove existing <title>
  result = result.replace(/<title[^>]*>[^<]*<\/title>/g, "")
  // Remove existing <meta name="description">
  result = result.replace(/<meta\s+name="description"[^>]*\/?>/g, "")
  // Remove existing og meta tags
  result = result.replace(/<meta\s+property="og:[^"]*"[^>]*\/?>/g, "")
  // Remove existing twitter meta tags
  result = result.replace(/<meta\s+name="twitter:[^"]*"[^>]*\/?>/g, "")
  // Remove existing canonical link
  result = result.replace(/<link\s+rel="canonical"[^>]*\/?>/g, "")
  // Remove open-graph url meta
  result = result.replace(/<meta\s+property="og:url"[^>]*\/?>/g, "")

  // Inject new SEO tags right after <head>
  const newTags = `
    <meta name="description" content="${escapeHtml(description)}" />
    <meta property="og:title" content="${escapeHtml(fullTitle)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${OG_IMAGE}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(fullTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${OG_IMAGE}" />
    <link rel="canonical" href="${url}" />
    <title>${escapeHtml(fullTitle)}</title>
`

  result = result.replace("<head>", "<head>" + newTags)

  // Remove blank lines inside <head>
  result = result.replace(/(<head>)([\s\S]*?)(<\/head>)/g, (_, open, inner, close) => {
    return open + inner.replace(/^\s*[\r\n]+/gm, "") + close
  })
  return result
}

// ---- tool config parser ----
const toolConfigPath = resolve(__dirname, "..", "src", "lib", "toolConfigs.ts")
const configContent = readFileSync(toolConfigPath, "utf-8")

function extractTools(content) {
  const tools = {}
  // Extract ordered tool blocks: slug, title, description, longDescription
  // Pattern: "slug": { ... slug: "slug", title: "Title", description: "...", longDescription: "..." }
  const blockRe = /"([^"]+)":\s*\{\s*slug:\s*"([^"]+)",\s*title:\s*"([^"]+)",\s*icon:\s*\w+,\s*description:\s*"((?:[^"\\]|\\.)*)",\s*longDescription:\s*"((?:[^"\\]|\\.)*)",/gs
  let m
  while ((m = blockRe.exec(content)) !== null) {
    tools[m[1]] = {
      title: m[3],
      description: m[4],
      longDescription: m[5],
    }
  }
  // Fallback for any missed
  const slugs = [...content.matchAll(/slug:\s*"([^"]+)"/g)].map((mm) => mm[1])
  const titles = [...content.matchAll(/(?<!long)Description:\s*"([^"]+)"/g)] // won't match longDescription
  // Simpler: just get slug-title pairs
  const titleMatches = [...content.matchAll(/title:\s*"([^"]+)"/g)]
  const descMatches = [...content.matchAll(/(?<!\w)description:\s*"((?:[^"\\]|\\.)*)"/g)]
  for (let i = 0; i < slugs.length; i++) {
    if (!tools[slugs[i]]) {
      tools[slugs[i]] = {
        title: titleMatches[i]?.[1] || slugs[i],
        description: descMatches[i]?.[1] || "",
        longDescription: "",
      }
    }
  }
  return tools
}

const tools = extractTools(configContent)
const toolSlugs = Object.keys(tools)

// ---- per-route SEO data ----
function seoForTool(slug) {
  const t = tools[slug]
  if (!t) return null
  const desc = (t.longDescription || t.description).replace(/\s+/g, " ").trim()
  const short = desc.length > 160 ? desc.slice(0, 157) + "..." : desc
  return { title: t.title, description: short, canonical: `/tools/${slug}` }
}

const routeSeo = {
  "/": {
    title: "Fix any Windows problem in plain English",
    description: "Describe your PC problem. Download a safe one-click fix with automatic undo. Free, no technical skill needed.",
    canonical: "/",
  },
  "history": {
    title: "My Fix History",
    description: "View your recent Windows fix history. Redownload fix or undo scripts anytime.",
    canonical: "/history",
  },
  "tools": {
    title: "All Windows Fix Tools — 52 free tools",
    description: "Browse 52 free Windows tools. Fix crashes, clean junk, boost privacy, automate tasks, install software, and more. No technical skill needed.",
    canonical: "/tools",
  },
  "diagnose": {
    title: "Diagnose Your PC",
    description: "Generate a detailed Windows diagnostic report. Find out what's wrong with your PC in minutes.",
    canonical: "/diagnose",
  },
  "community": {
    title: "Community Windows Fixes",
    description: "Browse community-tested Windows fixes. Download safe, pre-approved scripts for common Windows problems, all with automatic undo.",
    canonical: "/community",
  },
  "agent": {
    title: "Fixie AI Agent — Conversational Windows Fixer",
    description: "Chat with Fixie, your AI Windows assistant. Describe your problems conversationally and get safe PowerShell scripts with automatic undo.",
    canonical: "/agent",
  },
  "error-translator": {
    title: "Windows Error Code Translator",
    description: "Translate any Windows error code into plain English. Get the meaning, severity, and step-by-step fix. No technical skill needed.",
    canonical: "/error-translator",
  },
  "script-scanner": {
    title: "Script Safety Scanner",
    description: "Paste any PowerShell or batch script to get an AI safety analysis. See exactly what each command does before you run it.",
    canonical: "/script-scanner",
  },
  "terms": {
    title: "Terms of Service",
    description: "Terms of Service for Fixelo — an independent Windows repair tool platform. Not affiliated with Microsoft.",
    canonical: "/terms",
  },
  "privacy": {
    title: "Privacy Policy",
    description: "Fixelo privacy policy — no data collection, no storage of personal information. Scripts run entirely on your local machine.",
    canonical: "/privacy",
  },
  "disclaimer": {
    title: "Disclaimer",
    description: "Fixelo disclaimer — use scripts at your own risk. Not affiliated with Microsoft. No third-party download sites.",
    canonical: "/disclaimer",
  },
}

// ---- generate all route directories ----
const staticRoutes = Object.keys(routeSeo)

const allRoutes = [
  ...staticRoutes,
  ...toolSlugs.map((s) => `tools/${s}`),
]

function resolveSeo(route) {
  if (route.startsWith("tools/")) {
    return seoForTool(route.slice(6))
  }
  return routeSeo[route] || null
}

let count = 0
for (const route of allRoutes) {
  const seo = resolveSeo(route)
  if (!seo) {
    console.warn(`No SEO data for route: ${route} — skipping`)
    continue
  }

  const html = injectMeta(viteHtml, seo.title, seo.description, seo.canonical)
  const dir = route === "/" ? distDir : join(distDir, route)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, "index.html"), html, "utf-8")
  count++
}

console.log(`Prerendered ${count} unique HTML route directories`)

// verify uniqueness
const titles = {}
for (const route of allRoutes) {
  const seo = resolveSeo(route)
  if (seo) {
    const key = seo.title
    if (!titles[key]) titles[key] = []
    titles[key].push(route)
  }
}
const dupes = Object.entries(titles).filter(([, routes]) => routes.length > 1)
if (dupes.length > 0) {
  console.warn("Duplicate titles found:")
  for (const [title, routes] of dupes) {
    console.warn(`  "${title}" → ${routes.join(", ")}`)
  }
} else {
  console.log(`All ${count} routes have unique titles ✓`)
}
