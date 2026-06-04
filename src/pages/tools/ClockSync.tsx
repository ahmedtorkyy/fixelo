import { ToolPageLayout } from "@/components/tools/ToolPageLayout"
import { TOOLS } from "@/lib/toolConfigs"

export default function ClockSyncPage() {
  return <ToolPageLayout tool={TOOLS["clock-sync"]} />
}
