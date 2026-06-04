import { Outlet, useLocation } from "react-router"
import { Header } from "./Header"
import { Footer } from "./Footer"
import { ToastContainer } from "@/components/common/Toast"

export function Layout() {
  const location = useLocation()
  const isAgent = location.pathname === "/agent"

  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-brand-600 focus:text-white focus:font-medium focus:shadow-lg"
      >
        Skip to main content
      </a>
      <Header />
      <main
        id="main"
        tabIndex={-1}
        key={location.pathname}
        className={`flex-1 page-enter outline-none ${isAgent ? "overflow-hidden" : ""}`}
      >
        <Outlet />
      </main>
      {!isAgent && <Footer />}
      <ToastContainer />
    </div>
  )
}
