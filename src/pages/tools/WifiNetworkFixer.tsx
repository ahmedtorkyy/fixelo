import { ToolPageLayout } from "@/components/tools/ToolPageLayout"
import { TOOLS } from "@/lib/toolConfigs"

export default function WifiNetworkFixerPage() {
  return <ToolPageLayout tool={TOOLS["wifi-network-fixer"]} />
}