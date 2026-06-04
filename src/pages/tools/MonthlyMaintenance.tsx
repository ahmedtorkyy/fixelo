import { ToolPageLayout } from "@/components/tools/ToolPageLayout"
import { TOOLS } from "@/lib/toolConfigs"

export default function MonthlyMaintenancePage() {
  return <ToolPageLayout tool={TOOLS["monthly-maintenance"]} />
}