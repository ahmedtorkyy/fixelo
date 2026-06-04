import { useState } from "react"
import { Link } from "react-router"
import { ArrowRight, Search, AlertCircle, Shield } from "lucide-react"
import { Card } from "@/components/common/Card"
import { TOOLS, TOOL_CATEGORIES } from "@/lib/toolConfigs"

const categoryColors: Record<string, { icon: string; text: string; bg: string }> = {
  "Fix Tools":          { icon: "text-red-400",    text: "text-red-400",    bg: "bg-red-600/15 group-hover:bg-red-600/25" },
  "Performance":        { icon: "text-green-400",  text: "text-green-400",  bg: "bg-green-600/15 group-hover:bg-green-600/25" },
  "Privacy & Security": { icon: "text-blue-400",   text: "text-blue-400",   bg: "bg-blue-600/15 group-hover:bg-blue-600/25" },
  "Customization":      { icon: "text-purple-400", text: "text-purple-400", bg: "bg-purple-600/15 group-hover:bg-purple-600/25" },
  "Automation":         { icon: "text-orange-400", text: "text-orange-400", bg: "bg-orange-600/15 group-hover:bg-orange-600/25" },
  "Setup & Installation": { icon: "text-teal-400", text: "text-teal-400",   bg: "bg-teal-600/15 group-hover:bg-teal-600/25" },
}

const categoryDescriptions: Record<string, string> = {
  "Fix Tools": "Diagnose and repair common Windows problems",
  "Performance": "Speed up and optimize your PC",
  "Privacy & Security": "Protect your privacy and secure your system",
  "Customization": "Personalize your Windows experience",
  "Automation": "Set up automatic tasks and schedules",
  "Setup & Installation": "Install software and configure your environment",
}

export default function ToolsPage() {
  const [search, setSearch] = useState("")

  const allTools = Object.values(TOOLS)
  const filtered = search.trim()
    ? allTools.filter(
        (t) =>
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.description.toLowerCase().includes(search.toLowerCase()) ||
          t.category.toLowerCase().includes(search.toLowerCase())
      )
    : null

  const toolsByCategory = TOOL_CATEGORIES.map((cat) => ({
    category: cat,
    description: categoryDescriptions[cat] || "",
    colors: categoryColors[cat] || categoryColors["Fix Tools"],
    tools: (filtered ?? allTools).filter((t) => t.category === cat),
  })).filter((c) => c.tools.length > 0)

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Explore Tools</h1>
        <p className="text-surface-400 text-lg max-w-2xl mx-auto">
          Select a tool, check what you want, and download a custom script. Every script includes an automatic undo.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-10">
        <Search className="w-4 h-4 text-surface-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <label htmlFor="tools-search" className="sr-only">Search tools</label>
        <input
          id="tools-search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tools..."
          className="w-full bg-surface-900 border border-surface-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-surface-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm transition-all"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-500 hover:text-white text-xs cursor-pointer">
            Clear
          </button>
        )}
      </div>

      {/* AI Power Features */}
      {!search && (
        <div className="bg-brand-600/5 border border-brand-600/20 rounded-2xl p-6 mb-12">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs bg-brand-600 text-white px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wide">New</span>
            <h2 className="text-white font-bold">AI Power Features</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link to="/error-translator" className="block group">
              <div className="bg-surface-900 border border-surface-800 rounded-xl p-4 hover:border-brand-600/40 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-amber-600/15 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-amber-600/25 transition-colors">
                    <AlertCircle className="w-4.5 h-4.5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-sm group-hover:text-brand-400 transition-colors">Error Code Translator</h3>
                    <p className="text-surface-500 text-xs mt-0.5">Paste any Windows error — get a plain English explanation and fix</p>
                  </div>
                </div>
              </div>
            </Link>
            <Link to="/script-scanner" className="block group">
              <div className="bg-surface-900 border border-surface-800 rounded-xl p-4 hover:border-brand-600/40 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-green-600/15 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-green-600/25 transition-colors">
                    <Shield className="w-4.5 h-4.5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-sm group-hover:text-brand-400 transition-colors">Script Safety Scanner</h3>
                    <p className="text-surface-500 text-xs mt-0.5">Paste any script from the internet — get a safety rating and explanation</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* No results */}
      {filtered !== null && filtered.length === 0 && (
        <div className="text-center py-16 text-surface-500">
          No tools found for "<span className="text-white">{search}</span>"
        </div>
      )}

      {/* Tool categories */}
      <div className="space-y-12">
        {toolsByCategory.map(({ category, description, colors, tools }) => (
          <div key={category}>
            <div className="mb-4">
              <h2 className={`text-xl font-bold ${colors.text}`}>{category}</h2>
              <p className="text-surface-500 text-sm">{description}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tools.map((tool) => (
                <Link key={tool.slug} to={`/tools/${tool.slug}`} className="block">
                  <Card hover className="h-full cursor-pointer group">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${colors.bg}`}>
                        <tool.icon className={`w-5 h-5 ${colors.icon}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-sm group-hover:text-brand-400 transition-colors">
                          {tool.title}
                        </h3>
                      </div>
                    </div>
                    <p className="text-surface-400 text-sm leading-relaxed mb-3">{tool.description}</p>
                    <div className="flex items-center gap-1 text-brand-400 text-sm font-medium group-hover:gap-2 transition-all">
                      Select options <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
