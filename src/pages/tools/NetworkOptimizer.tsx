import { ToolPageLayout } from "@/components/tools/ToolPageLayout"
import { TOOLS } from "@/lib/toolConfigs"

export default function NetworkOptimizerPage() {
  return <ToolPageLayout tool={TOOLS["network-optimizer"]} />
}