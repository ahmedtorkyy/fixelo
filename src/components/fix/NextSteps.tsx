import { Download, MousePointerClick, ShieldCheck, MessageCircleQuestion } from "lucide-react"

const STEPS = [
  {
    icon: Download,
    title: "Find the file in your Downloads",
    desc: "The fix file (a .bat file) just saved to your Downloads folder.",
  },
  {
    icon: MousePointerClick,
    title: "Double-click the file to run it",
    desc: "It opens a small black window and applies the fix automatically.",
  },
  {
    icon: ShieldCheck,
    title: "Click \"Yes\" on the Windows popup",
    desc: "Windows asks for permission (UAC). This is normal — the fix needs admin access.",
  },
  {
    icon: MessageCircleQuestion,
    title: "Come back and tell us if it worked",
    desc: "When the fix finishes it copies a log to your clipboard. If it didn't work, paste that log below for a smarter retry.",
  },
]

export function NextSteps() {
  return (
    <section
      aria-labelledby="next-steps-heading"
      className="bg-brand-950/30 border border-brand-800/40 rounded-2xl p-6"
    >
      <h3 id="next-steps-heading" className="text-lg font-semibold text-brand-200 mb-4">
        Next steps: how to run your fix
      </h3>
      <ol className="space-y-4">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="shrink-0 w-7 h-7 rounded-full bg-brand-600 text-white text-sm font-bold flex items-center justify-center mt-0.5"
            >
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white flex items-center gap-2">
                <step.icon aria-hidden="true" className="w-4 h-4 text-brand-300 shrink-0" />
                {step.title}
              </p>
              <p className="text-sm text-surface-300 leading-relaxed mt-0.5">{step.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
