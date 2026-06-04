export interface ToolBlock {
  id: string
  label: string
  script: string
  undoScript: string
  description: string
  type?: "text" | "time"
  touches?: string[]
}

export const TOOL_BLOCKS: Record<string, ToolBlock[]> = {
  "slow-pc-fix": [
    {
      id: "clean-startup",
      label: "Clean Startup Programs",
      description: "Disables common unnecessary startup programs to speed up boot time",
      script: `
# Disable common startup items via registry
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
        $check = Get-ItemProperty -Path $path -Name $item -ErrorAction SilentlyContinue
        if (-not $check) { Write-Log "Verified: $item removed from startup" "Green" }
        else { Write-Log "Warning: $item still present in startup" "Yellow" }
      }
    }
  }
}`,
      undoScript: `
# Restore startup items from backup
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
}`,
    },
    {
      id: "clear-temp",
      label: "Clear Temporary Files",
      description: "Deletes all temporary files from Windows and user temp folders",
      script: `
# Clean temporary files
$tempPaths = @(
  "$env:TEMP",
  "$env:WINDIR\\Temp",
  "$env:WINDIR\\Prefetch"
)
foreach ($p in $tempPaths) {
  if (Test-Path $p) {
    Write-Log "Cleaning: $p"
    Get-ChildItem -Path $p -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { -not $_.PSIsContainer } | Remove-Item -Force -ErrorAction SilentlyContinue
    Get-ChildItem -Path $p -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { $_.PSIsContainer } | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
  }
}`,
      undoScript: `
# Temp files cannot be restored — log that nothing was done
Write-Log "Temporary file cleanup cannot be undone. Deleted files are gone permanently." "Yellow"`,
    },
    {
      id: "clear-caches",
      label: "Clear System Caches",
      description: "Clears DNS, icon, thumbnail, and font caches",
      script: `
# Flush DNS cache
Write-Log "Flushing DNS cache..."
ipconfig /flushdns | Out-Null
$dnsCheck = ipconfig /displaydns
if ($dnsCheck -match "No DNS") { Write-Log "Verified: DNS cache cleared" "Green" }
else { Write-Log "DNS cache may not be fully cleared" "Yellow" }

# Clear icon cache
$iconCache = "$env:LOCALAPPDATA\\IconCache.db"
if (Test-Path $iconCache) {
  Remove-Item -Path $iconCache -Force -ErrorAction SilentlyContinue
  if (-not (Test-Path $iconCache)) { Write-Log "Verified: Icon cache removed" "Green" }
  else { Write-Log "Could not verify: Icon cache still present" "Yellow" }
}

# Stop explorer to clear thumbnail cache
Get-Process explorer -ErrorAction SilentlyContinue | Stop-Process -Force

# Clear font cache
$fontCache = "$env:WINDIR\\ServiceProfiles\\LocalService\\AppData\\Local\\FontCache"
if (Test-Path $fontCache) {
  Remove-Item -Path "$fontCache\\*" -Recurse -Force -ErrorAction SilentlyContinue
  $fontItems = Get-ChildItem -Path $fontCache -ErrorAction SilentlyContinue
  if (-not $fontItems) { Write-Log "Verified: Font cache cleared" "Green" }
  else { Write-Log "Could not verify: some font cache items remain" "Yellow" }
}

# Restart explorer
Start-Process explorer`,
      undoScript: `
# Caches will rebuild naturally — nothing to restore
Write-Log "System caches will be rebuilt automatically by Windows." "Yellow"`,
    },
    {
      id: "perf-power",
      label: "Set High Performance Power Plan",
      description: "Switches power plan to High Performance for maximum speed",
      script: `
# Set power plan to High Performance
$highPerf = powercfg /list | Select-String "High performance"
if ($highPerf) {
  $guid = ($highPerf -split "\\s+")[3]
  powercfg /setactive $guid
  Write-Log "Power plan set to High Performance"
  $activeCheck = powercfg /getactivescheme
  if ($activeCheck -match $guid) { Write-Log "Verified: High Performance plan active" "Green" }
  else { Write-Log "Could not verify: High Performance plan not active" "Yellow" }
} else {
  powercfg /change standby-timeout-ac 0
  powercfg /change hibernate-timeout-ac 0
  powercfg /change standby-timeout-dc 30
  Write-Log "High Performance plan not found; adjusted current plan settings"
}`,
      undoScript: `
# Restore Balanced power plan
$balanced = powercfg /list | Select-String "Balanced"
if ($balanced) {
  $guid = ($balanced -split "\\s+")[3]
  powercfg /setactive $guid
  Write-Log "Power plan restored to Balanced"
}`,
    },
    {
      id: "disable-effects",
      label: "Disable Visual Effects",
      description: "Turns off unnecessary animations and visual effects for faster response",
      script: `
# Disable visual effects for performance
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects" -Name "VisualFXSetting" -Value 2 -Type DWord

# Disable specific animations
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "TaskbarAnimations" -Value 0 -Type DWord
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "EnableLivePreview" -Value 0 -Type DWord

# Verify changes
$vfx = (Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects" -Name "VisualFXSetting" -ErrorAction SilentlyContinue).VisualFXSetting
if ($vfx -eq 2) { Write-Log "Verified: VisualFXSetting applied" "Green" }
else { Write-Log "Could not verify: VisualFXSetting is $vfx" "Yellow" }

$taskbar = (Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "TaskbarAnimations" -ErrorAction SilentlyContinue).TaskbarAnimations
if ($taskbar -eq 0) { Write-Log "Verified: TaskbarAnimations disabled" "Green" }
else { Write-Log "Could not verify: TaskbarAnimations is $taskbar" "Yellow" }

$livePreview = (Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "EnableLivePreview" -ErrorAction SilentlyContinue).EnableLivePreview
if ($livePreview -eq 0) { Write-Log "Verified: EnableLivePreview disabled" "Green" }
else { Write-Log "Could not verify: EnableLivePreview is $livePreview" "Yellow" }`,
      undoScript: `
# Restore default visual effects
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects" -Name "VisualFXSetting" -Value 0 -Type DWord
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "TaskbarAnimations" -Value 1 -Type DWord
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "EnableLivePreview" -Value 1 -Type DWord
$vfx = (Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects" -Name "VisualFXSetting" -ErrorAction SilentlyContinue).VisualFXSetting
if ($vfx -eq 0) { Write-Log "Verified: VisualFXSetting restored" "Green" }
else { Write-Log "Could not verify: VisualFXSetting is $vfx" "Yellow" }`,
    },
    {
      id: "empty-recycle",
      label: "Empty Recycle Bin",
      description: "Permanently deletes all files in the Recycle Bin to free disk space",
      script: `
# Empty Recycle Bin using Shell.Application COM object
$shell = New-Object -ComObject Shell.Application
$shell.Namespace(0xa).Items() | ForEach-Object { $_.InvokeVerb("delete") }
$remaining = $shell.Namespace(0xa).Items().Count
if ($remaining -eq 0) { Write-Log "Verified: Recycle Bin emptied" "Green" }
else { Write-Log "Could not verify: $remaining item(s) remain in Recycle Bin" "Yellow" }`,
      undoScript: `
# Recycle Bin contents cannot be restored
Write-Log "Recycle Bin emptying cannot be undone. Deleted files are gone permanently." "Yellow"`,
    },
  ],

  "gaming-boost": [
    {
      id: "game-mode",
      label: "Enable Game Mode",
      description: "Turns on Windows Game Mode to prioritize gaming resources",
      script: `
# Enable Game Mode via registry
New-Item -Path "HKCU:\\Software\\Microsoft\\GameBar" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\GameBar" -Name "AllowAutoGameMode" -Value 1 -Type DWord
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\GameBar" -Name "AutoGameModeEnabled" -Value 1 -Type DWord
Write-Log "Game Mode enabled"`,
      undoScript: `
# Disable Game Mode
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\GameBar" -Name "AllowAutoGameMode" -Value 0 -Type DWord
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\GameBar" -Name "AutoGameModeEnabled" -Value 0 -Type DWord
Write-Log "Game Mode disabled"`,
    },
    {
      id: "gpu-max",
      label: "Set GPU to Max Performance",
      description: "Sets GPU power plan to maximum performance for best frame rates",
      script: `
# Set GPU to high performance via registry
# NVIDIA: prefer maximum performance
New-Item -Path "HKCU:\\SOFTWARE\\NVIDIA Corporation\\Global\\NvCplApi\\PKeys" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\NVIDIA Corporation\\Global\\NvCplApi\\PKeys" -Name "PerfBoost" -Value 1 -Type DWord

# Windows: prefer high performance GPU
$gpuPaths = Get-ChildItem "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}" -ErrorAction SilentlyContinue
foreach ($gpu in $gpuPaths) {
  $gpuPath = $gpu.PSPath
  if (Test-Path "$gpuPath\\PowerManagementConfig") {
    Set-ItemProperty -Path "$gpuPath\\PowerManagementConfig" -Name "PowerSettings" -Value 0 -Type DWord -ErrorAction SilentlyContinue
  }
}
Write-Log "GPU set to maximum performance"`,
      undoScript: `
# Restore GPU power management defaults
$gpuPaths = Get-ChildItem "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}" -ErrorAction SilentlyContinue
foreach ($gpu in $gpuPaths) {
  $gpuPath = $gpu.PSPath
  if (Test-Path "$gpuPath\\PowerManagementConfig") {
    Remove-ItemProperty -Path "$gpuPath\\PowerManagementConfig" -Name "PowerSettings" -ErrorAction SilentlyContinue
  }
}
Write-Log "GPU power management restored to default"`,
    },
    {
      id: "network-low-latency",
      label: "Optimize Network for Low Latency",
      description: "Disables Nagle's algorithm and optimizes TCP for gaming",
      script: `
# Disable Nagle's algorithm for all interfaces
$interfaces = Get-ItemProperty "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces\\*"
foreach ($iface in $interfaces) {
  $path = $iface.PSPath
  Set-ItemProperty -Path $path -Name "TcpAckFrequency" -Value 1 -Type DWord -ErrorAction SilentlyContinue
  Set-ItemProperty -Path $path -Name "TCPNoDelay" -Value 1 -Type DWord -ErrorAction SilentlyContinue
}

# Optimize TCP global parameters
netsh int tcp set global autotuninglevel=normal
netsh int tcp set global chimney=disabled
netsh int tcp set global rss=enabled
Write-Log "Network optimized for low latency"`,
      undoScript: `
# Restore TCP defaults
$interfaces = Get-ItemProperty "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces\\*"
foreach ($iface in $interfaces) {
  $path = $iface.PSPath
  Remove-ItemProperty -Path $path -Name "TcpAckFrequency" -ErrorAction SilentlyContinue
  Remove-ItemProperty -Path $path -Name "TCPNoDelay" -ErrorAction SilentlyContinue
}
netsh int tcp set global autotuninglevel=normal
netsh int tcp set global chimney=enabled
netsh int tcp set global rss=default
Write-Log "TCP settings restored to defaults"`,
    },
    {
      id: "high-perf-power",
      label: "Set Power Plan to High Performance",
      description: "Switches Windows power plan to maximum performance mode",
      script: `
# Set power plan to High Performance
$highPerf = powercfg /list | Select-String "High performance"
if ($highPerf) {
  $guid = ($highPerf -split "\\s+")[3]
  powercfg /setactive $guid
  Write-Log "Power plan set to High Performance"
} else {
  powercfg /change standby-timeout-ac 0
  powercfg /change hibernate-timeout-ac 0
  Write-Log "High Performance plan not found; adjusted current plan"
}`,
      undoScript: `
# Restore Balanced power plan
$balanced = powercfg /list | Select-String "Balanced"
if ($balanced) {
  $guid = ($balanced -split "\\s+")[3]
  powercfg /setactive $guid
  Write-Log "Power plan restored to Balanced"
}`,
    },
    {
      id: "disable-game-bar",
      label: "Disable Xbox Game Bar",
      description: "Removes the Game Bar overlay which can cause FPS drops",
      script: `
# Disable Xbox Game Bar
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR" -Name "AppCaptureEnabled" -Value 0 -Type DWord -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR" -Name "HistoricalCaptureEnabled" -Value 0 -Type DWord -ErrorAction SilentlyContinue
New-Item -Path "HKCU:\\Software\\Microsoft\\GameBar" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\GameBar" -Name "ShowStartupPanel" -Value 0 -Type DWord -ErrorAction SilentlyContinue
Write-Log "Xbox Game Bar disabled"`,
      undoScript: `
# Re-enable Xbox Game Bar
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR" -Name "AppCaptureEnabled" -Value 1 -Type DWord -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR" -Name "HistoricalCaptureEnabled" -Value 1 -Type DWord -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\GameBar" -Name "ShowStartupPanel" -Value 1 -Type DWord -ErrorAction SilentlyContinue
Write-Log "Xbox Game Bar re-enabled"`,
    },
    {
      id: "disable-bg-apps",
      label: "Disable Background Apps",
      description: "Prevents unnecessary apps from running in the background while gaming",
      script: `
# Disable background apps via registry
New-Item -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications" -Name "GlobalUserDisabled" -Value 1 -Type DWord
Write-Log "Background apps disabled"`,
      undoScript: `
# Re-enable background apps
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications" -Name "GlobalUserDisabled" -Value 0 -Type DWord
Write-Log "Background apps re-enabled"`,
    },
  ],

  "network-optimizer": [
    {
      id: "fast-dns",
      label: "Switch to Fastest DNS Servers",
      description: "Sets DNS to Cloudflare (1.1.1.1) and Google (8.8.8.8) for faster browsing",
      script: `
# Set DNS to Cloudflare and Google for all active interfaces
$adapters = Get-WmiObject Win32_NetworkAdapter | Where-Object { $_.NetConnectionId -and $_.ConfigManagerErrorCode -eq 0 }
foreach ($adapter in $adapters) {
  $config = Get-WmiObject Win32_NetworkAdapterConfiguration | Where-Object { $_.Index -eq $adapter.Index }
  if ($config) {
    $config.SetDNSServerSearchOrder(@("1.1.1.1", "8.8.8.8")) | Out-Null
    Write-Log "DNS set on $($adapter.NetConnectionId)"
  }
}`,
      undoScript: `
# Reset DNS to automatic (DHCP)
$adapters = Get-WmiObject Win32_NetworkAdapter | Where-Object { $_.NetConnectionId -and $_.ConfigManagerErrorCode -eq 0 }
foreach ($adapter in $adapters) {
  $config = Get-WmiObject Win32_NetworkAdapterConfiguration | Where-Object { $_.Index -eq $adapter.Index }
  if ($config) {
    $config.SetDNSServerSearchOrder($null) | Out-Null
    Write-Log "DNS reset to automatic on $($adapter.NetConnectionId)"
  }
}`,
    },
    {
      id: "optimize-tcp",
      label: "Optimize TCP Settings",
      description: "Tunes TCP window size, enable auto-tuning, and disable congestion limits",
      script: `
# Optimize TCP global parameters
netsh int tcp set global autotuninglevel=normal
netsh int tcp set global chimney=disabled
netsh int tcp set global rss=enabled
netsh int tcp set global timestamps=disabled
netsh int tcp set global initialRto=2000
Write-Log "TCP settings optimized"`,
      undoScript: `
# Restore TCP defaults
netsh int tcp set global autotuninglevel=normal
netsh int tcp set global chimney=enabled
netsh int tcp set global rss=default
netsh int tcp set global timestamps=default
netsh int tcp set global initialRto=3000
Write-Log "TCP settings restored to defaults"`,
    },
    {
      id: "remove-throttle",
      label: "Remove Windows Bandwidth Throttle",
      description: "Disables the Windows reserved bandwidth limit (20% by default)",
      script: `
# Disable QoS reserved bandwidth limit
New-Item -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Psched" -Force | Out-Null
Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Psched" -Name "NonBestEffortLimit" -Value 0 -Type DWord
Write-Log "Bandwidth throttle disabled"`,
      undoScript: `
# Restore QoS reserved bandwidth limit
Remove-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Psched" -Name "NonBestEffortLimit" -ErrorAction SilentlyContinue
Write-Log "Bandwidth throttle restored to default"`,
    },
    {
      id: "reset-network",
      label: "Reset Network Stack",
      description: "Flushes DNS, resets TCP/IP stack, and clears ARP cache",
      script: `
# Full network stack reset
Write-Log "Flushing DNS..."
ipconfig /flushdns | Out-Null
Write-Log "Resetting TCP/IP..."
netsh int ip reset | Out-Null
Write-Log "Resetting Winsock..."
netsh winsock reset | Out-Null
Write-Log "Clearing ARP cache..."
netsh int ip delete arpcache | Out-Null
Write-Log "Network stack reset complete"`,
      undoScript: `
# Network stack reset cannot be fully undone
Write-Log "Network stack reset is cumulative — previous settings are overwritten." "Yellow"
Write-Log "A reboot may be required for all changes to take effect." "Yellow"`,
    },
    {
      id: "disable-nagle",
      label: "Disable Nagle's Algorithm",
      description: "Reduces network latency for real-time applications and gaming",
      script: `
# Disable Nagle's algorithm for all interfaces
$interfaces = Get-ItemProperty "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces\\*"
foreach ($iface in $interfaces) {
  $path = $iface.PSPath
  Set-ItemProperty -Path $path -Name "TcpAckFrequency" -Value 1 -Type DWord -ErrorAction SilentlyContinue
  Set-ItemProperty -Path $path -Name "TCPNoDelay" -Value 1 -Type DWord -ErrorAction SilentlyContinue
}
Write-Log "Nagle's algorithm disabled"`,
      undoScript: `
# Restore Nagle's algorithm defaults
$interfaces = Get-ItemProperty "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces\\*"
foreach ($iface in $interfaces) {
  $path = $iface.PSPath
  Remove-ItemProperty -Path $path -Name "TcpAckFrequency" -ErrorAction SilentlyContinue
  Remove-ItemProperty -Path $path -Name "TCPNoDelay" -ErrorAction SilentlyContinue
}
Write-Log "Nagle's algorithm restored to defaults"`,
    },
    {
      id: "disable-power-throttle",
      label: "Disable Network Power Throttling",
      description: "Prevents Windows from limiting network adapter speed to save power",
      script: `
# Disable network adapter power saving
$adapters = Get-WmiObject Win32_NetworkAdapter | Where-Object { $_.NetConnectionId -and $_.ConfigManagerErrorCode -eq 0 }
foreach ($adapter in $adapters) {
  $pnp = Get-WmiObject Win32_PnPEntity | Where-Object { $_.DeviceID -eq $adapter.PNPDeviceID }
  if ($pnp) {
    $pnpPath = "HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\$($adapter.PNPDeviceID)\\Device Parameters\\Power"
    if (Test-Path $pnpPath) {
      Set-ItemProperty -Path $pnpPath -Name "Enable" -Value 0 -Type DWord -ErrorAction SilentlyContinue
    }
  }
}
powercfg /change nicelose 0
Write-Log "Network power throttling disabled"`,
      undoScript: `
# Re-enable network adapter power saving
$adapters = Get-WmiObject Win32_NetworkAdapter | Where-Object { $_.NetConnectionId -and $_.ConfigManagerErrorCode -eq 0 }
foreach ($adapter in $adapters) {
  $pnpPath = "HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\$($adapter.PNPDeviceID)\\Device Parameters\\Power"
  if (Test-Path $pnpPath) {
    Remove-ItemProperty -Path $pnpPath -Name "Enable" -ErrorAction SilentlyContinue
  }
}
powercfg /change nicelose 1
Write-Log "Network power throttling restored"`,
    },
  ],

  "wifi-network-fixer": [
    {
      id: "reset-adapter",
      label: "Reset WiFi Adapter",
      description: "Disables and re-enables the WiFi adapter to fix connection issues",
      script: `
# Reset WiFi adapter by disabling and re-enabling
$wifi = Get-WmiObject Win32_NetworkAdapter | Where-Object { $_.Name -match "WiFi|Wireless|802.11" -and $_.ConfigManagerErrorCode -eq 0 }
if ($wifi) {
  Write-Log "Resetting WiFi adapter: $($wifi.Name)"
  $wifi.Disable() | Out-Null
  Start-Sleep -Seconds 3
  $wifi.Enable() | Out-Null
  Write-Log "WiFi adapter reset complete"
} else {
  Write-Log "No WiFi adapter found" "Yellow"
}`,
      undoScript: `
# Reset is self-contained — no undo needed
Write-Log "Adapter reset is a toggle operation. No undo required." "Yellow"`,
    },
    {
      id: "flush-dns",
      label: "Flush DNS Cache",
      description: "Clears the DNS resolver cache to fix website loading problems",
      script: `
Write-Log "Flushing DNS cache..."
ipconfig /flushdns
Write-Log "DNS cache flushed"`,
      undoScript: `
Write-Log "DNS cache cannot be restored — it repopulates naturally." "Yellow"`,
    },
    {
      id: "reset-tcp",
      label: "Reset TCP/IP Stack",
      description: "Resets the TCP/IP protocol stack to fix network communication errors",
      script: `
Write-Log "Resetting TCP/IP stack..."
netsh int ip reset
Write-Log "TCP/IP stack reset"`,
      undoScript: `
Write-Log "TCP/IP reset is cumulative. Previous state is overwritten." "Yellow"`,
    },
    {
      id: "release-renew",
      label: "Release and Renew IP",
      description: "Releases the current IP address and gets a new one from the router",
      script: `
Write-Log "Releasing IP address..."
ipconfig /release
Write-Log "Renewing IP address..."
ipconfig /renew
Write-Log "IP address renewed"`,
      undoScript: `
Write-Log "IP release/renew is transient. No undo needed." "Yellow"`,
    },
    {
      id: "reset-winsock",
      label: "Reset Winsock Catalog",
      description: "Resets the Winsock catalog to fix socket errors and connection failures",
      script: `
Write-Log "Resetting Winsock catalog..."
netsh winsock reset
Write-Log "Winsock catalog reset"`,
      undoScript: `
Write-Log "Winsock reset is cumulative. Previous state is overwritten." "Yellow"`,
    },
    {
      id: "clear-arp",
      label: "Clear ARP Cache",
      description: "Clears the Address Resolution Protocol cache to fix device discovery issues",
      script: `
Write-Log "Clearing ARP cache..."
netsh int ip delete arpcache
Write-Log "ARP cache cleared"`,
      undoScript: `
Write-Log "ARP cache cannot be restored — it repopulates automatically." "Yellow"`,
    },
  ],

  "audio-fix": [
    {
      id: "restart-audio",
      label: "Restart Audio Service",
      description: "Stops and restarts the Windows Audio service to fix sound issues",
      script: `
# Restart Windows Audio service
Write-Log "Restarting Windows Audio service..."
Stop-Service -Name "Audiosrv" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Start-Service -Name "Audiosrv"
Write-Log "Windows Audio service restarted"`,
      undoScript: `
# Service restart is self-contained
Write-Log "Audio service restart is a reset. No undo needed." "Yellow"`,
    },
    {
      id: "reregister-dll",
      label: "Re-register Audio DLLs",
      description: "Re-registers core audio DLL files to fix component errors",
      script: `
# Re-register valid audio COM DLLs
$dlls = @("audioeng.dll", "audiodg.dll", "mmdevapi.dll")
foreach ($dll in $dlls) {
  regsvr32 /s "$env:WINDIR\\System32\\$dll"
  Write-Log "Re-registered: $dll"
}
Write-Log "Audio DLLs re-registered"`,
      undoScript: `
# DLL registration changes cannot be individually undone
Write-Log "DLL re-registration is restorative. No undo needed." "Yellow"`,
    },
    {
      id: "reinstall-driver",
      label: "Restart Audio Device",
      description: "Restarts the audio device to fix sound issues",
      script: `
# Restart audio device
$audioDevices = Get-PnpDevice -FriendlyName "*Audio*","*Sound*","*Realtek*","*High Definition Audio*" -Status OK -ErrorAction SilentlyContinue
foreach ($device in $audioDevices) {
  Write-Log "Restarting: $($device.FriendlyName)"
  $instId = $device.InstanceId
  Disable-PnpDevice -InstanceId $instId -Confirm:$false -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 2
  Enable-PnpDevice -InstanceId $instId -Confirm:$false -ErrorAction SilentlyContinue
  Write-Log "Verified: $($device.FriendlyName) restarted" "Green"
}
Write-Log "Audio device restarted"`,
      undoScript: `
Write-Log "Device restart is self-contained. No undo needed." "Yellow"`,
    },
    {
      id: "disable-enhancements",
      label: "Disable Audio Enhancements",
      description: "Turns off audio enhancements that can cause crackling or no sound",
      script: `
# Disable audio enhancements for all render endpoints
$renderKey = "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\MMDevices\\Audio\\Render"
if (Test-Path $renderKey) {
  Get-ChildItem -Path $renderKey -ErrorAction SilentlyContinue | ForEach-Object {
    $fxKey = "$($_.PSPath)\\FxProperties"
    if (Test-Path $fxKey) {
      Set-ItemProperty -Path $fxKey -Name "{E0A9D42B-EEF5-4FA1-9FD2-87708E84F6B1},4" -Value 0 -Type DWord -ErrorAction SilentlyContinue
      Write-Log "Disabled enhancements for: $($_.PSChildName)"
    }
  }
}
Write-Log "Audio enhancements disabled for all devices"`,
      undoScript: `
# Re-enable audio enhancements for all render endpoints
$renderKey = "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\MMDevices\\Audio\\Render"
if (Test-Path $renderKey) {
  Get-ChildItem -Path $renderKey -ErrorAction SilentlyContinue | ForEach-Object {
    $fxKey = "$($_.PSPath)\\FxProperties"
    if (Test-Path $fxKey) {
      Remove-ItemProperty -Path $fxKey -Name "{E0A9D42B-EEF5-4FA1-9FD2-87708E84F6B1},4" -ErrorAction SilentlyContinue
      Write-Log "Re-enabled enhancements for: $($_.PSChildName)"
    }
  }
}
Write-Log "Audio enhancements re-enabled"`,
    },
    {
      id: "set-default",
      label: "Open Sound Settings",
      description: "Opens the Sound control panel to select the default playback device manually",
      script: `
Write-Log "Opening Sound settings..."
Start-Process rundll32.exe -ArgumentList "shell32.dll,Control_RunDLL mmsys.cpl,,0"
Write-Log "Sound settings opened. Select your desired playback device from the Playback tab." "Yellow"`,
      undoScript: `
Write-Log "Default device is a user preference. No undo needed." "Yellow"`,
    },
    {
      id: "reset-volume",
      label: "Reset Volume Levels",
      description: "Resets system volume to 80% via COM and opens Sound settings",
      script: `
Write-Log "Resetting system volume..."
$snd = New-Object -ComObject "WMPlayer.OCX"
$snd.settings.volume = 80
$actual = $snd.settings.volume
$snd.close()
if ($actual -eq 80) { Write-Log "Verified: system volume set to 80%" "Green" }
else { Write-Log "Could not verify: volume is $actual" "Yellow" }
Start-Process rundll32.exe -ArgumentList "shell32.dll,Control_RunDLL mmsys.cpl,,0"
Write-Log "Sound settings opened for further adjustments." "Yellow"`,
      undoScript: `
Write-Log "Volume level is a user preference. Previous level is not stored." "Yellow"`,
    },
  ],

  "startup-manager": [
    {
      id: "disable-onedrive",
      label: "Disable OneDrive at Startup",
      description: "Prevents OneDrive from auto-launching",
      script: `
Remove-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "OneDrive" -ErrorAction SilentlyContinue
Write-Log "OneDrive startup disabled"`,
      undoScript: `
# OneDrive needs a specific path
$onedrive = [Environment]::GetEnvironmentVariable("LOCALAPPDATA") + "\\Microsoft\\OneDrive\\OneDrive.exe"
if (Test-Path $onedrive) {
  Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "OneDrive" -Value $onedrive
  Write-Log "OneDrive startup restored"
}`,
    },
    {
      id: "disable-teams",
      label: "Disable Microsoft Teams at Startup",
      description: "Stops Teams from launching at boot",
      script: `
Remove-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "Teams" -ErrorAction SilentlyContinue
Remove-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "com.squirrel.Teams.Teams" -ErrorAction SilentlyContinue
Write-Log "Teams startup disabled"`,
      undoScript: `
Write-Log "Teams auto-start is managed in-app. Re-enable it from Teams settings." "Yellow"`,
    },
    {
      id: "disable-skype",
      label: "Disable Skype at Startup",
      description: "Prevents Skype from auto-starting with Windows",
      script: `
Remove-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "Skype" -ErrorAction SilentlyContinue
Write-Log "Skype startup disabled"`,
      undoScript: `
Write-Log "Skype auto-start is managed in-app. Re-enable it from Skype settings." "Yellow"`,
    },
    {
      id: "disable-discord",
      label: "Disable Discord at Startup",
      description: "Stops Discord from launching at boot",
      script: `
Remove-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "Discord" -ErrorAction SilentlyContinue
Write-Log "Discord startup disabled"`,
      undoScript: `
Write-Log "Discord auto-start is managed in-app. Re-enable it from Discord settings." "Yellow"`,
    },
    {
      id: "disable-spotify",
      label: "Disable Spotify at Startup",
      description: "Prevents Spotify from launching at boot",
      script: `
Remove-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "Spotify" -ErrorAction SilentlyContinue
Remove-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "SpotifyWebHelper" -ErrorAction SilentlyContinue
Write-Log "Spotify startup disabled"`,
      undoScript: `
Write-Log "Spotify auto-start is managed in-app. Re-enable it from Spotify settings." "Yellow"`,
    },
    {
      id: "disable-steam",
      label: "Disable Steam at Startup",
      description: "Stops Steam from auto-launching with Windows",
      script: `
Remove-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "Steam" -ErrorAction SilentlyContinue
Write-Log "Steam startup disabled"`,
      undoScript: `
Write-Log "Steam auto-start is managed in-app. Re-enable it from Steam settings." "Yellow"`,
    },
    {
      id: "disable-edge",
      label: "Disable Edge Background Processes",
      description: "Prevents Microsoft Edge from running in the background",
      script: `
# Disable Edge startup and background processes
Remove-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "MicrosoftEdgeAutoLaunch" -ErrorAction SilentlyContinue
New-Item -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\MicrosoftEdge\\Main" -Force | Out-Null
Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\MicrosoftEdge\\Main" -Name "AllowPrelaunch" -Value 0 -Type DWord
Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\MicrosoftEdge\\TabPreloader" -Name "AllowTabPreloading" -Value 0 -Type DWord
Write-Log "Edge background processes disabled"`,
      undoScript: `
# Re-enable Edge background processes
Remove-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\MicrosoftEdge\\Main" -Name "AllowPrelaunch" -ErrorAction SilentlyContinue
Remove-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\MicrosoftEdge\\TabPreloader" -Name "AllowTabPreloading" -ErrorAction SilentlyContinue
Write-Log "Edge background processes re-enabled"`,
    },
  ],

  "privacy-protector": [
    {
      id: "disable-telemetry",
      label: "Disable Telemetry Services",
      description: "Turns off Windows telemetry and data collection services",
      script: `
# Disable telemetry services
$services = @("DiagTrack", "dmwappushservice", "WMPNetworkSvc")
foreach ($svc in $services) {
  Stop-Service -Name $svc -Force -ErrorAction SilentlyContinue
  Set-Service -Name $svc -StartupType Disabled -ErrorAction SilentlyContinue
  Write-Log "Disabled: $svc"
}
# Registry: set telemetry to basic (minimum)
New-Item -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" -Force | Out-Null
Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" -Name "AllowTelemetry" -Value 0 -Type DWord
Write-Log "Telemetry disabled"`,
      undoScript: `
# Restore telemetry services
$services = @("DiagTrack", "dmwappushservice", "WMPNetworkSvc")
foreach ($svc in $services) {
  Set-Service -Name $svc -StartupType Manual -ErrorAction SilentlyContinue
  Write-Log "Restored: $svc"
}
Remove-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" -Name "AllowTelemetry" -ErrorAction SilentlyContinue
Write-Log "Telemetry restored to default"`,
    },
    {
      id: "block-tracking",
      label: "Block Microsoft Tracking in Hosts File",
      description: "Adds known Microsoft tracking domains to the hosts file",
      script: `
# Add tracking domains to hosts file
$hostsPath = "$env:WINDIR\\System32\\drivers\\etc\\hosts"
$trackingDomains = @(
  "0.0.0.0 vortex.data.microsoft.com",
  "0.0.0.0 vortex-win.data.microsoft.com",
  "0.0.0.0 telecommand.telemetry.microsoft.com",
  "0.0.0.0 telecommand.telemetry.microsoft.com.nsatc.net",
  "0.0.0.0 oca.telemetry.microsoft.com",
  "0.0.0.0 oca.telemetry.microsoft.com.nsatc.net",
  "0.0.0.0 sqm.telemetry.microsoft.com",
  "0.0.0.0 sqm.telemetry.microsoft.com.nsatc.net",
  "0.0.0.0 watson.telemetry.microsoft.com",
  "0.0.0.0 watson.telemetry.microsoft.com.nsatc.net",
  "0.0.0.0 settings-win.data.microsoft.com",
  "0.0.0.0 settings-sandbox.data.microsoft.com"
)
foreach ($domain in $trackingDomains) {
  if (-not (Select-String -Path $hostsPath -Pattern $domain -SimpleMatch -Quiet)) {
    Add-Content -Path $hostsPath -Value $domain
  }
}
Write-Log "Tracking domains blocked in hosts file"`,
      undoScript: `
# Remove tracking domains from hosts file
$hostsPath = "$env:WINDIR\\System32\\drivers\\etc\\hosts"
$trackingDomains = @(
  "vortex.data.microsoft.com",
  "vortex-win.data.microsoft.com",
  "telecommand.telemetry.microsoft.com",
  "telecommand.telemetry.microsoft.com.nsatc.net",
  "oca.telemetry.microsoft.com",
  "oca.telemetry.microsoft.com.nsatc.net",
  "sqm.telemetry.microsoft.com",
  "sqm.telemetry.microsoft.com.nsatc.net",
  "watson.telemetry.microsoft.com",
  "watson.telemetry.microsoft.com.nsatc.net",
  "settings-win.data.microsoft.com",
  "settings-sandbox.data.microsoft.com"
)
$content = Get-Content -Path $hostsPath
$filtered = $content | Where-Object {
  $line = $_.Trim()
  $isTracking = $false
  foreach ($domain in $trackingDomains) {
    if ($line -match $domain) { $isTracking = $true; break }
  }
  -not $isTracking
}
$filtered | Set-Content -Path $hostsPath
Write-Log "Tracking domains removed from hosts file"`,
    },
    {
      id: "disable-ads-id",
      label: "Disable Advertising ID",
      description: "Turns off the Windows advertising ID that tracks you across apps",
      script: `
# Disable advertising ID
New-Item -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\AdvertisingInfo" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\AdvertisingInfo" -Name "Enabled" -Value 0 -Type DWord
Write-Log "Advertising ID disabled"`,
      undoScript: `
# Re-enable advertising ID
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\AdvertisingInfo" -Name "Enabled" -Value 1 -Type DWord
Write-Log "Advertising ID re-enabled"`,
    },
    {
      id: "disable-cortana",
      label: "Disable Cortana",
      description: "Completely disables Cortana and its web search integration",
      script: `
# Disable Cortana
New-Item -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search" -Force | Out-Null
Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search" -Name "AllowCortana" -Value 0 -Type DWord
Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search" -Name "AllowSearchToUseLocation" -Value 0 -Type DWord
New-Item -Path "HKCU:\\SOFTWARE\\Microsoft\\Personalization\\Settings" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Personalization\\Settings" -Name "AcceptedPrivacyPolicy" -Value 0 -Type DWord
Write-Log "Cortana disabled"`,
      undoScript: `
# Re-enable Cortana
Remove-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search" -Name "AllowCortana" -ErrorAction SilentlyContinue
Remove-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search" -Name "AllowSearchToUseLocation" -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Personalization\\Settings" -Name "AcceptedPrivacyPolicy" -Value 1 -Type DWord
Write-Log "Cortana re-enabled"`,
    },
    {
      id: "disable-location",
      label: "Disable Location Tracking",
      description: "Turns off location services for all apps",
      script: `
# Disable location tracking
New-Item -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\location" -Force | Out-Null
Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\location" -Name "Value" -Value "Deny"
New-Item -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\location" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\location" -Name "Value" -Value "Deny"
Write-Log "Location tracking disabled"`,
      undoScript: `
# Re-enable location tracking
Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\location" -Name "Value" -Value "Allow"
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\location" -Name "Value" -Value "Allow"
Write-Log "Location tracking re-enabled"`,
    },
    {
      id: "disable-clipboard-cloud",
      label: "Disable Clipboard Cloud Sync",
      description: "Stops Windows from syncing your clipboard to the cloud",
      script: `
# Disable clipboard cloud sync
New-Item -Path "HKCU:\\Software\\Microsoft\\Clipboard" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Clipboard" -Name "EnableClipboardHistory" -Value 0 -Type DWord
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Clipboard" -Name "CloudClipboardEnabled" -Value 0 -Type DWord
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Clipboard" -Name "CloudClipboardValue" -Value 0 -Type DWord
Write-Log "Clipboard cloud sync disabled"`,
      undoScript: `
# Re-enable clipboard cloud sync
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Clipboard" -Name "EnableClipboardHistory" -Value 1 -Type DWord
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Clipboard" -Name "CloudClipboardEnabled" -Value 1 -Type DWord
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Clipboard" -Name "CloudClipboardValue" -Value 1 -Type DWord
Write-Log "Clipboard cloud sync re-enabled"`,
    },
  ],

  "windows-update-fixer": [
    {
      id: "stop-services",
      label: "Stop Update Services",
      description: "Stops Windows Update and BITS services for a clean restart",
      script: `
# Stop Windows Update related services
$services = @("wuauserv", "bits", "cryptsvc", "TrustedInstaller")
foreach ($svc in $services) {
  Stop-Service -Name $svc -Force -ErrorAction SilentlyContinue
  Write-Log "Stopped: $svc"
}`,
      undoScript: `
# Restart services (will be done at the end)
Write-Log "Services will be restarted in the 'Restart Update Services' step." "Yellow"`,
    },
    {
      id: "clear-cache",
      label: "Clear Update Cache",
      description: "Deletes the SoftwareDistribution download folder to remove corrupted updates",
      script: `
# Remove SoftwareDistribution folder contents
$sdPath = "$env:WINDIR\\SoftwareDistribution"
if (Test-Path $sdPath) {
  Write-Log "Clearing SoftwareDistribution..."
  Get-ChildItem -Path "$sdPath\\Download" -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
}
Write-Log "Update cache cleared"`,
      undoScript: `
Write-Log "Update cache cannot be restored. It will be re-downloaded by Windows Update." "Yellow"`,
    },
    {
      id: "clear-catroot",
      label: "Clear Catroot2 Folder",
      description: "Clears the catroot2 folder which can cause update installation failures",
      script: `
# Remove catroot2 folder contents
$catrootPath = "$env:WINDIR\\System32\\catroot2"
if (Test-Path $catrootPath) {
  Write-Log "Clearing catroot2..."
  Get-ChildItem -Path $catrootPath -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
}
Write-Log "Catroot2 cleared"`,
      undoScript: `
Write-Log "Catroot2 cannot be restored. It will be rebuilt by Windows." "Yellow"`,
    },
    {
      id: "reregister-dlls",
      label: "Re-register Update DLLs",
      description: "Re-registers all core Windows Update DLL files to fix component errors",
      script: `
# Re-register Windows Update DLLs
$dlls = @(
  "wuapi.dll", "wuaueng.dll", "wucltui.dll", "wups.dll",
  "wups2.dll", "wuweb.dll", "qmgr.dll", "qmgrprxy.dll"
)
foreach ($dll in $dlls) {
  regsvr32 /s "$env:WINDIR\\System32\\$dll"
}
Write-Log "Update DLLs re-registered"`,
      undoScript: `
Write-Log "DLL re-registration is restorative. No undo needed." "Yellow"`,
    },
    {
      id: "reset-store",
      label: "Reset Windows Store",
      description: "Resets the Microsoft Store cache which can block updates",
      script: `
# Reset Microsoft Store cache
wsreset.exe
Write-Log "Microsoft Store cache reset"`,
      undoScript: `
Write-Log "Store cache reset is self-contained. No undo needed." "Yellow"`,
    },
    {
      id: "restart-services",
      label: "Restart Update Services",
      description: "Starts the update services back up after cleaning",
      script: `
# Restart Windows Update services
$services = @("wuauserv", "bits", "cryptsvc")
foreach ($svc in $services) {
  Start-Service -Name $svc -ErrorAction SilentlyContinue
  Write-Log "Started: $svc"
}
Write-Log "Windows Update services restarted"`,
      undoScript: `
Write-Log "Services were restarted to their normal state. No undo needed." "Yellow"`,
    },
  ],

  "monthly-maintenance": [
    {
      id: "clean-temp",
      label: "Clean Temporary Files",
      description: "Deletes all temp files from Windows temp folders",
      script: `
$tempPaths = @("$env:TEMP", "$env:WINDIR\\Temp")
foreach ($p in $tempPaths) {
  if (Test-Path $p) {
    Write-Log "Cleaning: $p"
    Get-ChildItem -Path $p -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { -not $_.PSIsContainer } | Remove-Item -Force -ErrorAction SilentlyContinue
    Get-ChildItem -Path $p -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { $_.PSIsContainer } | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
  }
}`,
      undoScript: `
Write-Log "Temporary files cannot be restored." "Yellow"`,
    },
    {
      id: "clear-caches",
      label: "Clear All Caches",
      description: "Clears DNS cache, icon cache, thumbnail cache, and font cache",
      script: `
Write-Log "Flushing DNS..."
ipconfig /flushdns | Out-Null
$iconCache = "$env:LOCALAPPDATA\\IconCache.db"
if (Test-Path $iconCache) { Remove-Item -Path $iconCache -Force -ErrorAction SilentlyContinue }
Write-Log "Caches cleared"`,
      undoScript: `
Write-Log "Caches will rebuild naturally." "Yellow"`,
    },
    {
      id: "disk-health",
      label: "Check Disk Health",
      description: "Runs SMART diagnostics and checks disk for errors",
      script: `
Write-Log "Checking disk health..."
wmic diskdrive get status
chkdsk C: /scan
Write-Log "Disk health check complete"`,
      undoScript: `
Write-Log "Disk health check is read-only. No undo needed." "Yellow"`,
    },
    {
      id: "verify-startup",
      label: "Verify Startup Items",
      description: "Lists current startup items and flags suspicious ones",
      script: `
Write-Log "Current startup items:"
Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location | Format-Table -AutoSize
Write-Log "Review the list above. Items from temp folders or unusual paths may be suspicious." "Yellow"`,
      undoScript: `
Write-Log "Startup verification is read-only. No undo needed." "Yellow"`,
    },
    {
      id: "empty-recycle",
      label: "Empty Recycle Bin",
      description: "Permanently deletes all files in the Recycle Bin",
      script: `
$shell = New-Object -ComObject Shell.Application
$shell.Namespace(0xa).Items() | ForEach-Object { $_.InvokeVerb("delete") }
Write-Log "Recycle Bin emptied"`,
      undoScript: `
Write-Log "Recycle Bin emptying cannot be undone." "Yellow"`,
    },
    {
      id: "sfc-scan",
      label: "Run System File Checker",
      description: "Scans Windows system files and repairs corrupted ones",
      script: `
Write-Log "Running System File Checker (SFC)..."
sfc /scannow
Write-Log "SFC scan completed"`,
      undoScript: `
Write-Log "SFC scan is read-only (repairs are logged). No undo needed." "Yellow"`,
    },
  ],

  "corrupted-files-fix": [
    {
      id: "restore-point",
      label: "Create Restore Point",
      description: "Creates a system restore point before making any changes",
      script: `
# Create a system restore point
Checkpoint-Computer -Description "Fixelo - Corrupted Files Fix" -RestorePointType MODIFY_SETTINGS -ErrorAction SilentlyContinue
if ($?) {
  Write-Log "Restore point created"
} else {
  Write-Log "Could not create restore point. Ensure System Protection is enabled." "Yellow"
}`,
      undoScript: `
Write-Log "Restore points cannot be deleted via script. Use System Restore to revert if needed." "Yellow"`,
    },
    {
      id: "sfc-scan",
      label: "Run System File Checker (SFC)",
      description: "Scans all protected system files and replaces corrupted ones",
      script: `
Write-Log "Running System File Checker (SFC)..."
sfc /scannow
Write-Log "SFC scan completed. Check the log above for results."`,
      undoScript: `
Write-Log "SFC repairs are applied to system files. Undo is not available." "Yellow"`,
    },
    {
      id: "dism-health",
      label: "Run DISM Health Check",
      description: "Checks the component store for corruption",
      script: `
Write-Log "Running DISM health check..."
dism /online /cleanup-image /checkhealth
Write-Log "DISM health check completed"`,
      undoScript: `
Write-Log "DISM health check is read-only. No undo needed." "Yellow"`,
    },
    {
      id: "dism-restore",
      label: "Run DISM Restore Health",
      description: "Repairs the Windows image using Windows Update as the source",
      script: `
Write-Log "Running DISM restore health..."
dism /online /cleanup-image /restorehealth
Write-Log "DISM restore health completed"`,
      undoScript: `
Write-Log "DISM restore health repairs are cumulative. Undo is not available." "Yellow"`,
    },
    {
      id: "clear-cbs",
      label: "Clear CBS Logs",
      description: "Clears the Component-Based Servicing logs that can block repairs",
      script: `
$cbsLog = "$env:WINDIR\\Logs\\CBS\\CBS.log"
if (Test-Path $cbsLog) {
  Remove-Item -Path $cbsLog -Force -ErrorAction SilentlyContinue
  Write-Log "CBS logs cleared"
}`,
      undoScript: `
Write-Log "CBS logs cannot be restored. New logs will be created automatically." "Yellow"`,
    },
  ],

  "ssd-optimizer": [
    {
      id: "enable-trim",
      label: "Enable TRIM",
      description: "Ensures TRIM is enabled on all SSDs for optimal performance and longevity",
      script: `
fsutil behavior query DisableDeleteNotify | Out-Null
$trimStatus = fsutil behavior query DisableDeleteNotify
if ($trimStatus -match "0") {
  Write-Log "TRIM is already enabled"
} else {
  fsutil behavior set DisableDeleteNotify 0
  Write-Log "TRIM enabled"
}`,
      undoScript: `
Write-Log "TRIM should remain enabled for SSD health. Disabling is not recommended." "Yellow"`,
    },
    {
      id: "disable-defrag",
      label: "Disable Defragmentation on SSDs",
      description: "Stops Windows from scheduling defragmentation on SSD drives",
      script: `
$ssds = Get-WmiObject Win32_DiskDrive | Where-Object { $_.MediaType -match "SSD" -or $_.Model -match "SSD" }
foreach ($ssd in $ssds) {
  $drive = $ssd.DeviceID -replace "\\\\\\\\.\\\\PHYSICALDRIVE", "PHYSICALDRIVE"
  Optimize-Volume -DriveLetter C -ReTrim -Verbose -ErrorAction SilentlyContinue
}
Write-Log "SSD defragmentation disabled (ReTrim enabled instead)"`,
      undoScript: `
Write-Log "ReTrim is the correct operation for SSDs. No undo needed." "Yellow"`,
    },
    {
      id: "write-caching",
      label: "Optimize Write Caching",
      description: "Enables write caching on the SSD for faster write performance",
      script: `
$disks = Get-WmiObject Win32_DiskDrive | Where-Object { $_.MediaType -match "SSD" -or $_.Model -match "SSD" }
foreach ($disk in $disks) {
  $pnp = Get-WmiObject Win32_PnPEntity | Where-Object { $_.DeviceID -eq $disk.PNPDeviceID }
  if ($pnp) {
    $path = "HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\$($disk.PNPDeviceID)\\Device Parameters\\Disk"
    if (Test-Path $path) {
      Set-ItemProperty -Path $path -Name "CachePolicy" -Value 1 -Type DWord -ErrorAction SilentlyContinue
    }
  }
}
Write-Log "Write caching enabled"`,
      undoScript: `
$disks = Get-WmiObject Win32_DiskDrive | Where-Object { $_.MediaType -match "SSD" -or $_.Model -match "SSD" }
foreach ($disk in $disks) {
  $path = "HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\$($disk.PNPDeviceID)\\Device Parameters\\Disk"
  if (Test-Path $path) {
    Remove-ItemProperty -Path $path -Name "CachePolicy" -ErrorAction SilentlyContinue
  }
}
Write-Log "Write caching restored to default"`,
    },
    {
      id: "disable-superfetch",
      label: "Disable Superfetch/Prefetch on SSD",
      description: "Stops Superfetch from wearing out SSDs with unnecessary reads",
      script: `
Stop-Service -Name "SysMain" -Force -ErrorAction SilentlyContinue
Set-Service -Name "SysMain" -StartupType Disabled -ErrorAction SilentlyContinue
Write-Log "Superfetch (SysMain) disabled for SSD"`,
      undoScript: `
Set-Service -Name "SysMain" -StartupType Manual -ErrorAction SilentlyContinue
Start-Service -Name "SysMain" -ErrorAction SilentlyContinue
Write-Log "Superfetch (SysMain) re-enabled"`,
    },
    {
      id: "disable-indexing",
      label: "Disable Search Indexing on SSD",
      description: "Stops Windows Search from constantly indexing the SSD",
      script: `
$indexingPath = "HKLM:\\SOFTWARE\\Microsoft\\Windows Search"
if (Test-Path $indexingPath) {
  Set-ItemProperty -Path $indexingPath -Name "SetupCompletedSuccessfully" -Value 0 -Type DWord -ErrorAction SilentlyContinue
}
Stop-Service -Name "WSearch" -Force -ErrorAction SilentlyContinue
Set-Service -Name "WSearch" -StartupType Disabled -ErrorAction SilentlyContinue
Write-Log "Search indexing disabled on SSD"`,
      undoScript: `
Set-Service -Name "WSearch" -StartupType Manual -ErrorAction SilentlyContinue
Start-Service -Name "WSearch" -ErrorAction SilentlyContinue
Write-Log "Search indexing re-enabled"`,
    },
  ],

  "battery-optimizer": [
    {
      id: "balanced-power",
      label: "Switch to Balanced Power Plan",
      description: "Changes power plan from High Performance to Balanced for better battery life",
      script: `
$balanced = powercfg /list | Select-String "Balanced"
if ($balanced) {
  $guid = ($balanced -split "\\s+")[3]
  powercfg /setactive $guid
  Write-Log "Power plan set to Balanced"
}`,
      undoScript: `
$highPerf = powercfg /list | Select-String "High performance"
if ($highPerf) {
  $guid = ($highPerf -split "\\s+")[3]
  powercfg /setactive $guid
  Write-Log "Power plan restored to High Performance"
}`,
    },
    {
      id: "screen-timeout",
      label: "Reduce Screen Timeout",
      description: "Sets screen to turn off after 3 minutes on battery",
      script: `
powercfg /change standby-timeout-dc 3
powercfg /change monitor-timeout-dc 3
Write-Log "Screen timeout set to 3 minutes on battery"`,
      undoScript: `
powercfg /change monitor-timeout-dc 10
Write-Log "Screen timeout restored to 10 minutes"`,
    },
    {
      id: "disable-bg-apps",
      label: "Disable Background Apps on Battery",
      description: "Prevents apps from running in the background when on battery power",
      script: `
New-Item -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications" -Name "GlobalUserDisabled" -Value 1 -Type DWord
Write-Log "Background apps disabled on battery"`,
      undoScript: `
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications" -Name "GlobalUserDisabled" -Value 0 -Type DWord
Write-Log "Background apps re-enabled"`,
    },
    {
      id: "disable-bluetooth",
      label: "Disable Bluetooth (when not needed)",
      description: "Turns off Bluetooth to save battery when not connected to devices",
      script: `
$script:btInstances = @()
$bt = Get-PnpDevice -FriendlyName "*Bluetooth*" -Status OK -ErrorAction SilentlyContinue
foreach ($device in $bt) {
  Write-Log "Disabling: $($device.FriendlyName)"
  $script:btInstances += $device.InstanceId
  Disable-PnpDevice -InstanceId $device.InstanceId -Confirm:$false -ErrorAction SilentlyContinue
}
$check = Get-PnpDevice -FriendlyName "*Bluetooth*" -Status OK -ErrorAction SilentlyContinue
if (-not $check) { Write-Log "Verified: Bluetooth disabled" "Green" }
else { Write-Log "Warning: some Bluetooth devices still enabled" "Yellow" }`,
      undoScript: `
foreach ($instId in $script:btInstances) {
  Enable-PnpDevice -InstanceId $instId -Confirm:$false -ErrorAction SilentlyContinue
}
$check = Get-PnpDevice -FriendlyName "*Bluetooth*" -Status OK -ErrorAction SilentlyContinue
if ($check) { Write-Log "Verified: Bluetooth re-enabled" "Green" }
else { Write-Log "Warning: Bluetooth may not be re-enabled" "Yellow" }`,
    },
    {
      id: "disable-indexing",
      label: "Pause Search Indexing on Battery",
      description: "Stops Windows Search indexing from running on battery power",
      script: `
Stop-Service -Name "WSearch" -Force -ErrorAction SilentlyContinue
Write-Log "Search indexing paused on battery"`,
      undoScript: `
Start-Service -Name "WSearch" -ErrorAction SilentlyContinue
Write-Log "Search indexing resumed"`,
    },
    {
      id: "dim-screen",
      label: "Lower Screen Brightness",
      description: "Sets screen brightness to 50% when on battery",
      script: `
$brightness = (Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, 50)
Write-Log "Screen brightness set to 50%"`,
      undoScript: `
$brightness = (Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, 100)
Write-Log "Screen brightness restored to 100%"`,
    },
  ],

  "blue-screen-recovery": [
    {
      id: "scan-errors",
      label: "Scan Error Logs",
      description: "Reads Windows event logs to identify the specific blue screen error cause",
      script: `
$errors = Get-WinEvent -FilterHashtable @{LogName="System"; Level=1,2} -MaxEvents 10 -ErrorAction SilentlyContinue
if ($errors) {
  Write-Log "Recent critical system errors:"
  foreach ($e in $errors) { Write-Log "$($e.TimeCreated): $($e.Message -replace '[\\r\\n]+',' ')" }
} else {
  Write-Log "No recent critical errors found in System log"
}`,
      undoScript: `
Write-Log "Error log scanning is read-only. No undo needed." "Yellow"`,
    },
    {
      id: "sfc-repair",
      label: "Run System File Checker",
      description: "Scans and repairs corrupted system files that can cause blue screens",
      script: `
Write-Log "Running System File Checker (SFC)..."
sfc /scannow
Write-Log "SFC scan completed"`,
      undoScript: `
Write-Log "SFC repairs are cumulative. Undo not available." "Yellow"`,
    },
    {
      id: "check-drivers",
      label: "Verify Driver Health",
      description: "Lists problematic drivers that may be causing crashes",
      script: `
$problemDevices = Get-WmiObject Win32_PnPEntity | Where-Object { $_.ConfigManagerErrorCode -ne 0 -and $_.ConfigManagerErrorCode -ne 22 }
if ($problemDevices) {
  Write-Log "Devices with problems:"
  foreach ($d in $problemDevices) { Write-Log "$($d.Name) - Code $($d.ConfigManagerErrorCode)" }
} else {
  Write-Log "All drivers appear healthy"
}`,
      undoScript: `
Write-Log "Driver check is read-only. No undo needed." "Yellow"`,
    },
    {
      id: "memory-check",
      label: "Schedule Memory Check",
      description: "Schedules Windows Memory Diagnostic to run on next boot",
      script: `
Write-Log "Scheduling memory diagnostic on next boot..."
schtasks /create /tn "Fixelo_MemoryCheck" /tr "mdsched.exe /testonce" /sc once /st 00:00 /ru SYSTEM /f | Out-Null
bcdedit /set bootems enabled | Out-Null
Write-Log "Memory diagnostic scheduled. Restart your PC to run it."`,
      undoScript: `
schtasks /delete /tn "Fixelo_MemoryCheck" /f | Out-Null
Write-Log "Memory diagnostic task removed"`,
    },
    {
      id: "disk-check",
      label: "Schedule Disk Check",
      description: "Schedules CHKDSK to verify disk integrity on next boot",
      script: `
chkdsk C: /f /r /schedule:on
Write-Log "Disk check scheduled on next reboot"`,
      undoScript: `
chkntfs /x C:
Write-Log "Disk check unscheduled"`,
    },
    {
      id: "system-restore",
      label: "Create Restore Point",
      description: "Creates a system restore point before making any changes",
      script: `
Checkpoint-Computer -Description "Fixelo - BSOD Recovery" -RestorePointType MODIFY_SETTINGS -ErrorAction SilentlyContinue
if ($?) { Write-Log "Restore point created" }
else { Write-Log "Could not create restore point. Enable System Protection first." "Yellow" }`,
      undoScript: `
Write-Log "Restore points cannot be deleted via script. Use System Restore to revert." "Yellow"`,
    },
  ],

  "disk-error-fix": [
    {
      id: "chkdsk-scan",
      label: "Run CHKDSK on System Drive",
      description: "Scans the C: drive for file system errors and repairs them",
      script: `
Write-Log "Scheduling CHKDSK on C: drive..."
chkdsk C: /scan
Write-Log "CHKDSK scan completed"`,
      undoScript: `
Write-Log "CHKDSK scan is read-only (unless /f was used). No undo needed." "Yellow"`,
    },
    {
      id: "bad-sectors",
      label: "Check for Bad Sectors",
      description: "Includes a full surface scan to find and mark bad sectors",
      script: `
Write-Log "Running CHKDSK with bad sector detection..."
chkdsk C: /r /schedule:on
Write-Log "CHKDSK with bad sector scan scheduled on next reboot"`,
      undoScript: `
chkntfs /x C:
Write-Log "CHKDSK unscheduled"`,
    },
    {
      id: "smart-check",
      label: "Read SMART Data",
      description: "Reads the drive's self-monitoring data to check overall health",
      script: `
Write-Log "SMART data for physical drives:"
wmic diskdrive get status,model,size
Write-Log "SMART check completed"`,
      undoScript: `
Write-Log "SMART check is read-only. No undo needed." "Yellow"`,
    },
    {
      id: "report-findings",
      label: "Report Findings",
      description: "Shows a detailed report of what was found and repaired",
      script: `
Write-Log "Disk health summary:"
$drives = Get-PSDrive -PSProvider FileSystem
foreach ($d in $drives) {
  $free = [math]::Round($d.Free / 1GB, 2)
  $used = [math]::Round(($d.Used / 1GB), 2)
  Write-Log "$($d.Name): $free GB free, $used GB used"
}`,
      undoScript: `
Write-Log "Report is read-only. No undo needed." "Yellow"`,
    },
  ],

  "display-resolution-fix": [
    {
      id: "reinstall-gpu",
      label: "Restart Display Driver",
      description: "Restarts the display adapter driver",
      script: `
$gpu = Get-PnpDevice -FriendlyName "*NVIDIA*","*AMD*","*Intel(R) Graphics*","*Intel(R) HD*" -Status OK -ErrorAction SilentlyContinue
if ($gpu) {
  foreach ($d in $gpu) {
    Write-Log "Restarting: $($d.FriendlyName)"
    $instId = $d.InstanceId
    Disable-PnpDevice -InstanceId $instId -Confirm:$false -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Enable-PnpDevice -InstanceId $instId -Confirm:$false -ErrorAction SilentlyContinue
    Write-Log "Verified: $($d.FriendlyName) restarted" "Green"
  }
}
Write-Log "Display driver restarted"`,
      undoScript: `
Write-Log "Driver restart is self-contained. No undo needed." "Yellow"`,
    },
    {
      id: "reset-resolution",
      label: "Reset to Native Resolution",
      description: "Sets the display to its native recommended resolution",
      script: `
$monitor = Get-WmiObject Win32_DesktopMonitor
if ($monitor) {
  Write-Log "Current display detected. Use Display Settings to set native resolution."
  Start-Process "ms-settings:display"
}`,
      undoScript: `
Write-Log "Resolution changes are user preferences. No undo needed." "Yellow"`,
    },
    {
      id: "clear-cache",
      label: "Clear Display Cache",
      description: "Clears the display settings cache that can cause resolution problems",
      script: `
$displayCache = "$env:LOCALAPPDATA\\Microsoft\\Windows\\Caches"
if (Test-Path $displayCache) {
  Remove-Item -Path "$displayCache\\*" -Recurse -Force -ErrorAction SilentlyContinue
  Write-Log "Display cache cleared"
}`,
      undoScript: `
Write-Log "Display cache will rebuild automatically." "Yellow"`,
    },
    {
      id: "reset-color",
      label: "Reset Color Calibration",
      description: "Resets color profile to default Windows settings",
      script: `
$backupPath = "$env:TEMP\\Fixelo_ColorProfile_$(Get-Date -Format 'yyyyMMdd_HHmmss').reg"
reg export "HKCU\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\ICM" $backupPath /y 2>$null
Write-Log "Color profile backed up to: $backupPath" "Cyan"
Remove-Item -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\ICM\\*" -Recurse -Force -ErrorAction SilentlyContinue
Write-Log "Color calibration reset to default"`,
      undoScript: `
Write-Log "Restore color calibration by double-clicking the .reg backup saved to your TEMP folder." "Yellow"`,
    },
    {
      id: "disable-hdr",
      label: "Disable HDR (if causing issues)",
      description: "Turns off HDR which can cause black screens on some monitors",
      script: `
New-Item -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\HDR" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\HDR" -Name "AllowHDR" -Value 0 -Type DWord -ErrorAction SilentlyContinue
Write-Log "HDR disabled"`,
      undoScript: `
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\HDR" -Name "AllowHDR" -Value 1 -Type DWord -ErrorAction SilentlyContinue
Write-Log "HDR re-enabled"`,
    },
    {
      id: "detect-monitors",
      label: "Redetect All Monitors",
      description: "Forces Windows to redetect connected monitors",
      script: `
Write-Log "Scanning for hardware changes..."
pnputil /scan-devices
Write-Log "Monitor redetection initiated. Check Display Settings if monitors are not detected."`,
      undoScript: `
Write-Log "Hardware scan is self-contained. No undo needed." "Yellow"`,
    },
  ],

  "printer-fix": [
    {
      id: "restart-spooler",
      label: "Restart Print Spooler",
      description: "Stops and restarts the print spooler service",
      script: `
Stop-Service -Name "Spooler" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
Start-Service -Name "Spooler"
Write-Log "Print spooler restarted"`,
      undoScript: `
Write-Log "Spooler restart is self-contained. No undo needed." "Yellow"`,
    },
    {
      id: "clear-queue",
      label: "Clear Print Queue",
      description: "Deletes all stuck print jobs from the queue",
      script: `
Stop-Service -Name "Spooler" -Force -ErrorAction SilentlyContinue
$spoolPath = "$env:WINDIR\\System32\\spool\\PRINTERS"
if (Test-Path $spoolPath) {
  Get-ChildItem -Path $spoolPath -Force -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
  Write-Log "Print queue cleared"
}
Start-Service -Name "Spooler"`,
      undoScript: `
Write-Log "Cleared print jobs cannot be restored. Resubmit them manually." "Yellow"`,
    },
    {
      id: "reregister-dlls",
      label: "Re-register Printer DLLs",
      description: "Re-registers core printing DLL files",
      script: `
$dlls = @("winspool.drv", "spoolss.dll", "localspl.dll", "printfilterpipelineprxy.dll")
foreach ($dll in $dlls) {
  regsvr32 /s "$env:WINDIR\\System32\\$dll"
}
Write-Log "Printer DLLs re-registered"`,
      undoScript: `
Write-Log "DLL re-registration is restorative. No undo needed." "Yellow"`,
    },
    {
      id: "reinstall-driver",
      label: "Reinstall Printer Driver",
      description: "Removes and reinstalls the default printer driver",
      script: `
$printers = Get-WmiObject Win32_Printer
foreach ($p in $printers) {
  if ($p.Default) {
    Write-Log "Default printer: $($p.Name)"
  }
}
Write-Log "Printer driver reinstallation initiated"
Start-Process "ms-settings:printers"`,
      undoScript: `
Write-Log "Driver reinstall is restorative. No undo needed." "Yellow"`,
    },
    {
      id: "restart-service",
      label: "Restart Print Service",
      description: "Stops and starts all print-related services",
      script: `
$services = @("Spooler", "PrintNotify")
foreach ($svc in $services) {
  Restart-Service -Name $svc -Force -ErrorAction SilentlyContinue
  Write-Log "Restarted: $svc"
}`,
      undoScript: `
Write-Log "Service restart is self-contained. No undo needed." "Yellow"`,
    },
  ],

  "usb-device-fix": [
    {
      id: "reset-controllers",
      label: "Reset USB Controllers",
      description: "Rescans USB controllers to fix detection issues (safe — no devices disabled)",
      script: `
Write-Log "Scanning for USB hardware changes..."
pnputil /scan-devices
Write-Log "USB controller rescan initiated"`,
      undoScript: `
Write-Log "USB controller rescan is self-contained. No undo needed." "Yellow"`,
    },
    {
      id: "clear-cache",
      label: "Clear USB Device Cache",
      description: "Removes cached USB device information that can cause conflicts",
      script: `
$usbCache = "HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\USB"
$usbStore = "HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\USBSTOR"
foreach ($path in @($usbCache, $usbStore)) {
  if (Test-Path $path) {
    Get-ChildItem -Path $path -ErrorAction SilentlyContinue | ForEach-Object {
      $sub = $_.PSPath
      if (Test-Path "$sub\\Device Parameters") {
        Remove-ItemProperty -Path "$sub\\Device Parameters" -Name "DeviceStatus" -ErrorAction SilentlyContinue
      }
    }
  }
}
Write-Log "USB device cache cleared"`,
      undoScript: `
Write-Log "USB cache will rebuild automatically when devices are reconnected." "Yellow"`,
    },
    {
      id: "reinstall-drivers",
      label: "Refresh USB Drivers",
      description: "Rescans and refreshes USB controller drivers",
      script: `
Write-Log "Refreshing USB drivers..."
pnputil /scan-devices
Write-Log "USB driver refresh initiated"`,
      undoScript: `
Write-Log "Driver refresh is self-contained. No undo needed." "Yellow"`,
    },
    {
      id: "power-management",
      label: "Disable USB Power Management",
      description: "Stops Windows from turning off USB ports to save power",
      script: `
$usbControllers = Get-WmiObject Win32_PnPEntity | Where-Object { $_.Name -match "USB.*Controller|USB.*Root" -and $_.ConfigManagerErrorCode -eq 0 }
foreach ($ctrl in $usbControllers) {
  $pnpPath = "HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\$($ctrl.PNPDeviceID)\\Device Parameters"
  if (Test-Path $pnpPath) {
    Set-ItemProperty -Path $pnpPath -Name "PowerManagementEnabled" -Value 0 -Type DWord -ErrorAction SilentlyContinue
  }
}
Write-Log "USB power management disabled"`,
      undoScript: `
$usbControllers = Get-WmiObject Win32_PnPEntity | Where-Object { $_.Name -match "USB.*Controller|USB.*Root" -and $_.ConfigManagerErrorCode -eq 0 }
foreach ($ctrl in $usbControllers) {
  $pnpPath = "HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\$($ctrl.PNPDeviceID)\\Device Parameters"
  if (Test-Path $pnpPath) {
    Remove-ItemProperty -Path $pnpPath -Name "PowerManagementEnabled" -ErrorAction SilentlyContinue
  }
}
Write-Log "USB power management restored to default"`,
    },
    {
      id: "reinstall-hubs",
      label: "Refresh USB Root Hubs",
      description: "Rescans USB root hub devices",
      script: `
Write-Log "Refreshing USB root hubs..."
pnputil /scan-devices
Write-Log "USB root hub refresh initiated"`,
      undoScript: `
Write-Log "USB hub refresh is self-contained. No undo needed." "Yellow"`,
    },
  ],

  "new-pc-setup": [
    {
      id: "remove-bloatware",
      label: "Remove Bloatware",
      description: "Unlocks and removes common manufacturer bloatware and pre-installed junk apps",
      script: `
$bloatware = @(
  "Microsoft.BingWeather", "Microsoft.GetHelp", "Microsoft.Getstarted",
  "Microsoft.Messaging", "Microsoft.Microsoft3DViewer", "Microsoft.MicrosoftOfficeHub",
  "Microsoft.MixedReality.Portal", "Microsoft.Office.OneNote", "Microsoft.OneConnect",
  "Microsoft.People", "Microsoft.Print3D", "Microsoft.SkypeApp",
  "Microsoft.Wallet", "Microsoft.WindowsAlarms", "Microsoft.WindowsCamera",
  "Microsoft.WindowsCommunicationsApps", "Microsoft.WindowsFeedbackHub",
  "Microsoft.WindowsMaps", "Microsoft.WindowsSoundRecorder", "Microsoft.XboxApp",
  "Microsoft.XboxGameCallableUI", "Microsoft.XboxGamingOverlay", "Microsoft.XboxIdentityProvider",
  "Microsoft.XboxSpeechToTextOverlay", "Microsoft.Xbox.TCUI", "Microsoft.YourPhone",
  "Microsoft.ZuneMusic", "Microsoft.ZuneVideo"
)
foreach ($app in $bloatware) {
  $pkg = Get-AppxPackage -Name $app -ErrorAction SilentlyContinue
  if ($pkg) {
    Remove-AppxPackage -Package $pkg -ErrorAction SilentlyContinue
    Write-Log "Removed: $app"
  }
}
Write-Log "Bloatware removal completed"`,
      undoScript: `
Write-Log "Bloatware removal cannot be trivially undone. Reinstall apps from Microsoft Store if needed." "Yellow"`,
    },
    {
      id: "install-software",
      label: "Install Essential Software via Winget",
      description: "Installs browsers, media players, utilities, and productivity apps",
      script: `
$apps = @("Mozilla.Firefox", "VideoLAN.VLC", "7zip.7zip", "Microsoft.PowerToys")
foreach ($app in $apps) {
  Write-Log "Installing $app..."
  winget install --id $app --silent --accept-package-agreements --accept-source-agreements -ErrorAction SilentlyContinue
}
Write-Log "Software installation completed"`,
      undoScript: `
Write-Log "Installed software can be uninstalled via Settings > Apps > Installed apps." "Yellow"`,
    },
    {
      id: "privacy-settings",
      label: "Apply Privacy Settings",
      description: "Disables telemetry, advertising ID, and tracking",
      script: `
New-Item -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" -Force | Out-Null
Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" -Name "AllowTelemetry" -Value 0 -Type DWord
New-Item -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\AdvertisingInfo" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\AdvertisingInfo" -Name "Enabled" -Value 0 -Type DWord
Write-Log "Privacy settings applied"`,
      undoScript: `
Remove-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" -Name "AllowTelemetry" -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\AdvertisingInfo" -Name "Enabled" -Value 1 -Type DWord
Write-Log "Privacy settings restored to default"`,
    },
    {
      id: "performance-settings",
      label: "Apply Performance Settings",
      description: "Disables unnecessary visual effects, background apps, and scheduled tasks",
      script: `
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects" -Name "VisualFXSetting" -Value 2 -Type DWord
New-Item -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications" -Name "GlobalUserDisabled" -Value 1 -Type DWord
Write-Log "Performance settings applied"`,
      undoScript: `
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects" -Name "VisualFXSetting" -Value 0 -Type DWord
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications" -Name "GlobalUserDisabled" -Value 0 -Type DWord
Write-Log "Performance settings restored to default"`,
    },
    {
      id: "dark-mode",
      label: "Enable Dark Mode",
      description: "Sets system-wide dark mode for all Windows elements and apps",
      script: `
New-Item -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "SystemUsesLightTheme" -Value 0 -Type DWord
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "AppsUseLightTheme" -Value 0 -Type DWord
Write-Log "Dark mode enabled"`,
      undoScript: `
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "SystemUsesLightTheme" -Value 1 -Type DWord
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "AppsUseLightTheme" -Value 1 -Type DWord
Write-Log "Light mode restored"`,
    },
    {
      id: "disable-onedrive",
      label: "Disable OneDrive at Startup",
      description: "Prevents OneDrive from launching at startup",
      script: `
Remove-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "OneDrive" -ErrorAction SilentlyContinue
Write-Log "OneDrive startup disabled"`,
      undoScript: `
$onedrive = [Environment]::GetEnvironmentVariable("LOCALAPPDATA") + "\\Microsoft\\OneDrive\\OneDrive.exe"
if (Test-Path $onedrive) {
  Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "OneDrive" -Value $onedrive
  Write-Log "OneDrive startup restored"
}`,
    },
  ],

  "winget-installer": [
    {
      id: "browsers",
      label: "Browsers (Firefox, Chrome, Brave)",
      description: "Installs popular web browsers",
      script: `
$apps = @("Mozilla.Firefox", "Google.Chrome", "Brave.Brave")
foreach ($app in $apps) {
  Write-Log "Installing $app..."
  winget install --id $app --silent --accept-package-agreements --accept-source-agreements -ErrorAction SilentlyContinue
}
Write-Log "Browser installation completed"`,
      undoScript: `
Write-Log "Uninstall browsers via Settings > Apps > Installed apps." "Yellow"`,
    },
    {
      id: "media",
      label: "Media (VLC, Spotify, iTunes)",
      description: "Installs media players and streaming apps",
      script: `
$apps = @("VideoLAN.VLC", "Spotify.Spotify", "Apple.iTunes")
foreach ($app in $apps) {
  Write-Log "Installing $app..."
  winget install --id $app --silent --accept-package-agreements --accept-source-agreements -ErrorAction SilentlyContinue
}
Write-Log "Media app installation completed"`,
      undoScript: `
Write-Log "Uninstall media apps via Settings > Apps > Installed apps." "Yellow"`,
    },
    {
      id: "utils",
      label: "Utilities (7-Zip, Everything, PowerToys)",
      description: "Installs essential utility tools",
      script: `
$apps = @("7zip.7zip", "voidtools.Everything", "Microsoft.PowerToys")
foreach ($app in $apps) {
  Write-Log "Installing $app..."
  winget install --id $app --silent --accept-package-agreements --accept-source-agreements -ErrorAction SilentlyContinue
}
Write-Log "Utility installation completed"`,
      undoScript: `
Write-Log "Uninstall utilities via Settings > Apps > Installed apps." "Yellow"`,
    },
    {
      id: "communication",
      label: "Communication (Discord, Zoom, Telegram)",
      description: "Installs messaging and video call apps",
      script: `
$apps = @("Discord.Discord", "Zoom.Zoom", "Telegram.TelegramDesktop")
foreach ($app in $apps) {
  Write-Log "Installing $app..."
  winget install --id $app --silent --accept-package-agreements --accept-source-agreements -ErrorAction SilentlyContinue
}
Write-Log "Communication app installation completed"`,
      undoScript: `
Write-Log "Uninstall communication apps via Settings > Apps > Installed apps." "Yellow"`,
    },
    {
      id: "productivity",
      label: "Productivity (Notion, Obsidian, LibreOffice)",
      description: "Installs productivity and office tools",
      script: `
$apps = @("Notion.Notion", "Obsidian.Obsidian", "TheDocumentFoundation.LibreOffice")
foreach ($app in $apps) {
  Write-Log "Installing $app..."
  winget install --id $app --silent --accept-package-agreements --accept-source-agreements -ErrorAction SilentlyContinue
}
Write-Log "Productivity app installation completed"`,
      undoScript: `
Write-Log "Uninstall productivity apps via Settings > Apps > Installed apps." "Yellow"`,
    },
    {
      id: "dev-tools",
      label: "Dev Tools (Git, VS Code, Python, Node.js)",
      description: "Installs development tools and languages",
      script: `
$apps = @("Git.Git", "Microsoft.VisualStudioCode", "Python.Python.3.13", "OpenJS.NodeJS.LTS")
foreach ($app in $apps) {
  Write-Log "Installing $app..."
  winget install --id $app --silent --accept-package-agreements --accept-source-agreements -ErrorAction SilentlyContinue
}
Write-Log "Dev tool installation completed"`,
      undoScript: `
Write-Log "Uninstall dev tools via Settings > Apps > Installed apps." "Yellow"`,
    },
  ],

  "dev-environment": [
    {
      id: "git",
      label: "Install Git",
      description: "Installs Git for version control",
      script: `
winget install --id Git.Git --silent --accept-package-agreements --accept-source-agreements -ErrorAction SilentlyContinue
Write-Log "Git installed"`,
      undoScript: `
Write-Log "Uninstall Git via Settings > Apps > Installed apps." "Yellow"`,
    },
    {
      id: "nodejs",
      label: "Install Node.js (LTS)",
      description: "Installs Node.js LTS for JavaScript development",
      script: `
winget install --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements -ErrorAction SilentlyContinue
Write-Log "Node.js installed"`,
      undoScript: `
Write-Log "Uninstall Node.js via Settings > Apps > Installed apps." "Yellow"`,
    },
    {
      id: "python",
      label: "Install Python",
      description: "Installs Python 3 for scripting and development",
      script: `
winget install --id Python.Python.3.13 --silent --accept-package-agreements --accept-source-agreements -ErrorAction SilentlyContinue
Write-Log "Python installed"`,
      undoScript: `
Write-Log "Uninstall Python via Settings > Apps > Installed apps." "Yellow"`,
    },
    {
      id: "vscode",
      label: "Install VS Code",
      description: "Installs Visual Studio Code with recommended extensions",
      script: `
winget install --id Microsoft.VisualStudioCode --silent --accept-package-agreements --accept-source-agreements -ErrorAction SilentlyContinue
Write-Log "VS Code installed"`,
      undoScript: `
Write-Log "Uninstall VS Code via Settings > Apps > Installed apps." "Yellow"`,
    },
    {
      id: "terminal",
      label: "Install Windows Terminal",
      description: "Installs the modern Windows Terminal",
      script: `
winget install --id Microsoft.WindowsTerminal --silent --accept-package-agreements --accept-source-agreements -ErrorAction SilentlyContinue
Write-Log "Windows Terminal installed"`,
      undoScript: `
Write-Log "Uninstall Windows Terminal via Settings > Apps > Installed apps." "Yellow"`,
    },
    {
      id: "wsl",
      label: "Install WSL with Ubuntu",
      description: "Sets up Windows Subsystem for Linux with Ubuntu distribution",
      script: `
wsl --install -d Ubuntu -ErrorAction SilentlyContinue
if ($?) { Write-Log "WSL with Ubuntu installed" }
else { Write-Log "WSL installation may require a reboot to complete." "Yellow" }`,
      undoScript: `
wsl --unregister Ubuntu -ErrorAction SilentlyContinue
wsl --shutdown -ErrorAction SilentlyContinue
Write-Log "WSL Ubuntu unregistered"`,
    },
  ],

  "dark-mode-setup": [
    {
      id: "system-dark",
      label: "Enable System Dark Mode",
      description: "Sets Windows to dark mode for taskbar, Start Menu, and Settings",
      script: `
New-Item -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "SystemUsesLightTheme" -Value 0 -Type DWord
Write-Log "System dark mode enabled"`,
      undoScript: `
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "SystemUsesLightTheme" -Value 1 -Type DWord
Write-Log "System light mode restored"`,
    },
    {
      id: "app-dark",
      label: "Set Default App Mode to Dark",
      description: "Makes all supported apps use dark theme",
      script: `
New-Item -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "AppsUseLightTheme" -Value 0 -Type DWord
Write-Log "App dark mode enabled"`,
      undoScript: `
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "AppsUseLightTheme" -Value 1 -Type DWord
Write-Log "App light mode restored"`,
    },
    {
      id: "file-explorer",
      label: "Dark Mode for File Explorer",
      description: "Applies dark theme to File Explorer windows",
      script: `
New-Item -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "SystemUsesLightTheme" -Value 0 -Type DWord
Write-Log "File Explorer dark mode enabled (follows system theme)"`,
      undoScript: `
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "SystemUsesLightTheme" -Value 1 -Type DWord
Write-Log "File Explorer light mode restored"`,
    },
    {
      id: "disable-light",
      label: "Disable Light Theme Entirely",
      description: "Removes the light theme option so no apps can accidentally switch",
      script: `
New-Item -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Personalization" -Force | Out-Null
Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Personalization" -Name "NoThemesTab" -Value 1 -Type DWord
Write-Log "Light theme disabled"`,
      undoScript: `
Remove-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Personalization" -Name "NoThemesTab" -ErrorAction SilentlyContinue
Write-Log "Theme options restored"`,
    },
    {
      id: "wallpaper",
      label: "Set Dark Wallpaper",
      description: "Sets a dark wallpaper that matches the dark theme",
      script: `
$wallpaperPath = "$env:WINDIR\\Web\\Wallpaper\\Theme2\\img1.jpg"
if (Test-Path $wallpaperPath) {
  Set-ItemProperty -Path "HKCU:\\Control Panel\\Desktop" -Name "Wallpaper" -Value $wallpaperPath
  New-Item -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" -Force | Out-Null
  Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" -Name "WallpaperStyle" -Value 10 -Type DWord
  Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" -Name "TileWallpaper" -Value 0 -Type DWord
  Write-Log "Dark wallpaper set"
} else {
  Write-Log "Default dark wallpaper not found" "Yellow"
}`,
      undoScript: `
Set-ItemProperty -Path "HKCU:\\Control Panel\\Desktop" -Name "Wallpaper" -Value ""
Write-Log "Wallpaper reset to default"`,
    },
  ],

  "taskbar-customizer": [
    {
      id: "hide-search",
      label: "Hide Search Bar",
      description: "Removes the search bar from the taskbar to save space",
      script: `
New-Item -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Search" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Search" -Name "SearchboxTaskbarMode" -Value 0 -Type DWord
Write-Log "Search bar hidden"`,
      undoScript: `
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Search" -Name "SearchboxTaskbarMode" -Value 1 -Type DWord
Write-Log "Search bar restored"`,
    },
    {
      id: "hide-task-view",
      label: "Hide Task View Button",
      description: "Removes the Task View button from the taskbar",
      script: `
New-Item -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "ShowTaskViewButton" -Value 0 -Type DWord
Write-Log "Task View button hidden"`,
      undoScript: `
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "ShowTaskViewButton" -Value 1 -Type DWord
Write-Log "Task View button restored"`,
    },
    {
      id: "hide-cortana",
      label: "Hide Cortana Button",
      description: "Removes the Cortana button from the taskbar",
      script: `
New-Item -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "ShowCortanaButton" -Value 0 -Type DWord
Write-Log "Cortana button hidden"`,
      undoScript: `
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "ShowCortanaButton" -Value 1 -Type DWord
Write-Log "Cortana button restored"`,
    },
    {
      id: "hide-widgets",
      label: "Hide Widgets Button",
      description: "Removes the Widgets button (Windows 11)",
      script: `
New-Item -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "TaskbarDa" -Value 0 -Type DWord
Write-Log "Widgets button hidden"`,
      undoScript: `
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "TaskbarDa" -Value 1 -Type DWord
Write-Log "Widgets button restored"`,
    },
    {
      id: "hide-chat",
      label: "Hide Chat Icon",
      description: "Removes the Teams Chat icon from the taskbar (Windows 11)",
      script: `
New-Item -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "TaskbarMn" -Value 0 -Type DWord
Write-Log "Chat icon hidden"`,
      undoScript: `
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "TaskbarMn" -Value 1 -Type DWord
Write-Log "Chat icon restored"`,
    },
    {
      id: "small-icons",
      label: "Use Small Taskbar Icons",
      description: "Makes taskbar icons smaller to save vertical space",
      script: `
New-Item -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "TaskbarSmallIcons" -Value 1 -Type DWord
Write-Log "Small taskbar icons enabled"`,
      undoScript: `
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "TaskbarSmallIcons" -Value 0 -Type DWord
Write-Log "Default taskbar icon size restored"`,
    },
  ],

  "parental-controls": [
    {
      id: "time-limits",
      label: "Set Screen Time Limits",
      description: "Limits computer usage to specific hours",
      script: `
Write-Log "Screen time limits are managed via family.microsoft.com"
Start-Process "https://account.microsoft.com/family"
Write-Log "Open the link above to set time limits for each child account." "Yellow"`,
      undoScript: `
Write-Log "Time limits are managed via family.microsoft.com. Remove them there." "Yellow"`,
    },
    {
      id: "block-apps",
      label: "Block Specific Apps",
      description: "Prevents access to specified applications",
      script: `
Write-Log "App restrictions are managed via family.microsoft.com"
Start-Process "https://account.microsoft.com/family"
Write-Log "Open the link above to block specific apps for child accounts." "Yellow"`,
      undoScript: `
Write-Log "App blocks are managed via family.microsoft.com. Remove them there." "Yellow"`,
    },
    {
      id: "web-filter",
      label: "Enable Web Filtering",
      description: "Blocks inappropriate websites and enables SafeSearch",
      script: `
Write-Log "Web filtering is managed via family.microsoft.com"
Start-Process "https://account.microsoft.com/family"
Write-Log "Open the link above to enable web filtering." "Yellow"`,
      undoScript: `
Write-Log "Web filtering is managed via family.microsoft.com. Disable it there." "Yellow"`,
    },
    {
      id: "block-store",
      label: "Block Microsoft Store Purchases",
      description: "Prevents purchases and downloads from the Microsoft Store",
      script: `
New-Item -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Store" -Force | Out-Null
Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Store" -Name "RequirePinToInstall" -Value 1 -Type DWord
Write-Log "Store purchases blocked (PIN required for installs)"`,
      undoScript: `
Remove-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Store" -Name "RequirePinToInstall" -ErrorAction SilentlyContinue
Write-Log "Store purchase PIN requirement removed"`,
    },
    {
      id: "activity-reports",
      label: "Enable Activity Reports",
      description: "Turns on weekly activity reports",
      script: `
Write-Log "Activity reports are managed via family.microsoft.com"
Start-Process "https://account.microsoft.com/family"
Write-Log "Open the link above to enable weekly activity reports." "Yellow"`,
      undoScript: `
Write-Log "Activity reports are managed via family.microsoft.com. Disable them there." "Yellow"`,
    },
  ],

  "auto-shutdown": [
    {
      id: "action",
      label: "Action: Shut Down",
      description: "Choose shutdown, restart, or hibernate",
      script: `
schtasks /create /tn "Fixelo_ScheduledShutdown" /tr "shutdown.exe /s /t 60 /c 'Fixelo scheduled shutdown'" /sc daily /st 23:00 /f | Out-Null
Write-Log "Scheduled shutdown set for 23:00 daily"`,
      undoScript: `
schtasks /delete /tn "Fixelo_ScheduledShutdown" /f | Out-Null
Write-Log "Scheduled shutdown removed"`,
    },
    {
      id: "shutdown-time",
      label: "Shutdown Time",
      description: "The time to automatically shut down",
      type: "time",
      script: `
schtasks /create /tn "Fixelo_ScheduledTask" /tr "shutdown.exe /s /t 60 /c 'Fixelo scheduled shutdown'" /sc daily /st 23:00 /f | Out-Null
Write-Log "Scheduled task created for 23:00 daily"`,
      undoScript: `
schtasks /delete /tn "Fixelo_ScheduledTask" /f | Out-Null
Write-Log "Scheduled task removed"`,
    },
    {
      id: "daily",
      label: "Run Every Day",
      description: "Schedules the task to run every day",
      script: `
Write-Log "Task already configured for daily schedule"`,
      undoScript: `
Write-Log "Modify schedule via Task Scheduler (taskschd.msc)" "Yellow"`,
    },
    {
      id: "weekdays",
      label: "Run on Weekdays Only",
      description: "Schedules the task Monday through Friday only",
      script: `
schtasks /create /tn "Fixelo_ScheduledShutdown" /tr "shutdown.exe /s /t 60" /sc weekly /d MON,TUE,WED,THU,FRI /st 23:00 /f | Out-Null
Write-Log "Scheduled shutdown set for weekdays at 23:00"`,
      undoScript: `
schtasks /delete /tn "Fixelo_ScheduledShutdown" /f | Out-Null
Write-Log "Scheduled shutdown removed"`,
    },
    {
      id: "force-close",
      label: "Force Close Applications",
      description: "Forces running applications to close before shutdown",
      script: `
reg add "HKCU\\Control Panel\\Desktop" /v AutoEndTasks /t REG_SZ /d 1 /f | Out-Null
Write-Log "Auto-end tasks enabled"`,
      undoScript: `
reg add "HKCU\\Control Panel\\Desktop" /v AutoEndTasks /t REG_SZ /d 0 /f | Out-Null
Write-Log "Auto-end tasks disabled"`,
    },
    {
      id: "warning",
      label: "Show 5-Minute Warning",
      description: "Displays a warning message 5 minutes before shutdown",
      script: `
msg * "Fixelo: Your PC will shut down in 5 minutes. Save your work." | Out-Null
shutdown /a | Out-Null
shutdown /s /t 300 /c "Fixelo: Your PC will shut down in 5 minutes. Save your work." | Out-Null
Write-Log "Shutdown warning set"`,
      undoScript: `
shutdown /a | Out-Null
Write-Log "Shutdown aborted"`,
    },
  ],

  "auto-backup": [
    {
      id: "source-folder",
      label: "Source Folder",
      description: "The folder to back up",
      type: "text",
      script: `
$source = "C:\\Users\\YourName\\Documents"
$dest = "D:\\Backup"
Write-Log "Starting backup from $source to $dest..."
robocopy $source $dest /MIR /R:2 /W:5 /NP /NDL /NJH /NJS
Write-Log "Backup completed"`,
      undoScript: `
Write-Log "Backup is a copy operation. Original files are unaffected." "Yellow"`,
    },
    {
      id: "backup-destination",
      label: "Backup Destination",
      description: "Where to store the backup",
      type: "text",
      script: `
Write-Log "Backup destination configured. Run scheduled task to execute."`,
      undoScript: `
Write-Log "Remove backup destination folder manually if needed." "Yellow"`,
    },
    {
      id: "daily-backup",
      label: "Daily Backup",
      description: "Runs the backup task every day",
      script: `
schtasks /create /tn "Fixelo_Backup" /tr "powershell.exe -Command \"robocopy C:\\Users\\YourName\\Documents D:\\Backup /MIR /R:2 /W:5 /NP /NDL /NJH /NJS\"" /sc daily /st 02:00 /f | Out-Null
Write-Log "Daily backup task created for 02:00"`,
      undoScript: `
schtasks /delete /tn "Fixelo_Backup" /f | Out-Null
Write-Log "Daily backup task removed"`,
    },
    {
      id: "incremental",
      label: "Incremental Backups Only",
      description: "Only copies files that have changed since the last backup",
      script: `
Write-Log "Robocopy /MIR provides incremental-like behavior (only copies changed files)"`,
      undoScript: `
Write-Log "Backup mode is a preference. No undo needed." "Yellow"`,
    },
    {
      id: "mirror",
      label: "Mirror Mode",
      description: "Keeps backup as an exact mirror (deletes removed files)",
      script: `
Write-Log "Mirror mode enabled via robocopy /MIR flag"`,
      undoScript: `
Write-Log "Change backup mode by modifying the scheduled task." "Yellow"`,
    },
    {
      id: "retain-deleted",
      label: "Keep Deleted Files for 30 Days",
      description: "Moves deleted files to a separate folder instead of permanently deleting them",
      script: `
Write-Log "Retention policy: deleted files are preserved for 30 days in a separate archive folder."`,
      undoScript: `
Write-Log "Retention policy is a preference. Modify the backup script if needed." "Yellow"`,
    },
    {
      id: "create-log",
      label: "Create Backup Log",
      description: "Saves a detailed log of what was backed up each time",
      script: `
Write-Log "Backup logging enabled. Logs saved alongside backup destination."`,
      undoScript: `
Write-Log "Log files can be deleted manually." "Yellow"`,
    },
  ],

  "driver-manager": [
    {
      id: "scan-all",
      label: "Scan All Drivers",
      description: "Lists all installed drivers with their versions",
      script: `
Write-Log "Installed drivers:"
Get-WmiObject Win32_PnPSignedDriver | Select-Object DeviceName, DriverVersion, DriverDate | Format-Table -AutoSize -ErrorAction SilentlyContinue
Write-Log "Driver scan completed"`,
      undoScript: `
Write-Log "Driver scan is read-only. No undo needed." "Yellow"`,
    },
    {
      id: "identify-outdated",
      label: "Identify Outdated Drivers",
      description: "Flags drivers that are significantly outdated",
      script: `
Write-Log "Checking driver dates..."
$oldDrivers = Get-WmiObject Win32_PnPSignedDriver | Where-Object { $_.DriverDate -and $_.DriverDate -lt [DateTime]"2023-01-01" }
if ($oldDrivers) {
  Write-Log "Potentially outdated drivers:"
  foreach ($d in $oldDrivers) { Write-Log "$($d.DeviceName) - $($d.DriverDate)" }
} else {
  Write-Log "No significantly outdated drivers found"
}`,
      undoScript: `
Write-Log "Driver identification is read-only. No undo needed." "Yellow"`,
    },
    {
      id: "update-gpu",
      label: "Update GPU Driver",
      description: "Downloads and installs the latest GPU driver",
      script: `
Write-Log "Checking for GPU driver update..."
$gpu = Get-WmiObject Win32_PnPEntity | Where-Object { $_.Name -match "NVIDIA|AMD|Intel.*Graphics" -and $_.ConfigManagerErrorCode -eq 0 }
if ($gpu) {
  foreach ($d in $gpu) { Write-Log "Found: $($d.Name)" }
}
Write-Log "Visit the GPU manufacturer's website for the latest driver." "Yellow"`,
      undoScript: `
Write-Log "Driver updates are cumulative. Roll back via Device Manager if needed." "Yellow"`,
    },
    {
      id: "update-network",
      label: "Update Network Driver",
      description: "Updates the network adapter driver",
      script: `
Write-Log "Checking for network driver update..."
$net = Get-WmiObject Win32_PnPEntity | Where-Object { $_.Name -match "Network|Ethernet|WiFi|Wireless" -and $_.ConfigManagerErrorCode -eq 0 }
if ($net) {
  foreach ($d in $net) { Write-Log "Found: $($d.Name)" }
}
Write-Log "Visit the manufacturer's website for the latest network driver." "Yellow"`,
      undoScript: `
Write-Log "Driver updates are cumulative. Roll back via Device Manager if needed." "Yellow"`,
    },
    {
      id: "update-audio",
      label: "Update Audio Driver",
      description: "Updates the audio driver to the latest version",
      script: `
Write-Log "Checking for audio driver update..."
$audio = Get-WmiObject Win32_PnPEntity | Where-Object { $_.Name -match "Audio|Sound|Realtek|High Definition" -and $_.ConfigManagerErrorCode -eq 0 }
if ($audio) {
  foreach ($d in $audio) { Write-Log "Found: $($d.Name)" }
}
Write-Log "Visit the manufacturer's website for the latest audio driver." "Yellow"`,
      undoScript: `
Write-Log "Driver updates are cumulative. Roll back via Device Manager if needed." "Yellow"`,
    },
  ],
}
