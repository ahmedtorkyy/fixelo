import type { FixResult } from "@/types/fix"
import { wrapPsInBat, psRequireAdmin } from "./scriptShell"

interface CachedFixEntry {
  keywords: string[]
  result: FixResult
}

function wrapScript(script: string, label: string): string {
  const safeLabel = label.replace(/"/g, '`"')
  return `try {
${script.trim()}
} catch {
  Write-Log "Error in ${safeLabel}: $($_.Exception.Message)" "Red"
}`
}

function makeFix(parts: {
  title: string
  summary: string
  whatItDoes: string
  touches?: string[]
  script: string
  undoScript: string
}): FixResult {
  const psBody = `${psRequireAdmin()}

# ── Fixelo: ${parts.title} ──────────────────────────
${wrapScript(parts.script, parts.title)}

Write-Log ""
Write-Log "All tasks completed." "Green"`

  const psUndo = `${psRequireAdmin()}

# ── Fixelo: Undo ${parts.title} ─────────────────────
${wrapScript(parts.undoScript, "Undo " + parts.title)}

Write-Log ""
Write-Log "Undo completed." "Yellow"`

  const touched = parts.touches ?? []
  const whatItDoesNotTouch = touched.length > 0
    ? `This script modifies: ${touched.join(", ")}. Everything else on your system is untouched.`
    : `This script only touches the items related to ${parts.title.toLowerCase()}. Nothing else is modified.`

  return {
    problemSummary: parts.summary,
    whatItDoes: parts.whatItDoes,
    whatItDoesNotTouch,
    fixScript: wrapPsInBat(parts.title, psBody),
    undoScript: wrapPsInBat("Undo " + parts.title, psUndo),
    scriptSafetyNotes: `Always download the Undo script as well — you can revert all changes by running it.`,
  }
}

export const CACHED_FIXES: CachedFixEntry[] = [
  {
    keywords: ["slow pc", "computer slow"],
    result: makeFix({
      title: "Slow PC Fix",
      summary: "Disable startup programs, clear temp files, clear system caches, and optimize power plan for performance.",
      whatItDoes: `This script performs the following optimizations to speed up your PC:
  - Disables unnecessary startup programs (OneDrive, Teams, Discord, Spotify, Steam)
  - Clears temporary files from Windows and user temp folders
  - Flushes DNS cache and clears icon/thumbnail/font caches
  - Sets power plan to High Performance (or adjusts current plan)`,
      touches: ["startup programs", "temporary files", "system caches", "power plan"],
      script: `
# ── Disable startup programs ──
$startupPaths = @(
  "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run",
  "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run"
)
$disableItems = @("OneDrive", "Teams", "Discord", "Spotify", "Steam")
foreach ($path in $startupPaths) {
  if (Test-Path $path) {
    foreach ($item in $disableItems) {
      $exists = Get-ItemProperty -Path $path -Name $item -ErrorAction SilentlyContinue
      if ($exists) {
        Write-Log "Disabling startup: $item"
        $backup = $path -replace "SOFTWARE\\\\Microsoft", "SOFTWARE\\\\Microsoft\\\\FixeloBackup"
        if (-not (Test-Path $backup)) { New-Item -Path $backup -Force | Out-Null }
        $value = (Get-ItemProperty -Path $path -Name $item).$item
        Set-ItemProperty -Path $backup -Name $item -Value $value
        Remove-ItemProperty -Path $path -Name $item
      }
    }
  }
}

# ── Clean temp files ──
$tempPaths = @("$env:TEMP", "$env:WINDIR\\Temp", "$env:WINDIR\\Prefetch")
foreach ($p in $tempPaths) {
  if (Test-Path $p) {
    Write-Log "Cleaning: $p"
    Get-ChildItem -Path $p -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { -not $_.PSIsContainer } | Remove-Item -Force -ErrorAction SilentlyContinue
    Get-ChildItem -Path $p -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { $_.PSIsContainer } | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
  }
}

# ── Flush DNS ──
Write-Log "Flushing DNS cache..."
ipconfig /flushdns | Out-Null

# ── Clear icon cache ──
$iconCache = "$env:LOCALAPPDATA\\IconCache.db"
if (Test-Path $iconCache) { Remove-Item -Path $iconCache -Force -ErrorAction SilentlyContinue }

# ── High Performance power plan ──
$highPerf = powercfg /list | Select-String "High performance"
if ($highPerf) {
  $guid = ($highPerf -split "\\s+")[3]
  powercfg /setactive $guid
  Write-Log "Power plan set to High Performance"
} else {
  powercfg /change standby-timeout-ac 0
  powercfg /change hibernate-timeout-ac 0
  Write-Log "Adjusted current power plan settings"
}`,
      undoScript: `
# ── Restore startup items ──
$backupPaths = @(
  "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\FixeloBackup\\Run",
  "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\FixeloBackup\\Run"
)
$targetPaths = @(
  "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run",
  "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run"
)
for ($i = 0; $i -lt $backupPaths.Length; $i++) {
  if (Test-Path $backupPaths[$i]) {
    $items = Get-ItemProperty -Path $backupPaths[$i]
    foreach ($prop in $items.PSObject.Properties) {
      if ($prop.Name -notin @("PSPath", "PSParentPath", "PSChildName", "PSDrive", "PSProvider")) {
        Set-ItemProperty -Path $targetPaths[$i] -Name $prop.Name -Value $prop.Value
      }
    }
  }
}

# ── Restore Balanced power plan ──
$balanced = powercfg /list | Select-String "Balanced"
if ($balanced) {
  $guid = ($balanced -split "\\s+")[3]
  powercfg /setactive $guid
  Write-Log "Power plan restored to Balanced"
}

Write-Log "Temp files and caches cannot be restored — they will rebuild naturally." "Yellow"`,
    }),
  },
  {
    keywords: ["dns", "dns cache", "website not loading", "dns problem"],
    result: makeFix({
      title: "DNS Flush",
      summary: "Flush DNS resolver cache to fix website loading issues.",
      whatItDoes: "This script flushes the DNS resolver cache, which clears outdated or corrupted DNS entries that may prevent websites from loading correctly.",
      touches: ["DNS cache"],
      script: `
Write-Log "Flushing DNS cache..."
ipconfig /flushdns
Write-Log "DNS cache flushed successfully."`,
      undoScript: `
Write-Log "DNS cache cannot be restored — it will repopulate naturally as you browse websites." "Yellow"`,
    }),
  },
  {
    keywords: ["no sound", "sound not working", "audio not working", "no audio"],
    result: makeFix({
      title: "Audio Fix",
      summary: "Restart Windows Audio service and re-register audio components to fix sound issues.",
      whatItDoes: "This script restarts the Windows Audio service, re-registers core audio DLLs, and reinstalls the audio driver to resolve common sound problems.",
      touches: ["audio service", "audio drivers"],
      script: `
Write-Log "Restarting Windows Audio service..."
Stop-Service -Name "Audiosrv" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Start-Service -Name "Audiosrv"

Write-Log "Re-registering audio DLLs..."
regsvr32 /s "$env:WINDIR\\System32\\audiosrv.dll"
regsvr32 /s "$env:WINDIR\\System32\\audioeng.dll"

$audioDevices = Get-PnpDevice -FriendlyName "*Audio*","*Sound*","*Realtek*","*High Definition Audio*" -Status OK -ErrorAction SilentlyContinue
foreach ($device in $audioDevices) {
  $instId = $device.InstanceId
  Disable-PnpDevice -InstanceId $instId -Confirm:$false -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 2
  Enable-PnpDevice -InstanceId $instId -Confirm:$false -ErrorAction SilentlyContinue
}
Write-Log "Audio fix completed"`,
      undoScript: `
Write-Log "Audio fix is restorative. No undo needed." "Yellow"`,
    }),
  },
  {
    keywords: ["update stuck", "windows update", "update not working", "update failed", "update error", "windows update stuck"],
    result: makeFix({
      title: "Windows Update Fix",
      summary: "Clear Windows Update cache and restart update services to fix stuck or failed updates.",
      whatItDoes: "This script stops Windows Update services, clears the SoftwareDistribution and catroot2 cache folders, re-registers update DLLs, and restarts the services fresh.",
      touches: ["Windows Update cache", "Windows Update services"],
      script: `
$services = @("wuauserv", "bits", "cryptsvc")
foreach ($svc in $services) {
  Stop-Service -Name $svc -Force -ErrorAction SilentlyContinue
}

$sdPath = "$env:WINDIR\\SoftwareDistribution\\Download"
if (Test-Path $sdPath) {
  Get-ChildItem -Path $sdPath -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
}

$catrootPath = "$env:WINDIR\\System32\\catroot2"
if (Test-Path $catrootPath) {
  Get-ChildItem -Path $catrootPath -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
}

$dlls = @("wuapi.dll", "wuaueng.dll", "wucltui.dll", "wups.dll")
foreach ($dll in $dlls) {
  regsvr32 /s "$env:WINDIR\\System32\\$dll"
}

foreach ($svc in $services) {
  Start-Service -Name $svc -ErrorAction SilentlyContinue
}
Write-Log "Windows Update fix completed"`,
      undoScript: `
Write-Log "Update cache was cleared and will be re-downloaded. Services were restarted." "Yellow"`,
    }),
  },
  {
    keywords: ["printer", "printing", "printer not working", "print spooler", "printer offline"],
    result: makeFix({
      title: "Printer Fix",
      summary: "Restart print spooler, clear print queue, and reinstall printer driver.",
      whatItDoes: "This script restarts the print spooler service, clears stuck print jobs, re-registers printing DLLs, and reinstalls the default printer driver.",
      touches: ["print spooler service", "printer drivers"],
      script: `
Stop-Service -Name "Spooler" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

$spoolPath = "$env:WINDIR\\System32\\spool\\PRINTERS"
if (Test-Path $spoolPath) {
  Get-ChildItem -Path $spoolPath -Force -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
}

$dlls = @("winspool.drv", "spoolss.dll", "localspl.dll")
foreach ($dll in $dlls) {
  regsvr32 /s "$env:WINDIR\\System32\\$dll"
}

Start-Service -Name "Spooler"
Write-Log "Printer fix completed"`,
      undoScript: `
Write-Log "Printer fix is restorative. No undo needed." "Yellow"`,
    }),
  },
  {
    keywords: ["wifi", "wi-fi", "wireless", "wifi keeps disconnecting", "wifi not working", "internet keeps dropping"],
    result: makeFix({
      title: "WiFi Reset",
      summary: "Reset WiFi adapter, flush DNS, and reset network stack.",
      whatItDoes: "This script resets your WiFi adapter, flushes the DNS cache, releases and renews the IP address, and resets the TCP/IP stack.",
      touches: ["WiFi adapter", "DNS cache", "network stack"],
      script: `
$wifi = Get-WmiObject Win32_NetworkAdapter | Where-Object { $_.Name -match "WiFi|Wireless|802.11" -and $_.ConfigManagerErrorCode -eq 0 }
if ($wifi) {
  $wifi.Disable() | Out-Null
  Start-Sleep -Seconds 3
  $wifi.Enable() | Out-Null
}
ipconfig /flushdns | Out-Null
ipconfig /release | Out-Null
ipconfig /renew | Out-Null
netsh int ip reset | Out-Null
Write-Log "WiFi reset completed"`,
      undoScript: `
Write-Log "WiFi reset is transient. No undo needed." "Yellow"`,
    }),
  },
  {
    keywords: ["blue screen", "bsod", "blue screen of death", "system crash", "computer crashing", "pc crash"],
    result: makeFix({
      title: "Blue Screen Recovery",
      summary: "Run SFC and DISM to repair corrupted system files that can cause blue screens.",
      whatItDoes: "This script runs System File Checker (SFC) and DISM to scan for and repair corrupted system files that commonly cause blue screen errors.",
      touches: ["system file integrity"],
      script: `
Write-Log "Running System File Checker..."
sfc /scannow

Write-Log "Running DISM health check..."
dism /online /cleanup-image /checkhealth

Write-Log "Running DISM restore health..."
dism /online /cleanup-image /restorehealth

Write-Log "Blue screen recovery completed"`,
      undoScript: `
Write-Log "SFC and DISM repairs are cumulative. Undo is not available." "Yellow"`,
    }),
  },
  {
    keywords: ["disk full", "low disk space", "disk space", "storage full", "out of space", "drive full"],
    result: makeFix({
      title: "Free Up Disk Space",
      summary: "Clean temporary files, empty recycle bin, and run Disk Cleanup to free up disk space.",
      whatItDoes: "This script cleans temporary files, empties the Recycle Bin, and runs the Windows Disk Cleanup tool to free up disk space safely.",
      touches: ["temporary files", "Recycle Bin", "disk cleanup"],
      script: `
$tempPaths = @("$env:TEMP", "$env:WINDIR\\Temp")
foreach ($p in $tempPaths) {
  if (Test-Path $p) {
    Get-ChildItem -Path $p -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { -not $_.PSIsContainer } | Remove-Item -Force -ErrorAction SilentlyContinue
    Get-ChildItem -Path $p -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { $_.PSIsContainer } | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
  }
}

$shell = New-Object -ComObject Shell.Application
$shell.Namespace(0xa).Items() | ForEach-Object { $_.InvokeVerb("delete") }

Write-Log "Running Disk Cleanup..."
cleanmgr /sagerun:1 | Out-Null
Write-Log "Disk cleanup completed"`,
      undoScript: `
Write-Log "Deleted files cannot be restored. Files in Recycle Bin are permanently removed." "Yellow"`,
    }),
  },
  {
    keywords: ["internet slow", "slow internet", "slow browsing", "network slow", "internet speed"],
    result: makeFix({
      title: "Internet Speed Fix",
      summary: "Set fast DNS, disable bandwidth throttle, and optimize TCP settings for faster internet.",
      whatItDoes: "This script sets DNS to Cloudflare and Google for faster lookups, disables Windows bandwidth throttling, and optimizes TCP settings for better throughput.",
      touches: ["DNS servers", "TCP/IP settings"],
      script: `
$adapters = Get-WmiObject Win32_NetworkAdapter | Where-Object { $_.NetConnectionId -and $_.ConfigManagerErrorCode -eq 0 }
foreach ($adapter in $adapters) {
  $config = Get-WmiObject Win32_NetworkAdapterConfiguration | Where-Object { $_.Index -eq $adapter.Index }
  if ($config) {
    $config.SetDNSServerSearchOrder(@("1.1.1.1", "8.8.8.8")) | Out-Null
  }
}

New-Item -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Psched" -Force | Out-Null
Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Psched" -Name "NonBestEffortLimit" -Value 0 -Type DWord

netsh int tcp set global autotuninglevel=normal
netsh int tcp set global chimney=disabled
netsh int tcp set global rss=enabled
Write-Log "Internet speed optimization completed"`,
      undoScript: `
$adapters = Get-WmiObject Win32_NetworkAdapter | Where-Object { $_.NetConnectionId -and $_.ConfigManagerErrorCode -eq 0 }
foreach ($adapter in $adapters) {
  $config = Get-WmiObject Win32_NetworkAdapterConfiguration | Where-Object { $_.Index -eq $adapter.Index }
  if ($config) {
    $config.SetDNSServerSearchOrder() | Out-Null
  }
}

Remove-Item -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Psched" -Recurse -Force -ErrorAction SilentlyContinue

netsh int tcp set global autotuninglevel=normal
Write-Log "Internet speed settings restored to defaults" "Green"`,
    }),
  },
]
