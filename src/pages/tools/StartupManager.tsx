import { ToolPageLayout } from "@/components/tools/ToolPageLayout"
import { TOOLS } from "@/lib/toolConfigs"

export default function StartupManagerPage() {
  return <ToolPageLayout tool={TOOLS["startup-manager"]} />
}