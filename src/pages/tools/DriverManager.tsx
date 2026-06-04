import { ToolPageLayout } from "@/components/tools/ToolPageLayout"
import { TOOLS } from "@/lib/toolConfigs"

export default function DriverManagerPage() {
  return <ToolPageLayout tool={TOOLS["driver-manager"]} />
}