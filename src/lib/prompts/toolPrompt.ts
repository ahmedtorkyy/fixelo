import { getSystemPrompt } from "./systemPrompt"
import type { ToolConfig } from "@/lib/toolConfigs"

const DOMAIN_GUIDANCE: Record<string, string> = {
  "Audio":
    "IMPORTANT — For audio fixes: Set-DefaultAudioDevice DOES NOT EXIST. Set-Volume DOES NOT EXIST. " +
    "Get-Process -Name 'System Sounds' DOES NOT EXIST. " +
    "MSiTunes_Sound_Device WMI class DOES NOT EXIST. " +
    "There is NO WMI class for default audio device. " +
    "CORRECT approaches: use Get-PnpDevice -Class Sound to list audio devices. " +
    "To set volume AND verify: $snd = New-Object -ComObject 'WMPlayer.OCX'; $snd.settings.volume = 50; $actual = $snd.settings.volume; if ($actual -eq 50) { Write-Log 'Verified: volume set to 50' 'Green' } else { Write-Log 'Could not verify: volume is $actual' 'Yellow' }. " +
    "To disable audio enhancements (registry with Test-Path): $enhPath = 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Audio\\Enhancements'; if (Test-Path $enhPath) { $current = Get-ItemProperty -Path $enhPath -Name 'Enable' -ErrorAction SilentlyContinue; Set-ItemProperty -Path $enhPath -Name 'Enable' -Value 0 -Type DWord; $check = Get-ItemProperty -Path $enhPath -Name 'Enable' -ErrorAction SilentlyContinue; if ($check.Enable -eq 0) { Write-Log 'Verified: audio enhancements disabled' 'Green' } else { Write-Log 'Could not verify: enhancements still enabled' 'Yellow' } } else { Write-Log 'Audio enhancements registry not found — skipping' 'Yellow' }. " +
    "To restart audio service: Restart-Service -Name Audiosrv -Force. " +
    "To re-register audio DLLs: regsvr32.exe /s %systemroot%\\system32\\*.dll (specific DLLs). " +
    "To guide user to set default device manually: rundll32.exe shell32.dll,Control_RunDLL mmsys.cpl,,0. " +
    "To reset audio devices: Get-PnpDevice -Class Sound | Where-Object {$_.FriendlyName -like '*Realtek*'} | Disable-PnpDevice -Confirm:$false. " +
    "Do NOT make up cmdlet names or WMI class names.",
  "Network":
    "For network/WiFi fixes: use only netsh, ipconfig, Get-NetAdapter, Restart-NetAdapter, " +
    "Get-DnsClientServerAddress, Set-DnsClientServerAddress, New-NetIPAddress, Remove-NetIPAddress. " +
    "netsh wlan show profiles / netsh wlan delete profile for WiFi networks. " +
    "ipconfig /flushdns /renew /release work in PowerShell too. " +
    "Get-NetConnectionProfile for network category.",
  "Printer":
    "For printer fixes: Get-Printer, Set-Printer, Remove-Printer, Add-Printer, " +
    "Restart-Service -Name Spooler, Get-PrintJob, Remove-PrintJob. " +
    "pnputil for driver management.",
  "USB":
    "For USB fixes: Get-PnpDevice, Disable-PnpDevice, Enable-PnpDevice, Restart-PnpDevice, " +
    "pnputil /scan-devices, pnputil /remove-device. " +
    "Get-CimInstance Win32_USBControllerDevice.",
  "Disk":
    "For disk/drive fixes: Get-Volume, Optimize-Volume, Repair-Volume, chkdsk, " +
    "Get-PhysicalDisk, Get-StorageJob. " +
    "Never use Format-Volume without explicit user confirmation.",
  "Display":
    "For display/resolution fixes: Set-DisplayResolution DOES NOT EXIST. " +
    "CORRECT: Use ChangeScreenResolution.exe (download from github) or " +
    "Register an executable via scheduled task. " +
    "For DPI/font scaling: Set-ItemProperty in registry under HKCU:\\Control Panel\\Desktop. " +
    "For multiple monitors: DisplaySwitch.exe /internal /external /extend /clone.",
  "Performance":
    "For performance fixes: " +
    "REAL cmdlets: powercfg /setactive, Get-CimInstance Win32_StartupCommand, " +
    "Remove-ItemProperty (registry for disabling startups), " +
    "Get-ChildItem + Remove-Item (temp files, use -ErrorAction SilentlyContinue), " +
    "Clear-RecycleBin, Get-Service, Set-Service, " +
    "Get-Process, Stop-Process, Disable-ScheduledTask, Enable-ScheduledTask, " +
    "Set-ItemProperty (registry). " +
    "powercfg /setactive SCHEME_MIN for power saver, SCHEME_MAX for high performance. " +
    "FORBIDDEN (DO NOT USE — these do not exist or don't work): " +
    "Get-Startups, Disable-StartupProgram, Get-TempFiles, Get-SystemCaches, " +
    "Clear-SystemCache, Set-PowerPlan, Disable-VisualEffects, Empty-RecycleBin. " +
    ".Delete() on CIM objects, .Activate() on Win32_PowerPlan. " +
    "USE INSTEAD: " +
    "To disable startups: Get-CimInstance Win32_StartupCommand then Remove-ItemProperty on its Location path. " +
    "Do NOT call .Delete() on CIM — use Remove-ItemProperty on registry. " +
    "For power plan: powercfg /setactive SCHEME_MAX — do NOT use Get-CimInstance Win32_PowerPlan. " +
    "For temp files: Get-ChildItem -Path \"$env:TEMP\" -File | Remove-Item -Force -ErrorAction SilentlyContinue. " +
    "For recycle bin: Clear-RecycleBin -Force. " +
    "IMPORTANT string interpolation: use \"$($object.Property)\" NOT \"$object.Property\". " +
    "IMPORTANT error handling: use \"$($Error[0].Exception.Message)\" NOT \"$($Error[0].Message)\".",
  "Privacy":
    "For privacy/security fixes: reg.exe, Get-Service, Set-Service, " +
    "Set-ItemProperty, Remove-ItemProperty, schtasks.exe. " +
    "Disable telemetry via registry, stop DiagTrack service, " +
    "block tracking domains via hosts file or firewall rules.",
  "Customization":
    "For customization: reg.exe, Set-ItemProperty, New-ItemProperty. " +
    "Use Test-Path before accessing registry keys. " +
    "Do not create keys that don't already exist — the user didn't ask for new settings.",
  "Automation":
    "For automation: schtasks.exe, Register-ScheduledTask, Set-ScheduledTask, " +
    "Unregister-ScheduledTask, Start-ScheduledTask, Stop-ScheduledTask. " +
    "New-ScheduledTaskTrigger, New-ScheduledTaskAction, New-ScheduledTaskPrincipal.",
  "Setup":
    "For setup/installation: winget install, winget uninstall, winget list, " +
    "reg.exe for registry, Set-ItemProperty for settings. " +
    "Use $env:USERPROFILE, $env:APPDATA, $env:LOCALAPPDATA for user paths.",
}

function getDomainGuidance(tool: ToolConfig): string {
  const title = tool.title.toLowerCase()
  const category = tool.category.toLowerCase()

  if (title.includes("audio") || title.includes("sound")) return DOMAIN_GUIDANCE["Audio"]
  if (title.includes("wifi") || title.includes("network") || title.includes("wlan")) return DOMAIN_GUIDANCE["Network"]
  if (title.includes("printer")) return DOMAIN_GUIDANCE["Printer"]
  if (title.includes("usb")) return DOMAIN_GUIDANCE["USB"]
  if (title.includes("disk") || title.includes("drive") || title.includes("corrupted")) return DOMAIN_GUIDANCE["Disk"]
  if (title.includes("display") || title.includes("resolution")) return DOMAIN_GUIDANCE["Display"]
  if (category.includes("performance")) return DOMAIN_GUIDANCE["Performance"]
  if (category.includes("privacy") || category.includes("security")) return DOMAIN_GUIDANCE["Privacy"]
  if (category.includes("customization")) return DOMAIN_GUIDANCE["Customization"]
  if (category.includes("automation")) return DOMAIN_GUIDANCE["Automation"]
  if (category.includes("setup") || category.includes("installation")) return DOMAIN_GUIDANCE["Setup"]
  return ""
}

export function buildToolPrompt(tool: ToolConfig, selectedOptions: string[], inputValues?: Record<string, string>): string {
  const selectedItems = tool.options
    .filter((opt) => selectedOptions.includes(opt.id))
    .map((opt) => `- ${opt.label}: ${opt.description}`)

  const unselectedItems = tool.options
    .filter((opt) => !selectedOptions.includes(opt.id) && opt.type !== "text" && opt.type !== "time")
    .map((opt) => `- NOT ${opt.label}`)

  const inputItems = tool.options
    .filter((opt) => opt.type === "text" || opt.type === "time")
    .map((opt) => {
      const value = inputValues?.[opt.id] || opt.inputDefaultValue || opt.placeholder || ""
      return `- ${opt.label}: ${value || "(not specified)"}`
    })

  const domainGuidance = getDomainGuidance(tool)

  return `${getSystemPrompt()}

The user is using the "${tool.title}" tool from Fixelo. This tool ${tool.longDescription}

The user has selected the following options:
${selectedItems.join("\n")}

The user has provided these specific values:
${inputItems.join("\n")}

The user has NOT selected these options (do NOT include these in the script):
${unselectedItems.join("\n")}

${domainGuidance}

If the user specified a time, use that exact time in the scheduled task. If the user specified folder paths, use those exact paths in the script. If a path was not specified, use reasonable defaults like $env:USERPROFILE\\Documents.

Generate a BAT file that implements ONLY the selected options. The script must:
1. Follow ALL the safety rules from the system prompt
2. Use the __PSSCRIPT__ format for the BAT file
3. Implement each selected option as a clearly separated step with friendly progress messages
4. Include a complete undo script that reverses every change
5. Be specific to the selected options — do not add anything the user did not select

Respond with ONLY the JSON object with the same format as a fix response:
{
  "problemSummary": "Summary of what this tool will do",
  "whatItDoes": "Step by step explanation of each selected optimization",
  "whatItDoesNotTouch": "Clear statement of what is NOT modified",
  "fixScript": "Complete BAT file content using the __PSSCRIPT__ format",
  "undoScript": "Complete BAT file that reverses all changes",
  "scriptSafetyNotes": "Important warnings or notes"
}

Respond with ONLY the JSON object. No other text. No preamble, no explanation, no markdown. Start with { and end with }.`
}
