import { ToolPageLayout } from "@/components/tools/ToolPageLayout"
import { TOOLS } from "@/lib/toolConfigs"

export default function BatteryOptimizerPage() {
  return <ToolPageLayout tool={TOOLS["battery-optimizer"]} />
}