import { ToolPageLayout } from "@/components/tools/ToolPageLayout"
import { TOOLS } from "@/lib/toolConfigs"

export default function AutoShutdownPage() {
  return <ToolPageLayout tool={TOOLS["auto-shutdown"]} />
}