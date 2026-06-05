import { Link } from "react-router"
import { Wrench, ArrowLeft } from "lucide-react"
import { Button } from "@/components/common/Button"
import { Seo } from "@/components/common/Seo"

export default function NotFoundPage() {
  return (
    <>
    <Seo title="404 — Page Not Found" description="This page doesn't exist. But your Windows problems do — describe them and get a safe fix in seconds." canonical="https://fixelo.pages.dev/404" />
    <div className="max-w-xl mx-auto py-24 px-4 text-center">
      <div className="text-8xl font-bold text-surface-800 mb-2 select-none">404</div>
      <div className="w-16 h-16 bg-brand-600/15 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Wrench className="w-8 h-8 text-brand-400" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-3">Page not found</h1>
      <p className="text-surface-400 mb-8 leading-relaxed">
        This page doesn't exist. But your Windows problems do — let's fix them.
      </p>
      <Link to="/">
        <Button size="lg">
          <ArrowLeft className="w-4 h-4" />
          Back to Homepage
        </Button>
      </Link>
    </div>
    </>
  )
}
