import { Wrench, CheckCircle, AlertTriangle, XCircle } from "lucide-react"
import { Button } from "@/components/common/Button"
import type { HealthCard } from "@/types/fix"

const statusConfig = {
  green: {
    bg: "bg-green-950/30",
    border: "border-green-800/40",
    icon: CheckCircle,
    iconColor: "text-green-400",
    badge: "bg-green-600/20 text-green-400",
    badgeText: "Good",
  },
  yellow: {
    bg: "bg-amber-950/30",
    border: "border-amber-800/40",
    icon: AlertTriangle,
    iconColor: "text-amber-400",
    badge: "bg-amber-600/20 text-amber-400",
    badgeText: "Warning",
  },
  red: {
    bg: "bg-red-950/30",
    border: "border-red-800/40",
    icon: XCircle,
    iconColor: "text-red-400",
    badge: "bg-red-600/20 text-red-400",
    badgeText: "Critical",
  },
}

interface HealthCardProps {
  card: HealthCard
  onFix: (fixPrompt: string) => void
  selectable?: boolean
  selected?: boolean
  onToggleSelect?: () => void
}

export function HealthCardComponent({ card, onFix, selectable, selected, onToggleSelect }: HealthCardProps) {
  const config = statusConfig[card.status]
  const Icon = config.icon
  const showCheckbox = !!selectable && card.fixAvailable && !!onToggleSelect

  return (
    <div
      className={`${config.bg} border rounded-2xl p-5 transition-colors ${
        showCheckbox && selected ? "border-brand-500/60 ring-1 ring-brand-500/30" : config.border
      }`}
    >
      <div className="flex items-start gap-4">
        {showCheckbox ? (
          <input
            type="checkbox"
            checked={!!selected}
            onChange={onToggleSelect}
            aria-label={`Include "${card.title}" in the combined fix`}
            className="mt-1 w-5 h-5 rounded border-surface-600 text-brand-600 focus:ring-brand-500 accent-brand-600 cursor-pointer shrink-0"
          />
        ) : (
          <Icon className={`w-6 h-6 ${config.iconColor} mt-0.5 shrink-0`} />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {showCheckbox && <Icon aria-hidden="true" className={`w-5 h-5 ${config.iconColor} shrink-0`} />}
            <h3 className="text-white font-semibold">{card.title}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.badge}`}>
              {config.badgeText}
            </span>
            <span className="text-xs text-surface-500">{card.category}</span>
          </div>
          <p className="text-surface-300 text-sm leading-relaxed mb-2">{card.description}</p>
          <p className="text-surface-400 text-sm">{card.recommendation}</p>
          {card.fixAvailable && (
            <Button size="sm" variant="secondary" className="mt-3" onClick={() => onFix(card.fixPrompt)}>
              <Wrench className="w-3.5 h-3.5" />
              Fix just this one
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}