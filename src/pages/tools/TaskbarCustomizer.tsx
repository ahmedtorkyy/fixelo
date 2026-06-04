import { ToolPageLayout } from "@/components/tools/ToolPageLayout"
import { TOOLS } from "@/lib/toolConfigs"

export default function TaskbarCustomizerPage() {
  return <ToolPageLayout tool={TOOLS["taskbar-customizer"]} />
}