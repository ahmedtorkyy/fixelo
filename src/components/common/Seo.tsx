import { Helmet } from "react-helmet-async"

interface SeoProps {
  title: string
  description: string
  canonical?: string
  jsonLd?: Record<string, unknown>
}

const SITE_NAME = "Fixelo"
const SITE_URL = "https://fixelo.pages.dev"

export function Seo({ title, description, canonical, jsonLd }: SeoProps) {
  const fullTitle = `${title} | ${SITE_NAME}`
  const url = canonical || SITE_URL
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <link rel="canonical" href={url} />
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  )
}
