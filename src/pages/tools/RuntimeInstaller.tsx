import { ToolPageLayout } from "@/components/tools/ToolPageLayout"
import { TOOLS } from "@/lib/toolConfigs"

export default function RuntimeInstallerPage() {
  return <ToolPageLayout tool={TOOLS["runtime-installer"]} />
}
