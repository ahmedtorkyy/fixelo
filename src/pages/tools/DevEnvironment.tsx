import { ToolPageLayout } from "@/components/tools/ToolPageLayout"
import { TOOLS } from "@/lib/toolConfigs"

export default function DevEnvironmentPage() {
  return <ToolPageLayout tool={TOOLS["dev-environment"]} />
}