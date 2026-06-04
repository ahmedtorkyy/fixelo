import { ToolPageLayout } from "@/components/tools/ToolPageLayout"
import { TOOLS } from "@/lib/toolConfigs"

export default function CorruptedFilesFixPage() {
  return <ToolPageLayout tool={TOOLS["corrupted-files-fix"]} />
}