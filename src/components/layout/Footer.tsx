import { Wrench, Shield } from "lucide-react"
import { NavLink } from "react-router"

export function Footer() {
  return (
    <footer className="border-t border-surface-800 bg-surface-950 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                <Wrench className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">
                Fix<span className="text-brand-400">elo</span>
              </span>
            </div>
            <p className="text-sm text-surface-400 leading-relaxed">
              Describe it. Download it. Done.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Product</h4>
            <ul className="space-y-2">
              <li>
                <NavLink to="/" className="text-sm text-surface-400 hover:text-brand-400 transition-colors">
                  Fix My Problem
                </NavLink>
              </li>
              <li>
                <NavLink to="/tools" className="text-sm text-surface-400 hover:text-brand-400 transition-colors">
                  Tool Library
                </NavLink>
              </li>
              <li>
                <NavLink to="/diagnose" className="text-sm text-surface-400 hover:text-brand-400 transition-colors">
                  Diagnose My PC
                </NavLink>
              </li>
              <li>
                <NavLink to="/agent" className="text-sm text-surface-400 hover:text-brand-400 transition-colors">
                  Fixie AI Agent
                </NavLink>
              </li>
              <li>
                <NavLink to="/history" className="text-sm text-surface-400 hover:text-brand-400 transition-colors">
                  My Fixes
                </NavLink>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3">AI Tools</h4>
            <ul className="space-y-2">
              <li>
                <NavLink to="/error-translator" className="text-sm text-surface-400 hover:text-brand-400 transition-colors">
                  Error Translator
                </NavLink>
              </li>
              <li>
                <NavLink to="/script-scanner" className="text-sm text-surface-400 hover:text-brand-400 transition-colors">
                  Script Safety Scanner
                </NavLink>
              </li>
              <li>
                <NavLink to="/community" className="text-sm text-surface-400 hover:text-brand-400 transition-colors">
                  Community Fix Library
                </NavLink>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Legal</h4>
            <ul className="space-y-2">
              <li>
                <NavLink to="/terms" className="text-sm text-surface-400 hover:text-brand-400 transition-colors">
                  Terms of Service
                </NavLink>
              </li>
              <li>
                <NavLink to="/privacy" className="text-sm text-surface-400 hover:text-brand-400 transition-colors">
                  Privacy Policy
                </NavLink>
              </li>
              <li>
                <NavLink to="/disclaimer" className="text-sm text-surface-400 hover:text-brand-400 transition-colors">
                  Disclaimer
                </NavLink>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Safety</h4>
            <div className="flex items-start gap-2 p-3 bg-surface-900 rounded-lg border border-surface-800">
              <Shield className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
              <p className="text-xs text-surface-400 leading-relaxed">
                Every script includes an undo file. Nothing is irreversible.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-surface-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-surface-400">
              Fixelo is not affiliated with, endorsed by, or sponsored by Microsoft Corporation.
            </p>
            <p className="text-xs text-surface-400">
              &copy; {new Date().getFullYear()} Fixelo. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}