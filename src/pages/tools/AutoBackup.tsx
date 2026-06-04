import { ToolPageLayout } from "@/components/tools/ToolPageLayout"
import { TOOLS } from "@/lib/toolConfigs"

export default function AutoBackupPage() {
  return <ToolPageLayout tool={TOOLS["auto-backup"]} />
}