import { ToolPageLayout } from "@/components/tools/ToolPageLayout"
import { TOOLS } from "@/lib/toolConfigs"

export default function PrinterFixPage() {
  return <ToolPageLayout tool={TOOLS["printer-fix"]} />
}