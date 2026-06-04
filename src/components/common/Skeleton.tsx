interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`skeleton ${className}`} />
}

export function FixResultSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-4 px-4">
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 space-y-3">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="bg-green-950/20 border border-green-900/30 rounded-2xl p-6 space-y-3">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-10 w-full rounded-xl" />
    </div>
  )
}
