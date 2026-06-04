import { ToolPageLayout } from "@/components/tools/ToolPageLayout"
import { TOOLS } from "@/lib/toolConfigs"

export default function USBDeviceFixPage() {
  return <ToolPageLayout tool={TOOLS["usb-device-fix"]} />
}