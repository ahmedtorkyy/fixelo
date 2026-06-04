import { ToolPageLayout } from "@/components/tools/ToolPageLayout"
import { TOOLS } from "@/lib/toolConfigs"

export default function WingetInstallerPage() {
  return <ToolPageLayout tool={TOOLS["winget-installer"]} />
}