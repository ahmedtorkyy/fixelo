import { NavLink } from "react-router"
import { Menu, X } from "lucide-react"
import { useState } from "react"

const navItems = [
  { to: "/", label: "Fix My Problem" },
  { to: "/tools", label: "Tools" },
  { to: "/diagnose", label: "Diagnose" },
  { to: "/agent", label: "Agent" },
  { to: "/community", label: "Community" },
  { to: "/history", label: "My Fixes" },
]

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="border-b border-surface-800 bg-surface-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2.5 group" onClick={() => setMobileOpen(false)}>
          <img src="/header-logo.png" alt="Fixelo" className="w-9 h-9 rounded-lg" />
          <span className="text-xl font-bold text-white tracking-tight">
            Fix<span className="text-brand-400">elo</span>
          </span>
        </NavLink>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `px-3 py-2 text-sm rounded-lg transition-colors ${
                  isActive
                    ? "text-brand-400 bg-brand-500/10 font-medium"
                    : "text-surface-400 hover:text-white hover:bg-surface-800"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          className="md:hidden p-2 text-surface-400 hover:text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <nav id="mobile-nav" className="md:hidden border-t border-surface-800 bg-surface-950 px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2.5 text-sm rounded-lg transition-colors ${
                  isActive
                    ? "text-brand-400 bg-brand-500/10 font-medium"
                    : "text-surface-400 hover:text-white hover:bg-surface-800"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}