import { ToolPageLayout } from "@/components/tools/ToolPageLayout"
import { TOOLS } from "@/lib/toolConfigs"

export default function WindowsUpdateFixerPage() {
  return <ToolPageLayout tool={TOOLS["windows-update-fixer"]} />
}