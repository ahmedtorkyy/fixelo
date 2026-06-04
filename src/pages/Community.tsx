import { useState } from "react"
import { Link } from "react-router"
import { ArrowRight, Send, CheckCircle, Search } from "lucide-react"
import { Card } from "@/components/common/Card"
import { Button } from "@/components/common/Button"
import { COMMUNITY_FIXES, COMMUNITY_CATEGORIES } from "@/lib/communityFixes"
import { useDownloadCounts, submitCommunityFix } from "@/hooks/useSupabase"

export default function CommunityPage() {
  const [activeCategory, setActiveCategory] = useState<string>("All")
  const [search, setSearch] = useState("")
  const { counts } = useDownloadCounts()

  const getDownloadCount = (slug: string, fallback: number) => {
    if (counts[slug] !== undefined) return counts[slug]
    return fallback
  }

  const byCategory = activeCategory === "All"
    ? COMMUNITY_FIXES
    : COMMUNITY_FIXES.filter((fix) => fix.category === activeCategory)

  const filtered = search.trim()
    ? byCategory.filter(
        (f) =>
          f.title.toLowerCase().includes(search.toLowerCase()) ||
          f.description.toLowerCase().includes(search.toLowerCase())
      )
    : byCategory

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Community Fix Library</h1>
        <p className="text-surface-400 text-lg max-w-2xl mx-auto">
          Browse pre-built fixes for common Windows problems. Each fix is AI-generated with a transparent script and an automatic undo file.
        </p>
      </div>

      <div className="relative mb-6">
        <Search className="w-4 h-4 text-surface-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search fixes..."
          className="w-full bg-surface-900 border border-surface-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-surface-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm transition-all"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-500 hover:text-white text-xs cursor-pointer">Clear</button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 justify-center mb-8">
        <button
          onClick={() => setActiveCategory("All")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            activeCategory === "All"
              ? "bg-brand-600 text-white"
              : "bg-surface-900 border border-surface-700 text-surface-300 hover:border-brand-600 hover:text-brand-300"
          }`}
        >
          All ({COMMUNITY_FIXES.length})
        </button>
        {COMMUNITY_CATEGORIES.map((cat) => {
          const count = COMMUNITY_FIXES.filter((f) => f.category === cat).length
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                activeCategory === cat
                  ? "bg-brand-600 text-white"
                  : "bg-surface-900 border border-surface-700 text-surface-300 hover:border-brand-600 hover:text-brand-300"
              }`}
            >
              {cat} ({count})
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((fix) => (
          <Link key={fix.slug} to={`/community/${fix.slug}`} className="block">
            <Card hover className="h-full cursor-pointer group">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 bg-brand-600/15 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-brand-600/25 transition-colors">
                  <fix.icon className="w-4.5 h-4.5 text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium text-sm group-hover:text-brand-400 transition-colors">
                    {fix.title}
                  </h3>
                  <p className="text-xs text-surface-500 mt-0.5">{fix.category}</p>
                </div>
              </div>
              <p className="text-surface-400 text-sm leading-relaxed line-clamp-2 mb-3">
                {fix.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-surface-500">{getDownloadCount(fix.slug, fix.downloads).toLocaleString()} downloads</span>
                <span className="text-xs text-brand-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                  Get fix <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <SubmitFixForm />
    </div>
  )
}

function SubmitFixForm() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("Fix Tools")
  const [submitted, setSubmitted] = useState(false)
  const [submittedOnline, setSubmittedOnline] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const success = await submitCommunityFix({
      title: title.trim(),
      description: description.trim(),
      category,
      fixPrompt: description.trim(),
      submittedBy: "community",
    })

    if (!success) {
      // No backend configured — keep a local note, but DON'T claim it was sent for review.
      const localSubmissions = JSON.parse(localStorage.getItem("fixelo_submissions") || "[]")
      localSubmissions.push({ title: title.trim(), description: description.trim(), category, submittedAt: Date.now() })
      localStorage.setItem("fixelo_submissions", JSON.stringify(localSubmissions))
    }

    setSubmittedOnline(success)
    setSubmitted(true)
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="mt-16 border-t border-surface-800 pt-10">
        <div className="max-w-xl mx-auto text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Thank you!</h3>
          <p className="text-surface-400 mb-6">
            {submittedOnline
              ? "Your fix has been submitted for review. We'll check it for safety and quality before publishing it to the community library."
              : "Thanks for sharing! We couldn't reach the review service just now, so this wasn't submitted — please try again in a bit. (We've kept a copy on your device.)"}
          </p>
          <Button variant="secondary" onClick={() => { setSubmitted(false); setSubmittedOnline(false); setTitle(""); setDescription(""); }}>
            Submit another fix
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-16 border-t border-surface-800 pt-10">
      <div className="max-w-xl mx-auto">
        <h2 className="text-xl font-bold text-white mb-2">Submit Your Fix</h2>
        <p className="text-surface-400 text-sm mb-6">
          Have a fix that worked for you? Share it with the community. All submissions are reviewed before publishing.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Fix Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fix blurry text in Chrome"
              className="w-full bg-surface-900 border border-surface-700 rounded-xl px-4 py-2.5 text-white placeholder-surface-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-surface-900 border border-surface-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm"
            >
              {COMMUNITY_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Problem Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the Windows problem and what the fix should do. Be specific — our AI will generate the script from your description."
              rows={4}
              className="w-full bg-surface-900 border border-surface-700 rounded-xl px-4 py-2.5 text-white placeholder-surface-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-none text-sm"
              required
            />
          </div>

          <Button type="submit" size="md" disabled={submitting || !title.trim() || !description.trim()}>
            <Send className="w-4 h-4" />
            {submitting ? "Submitting..." : "Submit for Review"}
          </Button>
        </form>
      </div>
    </div>
  )
}