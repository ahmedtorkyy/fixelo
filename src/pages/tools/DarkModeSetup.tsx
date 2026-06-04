import { ToolPageLayout } from "@/components/tools/ToolPageLayout"
import { TOOLS } from "@/lib/toolConfigs"

export default function DarkModeSetupPage() {
  return <ToolPageLayout tool={TOOLS["dark-mode-setup"]} />
}