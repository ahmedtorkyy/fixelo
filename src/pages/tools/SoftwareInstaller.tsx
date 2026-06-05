import { ToolPageLayout } from "@/components/tools/ToolPageLayout"
import { TOOLS } from "@/lib/toolConfigs"

export default function SoftwareInstallerPage() {
  return <ToolPageLayout tool={TOOLS["software-installer"]} />
}
