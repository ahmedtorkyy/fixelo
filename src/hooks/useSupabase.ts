import { useState, useEffect, useCallback } from "react"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

const DOWNLOAD_COUNTS_TABLE = "community_fix_downloads"

interface DownloadCountRow {
  slug: string
  count: number
}

export function useDownloadCounts() {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const loading = !isSupabaseConfigured ? false : true

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    let cancelled = false

    async function fetchCounts() {
      const { data } = await supabase!.from(DOWNLOAD_COUNTS_TABLE).select("slug, count")
      if (!cancelled && data) {
        const map: Record<string, number> = {}
        for (const row of data as DownloadCountRow[]) {
          map[row.slug] = row.count
        }
        setCounts(map)
      }
    }

    fetchCounts()
    return () => { cancelled = true }
  }, [])

  const incrementCount = useCallback(async (slug: string) => {
    if (!isSupabaseConfigured || !supabase) return

    setCounts((prev) => {
      const current = prev[slug] ?? 0
      return { ...prev, [slug]: current + 1 }
    })

    const { data: existing } = await supabase!
      .from(DOWNLOAD_COUNTS_TABLE)
      .select("count")
      .eq("slug", slug)
      .single()

    if (existing) {
      const newCount = (existing as DownloadCountRow).count + 1
      await supabase!.from(DOWNLOAD_COUNTS_TABLE).update({ count: newCount }).eq("slug", slug)
    } else {
      await supabase!.from(DOWNLOAD_COUNTS_TABLE).insert({ slug, count: 1 })
    }
  }, [])

  return { counts, loading, incrementCount }
}

interface FixSubmission {
  title: string
  description: string
  category: string
  fixPrompt: string
  submittedBy: string
  status: "pending" | "approved" | "rejected"
}

export async function submitCommunityFix(submission: Omit<FixSubmission, "status">): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false

  const { error } = await supabase.from("community_fix_submissions").insert({
    ...submission,
    status: "pending",
  })

  return !error
}