import { ToolPageLayout } from "@/components/tools/ToolPageLayout"
import { TOOLS } from "@/lib/toolConfigs"

export default function SystemTweaksPage() {
  return <ToolPageLayout tool={TOOLS["system-tweaks"]} />
}
