interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export function Card({ children, className = "", hover = false }: CardProps) {
  return (
    <div
      className={`bg-surface-900 border border-surface-800 rounded-2xl p-6 ${
        hover ? "hover:border-surface-700 hover:bg-surface-900/80 transition-colors" : ""
      } ${className}`}
    >
      {children}
    </div>
  )
}