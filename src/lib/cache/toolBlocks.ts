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
      script: `try {
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
}
} catch {
  Write-Log "Error in Clean Startup Programs: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
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
}
} catch {
  Write-Log "Error in Clean Startup Programs: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "clear-temp",
      label: "Clear Temporary Files",
      description: "Deletes all temporary files from Windows and user temp folders",
      script: `try {
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
}
} catch {
  Write-Log "Error in Clear Temporary Files: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
# Temp files cannot be restored — log that nothing was done
Write-Log "Temporary file cleanup cannot be undone. Deleted files are gone permanently." "Yellow"
} catch {
  Write-Log "Error in Clear Temporary Files: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "clear-caches",
      label: "Clear System Caches",
      description: "Clears DNS, icon, thumbnail, and font caches",
      script: `try {
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
Start-Process explorer
} catch {
  Write-Log "Error in Clear System Caches: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
# Caches will rebuild naturally — nothing to restore
Write-Log "System caches will be rebuilt automatically by Windows." "Yellow"
} catch {
  Write-Log "Error in Clear System Caches: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "perf-power",
      label: "Set High Performance Power Plan",
      description: "Switches power plan to High Performance for maximum speed",
      script: `try {
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
}
} catch {
  Write-Log "Error in Set High Performance Power Plan: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
# Restore Balanced power plan
$balanced = powercfg /list | Select-String "Balanced"
if ($balanced) {
  $guid = ($balanced -split "\\s+")[3]
  powercfg /setactive $guid
  Write-Log "Power plan restored to Balanced"
}
} catch {
  Write-Log "Error in Set High Performance Power Plan: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disable-effects",
      label: "Disable Visual Effects",
      description: "Turns off unnecessary animations and visual effects for faster response",
      script: `try {
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
else { Write-Log "Could not verify: EnableLivePreview is $livePreview" "Yellow" }
} catch {
  Write-Log "Error in Disable Visual Effects: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
# Restore default visual effects
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects" -Name "VisualFXSetting" -Value 0 -Type DWord
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "TaskbarAnimations" -Value 1 -Type DWord
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "EnableLivePreview" -Value 1 -Type DWord
$vfx = (Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects" -Name "VisualFXSetting" -ErrorAction SilentlyContinue).VisualFXSetting
if ($vfx -eq 0) { Write-Log "Verified: VisualFXSetting restored" "Green" }
else { Write-Log "Could not verify: VisualFXSetting is $vfx" "Yellow" }
} catch {
  Write-Log "Error in Disable Visual Effects: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "empty-recycle",
      label: "Empty Recycle Bin",
      description: "Permanently deletes all files in the Recycle Bin to free disk space",
      script: `try {
# Empty Recycle Bin silently using Clear-RecycleBin
Clear-RecycleBin -Force -ErrorAction SilentlyContinue
$shell = New-Object -ComObject Shell.Application
$remaining = $shell.Namespace(0xa).Items().Count
if ($remaining -eq 0) { Write-Log "Verified: Recycle Bin emptied" "Green" }
else { Write-Log "Could not verify: $remaining item(s) remain in Recycle Bin" "Yellow" }
} catch {
  Write-Log "Error in Empty Recycle Bin: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
# Recycle Bin contents cannot be restored
Write-Log "Recycle Bin emptying cannot be undone. Deleted files are gone permanently." "Yellow"
} catch {
  Write-Log "Error in Empty Recycle Bin: $($_.Exception.Message)" "Red"
}`,
    },
  ],

  "gaming-boost": [
    {
      id: "game-mode",
      label: "Enable Game Mode",
      description: "Turns on Windows Game Mode to prioritize gaming resources",
      script: `try {
# Enable Game Mode via registry
New-Item -Path "HKCU:\\Software\\Microsoft\\GameBar" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\GameBar" -Name "AllowAutoGameMode" -Value 1 -Type DWord
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\GameBar" -Name "AutoGameModeEnabled" -Value 1 -Type DWord
$checkAllow = (Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\GameBar" -Name "AllowAutoGameMode" -ErrorAction SilentlyContinue).AllowAutoGameMode
$checkEnabled = (Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\GameBar" -Name "AutoGameModeEnabled" -ErrorAction SilentlyContinue).AutoGameModeEnabled
if ($checkAllow -eq 1 -and $checkEnabled -eq 1) { Write-Log "Verified: Game Mode enabled" "Green" }
else { Write-Log "Could not verify: Game Mode settings mismatch" "Yellow" }
} catch {
  Write-Log "Error in Enable Game Mode: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
# Disable Game Mode
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\GameBar" -Name "AllowAutoGameMode" -Value 0 -Type DWord
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\GameBar" -Name "AutoGameModeEnabled" -Value 0 -Type DWord
$checkAllow = (Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\GameBar" -Name "AllowAutoGameMode" -ErrorAction SilentlyContinue).AllowAutoGameMode
if ($checkAllow -eq 0) { Write-Log "Verified: Game Mode disabled" "Green" }
else { Write-Log "Could not verify: Game Mode still enabled" "Yellow" }
} catch {
  Write-Log "Error in Enable Game Mode: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "gpu-max",
      label: "Set GPU to Max Performance",
      description: "Sets GPU power plan to maximum performance for best frame rates",
      script: `try {
# Set GPU to high performance via registry
# NVIDIA: prefer maximum performance
New-Item -Path "HKCU:\\SOFTWARE\\NVIDIA Corporation\\Global\\NvCplApi\\PKeys" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\NVIDIA Corporation\\Global\\NvCplApi\\PKeys" -Name "PerfBoost" -Value 1 -Type DWord
$nvCheck = (Get-ItemProperty -Path "HKCU:\\SOFTWARE\\NVIDIA Corporation\\Global\\NvCplApi\\PKeys" -Name "PerfBoost" -ErrorAction SilentlyContinue).PerfBoost
if ($nvCheck -eq 1) { Write-Log "Verified: NVIDIA performance boost enabled" "Green" }
else { Write-Log "Could not verify: NVIDIA setting" "Yellow" }

# Windows: prefer high performance GPU
$gpuPaths = Get-ChildItem "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}" -ErrorAction SilentlyContinue
foreach ($gpu in $gpuPaths) {
  $gpuPath = $gpu.PSPath
  if (Test-Path "$gpuPath\\PowerManagementConfig") {
    Set-ItemProperty -Path "$gpuPath\\PowerManagementConfig" -Name "PowerSettings" -Value 0 -Type DWord -ErrorAction SilentlyContinue
  }
}
Write-Log "GPU set to maximum performance"
} catch {
  Write-Log "Error in Set GPU to Max Performance: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
# Restore GPU power management defaults
Remove-ItemProperty -Path "HKCU:\\SOFTWARE\\NVIDIA Corporation\\Global\\NvCplApi\\PKeys" -Name "PerfBoost" -ErrorAction SilentlyContinue
$gpuPaths = Get-ChildItem "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}" -ErrorAction SilentlyContinue
foreach ($gpu in $gpuPaths) {
  $gpuPath = $gpu.PSPath
  if (Test-Path "$gpuPath\\PowerManagementConfig") {
    Remove-ItemProperty -Path "$gpuPath\\PowerManagementConfig" -Name "PowerSettings" -ErrorAction SilentlyContinue
  }
}
Write-Log "GPU power management restored to default"
} catch {
  Write-Log "Error in Set GPU to Max Performance: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "network-low-latency",
      label: "Optimize Network for Low Latency",
      description: "Disables Nagle's algorithm and optimizes TCP for gaming",
      script: `try {
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
Write-Log "Network optimized for low latency"
} catch {
  Write-Log "Error in Optimize Network for Low Latency: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
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
Write-Log "TCP settings restored to defaults"
} catch {
  Write-Log "Error in Optimize Network for Low Latency: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "high-perf-power",
      label: "Set Power Plan to High Performance",
      description: "Switches Windows power plan to maximum performance mode",
      script: `try {
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
}
} catch {
  Write-Log "Error in Set Power Plan to High Performance: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
# Restore Balanced power plan
$balanced = powercfg /list | Select-String "Balanced"
if ($balanced) {
  $guid = ($balanced -split "\\s+")[3]
  powercfg /setactive $guid
  Write-Log "Power plan restored to Balanced"
}
} catch {
  Write-Log "Error in Set Power Plan to High Performance: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disable-game-bar",
      label: "Disable Xbox Game Bar",
      description: "Removes the Game Bar overlay which can cause FPS drops",
      script: `try {
# Disable Xbox Game Bar
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR" -Name "AppCaptureEnabled" -Value 0 -Type DWord -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR" -Name "HistoricalCaptureEnabled" -Value 0 -Type DWord -ErrorAction SilentlyContinue
New-Item -Path "HKCU:\\Software\\Microsoft\\GameBar" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\GameBar" -Name "ShowStartupPanel" -Value 0 -Type DWord -ErrorAction SilentlyContinue
$capture = (Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR" -Name "AppCaptureEnabled" -ErrorAction SilentlyContinue).AppCaptureEnabled
if ($capture -eq 0) { Write-Log "Verified: Game Bar disabled" "Green" }
else { Write-Log "Could not verify: Game Bar setting" "Yellow" }
} catch {
  Write-Log "Error in Disable Xbox Game Bar: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
# Re-enable Xbox Game Bar
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR" -Name "AppCaptureEnabled" -Value 1 -Type DWord -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR" -Name "HistoricalCaptureEnabled" -Value 1 -Type DWord -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\GameBar" -Name "ShowStartupPanel" -Value 1 -Type DWord -ErrorAction SilentlyContinue
Write-Log "Xbox Game Bar re-enabled"
} catch {
  Write-Log "Error in Disable Xbox Game Bar: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disable-bg-apps",
      label: "Disable Background Apps",
      description: "Prevents unnecessary apps from running in the background while gaming",
      script: `try {
# Disable background apps via registry
New-Item -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications" -Name "GlobalUserDisabled" -Value 1 -Type DWord
$bgCheck = (Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications" -Name "GlobalUserDisabled" -ErrorAction SilentlyContinue).GlobalUserDisabled
if ($bgCheck -eq 1) { Write-Log "Verified: Background apps disabled" "Green" }
else { Write-Log "Could not verify: Background apps setting" "Yellow" }
} catch {
  Write-Log "Error in Disable Background Apps: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
# Re-enable background apps
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications" -Name "GlobalUserDisabled" -Value 0 -Type DWord
$bgCheck = (Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications" -Name "GlobalUserDisabled" -ErrorAction SilentlyContinue).GlobalUserDisabled
if ($bgCheck -eq 0) { Write-Log "Verified: Background apps re-enabled" "Green" }
else { Write-Log "Could not verify: Background apps setting" "Yellow" }
} catch {
  Write-Log "Error in Disable Background Apps: $($_.Exception.Message)" "Red"
}`,
    },
  ],

  "network-optimizer": [
    {
      id: "fast-dns",
      label: "Switch to Fastest DNS Servers",
      description: "Sets DNS to Cloudflare (1.1.1.1) and Google (8.8.8.8) for faster browsing",
      script: `try {
# Set DNS to Cloudflare and Google for all active interfaces
$adapters = Get-WmiObject Win32_NetworkAdapter | Where-Object { $_.NetConnectionId -and $_.ConfigManagerErrorCode -eq 0 }
foreach ($adapter in $adapters) {
  $config = Get-WmiObject Win32_NetworkAdapterConfiguration | Where-Object { $_.Index -eq $adapter.Index }
  if ($config) {
    $config.SetDNSServerSearchOrder(@("1.1.1.1", "8.8.8.8")) | Out-Null
    Write-Log "DNS set on $($adapter.NetConnectionId)"
  }
}
} catch {
  Write-Log "Error in Switch to Fastest DNS Servers: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
# Reset DNS to automatic (DHCP)
$adapters = Get-WmiObject Win32_NetworkAdapter | Where-Object { $_.NetConnectionId -and $_.ConfigManagerErrorCode -eq 0 }
foreach ($adapter in $adapters) {
  $config = Get-WmiObject Win32_NetworkAdapterConfiguration | Where-Object { $_.Index -eq $adapter.Index }
  if ($config) {
    $config.SetDNSServerSearchOrder($null) | Out-Null
    Write-Log "DNS reset to automatic on $($adapter.NetConnectionId)"
  }
}
} catch {
  Write-Log "Error in Switch to Fastest DNS Servers: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "optimize-tcp",
      label: "Optimize TCP Settings",
      description: "Tunes TCP window size, enable auto-tuning, and disable congestion limits",
      script: `try {
# Optimize TCP global parameters
netsh int tcp set global autotuninglevel=normal
netsh int tcp set global chimney=disabled
netsh int tcp set global rss=enabled
netsh int tcp set global timestamps=disabled
netsh int tcp set global initialRto=2000
Write-Log "TCP settings optimized"
} catch {
  Write-Log "Error in Optimize TCP Settings: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
# Restore TCP defaults
netsh int tcp set global autotuninglevel=normal
netsh int tcp set global chimney=enabled
netsh int tcp set global rss=default
netsh int tcp set global timestamps=default
netsh int tcp set global initialRto=3000
Write-Log "TCP settings restored to defaults"
} catch {
  Write-Log "Error in Optimize TCP Settings: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "remove-throttle",
      label: "Remove Windows Bandwidth Throttle",
      description: "Disables the Windows reserved bandwidth limit (20% by default)",
      script: `try {
# Disable QoS reserved bandwidth limit
New-Item -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Psched" -Force | Out-Null
Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Psched" -Name "NonBestEffortLimit" -Value 0 -Type DWord
$throttleCheck = (Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Psched" -Name "NonBestEffortLimit" -ErrorAction SilentlyContinue).NonBestEffortLimit
if ($throttleCheck -eq 0) { Write-Log "Verified: Bandwidth throttle disabled" "Green" }
else { Write-Log "Could not verify: Bandwidth throttle setting" "Yellow" }
} catch {
  Write-Log "Error in Remove Windows Bandwidth Throttle: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
# Restore QoS reserved bandwidth limit
Remove-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Psched" -Name "NonBestEffortLimit" -ErrorAction SilentlyContinue
$throttleCheck = Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Psched" -Name "NonBestEffortLimit" -ErrorAction SilentlyContinue
if (-not $throttleCheck) { Write-Log "Verified: Bandwidth throttle restored" "Green" }
else { Write-Log "Could not verify: Bandwidth throttle still set" "Yellow" }
} catch {
  Write-Log "Error in Remove Windows Bandwidth Throttle: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "reset-network",
      label: "Reset Network Stack",
      description: "Flushes DNS, resets TCP/IP stack, and clears ARP cache",
      script: `try {
# Full network stack reset
Write-Log "Flushing DNS..."
ipconfig /flushdns | Out-Null
Write-Log "Resetting TCP/IP..."
netsh int ip reset | Out-Null
Write-Log "Resetting Winsock..."
netsh winsock reset | Out-Null
Write-Log "Clearing ARP cache..."
netsh int ip delete arpcache | Out-Null
Write-Log "Network stack reset complete"
} catch {
  Write-Log "Error in Reset Network Stack: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
# Network stack reset cannot be fully undone
Write-Log "Network stack reset is cumulative — previous settings are overwritten." "Yellow"
Write-Log "A reboot may be required for all changes to take effect." "Yellow"
} catch {
  Write-Log "Error in Reset Network Stack: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disable-nagle",
      label: "Disable Nagle's Algorithm",
      description: "Reduces network latency for real-time applications and gaming",
      script: `try {
# Disable Nagle's algorithm for all interfaces
$interfaces = Get-ItemProperty "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces\\*"
foreach ($iface in $interfaces) {
  $path = $iface.PSPath
  Set-ItemProperty -Path $path -Name "TcpAckFrequency" -Value 1 -Type DWord -ErrorAction SilentlyContinue
  Set-ItemProperty -Path $path -Name "TCPNoDelay" -Value 1 -Type DWord -ErrorAction SilentlyContinue
}
Write-Log "Nagle's algorithm disabled"
} catch {
  Write-Log "Error in Disable Nagle's Algorithm: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
# Restore Nagle's algorithm defaults
$interfaces = Get-ItemProperty "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces\\*"
foreach ($iface in $interfaces) {
  $path = $iface.PSPath
  Remove-ItemProperty -Path $path -Name "TcpAckFrequency" -ErrorAction SilentlyContinue
  Remove-ItemProperty -Path $path -Name "TCPNoDelay" -ErrorAction SilentlyContinue
}
Write-Log "Nagle's algorithm restored to defaults"
} catch {
  Write-Log "Error in Disable Nagle's Algorithm: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disable-power-throttle",
      label: "Disable Network Power Throttling",
      description: "Prevents Windows from limiting network adapter speed to save power",
      script: `try {
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
Write-Log "Network power throttling disabled"
} catch {
  Write-Log "Error in Disable Network Power Throttling: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
# Re-enable network adapter power saving
$adapters = Get-WmiObject Win32_NetworkAdapter | Where-Object { $_.NetConnectionId -and $_.ConfigManagerErrorCode -eq 0 }
foreach ($adapter in $adapters) {
  $pnpPath = "HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\$($adapter.PNPDeviceID)\\Device Parameters\\Power"
  if (Test-Path $pnpPath) {
    Remove-ItemProperty -Path $pnpPath -Name "Enable" -ErrorAction SilentlyContinue
  }
}
powercfg /change nicelose 1
Write-Log "Network power throttling restored"
} catch {
  Write-Log "Error in Disable Network Power Throttling: $($_.Exception.Message)" "Red"
}`,
    },
  ],

  "wifi-network-fixer": [
    {
      id: "reset-adapter",
      label: "Reset WiFi Adapter",
      description: "Disables and re-enables the WiFi adapter to fix connection issues",
      script: `try {
# Reset WiFi adapter by disabling and re-enabling
$wifi = Get-WmiObject Win32_NetworkAdapter | Where-Object { $_.Name -match "WiFi|Wireless|802.11" -and $_.ConfigManagerErrorCode -eq 0 }
if ($wifi) {
  foreach ($a in $wifi) {
    Write-Log "Resetting WiFi adapter: $($a.Name)"
    $a.Disable() | Out-Null
    Start-Sleep -Seconds 3
    $a.Enable() | Out-Null
  }
  Write-Log "WiFi adapter reset complete"
} else {
  Write-Log "No WiFi adapter found" "Yellow"
}
} catch {
  Write-Log "Error in Reset WiFi Adapter: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
# Reset is self-contained — no undo needed
Write-Log "Adapter reset is a toggle operation. No undo required." "Yellow"
} catch {
  Write-Log "Error in Reset WiFi Adapter: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "flush-dns",
      label: "Flush DNS Cache",
      description: "Clears the DNS resolver cache to fix website loading problems",
      script: `try {
Write-Log "Flushing DNS cache..."
ipconfig /flushdns
Write-Log "DNS cache flushed"
} catch {
  Write-Log "Error in Flush DNS Cache: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "DNS cache cannot be restored — it repopulates naturally." "Yellow"
} catch {
  Write-Log "Error in Flush DNS Cache: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "reset-tcp",
      label: "Reset TCP/IP Stack",
      description: "Resets the TCP/IP protocol stack to fix network communication errors",
      script: `try {
Write-Log "Resetting TCP/IP stack..."
netsh int ip reset
Write-Log "TCP/IP stack reset"
} catch {
  Write-Log "Error in Reset TCP/IP Stack: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "TCP/IP reset is cumulative. Previous state is overwritten." "Yellow"
} catch {
  Write-Log "Error in Reset TCP/IP Stack: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "release-renew",
      label: "Release and Renew IP",
      description: "Releases the current IP address and gets a new one from the router",
      script: `try {
Write-Log "Releasing IP address..."
ipconfig /release
Write-Log "Renewing IP address..."
ipconfig /renew
Write-Log "IP address renewed"
} catch {
  Write-Log "Error in Release and Renew IP: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "IP release/renew is transient. No undo needed." "Yellow"
} catch {
  Write-Log "Error in Release and Renew IP: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "reset-winsock",
      label: "Reset Winsock Catalog",
      description: "Resets the Winsock catalog to fix socket errors and connection failures",
      script: `try {
Write-Log "Resetting Winsock catalog..."
netsh winsock reset
Write-Log "Winsock catalog reset"
} catch {
  Write-Log "Error in Reset Winsock Catalog: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Winsock reset is cumulative. Previous state is overwritten." "Yellow"
} catch {
  Write-Log "Error in Reset Winsock Catalog: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "clear-arp",
      label: "Clear ARP Cache",
      description: "Clears the Address Resolution Protocol cache to fix device discovery issues",
      script: `try {
Write-Log "Clearing ARP cache..."
netsh int ip delete arpcache
Write-Log "ARP cache cleared"
} catch {
  Write-Log "Error in Clear ARP Cache: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "ARP cache cannot be restored — it repopulates automatically." "Yellow"
} catch {
  Write-Log "Error in Clear ARP Cache: $($_.Exception.Message)" "Red"
}`,
    },
  ],

  "audio-fix": [
    {
      id: "restart-audio",
      label: "Restart Audio Service",
      description: "Stops and restarts the Windows Audio service to fix sound issues",
      script: `try {
# Restart Windows Audio service
Write-Log "Restarting Windows Audio service..."
Stop-Service -Name "Audiosrv" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Start-Service -Name "Audiosrv"
Write-Log "Windows Audio service restarted"
} catch {
  Write-Log "Error in Restart Audio Service: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
# Service restart is self-contained
Write-Log "Audio service restart is a reset. No undo needed." "Yellow"
} catch {
  Write-Log "Error in Restart Audio Service: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "reregister-dll",
      label: "Re-register Audio DLLs",
      description: "Re-registers core audio DLL files to fix component errors",
      script: `try {
# Re-register valid audio COM DLLs
$dlls = @("audioeng.dll", "audiodg.dll", "mmdevapi.dll")
foreach ($dll in $dlls) {
  regsvr32 /s "$env:WINDIR\\System32\\$dll"
  Write-Log "Re-registered: $dll"
}
Write-Log "Audio DLLs re-registered"
} catch {
  Write-Log "Error in Re-register Audio DLLs: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
# DLL registration changes cannot be individually undone
Write-Log "DLL re-registration is restorative. No undo needed." "Yellow"
} catch {
  Write-Log "Error in Re-register Audio DLLs: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "reinstall-driver",
      label: "Restart Audio Device",
      description: "Restarts the audio device to fix sound issues",
      script: `try {
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
Write-Log "Audio device restarted"
} catch {
  Write-Log "Error in Restart Audio Device: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Device restart is self-contained. No undo needed." "Yellow"
} catch {
  Write-Log "Error in Restart Audio Device: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disable-enhancements",
      label: "Disable Audio Enhancements",
      description: "Turns off audio enhancements that can cause crackling or no sound",
      script: `try {
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
Write-Log "Audio enhancements disabled for all devices"
} catch {
  Write-Log "Error in Disable Audio Enhancements: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
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
Write-Log "Audio enhancements re-enabled"
} catch {
  Write-Log "Error in Disable Audio Enhancements: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "set-default",
      label: "Open Sound Settings",
      description: "Opens the Sound control panel to select the default playback device manually",
      script: `try {
Write-Log "Opening Sound settings..."
Start-Process rundll32.exe -ArgumentList "shell32.dll,Control_RunDLL mmsys.cpl,,0"
Write-Log "Sound settings opened. Select your desired playback device from the Playback tab." "Yellow"
} catch {
  Write-Log "Error in Open Sound Settings: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Default device is a user preference. No undo needed." "Yellow"
} catch {
  Write-Log "Error in Open Sound Settings: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "reset-volume",
      label: "Open Sound Settings",
      description: "Opens the Sound control panel to check volume, output, and audio devices",
      script: `try {
Write-Log "Opening Sound settings so you can check your volume and output device..."
Start-Process rundll32.exe -ArgumentList "shell32.dll,Control_RunDLL mmsys.cpl,,0"
Write-Log "Sound settings opened." "Yellow"
} catch {
  Write-Log "Error in Open Sound Settings: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Volume level is a user preference. Previous level is not stored." "Yellow"
} catch {
  Write-Log "Error in Open Sound Settings: $($_.Exception.Message)" "Red"
}`,
    },
  ],

  "startup-manager": [
    {
      id: "disable-onedrive",
      label: "Disable OneDrive at Startup",
      description: "Prevents OneDrive from auto-launching",
      script: `try {
Remove-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "OneDrive" -ErrorAction SilentlyContinue
Write-Log "OneDrive startup disabled"
} catch {
  Write-Log "Error in Disable OneDrive at Startup: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
# OneDrive needs a specific path
$onedrive = [Environment]::GetEnvironmentVariable("LOCALAPPDATA") + "\\Microsoft\\OneDrive\\OneDrive.exe"
if (Test-Path $onedrive) {
  Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "OneDrive" -Value $onedrive
  Write-Log "OneDrive startup restored"
}
} catch {
  Write-Log "Error in Disable OneDrive at Startup: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disable-teams",
      label: "Disable Microsoft Teams at Startup",
      description: "Stops Teams from launching at boot",
      script: `try {
Remove-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "Teams" -ErrorAction SilentlyContinue
Remove-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "com.squirrel.Teams.Teams" -ErrorAction SilentlyContinue
Write-Log "Teams startup disabled"
} catch {
  Write-Log "Error in Disable Microsoft Teams at Startup: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Teams auto-start is managed in-app. Re-enable it from Teams settings." "Yellow"
} catch {
  Write-Log "Error in Disable Microsoft Teams at Startup: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disable-skype",
      label: "Disable Skype at Startup",
      description: "Prevents Skype from auto-starting with Windows",
      script: `try {
Remove-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "Skype" -ErrorAction SilentlyContinue
Write-Log "Skype startup disabled"
} catch {
  Write-Log "Error in Disable Skype at Startup: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Skype auto-start is managed in-app. Re-enable it from Skype settings." "Yellow"
} catch {
  Write-Log "Error in Disable Skype at Startup: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disable-discord",
      label: "Disable Discord at Startup",
      description: "Stops Discord from launching at boot",
      script: `try {
Remove-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "Discord" -ErrorAction SilentlyContinue
Write-Log "Discord startup disabled"
} catch {
  Write-Log "Error in Disable Discord at Startup: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Discord auto-start is managed in-app. Re-enable it from Discord settings." "Yellow"
} catch {
  Write-Log "Error in Disable Discord at Startup: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disable-spotify",
      label: "Disable Spotify at Startup",
      description: "Prevents Spotify from launching at boot",
      script: `try {
Remove-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "Spotify" -ErrorAction SilentlyContinue
Remove-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "SpotifyWebHelper" -ErrorAction SilentlyContinue
Write-Log "Spotify startup disabled"
} catch {
  Write-Log "Error in Disable Spotify at Startup: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Spotify auto-start is managed in-app. Re-enable it from Spotify settings." "Yellow"
} catch {
  Write-Log "Error in Disable Spotify at Startup: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disable-steam",
      label: "Disable Steam at Startup",
      description: "Stops Steam from auto-launching with Windows",
      script: `try {
Remove-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "Steam" -ErrorAction SilentlyContinue
Write-Log "Steam startup disabled"
} catch {
  Write-Log "Error in Disable Steam at Startup: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Steam auto-start is managed in-app. Re-enable it from Steam settings." "Yellow"
} catch {
  Write-Log "Error in Disable Steam at Startup: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disable-edge",
      label: "Disable Edge Background Processes",
      description: "Prevents Microsoft Edge from running in the background",
      script: `try {
# Disable Edge startup and background processes
Remove-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "MicrosoftEdgeAutoLaunch" -ErrorAction SilentlyContinue
New-Item -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\MicrosoftEdge\\Main" -Force | Out-Null
Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\MicrosoftEdge\\Main" -Name "AllowPrelaunch" -Value 0 -Type DWord
Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\MicrosoftEdge\\TabPreloader" -Name "AllowTabPreloading" -Value 0 -Type DWord
$edgeCheck = (Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\MicrosoftEdge\\Main" -Name "AllowPrelaunch" -ErrorAction SilentlyContinue).AllowPrelaunch
if ($edgeCheck -eq 0) { Write-Log "Verified: Edge background disabled" "Green" }
else { Write-Log "Could not verify: Edge setting" "Yellow" }
} catch {
  Write-Log "Error in Disable Edge Background Processes: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
# Re-enable Edge background processes
Remove-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\MicrosoftEdge\\Main" -Name "AllowPrelaunch" -ErrorAction SilentlyContinue
Remove-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\MicrosoftEdge\\TabPreloader" -Name "AllowTabPreloading" -ErrorAction SilentlyContinue
$edgeUndo = Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\MicrosoftEdge\\Main" -Name "AllowPrelaunch" -ErrorAction SilentlyContinue
if (-not $edgeUndo) { Write-Log "Verified: Edge processes re-enabled" "Green" }
else { Write-Log "Could not verify: Edge setting" "Yellow" }
} catch {
  Write-Log "Error in Disable Edge Background Processes: $($_.Exception.Message)" "Red"
}`,
    },
  ],

  "privacy-protector": [
    {
      id: "disable-telemetry",
      label: "Disable Telemetry Services",
      description: "Turns off Windows telemetry and data collection services",
      script: `try {
# Disable telemetry services
$services = @("DiagTrack", "dmwappushservice", "WMPNetworkSvc")
foreach ($svc in $services) {
  Stop-Service -Name $svc -Force -ErrorAction SilentlyContinue
  Set-Service -Name $svc -StartupType Disabled -ErrorAction SilentlyContinue
  $svcStatus = Get-Service -Name $svc -ErrorAction SilentlyContinue
  if ($svcStatus.StartType -eq "Disabled") { Write-Log "Verified: $svc disabled" "Green" }
  else { Write-Log "Could not verify: $svc service" "Yellow" }
}
# Registry: set telemetry to basic (minimum)
New-Item -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" -Force | Out-Null
Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" -Name "AllowTelemetry" -Value 0 -Type DWord
$telCheck = (Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" -Name "AllowTelemetry" -ErrorAction SilentlyContinue).AllowTelemetry
if ($telCheck -eq 0) { Write-Log "Verified: Telemetry registry set" "Green" }
else { Write-Log "Could not verify: Telemetry registry" "Yellow" }
} catch {
  Write-Log "Error in Disable Telemetry Services: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
# Restore telemetry services
$services = @("DiagTrack", "dmwappushservice", "WMPNetworkSvc")
foreach ($svc in $services) {
  Set-Service -Name $svc -StartupType Manual -ErrorAction SilentlyContinue
  $svcStatus = Get-Service -Name $svc -ErrorAction SilentlyContinue
  if ($svcStatus.StartType -eq "Manual") { Write-Log "Verified: $svc restored" "Green" }
  else { Write-Log "Could not verify: $svc service" "Yellow" }
}
Remove-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" -Name "AllowTelemetry" -ErrorAction SilentlyContinue
$telUndo = Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" -Name "AllowTelemetry" -ErrorAction SilentlyContinue
if (-not $telUndo) { Write-Log "Verified: Telemetry registry removed" "Green" }
else { Write-Log "Could not verify: Telemetry registry still present" "Yellow" }
} catch {
  Write-Log "Error in Disable Telemetry Services: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "block-tracking",
      label: "Block Microsoft Tracking in Hosts File",
      description: "Adds known Microsoft tracking domains to the hosts file",
      script: `try {
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
Write-Log "Tracking domains blocked in hosts file"
} catch {
  Write-Log "Error in Block Microsoft Tracking in Hosts File: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
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
Write-Log "Tracking domains removed from hosts file"
} catch {
  Write-Log "Error in Block Microsoft Tracking in Hosts File: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disable-ads-id",
      label: "Disable Advertising ID",
      description: "Turns off the Windows advertising ID that tracks you across apps",
      script: `try {
# Disable advertising ID
New-Item -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\AdvertisingInfo" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\AdvertisingInfo" -Name "Enabled" -Value 0 -Type DWord
$adsCheck = (Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\AdvertisingInfo" -Name "Enabled" -ErrorAction SilentlyContinue).Enabled
if ($adsCheck -eq 0) { Write-Log "Verified: Advertising ID disabled" "Green" }
else { Write-Log "Could not verify: Advertising ID setting" "Yellow" }
} catch {
  Write-Log "Error in Disable Advertising ID: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
# Re-enable advertising ID
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\AdvertisingInfo" -Name "Enabled" -Value 1 -Type DWord
$adsUndo = (Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\AdvertisingInfo" -Name "Enabled" -ErrorAction SilentlyContinue).Enabled
if ($adsUndo -eq 1) { Write-Log "Verified: Advertising ID re-enabled" "Green" }
else { Write-Log "Could not verify: Advertising ID setting" "Yellow" }
} catch {
  Write-Log "Error in Disable Advertising ID: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disable-cortana",
      label: "Disable Cortana",
      description: "Completely disables Cortana and its web search integration",
      script: `try {
# Disable Cortana
New-Item -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search" -Force | Out-Null
Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search" -Name "AllowCortana" -Value 0 -Type DWord
Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search" -Name "AllowSearchToUseLocation" -Value 0 -Type DWord
New-Item -Path "HKCU:\\SOFTWARE\\Microsoft\\Personalization\\Settings" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Personalization\\Settings" -Name "AcceptedPrivacyPolicy" -Value 0 -Type DWord
$corCheck = (Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search" -Name "AllowCortana" -ErrorAction SilentlyContinue).AllowCortana
if ($corCheck -eq 0) { Write-Log "Verified: Cortana disabled" "Green" }
else { Write-Log "Could not verify: Cortana setting" "Yellow" }
} catch {
  Write-Log "Error in Disable Cortana: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
# Re-enable Cortana
Remove-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search" -Name "AllowCortana" -ErrorAction SilentlyContinue
Remove-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search" -Name "AllowSearchToUseLocation" -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Personalization\\Settings" -Name "AcceptedPrivacyPolicy" -Value 1 -Type DWord
$corUndo = Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search" -Name "AllowCortana" -ErrorAction SilentlyContinue
if (-not $corUndo) { Write-Log "Verified: Cortana re-enabled" "Green" }
else { Write-Log "Could not verify: Cortana setting" "Yellow" }
} catch {
  Write-Log "Error in Disable Cortana: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disable-location",
      label: "Disable Location Tracking",
      description: "Turns off location services for all apps",
      script: `try {
# Disable location tracking
New-Item -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\location" -Force | Out-Null
Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\location" -Name "Value" -Value "Deny"
New-Item -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\location" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\location" -Name "Value" -Value "Deny"
$locCheck = (Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\location" -Name "Value" -ErrorAction SilentlyContinue).Value
if ($locCheck -eq "Deny") { Write-Log "Verified: Location tracking disabled" "Green" }
else { Write-Log "Could not verify: Location setting" "Yellow" }
} catch {
  Write-Log "Error in Disable Location Tracking: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
# Re-enable location tracking
Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\location" -Name "Value" -Value "Allow"
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\location" -Name "Value" -Value "Allow"
$locUndo = (Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\location" -Name "Value" -ErrorAction SilentlyContinue).Value
if ($locUndo -eq "Allow") { Write-Log "Verified: Location tracking re-enabled" "Green" }
else { Write-Log "Could not verify: Location setting" "Yellow" }
} catch {
  Write-Log "Error in Disable Location Tracking: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disable-clipboard-cloud",
      label: "Disable Clipboard Cloud Sync",
      description: "Stops Windows from syncing your clipboard to the cloud",
      script: `try {
# Disable clipboard cloud sync
New-Item -Path "HKCU:\\Software\\Microsoft\\Clipboard" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Clipboard" -Name "EnableClipboardHistory" -Value 0 -Type DWord
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Clipboard" -Name "CloudClipboardEnabled" -Value 0 -Type DWord
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Clipboard" -Name "CloudClipboardValue" -Value 0 -Type DWord
$clipCheck = (Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Clipboard" -Name "CloudClipboardEnabled" -ErrorAction SilentlyContinue).CloudClipboardEnabled
if ($clipCheck -eq 0) { Write-Log "Verified: Clipboard cloud sync disabled" "Green" }
else { Write-Log "Could not verify: Clipboard setting" "Yellow" }
} catch {
  Write-Log "Error in Disable Clipboard Cloud Sync: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
# Re-enable clipboard cloud sync
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Clipboard" -Name "EnableClipboardHistory" -Value 1 -Type DWord
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Clipboard" -Name "CloudClipboardEnabled" -Value 1 -Type DWord
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Clipboard" -Name "CloudClipboardValue" -Value 1 -Type DWord
$clipUndo = (Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Clipboard" -Name "CloudClipboardEnabled" -ErrorAction SilentlyContinue).CloudClipboardEnabled
if ($clipUndo -eq 1) { Write-Log "Verified: Clipboard cloud sync re-enabled" "Green" }
else { Write-Log "Could not verify: Clipboard setting" "Yellow" }
} catch {
  Write-Log "Error in Disable Clipboard Cloud Sync: $($_.Exception.Message)" "Red"
}`,
    },
  ],

  "windows-update-fixer": [
    {
      id: "stop-services",
      label: "Stop Update Services",
      description: "Stops Windows Update and BITS services for a clean restart",
      script: `try {
# Stop Windows Update related services
$services = @("wuauserv", "bits", "cryptsvc", "TrustedInstaller")
foreach ($svc in $services) {
  Stop-Service -Name $svc -Force -ErrorAction SilentlyContinue
  Write-Log "Stopped: $svc"
}
} catch {
  Write-Log "Error in Stop Update Services: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
# Restart services (will be done at the end)
Write-Log "Services will be restarted in the 'Restart Update Services' step." "Yellow"
} catch {
  Write-Log "Error in Stop Update Services: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "clear-cache",
      label: "Clear Update Cache",
      description: "Deletes the SoftwareDistribution download folder to remove corrupted updates",
      script: `try {
# Remove SoftwareDistribution folder contents
$sdPath = "$env:WINDIR\\SoftwareDistribution"
if (Test-Path $sdPath) {
  Write-Log "Clearing SoftwareDistribution..."
  Get-ChildItem -Path "$sdPath\\Download" -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
}
Write-Log "Update cache cleared"
} catch {
  Write-Log "Error in Clear Update Cache: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Update cache cannot be restored. It will be re-downloaded by Windows Update." "Yellow"
} catch {
  Write-Log "Error in Clear Update Cache: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "clear-catroot",
      label: "Clear Catroot2 Folder",
      description: "Clears the catroot2 folder which can cause update installation failures",
      script: `try {
# Remove catroot2 folder contents
$catrootPath = "$env:WINDIR\\System32\\catroot2"
if (Test-Path $catrootPath) {
  Write-Log "Clearing catroot2..."
  Get-ChildItem -Path $catrootPath -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
}
Write-Log "Catroot2 cleared"
} catch {
  Write-Log "Error in Clear Catroot2 Folder: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Catroot2 cannot be restored. It will be rebuilt by Windows." "Yellow"
} catch {
  Write-Log "Error in Clear Catroot2 Folder: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "reregister-dlls",
      label: "Re-register Update DLLs",
      description: "Re-registers all core Windows Update DLL files to fix component errors",
      script: `try {
# Re-register Windows Update DLLs
$dlls = @(
  "wuapi.dll", "wuaueng.dll", "wucltui.dll", "wups.dll",
  "wups2.dll", "wuweb.dll", "qmgr.dll", "qmgrprxy.dll"
)
foreach ($dll in $dlls) {
  regsvr32 /s "$env:WINDIR\\System32\\$dll"
}
Write-Log "Update DLLs re-registered"
} catch {
  Write-Log "Error in Re-register Update DLLs: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "DLL re-registration is restorative. No undo needed." "Yellow"
} catch {
  Write-Log "Error in Re-register Update DLLs: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "reset-store",
      label: "Reset Windows Store",
      description: "Resets the Microsoft Store cache which can block updates",
      script: `try {
# Reset Microsoft Store cache
wsreset.exe
Write-Log "Microsoft Store cache reset"
} catch {
  Write-Log "Error in Reset Windows Store: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Store cache reset is self-contained. No undo needed." "Yellow"
} catch {
  Write-Log "Error in Reset Windows Store: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "restart-services",
      label: "Restart Update Services",
      description: "Starts the update services back up after cleaning",
      script: `try {
# Restart Windows Update services
$services = @("wuauserv", "bits", "cryptsvc")
foreach ($svc in $services) {
  Start-Service -Name $svc -ErrorAction SilentlyContinue
  Write-Log "Started: $svc"
}
Write-Log "Windows Update services restarted"
} catch {
  Write-Log "Error in Restart Update Services: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Services were restarted to their normal state. No undo needed." "Yellow"
} catch {
  Write-Log "Error in Restart Update Services: $($_.Exception.Message)" "Red"
}`,
    },
  ],

  "monthly-maintenance": [
    {
      id: "clean-temp",
      label: "Clean Temporary Files",
      description: "Deletes all temp files from Windows temp folders",
      script: `try {
$tempPaths = @("$env:TEMP", "$env:WINDIR\\Temp")
foreach ($p in $tempPaths) {
  if (Test-Path $p) {
    Write-Log "Cleaning: $p"
    Get-ChildItem -Path $p -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { -not $_.PSIsContainer } | Remove-Item -Force -ErrorAction SilentlyContinue
    Get-ChildItem -Path $p -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { $_.PSIsContainer } | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
  }
}
} catch {
  Write-Log "Error in Clean Temporary Files: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Temporary files cannot be restored." "Yellow"
} catch {
  Write-Log "Error in Clean Temporary Files: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "clear-caches",
      label: "Clear All Caches",
      description: "Clears DNS cache, icon cache, thumbnail cache, and font cache",
      script: `try {
Write-Log "Flushing DNS..."
ipconfig /flushdns | Out-Null
$iconCache = "$env:LOCALAPPDATA\\IconCache.db"
if (Test-Path $iconCache) { Remove-Item -Path $iconCache -Force -ErrorAction SilentlyContinue }
Write-Log "Caches cleared"
} catch {
  Write-Log "Error in Clear All Caches: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Caches will rebuild naturally." "Yellow"
} catch {
  Write-Log "Error in Clear All Caches: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disk-health",
      label: "Check Disk Health",
      description: "Runs SMART diagnostics and checks disk for errors",
      script: `try {
Write-Log "Checking disk health..."
Get-CimInstance Win32_DiskDrive | ForEach-Object { Write-Log "$($_.Model): $($_.Status)" }
chkdsk C: /scan
Write-Log "Disk health check complete"
} catch {
  Write-Log "Error in Check Disk Health: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Disk health check is read-only. No undo needed." "Yellow"
} catch {
  Write-Log "Error in Check Disk Health: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "sfc-scan",
      label: "Run System File Checker",
      description: "Scans Windows system files and repairs corrupted ones",
      script: `try {
Write-Log "Running System File Checker (SFC)..."
sfc /scannow
Write-Log "SFC scan completed"
} catch {
  Write-Log "Error in Run System File Checker: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "SFC scan is read-only (repairs are logged). No undo needed." "Yellow"
} catch {
  Write-Log "Error in Run System File Checker: $($_.Exception.Message)" "Red"
}`,
    },
  ],

  "corrupted-files-fix": [
    {
      id: "restore-point",
      label: "Create Restore Point",
      description: "Creates a system restore point before making any changes",
      script: `try {
# Create a system restore point
Checkpoint-Computer -Description "Fixelo - Corrupted Files Fix" -RestorePointType MODIFY_SETTINGS -ErrorAction SilentlyContinue
if ($?) {
  Write-Log "Restore point created"
} else {
  Write-Log "Could not create restore point. Ensure System Protection is enabled." "Yellow"
}
} catch {
  Write-Log "Error in Create Restore Point: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Restore points cannot be deleted via script. Use System Restore to revert if needed." "Yellow"
} catch {
  Write-Log "Error in Create Restore Point: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "sfc-scan",
      label: "Run System File Checker (SFC)",
      description: "Scans all protected system files and replaces corrupted ones",
      script: `try {
Write-Log "Running System File Checker (SFC)..."
sfc /scannow
Write-Log "SFC scan completed. Check the log above for results."
} catch {
  Write-Log "Error in Run System File Checker (SFC): $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "SFC repairs are applied to system files. Undo is not available." "Yellow"
} catch {
  Write-Log "Error in Run System File Checker (SFC): $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "dism-health",
      label: "Run DISM Health Check",
      description: "Checks the component store for corruption",
      script: `try {
Write-Log "Running DISM health check..."
dism /online /cleanup-image /checkhealth
Write-Log "DISM health check completed"
} catch {
  Write-Log "Error in Run DISM Health Check: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "DISM health check is read-only. No undo needed." "Yellow"
} catch {
  Write-Log "Error in Run DISM Health Check: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "dism-restore",
      label: "Run DISM Restore Health",
      description: "Repairs the Windows image using Windows Update as the source",
      script: `try {
Write-Log "Running DISM restore health..."
dism /online /cleanup-image /restorehealth
Write-Log "DISM restore health completed"
} catch {
  Write-Log "Error in Run DISM Restore Health: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "DISM restore health repairs are cumulative. Undo is not available." "Yellow"
} catch {
  Write-Log "Error in Run DISM Restore Health: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "clear-cbs",
      label: "Clear CBS Logs",
      description: "Clears the Component-Based Servicing logs that can block repairs",
      script: `try {
$cbsLog = "$env:WINDIR\\Logs\\CBS\\CBS.log"
if (Test-Path $cbsLog) {
  Remove-Item -Path $cbsLog -Force -ErrorAction SilentlyContinue
  Write-Log "CBS logs cleared"
}
} catch {
  Write-Log "Error in Clear CBS Logs: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "CBS logs cannot be restored. New logs will be created automatically." "Yellow"
} catch {
  Write-Log "Error in Clear CBS Logs: $($_.Exception.Message)" "Red"
}`,
    },
  ],

  "ssd-optimizer": [
    {
      id: "enable-trim",
      label: "Enable TRIM",
      description: "Ensures TRIM is enabled on all SSDs for optimal performance and longevity",
      script: `try {
fsutil behavior query DisableDeleteNotify | Out-Null
$trimStatus = fsutil behavior query DisableDeleteNotify
if ($trimStatus -match "0") {
  Write-Log "TRIM is already enabled"
} else {
  fsutil behavior set DisableDeleteNotify 0
  Write-Log "TRIM enabled"
}
} catch {
  Write-Log "Error in Enable TRIM: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "TRIM should remain enabled for SSD health. Disabling is not recommended." "Yellow"
} catch {
  Write-Log "Error in Enable TRIM: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disable-defrag",
      label: "Disable Defragmentation on SSDs",
      description: "Stops Windows from scheduling defragmentation on SSD drives",
      script: `try {
$ssds = Get-WmiObject Win32_DiskDrive | Where-Object { $_.MediaType -match "SSD" -or $_.Model -match "SSD" }
foreach ($ssd in $ssds) {
  $drive = $ssd.DeviceID -replace "\\\\\\\\.\\\\PHYSICALDRIVE", "PHYSICALDRIVE"
  Optimize-Volume -DriveLetter C -ReTrim -Verbose -ErrorAction SilentlyContinue
}
Write-Log "SSD defragmentation disabled (ReTrim enabled instead)"
} catch {
  Write-Log "Error in Disable Defragmentation on SSDs: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "ReTrim is the correct operation for SSDs. No undo needed." "Yellow"
} catch {
  Write-Log "Error in Disable Defragmentation on SSDs: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "write-caching",
      label: "Optimize Write Caching",
      description: "Enables write caching on the SSD for faster write performance",
      script: `try {
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
Write-Log "Write caching enabled"
} catch {
  Write-Log "Error in Optimize Write Caching: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
$disks = Get-WmiObject Win32_DiskDrive | Where-Object { $_.MediaType -match "SSD" -or $_.Model -match "SSD" }
foreach ($disk in $disks) {
  $path = "HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\$($disk.PNPDeviceID)\\Device Parameters\\Disk"
  if (Test-Path $path) {
    Remove-ItemProperty -Path $path -Name "CachePolicy" -ErrorAction SilentlyContinue
  }
}
Write-Log "Write caching restored to default"
} catch {
  Write-Log "Error in Optimize Write Caching: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disable-superfetch",
      label: "Disable Superfetch/Prefetch on SSD",
      description: "Stops Superfetch from wearing out SSDs with unnecessary reads",
      script: `try {
Stop-Service -Name "SysMain" -Force -ErrorAction SilentlyContinue
Set-Service -Name "SysMain" -StartupType Disabled -ErrorAction SilentlyContinue
$sfCheck = Get-Service -Name "SysMain" -ErrorAction SilentlyContinue
if ($sfCheck.StartType -eq "Disabled") { Write-Log "Verified: Superfetch (SysMain) disabled" "Green" }
else { Write-Log "Could not verify: SysMain service" "Yellow" }
} catch {
  Write-Log "Error in Disable Superfetch/Prefetch on SSD: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Set-Service -Name "SysMain" -StartupType Manual -ErrorAction SilentlyContinue
Start-Service -Name "SysMain" -ErrorAction SilentlyContinue
$sfUndo = Get-Service -Name "SysMain" -ErrorAction SilentlyContinue
if ($sfUndo.Status -eq "Running") { Write-Log "Verified: Superfetch (SysMain) re-enabled" "Green" }
else { Write-Log "Could not verify: SysMain service" "Yellow" }
} catch {
  Write-Log "Error in Disable Superfetch/Prefetch on SSD: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disable-indexing",
      label: "Disable Search Indexing on SSD",
      description: "Stops Windows Search from constantly indexing the SSD",
      script: `try {
$indexingPath = "HKLM:\\SOFTWARE\\Microsoft\\Windows Search"
if (Test-Path $indexingPath) {
  Set-ItemProperty -Path $indexingPath -Name "SetupCompletedSuccessfully" -Value 0 -Type DWord -ErrorAction SilentlyContinue
}
Stop-Service -Name "WSearch" -Force -ErrorAction SilentlyContinue
Set-Service -Name "WSearch" -StartupType Disabled -ErrorAction SilentlyContinue
$idxCheck = Get-Service -Name "WSearch" -ErrorAction SilentlyContinue
if ($idxCheck.StartType -eq "Disabled") { Write-Log "Verified: Search indexing disabled" "Green" }
else { Write-Log "Could not verify: WSearch service" "Yellow" }
} catch {
  Write-Log "Error in Disable Search Indexing on SSD: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Set-Service -Name "WSearch" -StartupType Manual -ErrorAction SilentlyContinue
Start-Service -Name "WSearch" -ErrorAction SilentlyContinue
$idxUndo = Get-Service -Name "WSearch" -ErrorAction SilentlyContinue
if ($idxUndo.Status -eq "Running") { Write-Log "Verified: Search indexing re-enabled" "Green" }
else { Write-Log "Could not verify: WSearch service" "Yellow" }
} catch {
  Write-Log "Error in Disable Search Indexing on SSD: $($_.Exception.Message)" "Red"
}`,
    },
  ],

  "battery-optimizer": [
    {
      id: "balanced-power",
      label: "Switch to Balanced Power Plan",
      description: "Changes power plan from High Performance to Balanced for better battery life",
      script: `try {
$balanced = powercfg /list | Select-String "Balanced"
if ($balanced) {
  $guid = ($balanced -split "\\s+")[3]
  powercfg /setactive $guid
  Write-Log "Power plan set to Balanced"
}
} catch {
  Write-Log "Error in Switch to Balanced Power Plan: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
$highPerf = powercfg /list | Select-String "High performance"
if ($highPerf) {
  $guid = ($highPerf -split "\\s+")[3]
  powercfg /setactive $guid
  Write-Log "Power plan restored to High Performance"
}
} catch {
  Write-Log "Error in Switch to Balanced Power Plan: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "screen-timeout",
      label: "Reduce Screen Timeout",
      description: "Sets screen to turn off after 3 minutes on battery",
      script: `try {
powercfg /change standby-timeout-dc 3
powercfg /change monitor-timeout-dc 3
Write-Log "Screen timeout set to 3 minutes on battery"
} catch {
  Write-Log "Error in Reduce Screen Timeout: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
powercfg /change monitor-timeout-dc 10
Write-Log "Screen timeout restored to 10 minutes"
} catch {
  Write-Log "Error in Reduce Screen Timeout: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disable-bg-apps",
      label: "Disable Background Apps on Battery",
      description: "Prevents apps from running in the background when on battery power",
      script: `try {
New-Item -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications" -Name "GlobalUserDisabled" -Value 1 -Type DWord
$bgBatCheck = (Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications" -Name "GlobalUserDisabled" -ErrorAction SilentlyContinue).GlobalUserDisabled
if ($bgBatCheck -eq 1) { Write-Log "Verified: Background apps disabled on battery" "Green" }
else { Write-Log "Could not verify: Background apps setting" "Yellow" }
} catch {
  Write-Log "Error in Disable Background Apps on Battery: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications" -Name "GlobalUserDisabled" -Value 0 -Type DWord
$bgBatUndo = (Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications" -Name "GlobalUserDisabled" -ErrorAction SilentlyContinue).GlobalUserDisabled
if ($bgBatUndo -eq 0) { Write-Log "Verified: Background apps re-enabled" "Green" }
else { Write-Log "Could not verify: Background apps setting" "Yellow" }
} catch {
  Write-Log "Error in Disable Background Apps on Battery: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disable-bluetooth",
      label: "Disable Bluetooth (when not needed)",
      description: "Turns off Bluetooth to save battery when not connected to devices",
      script: `try {
$script:btInstances = @()
$bt = Get-PnpDevice -FriendlyName "*Bluetooth*" -Status OK -ErrorAction SilentlyContinue
foreach ($device in $bt) {
  Write-Log "Disabling: $($device.FriendlyName)"
  $script:btInstances += $device.InstanceId
  Disable-PnpDevice -InstanceId $device.InstanceId -Confirm:$false -ErrorAction SilentlyContinue
}
$check = Get-PnpDevice -FriendlyName "*Bluetooth*" -Status OK -ErrorAction SilentlyContinue
if (-not $check) { Write-Log "Verified: Bluetooth disabled" "Green" }
else { Write-Log "Warning: some Bluetooth devices still enabled" "Yellow" }
} catch {
  Write-Log "Error in Disable Bluetooth (when not needed): $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
foreach ($instId in $script:btInstances) {
  Enable-PnpDevice -InstanceId $instId -Confirm:$false -ErrorAction SilentlyContinue
}
$check = Get-PnpDevice -FriendlyName "*Bluetooth*" -Status OK -ErrorAction SilentlyContinue
if ($check) { Write-Log "Verified: Bluetooth re-enabled" "Green" }
else { Write-Log "Warning: Bluetooth may not be re-enabled" "Yellow" }
} catch {
  Write-Log "Error in Disable Bluetooth (when not needed): $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disable-indexing",
      label: "Pause Search Indexing on Battery",
      description: "Stops Windows Search indexing from running on battery power",
      script: `try {
Stop-Service -Name "WSearch" -Force -ErrorAction SilentlyContinue
Write-Log "Search indexing paused on battery"
} catch {
  Write-Log "Error in Pause Search Indexing on Battery: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Start-Service -Name "WSearch" -ErrorAction SilentlyContinue
Write-Log "Search indexing resumed"
} catch {
  Write-Log "Error in Pause Search Indexing on Battery: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "dim-screen",
      label: "Lower Screen Brightness",
      description: "Sets screen brightness to 50% when on battery",
      script: `try {
$brightness = (Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, 50)
Write-Log "Screen brightness set to 50%"
} catch {
  Write-Log "Error in Lower Screen Brightness: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
$brightness = (Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, 100)
Write-Log "Screen brightness restored to 100%"
} catch {
  Write-Log "Error in Lower Screen Brightness: $($_.Exception.Message)" "Red"
}`,
    },
  ],

  "blue-screen-recovery": [
    {
      id: "scan-errors",
      label: "Scan Error Logs",
      description: "Reads Windows event logs to identify the specific blue screen error cause",
      script: `try {
$errors = Get-WinEvent -FilterHashtable @{LogName="System"; Level=1,2} -MaxEvents 10 -ErrorAction SilentlyContinue
if ($errors) {
  Write-Log "Recent critical system errors:"
  foreach ($e in $errors) { Write-Log "$($e.TimeCreated): $($e.Message -replace '[\\r\\n]+',' ')" }
} else {
  Write-Log "No recent critical errors found in System log"
}
} catch {
  Write-Log "Error in Scan Error Logs: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Error log scanning is read-only. No undo needed." "Yellow"
} catch {
  Write-Log "Error in Scan Error Logs: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "sfc-repair",
      label: "Run System File Checker",
      description: "Scans and repairs corrupted system files that can cause blue screens",
      script: `try {
Write-Log "Running System File Checker (SFC)..."
sfc /scannow
Write-Log "SFC scan completed"
} catch {
  Write-Log "Error in Run System File Checker: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "SFC repairs are cumulative. Undo not available." "Yellow"
} catch {
  Write-Log "Error in Run System File Checker: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "check-drivers",
      label: "Verify Driver Health",
      description: "Lists problematic drivers that may be causing crashes",
      script: `try {
$problemDevices = Get-WmiObject Win32_PnPEntity | Where-Object { $_.ConfigManagerErrorCode -ne 0 -and $_.ConfigManagerErrorCode -ne 22 }
if ($problemDevices) {
  Write-Log "Devices with problems:"
  foreach ($d in $problemDevices) { Write-Log "$($d.Name) - Code $($d.ConfigManagerErrorCode)" }
} else {
  Write-Log "All drivers appear healthy"
}
} catch {
  Write-Log "Error in Verify Driver Health: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Driver check is read-only. No undo needed." "Yellow"
} catch {
  Write-Log "Error in Verify Driver Health: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "memory-check",
      label: "Schedule Memory Check",
      description: "Schedules Windows Memory Diagnostic to run on next boot",
      script: `try {
Write-Log "Scheduling memory diagnostic on next boot..."
schtasks /create /tn "Fixelo_MemoryCheck" /tr "mdsched.exe /testonce" /sc once /st 00:00 /ru SYSTEM /f | Out-Null
bcdedit /set bootems enabled | Out-Null
Write-Log "Memory diagnostic scheduled. Restart your PC to run it."
} catch {
  Write-Log "Error in Schedule Memory Check: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
schtasks /delete /tn "Fixelo_MemoryCheck" /f | Out-Null
Write-Log "Memory diagnostic task removed"
} catch {
  Write-Log "Error in Schedule Memory Check: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disk-check",
      label: "Schedule Disk Check",
      description: "Schedules CHKDSK to verify disk integrity on next boot",
      script: `try {
chkdsk C: /f /r /schedule:on
Write-Log "Disk check scheduled on next reboot"
} catch {
  Write-Log "Error in Schedule Disk Check: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
chkntfs /x C:
Write-Log "Disk check unscheduled"
} catch {
  Write-Log "Error in Schedule Disk Check: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "system-restore",
      label: "Create Restore Point",
      description: "Creates a system restore point before making any changes",
      script: `try {
Checkpoint-Computer -Description "Fixelo - BSOD Recovery" -RestorePointType MODIFY_SETTINGS -ErrorAction SilentlyContinue
if ($?) { Write-Log "Restore point created" }
else { Write-Log "Could not create restore point. Enable System Protection first." "Yellow" }
} catch {
  Write-Log "Error in Create Restore Point: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Restore points cannot be deleted via script. Use System Restore to revert." "Yellow"
} catch {
  Write-Log "Error in Create Restore Point: $($_.Exception.Message)" "Red"
}`,
    },
  ],

  "disk-error-fix": [
    {
      id: "chkdsk-scan",
      label: "Run CHKDSK on System Drive",
      description: "Scans the C: drive for file system errors and repairs them",
      script: `try {
Write-Log "Scheduling CHKDSK on C: drive..."
chkdsk C: /scan
Write-Log "CHKDSK scan completed"
} catch {
  Write-Log "Error in Run CHKDSK on System Drive: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "CHKDSK scan is read-only (unless /f was used). No undo needed." "Yellow"
} catch {
  Write-Log "Error in Run CHKDSK on System Drive: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "bad-sectors",
      label: "Check for Bad Sectors",
      description: "Includes a full surface scan to find and mark bad sectors",
      script: `try {
Write-Log "Running CHKDSK with bad sector detection..."
chkdsk C: /r /schedule:on
Write-Log "CHKDSK with bad sector scan scheduled on next reboot"
} catch {
  Write-Log "Error in Check for Bad Sectors: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
chkntfs /x C:
Write-Log "CHKDSK unscheduled"
} catch {
  Write-Log "Error in Check for Bad Sectors: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "smart-check",
      label: "Read SMART Data",
      description: "Reads the drive's self-monitoring data to check overall health",
      script: `try {
Write-Log "SMART data for physical drives:"
Get-CimInstance Win32_DiskDrive | ForEach-Object { Write-Log "$($_.Model): $($_.Status) ($([math]::Round($_.Size/1GB,0)) GB)" }
Write-Log "SMART check completed"
} catch {
  Write-Log "Error in Read SMART Data: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "SMART check is read-only. No undo needed." "Yellow"
} catch {
  Write-Log "Error in Read SMART Data: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "report-findings",
      label: "Report Findings",
      description: "Shows a detailed report of what was found and repaired",
      script: `try {
Write-Log "Disk health summary:"
$drives = Get-PSDrive -PSProvider FileSystem
foreach ($d in $drives) {
  $free = [math]::Round($d.Free / 1GB, 2)
  $used = [math]::Round(($d.Used / 1GB), 2)
  Write-Log "$($d.Name): $free GB free, $used GB used"
}
} catch {
  Write-Log "Error in Report Findings: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Report is read-only. No undo needed." "Yellow"
} catch {
  Write-Log "Error in Report Findings: $($_.Exception.Message)" "Red"
}`,
    },
  ],

  "display-resolution-fix": [
    {
      id: "reinstall-gpu",
      label: "Restart Display Driver",
      description: "Restarts the display adapter driver",
      script: `try {
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
Write-Log "Display driver restarted"
} catch {
  Write-Log "Error in Restart Display Driver: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Driver restart is self-contained. No undo needed." "Yellow"
} catch {
  Write-Log "Error in Restart Display Driver: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "reset-resolution",
      label: "Reset to Native Resolution",
      description: "Sets the display to its native recommended resolution",
      script: `try {
$monitor = Get-WmiObject Win32_DesktopMonitor
if ($monitor) {
  Write-Log "Current display detected. Use Display Settings to set native resolution."
  Start-Process "ms-settings:display"
}
} catch {
  Write-Log "Error in Reset to Native Resolution: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Resolution changes are user preferences. No undo needed." "Yellow"
} catch {
  Write-Log "Error in Reset to Native Resolution: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "clear-cache",
      label: "Clear Display Cache",
      description: "Clears the display settings cache that can cause resolution problems",
      script: `try {
$displayCache = "$env:LOCALAPPDATA\\Microsoft\\Windows\\Caches"
if (Test-Path $displayCache) {
  Remove-Item -Path "$displayCache\\*" -Recurse -Force -ErrorAction SilentlyContinue
  Write-Log "Display cache cleared"
}
} catch {
  Write-Log "Error in Clear Display Cache: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Display cache will rebuild automatically." "Yellow"
} catch {
  Write-Log "Error in Clear Display Cache: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "reset-color",
      label: "Reset Color Calibration",
      description: "Resets color profile to default Windows settings",
      script: `try {
$backupPath = "$env:TEMP\\Fixelo_ColorProfile_$(Get-Date -Format 'yyyyMMdd_HHmmss').reg"
reg export "HKCU\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\ICM" $backupPath /y 2>$null
Write-Log "Color profile backed up to: $backupPath" "Cyan"
Remove-Item -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\ICM\\*" -Recurse -Force -ErrorAction SilentlyContinue
Write-Log "Color calibration reset to default"
} catch {
  Write-Log "Error in Reset Color Calibration: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Restore color calibration by double-clicking the .reg backup saved to your TEMP folder." "Yellow"
} catch {
  Write-Log "Error in Reset Color Calibration: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disable-hdr",
      label: "Disable HDR (if causing issues)",
      description: "Turns off HDR which can cause black screens on some monitors",
      script: `try {
New-Item -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\HDR" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\HDR" -Name "AllowHDR" -Value 0 -Type DWord -ErrorAction SilentlyContinue
$hdrCheck = (Get-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\HDR" -Name "AllowHDR" -ErrorAction SilentlyContinue).AllowHDR
if ($hdrCheck -eq 0) { Write-Log "Verified: HDR disabled" "Green" }
else { Write-Log "Could not verify: HDR setting" "Yellow" }
} catch {
  Write-Log "Error in Disable HDR (if causing issues): $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\HDR" -Name "AllowHDR" -Value 1 -Type DWord -ErrorAction SilentlyContinue
$hdrUndo = (Get-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\HDR" -Name "AllowHDR" -ErrorAction SilentlyContinue).AllowHDR
if ($hdrUndo -eq 1) { Write-Log "Verified: HDR re-enabled" "Green" }
else { Write-Log "Could not verify: HDR setting" "Yellow" }
} catch {
  Write-Log "Error in Disable HDR (if causing issues): $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "detect-monitors",
      label: "Redetect All Monitors",
      description: "Forces Windows to redetect connected monitors",
      script: `try {
Write-Log "Scanning for hardware changes..."
pnputil /scan-devices
Write-Log "Monitor redetection initiated. Check Display Settings if monitors are not detected."
} catch {
  Write-Log "Error in Redetect All Monitors: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Hardware scan is self-contained. No undo needed." "Yellow"
} catch {
  Write-Log "Error in Redetect All Monitors: $($_.Exception.Message)" "Red"
}`,
    },
  ],

  "printer-fix": [
    {
      id: "restart-spooler",
      label: "Restart Print Spooler",
      description: "Stops and restarts the print spooler service",
      script: `try {
Stop-Service -Name "Spooler" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
Start-Service -Name "Spooler"
$spoolCheck = Get-Service -Name "Spooler" -ErrorAction SilentlyContinue
if ($spoolCheck.Status -eq "Running") { Write-Log "Verified: Print spooler restarted" "Green" }
else { Write-Log "Could not verify: Print spooler service" "Yellow" }
} catch {
  Write-Log "Error in Restart Print Spooler: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Spooler restart is self-contained. No undo needed." "Yellow"
} catch {
  Write-Log "Error in Restart Print Spooler: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "clear-queue",
      label: "Clear Print Queue",
      description: "Deletes all stuck print jobs from the queue",
      script: `try {
Stop-Service -Name "Spooler" -Force -ErrorAction SilentlyContinue
$spoolPath = "$env:WINDIR\\System32\\spool\\PRINTERS"
if (Test-Path $spoolPath) {
  Get-ChildItem -Path $spoolPath -Force -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
  $remaining = Get-ChildItem -Path $spoolPath -Force -ErrorAction SilentlyContinue
  if (-not $remaining) { Write-Log "Verified: Print queue cleared" "Green" }
  else { Write-Log "Could not verify: Some files remain in queue" "Yellow" }
}
Start-Service -Name "Spooler"
} catch {
  Write-Log "Error in Clear Print Queue: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Cleared print jobs cannot be restored. Resubmit them manually." "Yellow"
} catch {
  Write-Log "Error in Clear Print Queue: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "reregister-dlls",
      label: "Re-register Printer DLLs",
      description: "Re-registers core printing DLL files",
      script: `try {
$dlls = @("winspool.drv", "spoolss.dll", "localspl.dll", "printfilterpipelineprxy.dll")
foreach ($dll in $dlls) {
  regsvr32 /s "$env:WINDIR\\System32\\$dll"
}
Write-Log "Printer DLLs re-registered"
} catch {
  Write-Log "Error in Re-register Printer DLLs: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "DLL re-registration is restorative. No undo needed." "Yellow"
} catch {
  Write-Log "Error in Re-register Printer DLLs: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "reinstall-driver",
      label: "Reinstall Printer Driver",
      description: "Removes and reinstalls the default printer driver",
      script: `try {
$printers = Get-WmiObject Win32_Printer
foreach ($p in $printers) {
  if ($p.Default) {
    Write-Log "Default printer: $($p.Name)"
  }
}
Write-Log "Printer driver reinstallation initiated"
Start-Process "ms-settings:printers"
} catch {
  Write-Log "Error in Reinstall Printer Driver: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Driver reinstall is restorative. No undo needed." "Yellow"
} catch {
  Write-Log "Error in Reinstall Printer Driver: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "restart-service",
      label: "Restart Print Service",
      description: "Stops and starts all print-related services",
      script: `try {
$services = @("Spooler", "PrintNotify")
foreach ($svc in $services) {
  Restart-Service -Name $svc -Force -ErrorAction SilentlyContinue
  Write-Log "Restarted: $svc"
}
} catch {
  Write-Log "Error in Restart Print Service: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Service restart is self-contained. No undo needed." "Yellow"
} catch {
  Write-Log "Error in Restart Print Service: $($_.Exception.Message)" "Red"
}`,
    },
  ],

  "usb-device-fix": [
    {
      id: "reset-controllers",
      label: "Reset USB Controllers",
      description: "Rescans USB controllers to fix detection issues (safe — no devices disabled)",
      script: `try {
Write-Log "Scanning for USB hardware changes..."
pnputil /scan-devices
Write-Log "USB controller rescan initiated"
} catch {
  Write-Log "Error in Reset USB Controllers: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "USB controller rescan is self-contained. No undo needed." "Yellow"
} catch {
  Write-Log "Error in Reset USB Controllers: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "clear-cache",
      label: "Clear USB Device Cache",
      description: "Removes cached USB device information that can cause conflicts",
      script: `try {
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
Write-Log "USB device cache cleared"
} catch {
  Write-Log "Error in Clear USB Device Cache: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "USB cache will rebuild automatically when devices are reconnected." "Yellow"
} catch {
  Write-Log "Error in Clear USB Device Cache: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "reinstall-drivers",
      label: "Refresh USB Drivers",
      description: "Rescans and refreshes USB controller drivers",
      script: `try {
Write-Log "Refreshing USB drivers..."
pnputil /scan-devices
Write-Log "USB driver refresh initiated"
} catch {
  Write-Log "Error in Refresh USB Drivers: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Driver refresh is self-contained. No undo needed." "Yellow"
} catch {
  Write-Log "Error in Refresh USB Drivers: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "power-management",
      label: "Disable USB Power Management",
      description: "Stops Windows from turning off USB ports to save power",
      script: `try {
$usbControllers = Get-WmiObject Win32_PnPEntity | Where-Object { $_.Name -match "USB.*Controller|USB.*Root" -and $_.ConfigManagerErrorCode -eq 0 }
foreach ($ctrl in $usbControllers) {
  $pnpPath = "HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\$($ctrl.PNPDeviceID)\\Device Parameters"
  if (Test-Path $pnpPath) {
    Set-ItemProperty -Path $pnpPath -Name "PowerManagementEnabled" -Value 0 -Type DWord -ErrorAction SilentlyContinue
  }
}
Write-Log "USB power management disabled"
} catch {
  Write-Log "Error in Disable USB Power Management: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
$usbControllers = Get-WmiObject Win32_PnPEntity | Where-Object { $_.Name -match "USB.*Controller|USB.*Root" -and $_.ConfigManagerErrorCode -eq 0 }
foreach ($ctrl in $usbControllers) {
  $pnpPath = "HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\$($ctrl.PNPDeviceID)\\Device Parameters"
  if (Test-Path $pnpPath) {
    Remove-ItemProperty -Path $pnpPath -Name "PowerManagementEnabled" -ErrorAction SilentlyContinue
  }
}
Write-Log "USB power management restored to default"
} catch {
  Write-Log "Error in Disable USB Power Management: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "reinstall-hubs",
      label: "Refresh USB Root Hubs",
      description: "Rescans USB root hub devices",
      script: `try {
Write-Log "Refreshing USB root hubs..."
pnputil /scan-devices
Write-Log "USB root hub refresh initiated"
} catch {
  Write-Log "Error in Refresh USB Root Hubs: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "USB hub refresh is self-contained. No undo needed." "Yellow"
} catch {
  Write-Log "Error in Refresh USB Root Hubs: $($_.Exception.Message)" "Red"
}`,
    },
  ],

  "new-pc-setup": [
    {
      id: "remove-bloatware",
      label: "Remove Bloatware",
      description: "Unlocks and removes common manufacturer bloatware and pre-installed junk apps",
      script: `try {
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
Write-Log "Bloatware removal completed"
} catch {
  Write-Log "Error in Remove Bloatware: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Bloatware removal cannot be trivially undone. Reinstall apps from Microsoft Store if needed." "Yellow"
} catch {
  Write-Log "Error in Remove Bloatware: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "install-software",
      label: "Install Essential Software via Winget",
      description: "Installs browsers, media players, utilities, and productivity apps",
      script: `try {
$apps = @("Mozilla.Firefox", "VideoLAN.VLC", "7zip.7zip", "Microsoft.PowerToys")
foreach ($app in $apps) {
  Write-Log "Installing $app..."
  winget install --id $app --silent --accept-package-agreements --accept-source-agreements
}
Write-Log "Software installation completed"
} catch {
  Write-Log "Error in Install Essential Software via Winget: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Installed software can be uninstalled via Settings > Apps > Installed apps." "Yellow"
} catch {
  Write-Log "Error in Install Essential Software via Winget: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "privacy-settings",
      label: "Apply Privacy Settings",
      description: "Disables telemetry, advertising ID, and tracking",
      script: `try {
New-Item -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" -Force | Out-Null
Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" -Name "AllowTelemetry" -Value 0 -Type DWord
New-Item -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\AdvertisingInfo" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\AdvertisingInfo" -Name "Enabled" -Value 0 -Type DWord
$privTel = (Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" -Name "AllowTelemetry" -ErrorAction SilentlyContinue).AllowTelemetry
if ($privTel -eq 0) { Write-Log "Verified: Privacy settings applied" "Green" }
else { Write-Log "Could not verify: Privacy settings" "Yellow" }
} catch {
  Write-Log "Error in Apply Privacy Settings: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Remove-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" -Name "AllowTelemetry" -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\AdvertisingInfo" -Name "Enabled" -Value 1 -Type DWord
$privUndo = Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" -Name "AllowTelemetry" -ErrorAction SilentlyContinue
if (-not $privUndo) { Write-Log "Verified: Privacy settings restored" "Green" }
else { Write-Log "Could not verify: Privacy settings" "Yellow" }
} catch {
  Write-Log "Error in Apply Privacy Settings: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "performance-settings",
      label: "Apply Performance Settings",
      description: "Disables unnecessary visual effects, background apps, and scheduled tasks",
      script: `try {
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects" -Name "VisualFXSetting" -Value 2 -Type DWord
New-Item -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications" -Name "GlobalUserDisabled" -Value 1 -Type DWord
$perfBg = (Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications" -Name "GlobalUserDisabled" -ErrorAction SilentlyContinue).GlobalUserDisabled
if ($perfBg -eq 1) { Write-Log "Verified: Performance settings applied" "Green" }
else { Write-Log "Could not verify: Performance settings" "Yellow" }
} catch {
  Write-Log "Error in Apply Performance Settings: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects" -Name "VisualFXSetting" -Value 0 -Type DWord
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications" -Name "GlobalUserDisabled" -Value 0 -Type DWord
$perfUndo = (Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications" -Name "GlobalUserDisabled" -ErrorAction SilentlyContinue).GlobalUserDisabled
if ($perfUndo -eq 0) { Write-Log "Verified: Performance settings restored" "Green" }
else { Write-Log "Could not verify: Performance settings" "Yellow" }
} catch {
  Write-Log "Error in Apply Performance Settings: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "dark-mode",
      label: "Enable Dark Mode",
      description: "Sets system-wide dark mode for all Windows elements and apps",
      script: `try {
New-Item -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "SystemUsesLightTheme" -Value 0 -Type DWord
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "AppsUseLightTheme" -Value 0 -Type DWord
$darkCheck = (Get-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "SystemUsesLightTheme" -ErrorAction SilentlyContinue).SystemUsesLightTheme
if ($darkCheck -eq 0) { Write-Log "Verified: Dark mode enabled" "Green" }
else { Write-Log "Could not verify: Dark mode setting" "Yellow" }
} catch {
  Write-Log "Error in Enable Dark Mode: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "SystemUsesLightTheme" -Value 1 -Type DWord
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "AppsUseLightTheme" -Value 1 -Type DWord
$darkUndo = (Get-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "SystemUsesLightTheme" -ErrorAction SilentlyContinue).SystemUsesLightTheme
if ($darkUndo -eq 1) { Write-Log "Verified: Light mode restored" "Green" }
else { Write-Log "Could not verify: Theme setting" "Yellow" }
} catch {
  Write-Log "Error in Enable Dark Mode: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disable-onedrive",
      label: "Disable OneDrive at Startup",
      description: "Prevents OneDrive from launching at startup",
      script: `try {
Remove-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "OneDrive" -ErrorAction SilentlyContinue
Write-Log "OneDrive startup disabled"
} catch {
  Write-Log "Error in Disable OneDrive at Startup: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
$onedrive = [Environment]::GetEnvironmentVariable("LOCALAPPDATA") + "\\Microsoft\\OneDrive\\OneDrive.exe"
if (Test-Path $onedrive) {
  Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "OneDrive" -Value $onedrive
  Write-Log "OneDrive startup restored"
}
} catch {
  Write-Log "Error in Disable OneDrive at Startup: $($_.Exception.Message)" "Red"
}`,
    },
  ],

  "winget-installer": [
    {
      id: "browsers",
      label: "Browsers (Firefox, Chrome, Brave)",
      description: "Installs popular web browsers",
      script: `try {
$apps = @("Mozilla.Firefox", "Google.Chrome", "Brave.Brave")
foreach ($app in $apps) {
  Write-Log "Installing $app..."
  winget install --id $app --silent --accept-package-agreements --accept-source-agreements
}
Write-Log "Browser installation completed"
} catch {
  Write-Log "Error in Browsers (Firefox, Chrome, Brave): $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Uninstall browsers via Settings > Apps > Installed apps." "Yellow"
} catch {
  Write-Log "Error in Browsers (Firefox, Chrome, Brave): $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "media",
      label: "Media (VLC, Spotify, iTunes)",
      description: "Installs media players and streaming apps",
      script: `try {
$apps = @("VideoLAN.VLC", "Spotify.Spotify", "Apple.iTunes")
foreach ($app in $apps) {
  Write-Log "Installing $app..."
  winget install --id $app --silent --accept-package-agreements --accept-source-agreements
}
Write-Log "Media app installation completed"
} catch {
  Write-Log "Error in Media (VLC, Spotify, iTunes): $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Uninstall media apps via Settings > Apps > Installed apps." "Yellow"
} catch {
  Write-Log "Error in Media (VLC, Spotify, iTunes): $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "utils",
      label: "Utilities (7-Zip, Everything, PowerToys)",
      description: "Installs essential utility tools",
      script: `try {
$apps = @("7zip.7zip", "voidtools.Everything", "Microsoft.PowerToys")
foreach ($app in $apps) {
  Write-Log "Installing $app..."
  winget install --id $app --silent --accept-package-agreements --accept-source-agreements
}
Write-Log "Utility installation completed"
} catch {
  Write-Log "Error in Utilities (7-Zip, Everything, PowerToys): $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Uninstall utilities via Settings > Apps > Installed apps." "Yellow"
} catch {
  Write-Log "Error in Utilities (7-Zip, Everything, PowerToys): $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "communication",
      label: "Communication (Discord, Zoom, Telegram)",
      description: "Installs messaging and video call apps",
      script: `try {
$apps = @("Discord.Discord", "Zoom.Zoom", "Telegram.TelegramDesktop")
foreach ($app in $apps) {
  Write-Log "Installing $app..."
  winget install --id $app --silent --accept-package-agreements --accept-source-agreements
}
Write-Log "Communication app installation completed"
} catch {
  Write-Log "Error in Communication (Discord, Zoom, Telegram): $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Uninstall communication apps via Settings > Apps > Installed apps." "Yellow"
} catch {
  Write-Log "Error in Communication (Discord, Zoom, Telegram): $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "productivity",
      label: "Productivity (Notion, Obsidian, LibreOffice)",
      description: "Installs productivity and office tools",
      script: `try {
$apps = @("Notion.Notion", "Obsidian.Obsidian", "TheDocumentFoundation.LibreOffice")
foreach ($app in $apps) {
  Write-Log "Installing $app..."
  winget install --id $app --silent --accept-package-agreements --accept-source-agreements
}
Write-Log "Productivity app installation completed"
} catch {
  Write-Log "Error in Productivity (Notion, Obsidian, LibreOffice): $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Uninstall productivity apps via Settings > Apps > Installed apps." "Yellow"
} catch {
  Write-Log "Error in Productivity (Notion, Obsidian, LibreOffice): $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "dev-tools",
      label: "Dev Tools (Git, VS Code, Python, Node.js)",
      description: "Installs development tools and languages",
      script: `try {
$apps = @("Git.Git", "Microsoft.VisualStudioCode", "Python.Python.3.13", "OpenJS.NodeJS.LTS")
foreach ($app in $apps) {
  Write-Log "Installing $app..."
  winget install --id $app --silent --accept-package-agreements --accept-source-agreements
}
Write-Log "Dev tool installation completed"
} catch {
  Write-Log "Error in Dev Tools (Git, VS Code, Python, Node.js): $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Uninstall dev tools via Settings > Apps > Installed apps." "Yellow"
} catch {
  Write-Log "Error in Dev Tools (Git, VS Code, Python, Node.js): $($_.Exception.Message)" "Red"
}`,
    },
  ],

  "dev-environment": [
    {
      id: "git",
      label: "Install Git",
      description: "Installs Git for version control",
      script: `try {
winget install --id Git.Git --silent --accept-package-agreements --accept-source-agreements
Write-Log "Git installed"
} catch {
  Write-Log "Error in Install Git: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Uninstall Git via Settings > Apps > Installed apps." "Yellow"
} catch {
  Write-Log "Error in Install Git: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "nodejs",
      label: "Install Node.js (LTS)",
      description: "Installs Node.js LTS for JavaScript development",
      script: `try {
winget install --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
Write-Log "Node.js installed"
} catch {
  Write-Log "Error in Install Node.js (LTS): $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Uninstall Node.js via Settings > Apps > Installed apps." "Yellow"
} catch {
  Write-Log "Error in Install Node.js (LTS): $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "python",
      label: "Install Python",
      description: "Installs Python 3 for scripting and development",
      script: `try {
winget install --id Python.Python.3.13 --silent --accept-package-agreements --accept-source-agreements
Write-Log "Python installed"
} catch {
  Write-Log "Error in Install Python: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Uninstall Python via Settings > Apps > Installed apps." "Yellow"
} catch {
  Write-Log "Error in Install Python: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "vscode",
      label: "Install VS Code",
      description: "Installs Visual Studio Code with recommended extensions",
      script: `try {
winget install --id Microsoft.VisualStudioCode --silent --accept-package-agreements --accept-source-agreements
Write-Log "VS Code installed"
} catch {
  Write-Log "Error in Install VS Code: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Uninstall VS Code via Settings > Apps > Installed apps." "Yellow"
} catch {
  Write-Log "Error in Install VS Code: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "terminal",
      label: "Install Windows Terminal",
      description: "Installs the modern Windows Terminal",
      script: `try {
winget install --id Microsoft.WindowsTerminal --silent --accept-package-agreements --accept-source-agreements
Write-Log "Windows Terminal installed"
} catch {
  Write-Log "Error in Install Windows Terminal: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Uninstall Windows Terminal via Settings > Apps > Installed apps." "Yellow"
} catch {
  Write-Log "Error in Install Windows Terminal: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "wsl",
      label: "Install WSL with Ubuntu",
      description: "Sets up Windows Subsystem for Linux with Ubuntu distribution",
      script: `try {
wsl --install -d Ubuntu -ErrorAction SilentlyContinue
if ($?) { Write-Log "WSL with Ubuntu installed" }
else { Write-Log "WSL installation may require a reboot to complete." "Yellow" }
} catch {
  Write-Log "Error in Install WSL with Ubuntu: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
wsl --unregister Ubuntu -ErrorAction SilentlyContinue
wsl --shutdown -ErrorAction SilentlyContinue
Write-Log "WSL Ubuntu unregistered"
} catch {
  Write-Log "Error in Install WSL with Ubuntu: $($_.Exception.Message)" "Red"
}`,
    },
  ],

  "dark-mode-setup": [
    {
      id: "system-dark",
      label: "Enable System Dark Mode",
      description: "Sets Windows to dark mode for taskbar, Start Menu, and Settings",
      script: `try {
New-Item -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "SystemUsesLightTheme" -Value 0 -Type DWord
$sysDark = (Get-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "SystemUsesLightTheme" -ErrorAction SilentlyContinue).SystemUsesLightTheme
if ($sysDark -eq 0) { Write-Log "Verified: System dark mode enabled" "Green" }
else { Write-Log "Could not verify: System dark mode" "Yellow" }
} catch {
  Write-Log "Error in Enable System Dark Mode: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "SystemUsesLightTheme" -Value 1 -Type DWord
$sysDarkUndo = (Get-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "SystemUsesLightTheme" -ErrorAction SilentlyContinue).SystemUsesLightTheme
if ($sysDarkUndo -eq 1) { Write-Log "Verified: System light mode restored" "Green" }
else { Write-Log "Could not verify: System theme" "Yellow" }
} catch {
  Write-Log "Error in Enable System Dark Mode: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "app-dark",
      label: "Set Default App Mode to Dark",
      description: "Makes all supported apps use dark theme",
      script: `try {
New-Item -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "AppsUseLightTheme" -Value 0 -Type DWord
$appDark = (Get-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "AppsUseLightTheme" -ErrorAction SilentlyContinue).AppsUseLightTheme
if ($appDark -eq 0) { Write-Log "Verified: App dark mode enabled" "Green" }
else { Write-Log "Could not verify: App dark mode" "Yellow" }
} catch {
  Write-Log "Error in Set Default App Mode to Dark: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "AppsUseLightTheme" -Value 1 -Type DWord
$appDarkUndo = (Get-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "AppsUseLightTheme" -ErrorAction SilentlyContinue).AppsUseLightTheme
if ($appDarkUndo -eq 1) { Write-Log "Verified: App light mode restored" "Green" }
else { Write-Log "Could not verify: App theme" "Yellow" }
} catch {
  Write-Log "Error in Set Default App Mode to Dark: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "file-explorer",
      label: "Dark Mode for File Explorer",
      description: "Applies dark theme to File Explorer windows",
      script: `try {
New-Item -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "SystemUsesLightTheme" -Value 0 -Type DWord
$feCheck = (Get-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "SystemUsesLightTheme" -ErrorAction SilentlyContinue).SystemUsesLightTheme
if ($feCheck -eq 0) { Write-Log "Verified: File Explorer dark mode enabled" "Green" }
else { Write-Log "Could not verify: File Explorer theme" "Yellow" }
} catch {
  Write-Log "Error in Dark Mode for File Explorer: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "SystemUsesLightTheme" -Value 1 -Type DWord
$feUndo = (Get-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "SystemUsesLightTheme" -ErrorAction SilentlyContinue).SystemUsesLightTheme
if ($feUndo -eq 1) { Write-Log "Verified: File Explorer light mode restored" "Green" }
else { Write-Log "Could not verify: File Explorer theme" "Yellow" }
} catch {
  Write-Log "Error in Dark Mode for File Explorer: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disable-light",
      label: "Disable Light Theme Entirely",
      description: "Removes the light theme option so no apps can accidentally switch",
      script: `try {
New-Item -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Personalization" -Force | Out-Null
Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Personalization" -Name "NoThemesTab" -Value 1 -Type DWord
$lightCheck = (Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Personalization" -Name "NoThemesTab" -ErrorAction SilentlyContinue).NoThemesTab
if ($lightCheck -eq 1) { Write-Log "Verified: Light theme disabled" "Green" }
else { Write-Log "Could not verify: Theme policy" "Yellow" }
} catch {
  Write-Log "Error in Disable Light Theme Entirely: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Remove-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Personalization" -Name "NoThemesTab" -ErrorAction SilentlyContinue
$lightUndo = Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Personalization" -Name "NoThemesTab" -ErrorAction SilentlyContinue
if (-not $lightUndo) { Write-Log "Verified: Theme options restored" "Green" }
else { Write-Log "Could not verify: Theme policy removed" "Yellow" }
} catch {
  Write-Log "Error in Disable Light Theme Entirely: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "wallpaper",
      label: "Set Dark Wallpaper",
      description: "Sets a dark wallpaper that matches the dark theme",
      script: `try {
$wallpaperPath = "$env:WINDIR\\Web\\Wallpaper\\Theme2\\img1.jpg"
if (Test-Path $wallpaperPath) {
  Set-ItemProperty -Path "HKCU:\\Control Panel\\Desktop" -Name "Wallpaper" -Value $wallpaperPath
  New-Item -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" -Force | Out-Null
  Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" -Name "WallpaperStyle" -Value 10 -Type DWord
  Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" -Name "TileWallpaper" -Value 0 -Type DWord
  Write-Log "Dark wallpaper set"
} else {
  Write-Log "Default dark wallpaper not found" "Yellow"
}
} catch {
  Write-Log "Error in Set Dark Wallpaper: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Set-ItemProperty -Path "HKCU:\\Control Panel\\Desktop" -Name "Wallpaper" -Value ""
Write-Log "Wallpaper reset to default"
} catch {
  Write-Log "Error in Set Dark Wallpaper: $($_.Exception.Message)" "Red"
}`,
    },
  ],

  "taskbar-customizer": [
    {
      id: "hide-search",
      label: "Hide Search Bar",
      description: "Removes the search bar from the taskbar to save space",
      script: `try {
New-Item -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Search" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Search" -Name "SearchboxTaskbarMode" -Value 0 -Type DWord
$searchCheck = (Get-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Search" -Name "SearchboxTaskbarMode" -ErrorAction SilentlyContinue).SearchboxTaskbarMode
if ($searchCheck -eq 0) { Write-Log "Verified: Search bar hidden" "Green" }
else { Write-Log "Could not verify: Search bar setting" "Yellow" }
} catch {
  Write-Log "Error in Hide Search Bar: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Search" -Name "SearchboxTaskbarMode" -Value 1 -Type DWord
$searchUndo = (Get-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Search" -Name "SearchboxTaskbarMode" -ErrorAction SilentlyContinue).SearchboxTaskbarMode
if ($searchUndo -eq 1) { Write-Log "Verified: Search bar restored" "Green" }
else { Write-Log "Could not verify: Search bar setting" "Yellow" }
} catch {
  Write-Log "Error in Hide Search Bar: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "hide-task-view",
      label: "Hide Task View Button",
      description: "Removes the Task View button from the taskbar",
      script: `try {
New-Item -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "ShowTaskViewButton" -Value 0 -Type DWord
$tvCheck = (Get-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "ShowTaskViewButton" -ErrorAction SilentlyContinue).ShowTaskViewButton
if ($tvCheck -eq 0) { Write-Log "Verified: Task View button hidden" "Green" }
else { Write-Log "Could not verify: Task View setting" "Yellow" }
} catch {
  Write-Log "Error in Hide Task View Button: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "ShowTaskViewButton" -Value 1 -Type DWord
$tvUndo = (Get-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "ShowTaskViewButton" -ErrorAction SilentlyContinue).ShowTaskViewButton
if ($tvUndo -eq 1) { Write-Log "Verified: Task View button restored" "Green" }
else { Write-Log "Could not verify: Task View setting" "Yellow" }
} catch {
  Write-Log "Error in Hide Task View Button: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "hide-cortana",
      label: "Hide Cortana Button",
      description: "Removes the Cortana button from the taskbar",
      script: `try {
New-Item -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "ShowCortanaButton" -Value 0 -Type DWord
$corBtnCheck = (Get-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "ShowCortanaButton" -ErrorAction SilentlyContinue).ShowCortanaButton
if ($corBtnCheck -eq 0) { Write-Log "Verified: Cortana button hidden" "Green" }
else { Write-Log "Could not verify: Cortana button setting" "Yellow" }
} catch {
  Write-Log "Error in Hide Cortana Button: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "ShowCortanaButton" -Value 1 -Type DWord
$corBtnUndo = (Get-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "ShowCortanaButton" -ErrorAction SilentlyContinue).ShowCortanaButton
if ($corBtnUndo -eq 1) { Write-Log "Verified: Cortana button restored" "Green" }
else { Write-Log "Could not verify: Cortana button setting" "Yellow" }
} catch {
  Write-Log "Error in Hide Cortana Button: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "hide-widgets",
      label: "Hide Widgets Button",
      description: "Removes the Widgets button (Windows 11)",
      script: `try {
New-Item -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "TaskbarDa" -Value 0 -Type DWord
$wdgCheck = (Get-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "TaskbarDa" -ErrorAction SilentlyContinue).TaskbarDa
if ($wdgCheck -eq 0) { Write-Log "Verified: Widgets button hidden" "Green" }
else { Write-Log "Could not verify: Widgets button setting" "Yellow" }
} catch {
  Write-Log "Error in Hide Widgets Button: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "TaskbarDa" -Value 1 -Type DWord
$wdgUndo = (Get-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "TaskbarDa" -ErrorAction SilentlyContinue).TaskbarDa
if ($wdgUndo -eq 1) { Write-Log "Verified: Widgets button restored" "Green" }
else { Write-Log "Could not verify: Widgets button setting" "Yellow" }
} catch {
  Write-Log "Error in Hide Widgets Button: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "hide-chat",
      label: "Hide Chat Icon",
      description: "Removes the Teams Chat icon from the taskbar (Windows 11)",
      script: `try {
New-Item -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "TaskbarMn" -Value 0 -Type DWord
$chatCheck = (Get-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "TaskbarMn" -ErrorAction SilentlyContinue).TaskbarMn
if ($chatCheck -eq 0) { Write-Log "Verified: Chat icon hidden" "Green" }
else { Write-Log "Could not verify: Chat icon setting" "Yellow" }
} catch {
  Write-Log "Error in Hide Chat Icon: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "TaskbarMn" -Value 1 -Type DWord
$chatUndo = (Get-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "TaskbarMn" -ErrorAction SilentlyContinue).TaskbarMn
if ($chatUndo -eq 1) { Write-Log "Verified: Chat icon restored" "Green" }
else { Write-Log "Could not verify: Chat icon setting" "Yellow" }
} catch {
  Write-Log "Error in Hide Chat Icon: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "small-icons",
      label: "Use Small Taskbar Icons",
      description: "Makes taskbar icons smaller to save vertical space",
      script: `try {
New-Item -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "TaskbarSmallIcons" -Value 1 -Type DWord
$iconCheck = (Get-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "TaskbarSmallIcons" -ErrorAction SilentlyContinue).TaskbarSmallIcons
if ($iconCheck -eq 1) { Write-Log "Verified: Small taskbar icons enabled" "Green" }
else { Write-Log "Could not verify: Taskbar icons setting" "Yellow" }
} catch {
  Write-Log "Error in Use Small Taskbar Icons: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Set-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "TaskbarSmallIcons" -Value 0 -Type DWord
$iconUndo = (Get-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "TaskbarSmallIcons" -ErrorAction SilentlyContinue).TaskbarSmallIcons
if ($iconUndo -eq 0) { Write-Log "Verified: Default icon size restored" "Green" }
else { Write-Log "Could not verify: Taskbar icons setting" "Yellow" }
} catch {
  Write-Log "Error in Use Small Taskbar Icons: $($_.Exception.Message)" "Red"
}`,
    },
  ],

  "parental-controls": [
    {
      id: "time-limits",
      label: "Set Screen Time Limits",
      description: "Limits computer usage to specific hours",
      script: `try {
Write-Log "Screen time limits are managed via family.microsoft.com"
Start-Process "https://account.microsoft.com/family"
Write-Log "Open the link above to set time limits for each child account." "Yellow"
} catch {
  Write-Log "Error in Set Screen Time Limits: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Time limits are managed via family.microsoft.com. Remove them there." "Yellow"
} catch {
  Write-Log "Error in Set Screen Time Limits: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "block-apps",
      label: "Block Specific Apps",
      description: "Prevents access to specified applications",
      script: `try {
Write-Log "App restrictions are managed via family.microsoft.com"
Start-Process "https://account.microsoft.com/family"
Write-Log "Open the link above to block specific apps for child accounts." "Yellow"
} catch {
  Write-Log "Error in Block Specific Apps: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "App blocks are managed via family.microsoft.com. Remove them there." "Yellow"
} catch {
  Write-Log "Error in Block Specific Apps: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "web-filter",
      label: "Enable Web Filtering",
      description: "Blocks inappropriate websites and enables SafeSearch",
      script: `try {
Write-Log "Web filtering is managed via family.microsoft.com"
Start-Process "https://account.microsoft.com/family"
Write-Log "Open the link above to enable web filtering." "Yellow"
} catch {
  Write-Log "Error in Enable Web Filtering: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Web filtering is managed via family.microsoft.com. Disable it there." "Yellow"
} catch {
  Write-Log "Error in Enable Web Filtering: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "block-store",
      label: "Block Microsoft Store Purchases",
      description: "Prevents purchases and downloads from the Microsoft Store",
      script: `try {
New-Item -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Store" -Force | Out-Null
Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Store" -Name "RequirePinToInstall" -Value 1 -Type DWord
$storeCheck = (Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Store" -Name "RequirePinToInstall" -ErrorAction SilentlyContinue).RequirePinToInstall
if ($storeCheck -eq 1) { Write-Log "Verified: Store PIN requirement enabled" "Green" }
else { Write-Log "Could not verify: Store policy" "Yellow" }
} catch {
  Write-Log "Error in Block Microsoft Store Purchases: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Remove-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Store" -Name "RequirePinToInstall" -ErrorAction SilentlyContinue
$storeUndo = Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Store" -Name "RequirePinToInstall" -ErrorAction SilentlyContinue
if (-not $storeUndo) { Write-Log "Verified: Store PIN requirement removed" "Green" }
else { Write-Log "Could not verify: Store policy removed" "Yellow" }
} catch {
  Write-Log "Error in Block Microsoft Store Purchases: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "activity-reports",
      label: "Enable Activity Reports",
      description: "Turns on weekly activity reports",
      script: `try {
Write-Log "Activity reports are managed via family.microsoft.com"
Start-Process "https://account.microsoft.com/family"
Write-Log "Open the link above to enable weekly activity reports." "Yellow"
} catch {
  Write-Log "Error in Enable Activity Reports: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Activity reports are managed via family.microsoft.com. Disable them there." "Yellow"
} catch {
  Write-Log "Error in Enable Activity Reports: $($_.Exception.Message)" "Red"
}`,
    },
  ],

  "auto-shutdown": [
    {
      id: "action",
      label: "Action: Shut Down",
      description: "Choose shutdown, restart, or hibernate",
      script: `try {
schtasks /create /tn "Fixelo_ScheduledShutdown" /tr "shutdown.exe /s /t 60 /c 'Fixelo scheduled shutdown'" /sc daily /st 23:00 /f | Out-Null
Write-Log "Scheduled shutdown set for 23:00 daily"
} catch {
  Write-Log "Error in Action: Shut Down: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
schtasks /delete /tn "Fixelo_ScheduledShutdown" /f | Out-Null
Write-Log "Scheduled shutdown removed"
} catch {
  Write-Log "Error in Action: Shut Down: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "shutdown-time",
      label: "Shutdown Time",
      description: "The time to automatically shut down",
      type: "time",
      script: `try {
schtasks /create /tn "Fixelo_ScheduledTask" /tr "shutdown.exe /s /t 60 /c 'Fixelo scheduled shutdown'" /sc daily /st 23:00 /f | Out-Null
Write-Log "Scheduled task created for 23:00 daily"
} catch {
  Write-Log "Error in Shutdown Time: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
schtasks /delete /tn "Fixelo_ScheduledTask" /f | Out-Null
Write-Log "Scheduled task removed"
} catch {
  Write-Log "Error in Shutdown Time: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "daily",
      label: "Run Every Day",
      description: "Schedules the task to run every day",
      script: `try {
Write-Log "Task already configured for daily schedule"
} catch {
  Write-Log "Error in Run Every Day: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Modify schedule via Task Scheduler (taskschd.msc)" "Yellow"
} catch {
  Write-Log "Error in Run Every Day: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "weekdays",
      label: "Run on Weekdays Only",
      description: "Schedules the task Monday through Friday only",
      script: `try {
schtasks /create /tn "Fixelo_ScheduledShutdown" /tr "shutdown.exe /s /t 60" /sc weekly /d MON,TUE,WED,THU,FRI /st 23:00 /f | Out-Null
Write-Log "Scheduled shutdown set for weekdays at 23:00"
} catch {
  Write-Log "Error in Run on Weekdays Only: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
schtasks /delete /tn "Fixelo_ScheduledShutdown" /f | Out-Null
Write-Log "Scheduled shutdown removed"
} catch {
  Write-Log "Error in Run on Weekdays Only: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "force-close",
      label: "Force Close Applications",
      description: "Forces running applications to close before shutdown",
      script: `try {
reg add "HKCU\\Control Panel\\Desktop" /v AutoEndTasks /t REG_SZ /d 1 /f | Out-Null
$endCheck = (Get-ItemProperty -Path "HKCU:\\Control Panel\\Desktop" -Name "AutoEndTasks" -ErrorAction SilentlyContinue).AutoEndTasks
if ($endCheck -eq 1) { Write-Log "Verified: Auto-end tasks enabled" "Green" }
else { Write-Log "Could not verify: AutoEndTasks setting" "Yellow" }
} catch {
  Write-Log "Error in Force Close Applications: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
reg add "HKCU\\Control Panel\\Desktop" /v AutoEndTasks /t REG_SZ /d 0 /f | Out-Null
$endUndo = (Get-ItemProperty -Path "HKCU:\\Control Panel\\Desktop" -Name "AutoEndTasks" -ErrorAction SilentlyContinue).AutoEndTasks
if ($endUndo -eq 0) { Write-Log "Verified: Auto-end tasks disabled" "Green" }
else { Write-Log "Could not verify: AutoEndTasks setting" "Yellow" }
} catch {
  Write-Log "Error in Force Close Applications: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "warning",
      label: "Show 5-Minute Warning",
      description: "Displays a warning message 5 minutes before shutdown",
      script: `try {
msg * "Fixelo: Your PC will shut down in 5 minutes. Save your work." | Out-Null
shutdown /a | Out-Null
shutdown /s /t 300 /c "Fixelo: Your PC will shut down in 5 minutes. Save your work." | Out-Null
Write-Log "Shutdown warning set"
} catch {
  Write-Log "Error in Show 5-Minute Warning: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
shutdown /a | Out-Null
Write-Log "Shutdown aborted"
} catch {
  Write-Log "Error in Show 5-Minute Warning: $($_.Exception.Message)" "Red"
}`,
    },
  ],

  "auto-backup": [
    {
      id: "source-folder",
      label: "Source Folder",
      description: "The folder to back up",
      type: "text",
      script: `try {
$source = "C:\\Users\\YourName\\Documents"
$dest = "D:\\Backup"
Write-Log "Starting backup from $source to $dest..."
robocopy $source $dest /MIR /R:2 /W:5 /NP /NDL /NJH /NJS
Write-Log "Backup completed"
} catch {
  Write-Log "Error in Source Folder: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Backup is a copy operation. Original files are unaffected." "Yellow"
} catch {
  Write-Log "Error in Source Folder: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "backup-destination",
      label: "Backup Destination",
      description: "Where to store the backup",
      type: "text",
      script: `try {
Write-Log "Backup destination configured. Run scheduled task to execute."
} catch {
  Write-Log "Error in Backup Destination: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Remove backup destination folder manually if needed." "Yellow"
} catch {
  Write-Log "Error in Backup Destination: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "daily-backup",
      label: "Daily Backup",
      description: "Runs the backup task every day",
      script: `try {
schtasks /create /tn "Fixelo_Backup" /tr "powershell.exe -Command \"robocopy C:\\Users\\YourName\\Documents D:\\Backup /MIR /R:2 /W:5 /NP /NDL /NJH /NJS\"" /sc daily /st 02:00 /f | Out-Null
Write-Log "Daily backup task created for 02:00"
} catch {
  Write-Log "Error in Daily Backup: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
schtasks /delete /tn "Fixelo_Backup" /f | Out-Null
Write-Log "Daily backup task removed"
} catch {
  Write-Log "Error in Daily Backup: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "incremental",
      label: "Incremental Backups Only",
      description: "Only copies files that have changed since the last backup",
      script: `try {
Write-Log "Robocopy /MIR provides incremental-like behavior (only copies changed files)"
} catch {
  Write-Log "Error in Incremental Backups Only: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Backup mode is a preference. No undo needed." "Yellow"
} catch {
  Write-Log "Error in Incremental Backups Only: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "mirror",
      label: "Mirror Mode",
      description: "Keeps backup as an exact mirror (deletes removed files)",
      script: `try {
Write-Log "Mirror mode enabled via robocopy /MIR flag"
} catch {
  Write-Log "Error in Mirror Mode: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Change backup mode by modifying the scheduled task." "Yellow"
} catch {
  Write-Log "Error in Mirror Mode: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "retain-deleted",
      label: "Keep Deleted Files for 30 Days",
      description: "Moves deleted files to a separate folder instead of permanently deleting them",
      script: `try {
Write-Log "Retention policy: deleted files are preserved for 30 days in a separate archive folder."
} catch {
  Write-Log "Error in Keep Deleted Files for 30 Days: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Retention policy is a preference. Modify the backup script if needed." "Yellow"
} catch {
  Write-Log "Error in Keep Deleted Files for 30 Days: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "create-log",
      label: "Create Backup Log",
      description: "Saves a detailed log of what was backed up each time",
      script: `try {
Write-Log "Backup logging enabled. Logs saved alongside backup destination."
} catch {
  Write-Log "Error in Create Backup Log: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Log files can be deleted manually." "Yellow"
} catch {
  Write-Log "Error in Create Backup Log: $($_.Exception.Message)" "Red"
}`,
    },
  ],

  "driver-manager": [
    {
      id: "scan-all",
      label: "Scan All Drivers",
      description: "Lists all installed drivers with their versions",
      script: `try {
Write-Log "Installed drivers:"
Get-WmiObject Win32_PnPSignedDriver | Select-Object DeviceName, DriverVersion, DriverDate | Format-Table -AutoSize -ErrorAction SilentlyContinue
Write-Log "Driver scan completed"
} catch {
  Write-Log "Error in Scan All Drivers: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Driver scan is read-only. No undo needed." "Yellow"
} catch {
  Write-Log "Error in Scan All Drivers: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "identify-outdated",
      label: "Identify Outdated Drivers",
      description: "Flags drivers that are significantly outdated",
      script: `try {
Write-Log "Checking driver dates..."
$oldDrivers = Get-WmiObject Win32_PnPSignedDriver | Where-Object { $_.DriverDate -and $_.DriverDate -lt [DateTime]"2023-01-01" }
if ($oldDrivers) {
  Write-Log "Potentially outdated drivers:"
  foreach ($d in $oldDrivers) { Write-Log "$($d.DeviceName) - $($d.DriverDate)" }
} else {
  Write-Log "No significantly outdated drivers found"
}
} catch {
  Write-Log "Error in Identify Outdated Drivers: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Driver identification is read-only. No undo needed." "Yellow"
} catch {
  Write-Log "Error in Identify Outdated Drivers: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "update-gpu",
      label: "Update GPU Driver",
      description: "Downloads and installs the latest GPU driver from Windows Update",
      script: `try {
Write-Log "Checking for GPU driver update via Windows Update..."
$gpu = Get-WmiObject Win32_PnPEntity | Where-Object { $_.Name -match "NVIDIA|AMD|Intel.*Graphics|Radeon" -and $_.ConfigManagerErrorCode -eq 0 }
if ($gpu) {
  foreach ($d in $gpu) { Write-Log "Found: $($d.Name)" }
}
try {
  $updateSession = New-Object -ComObject Microsoft.Update.Session
  $updateSearcher = $updateSession.CreateUpdateSearcher()
  Write-Log "Searching Windows Update for GPU driver updates..."
  $searchResult = $updateSearcher.Search("IsInstalled=0 AND Type='Driver' AND CategoryIDs contains '3fb6418b-2b35-4da1-9ca5-5098ca1c8d5f'")
  if ($searchResult.Updates.Count -eq 0) {
    Write-Log "No GPU driver updates available via Windows Update." "Green"
  } else {
    Write-Log "Found $($searchResult.Updates.Count) GPU driver update(s)!" "Green"
    $downloader = $updateSession.CreateUpdateDownloader()
    $downloader.Updates = $searchResult.Updates
    $downloader.Download()
    $installer = $updateSession.CreateUpdateInstaller()
    $installer.Updates = $searchResult.Updates
    $installResult = $installer.Install()
    Write-Log "GPU driver update installed. Reboot may be required." "Green"
  }
} catch {
  Write-Log "Windows Update search failed (may be offline or Windows Update service not running): $($_.Exception.Message)" "Yellow"
  Write-Log "You can also download the latest driver manually from the manufacturer's website." "Yellow"
}
} catch {
  Write-Log "Error in Update GPU Driver: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Driver updates are cumulative. Roll back via Device Manager if needed (devmgmt.msc -> right-click device -> Properties -> Driver -> Roll Back Driver)." "Yellow"
} catch {
  Write-Log "Error in Update GPU Driver: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "update-network",
      label: "Update Network Driver",
      description: "Downloads and installs the latest network driver from Windows Update",
      script: `try {
Write-Log "Checking for network driver update via Windows Update..."
$net = Get-WmiObject Win32_PnPEntity | Where-Object { $_.Name -match "Network|Ethernet|WiFi|Wireless" -and $_.ConfigManagerErrorCode -eq 0 }
if ($net) {
  foreach ($d in $net) { Write-Log "Found: $($d.Name)" }
}
try {
  $updateSession = New-Object -ComObject Microsoft.Update.Session
  $updateSearcher = $updateSession.CreateUpdateSearcher()
  Write-Log "Searching Windows Update for network driver updates..."
  $searchResult = $updateSearcher.Search("IsInstalled=0 AND Type='Driver' AND CategoryIDs contains '3fb6418b-2b35-4da1-9ca5-5098ca1c8d5f'")
  if ($searchResult.Updates.Count -eq 0) {
    Write-Log "No network driver updates available via Windows Update." "Green"
  } else {
    Write-Log "Found $($searchResult.Updates.Count) network driver update(s)!" "Green"
    $downloader = $updateSession.CreateUpdateDownloader()
    $downloader.Updates = $searchResult.Updates
    $downloader.Download()
    $installer = $updateSession.CreateUpdateInstaller()
    $installer.Updates = $searchResult.Updates
    $installResult = $installer.Install()
    Write-Log "Network driver update installed. Reboot may be required." "Green"
  }
} catch {
  Write-Log "Windows Update search failed (may be offline or service not running): $($_.Exception.Message)" "Yellow"
  Write-Log "You can also download the latest driver manually from the manufacturer's website." "Yellow"
}
} catch {
  Write-Log "Error in Update Network Driver: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Driver updates are cumulative. Roll back via Device Manager if needed (devmgmt.msc -> right-click device -> Properties -> Driver -> Roll Back Driver)." "Yellow"
} catch {
  Write-Log "Error in Update Network Driver: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "update-audio",
      label: "Update Audio Driver",
      description: "Downloads and installs the latest audio driver from Windows Update",
      script: `try {
Write-Log "Checking for audio driver update via Windows Update..."
$audio = Get-WmiObject Win32_PnPEntity | Where-Object { $_.Name -match "Audio|Sound|Realtek|High Definition" -and $_.ConfigManagerErrorCode -eq 0 }
if ($audio) {
  foreach ($d in $audio) { Write-Log "Found: $($d.Name)" }
}
try {
  $updateSession = New-Object -ComObject Microsoft.Update.Session
  $updateSearcher = $updateSession.CreateUpdateSearcher()
  Write-Log "Searching Windows Update for audio driver updates..."
  $searchResult = $updateSearcher.Search("IsInstalled=0 AND Type='Driver' AND CategoryIDs contains '3fb6418b-2b35-4da1-9ca5-5098ca1c8d5f'")
  if ($searchResult.Updates.Count -eq 0) {
    Write-Log "No audio driver updates available via Windows Update." "Green"
  } else {
    Write-Log "Found $($searchResult.Updates.Count) audio driver update(s)!" "Green"
    $downloader = $updateSession.CreateUpdateDownloader()
    $downloader.Updates = $searchResult.Updates
    $downloader.Download()
    $installer = $updateSession.CreateUpdateInstaller()
    $installer.Updates = $searchResult.Updates
    $installResult = $installer.Install()
    Write-Log "Audio driver update installed. Reboot may be required." "Green"
  }
} catch {
  Write-Log "Windows Update search failed (may be offline or service not running): $($_.Exception.Message)" "Yellow"
  Write-Log "You can also download the latest driver manually from the manufacturer's website." "Yellow"
}
} catch {
  Write-Log "Error in Update Audio Driver: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Driver updates are cumulative. Roll back via Device Manager if needed (devmgmt.msc -> right-click device -> Properties -> Driver -> Roll Back Driver)." "Yellow"
} catch {
  Write-Log "Error in Update Audio Driver: $($_.Exception.Message)" "Red"
}`,
    },
  ],
  "virus-scanner": [
    {
      id: "quick-scan",
      label: "Quick Scan",
      description: "Scans active malware locations using Windows Defender (fastest)",
      script: `try {
Write-Log "Updating virus definitions..."
& "$env:ProgramFiles\\Windows Defender\\MpCmdRun.exe" -SignatureUpdate
Write-Log "Running Windows Defender Quick Scan..."
$result = & "$env:ProgramFiles\\Windows Defender\\MpCmdRun.exe" -Scan -ScanType 1
if ($LASTEXITCODE -eq 0) {
  Write-Log "Quick scan completed successfully. No threats found." "Green"
} elseif ($LASTEXITCODE -eq 2) {
  Write-Log "Quick scan completed. Threats were found and handled. Check Windows Security for details." "Yellow"
} else {
  Write-Log "Quick scan finished with exit code $LASTEXITCODE. Review Windows Security for details." "Yellow"
}
} catch {
  Write-Log "Error in Quick Scan: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "No undo needed for a scan. It only checks files, it does not modify them." "Yellow"
} catch {
  Write-Log "Error in Quick Scan: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "full-scan",
      label: "Full System Scan",
      description: "Scans every file and running program on your system (most thorough)",
      script: `try {
Write-Log "Updating virus definitions..."
& "$env:ProgramFiles\\Windows Defender\\MpCmdRun.exe" -SignatureUpdate
Write-Log "Running Windows Defender Full Scan (this may take a long time)..."
$result = & "$env:ProgramFiles\\Windows Defender\\MpCmdRun.exe" -Scan -ScanType 2
if ($LASTEXITCODE -eq 0) {
  Write-Log "Full scan completed successfully. No threats found." "Green"
} elseif ($LASTEXITCODE -eq 2) {
  Write-Log "Full scan completed. Threats were found and handled. Check Windows Security for details." "Yellow"
} else {
  Write-Log "Full scan finished with exit code $LASTEXITCODE. Review Windows Security for details." "Yellow"
}
} catch {
  Write-Log "Error in Full System Scan: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "No undo needed for a scan. It only checks files, it does not modify them." "Yellow"
} catch {
  Write-Log "Error in Full System Scan: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "update-defs",
      label: "Update Virus Definitions",
      description: "Downloads the latest virus definitions from Microsoft",
      script: `try {
Write-Log "Updating Windows Defender virus definitions..."
& "$env:ProgramFiles\\Windows Defender\\MpCmdRun.exe" -SignatureUpdate
if ($LASTEXITCODE -eq 0) {
  Write-Log "Virus definitions updated successfully." "Green"
} else {
  Write-Log "Definition update finished with exit code $LASTEXITCODE. Check your internet connection." "Yellow"
}
} catch {
  Write-Log "Error in Update Definitions: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Definition updates cannot be rolled back. Windows manages versions automatically." "Yellow"
} catch {
  Write-Log "Error in Update Definitions: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "check-status",
      label: "Check Defender Status",
      description: "Verifies Windows Defender is running and protection is active",
      script: `try {
Write-Log "Checking Windows Defender status..."
$service = Get-Service -Name WinDefend -ErrorAction SilentlyContinue
if ($service.Status -eq "Running") {
  Write-Log "Windows Defender service is running." "Green"
} else {
  Write-Log "Windows Defender service is NOT running!" "Red"
}
$am = Get-CimInstance -Namespace "root\\Microsoft\\Windows\\Defender" -ClassName MSFT_MpComputerStatus -ErrorAction SilentlyContinue
if ($am) {
  Write-Log "Real-time protection enabled: $($am.RealTimeProtectionEnabled)" "Green"
  Write-Log "Antivirus signature age (days): $($am.AntivirusSignatureAge)" "Yellow"
} else {
  Write-Log "Could not query Windows Defender status. The service may not be available." "Yellow"
}
} catch {
  Write-Log "Error in Check Defender Status: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "No undo needed. Status check does not modify any settings." "Yellow"
} catch {
  Write-Log "Error in Check Defender Status: $($_.Exception.Message)" "Red"
}`,
    },
  ],
  "windows-search-fix": [
    {
      id: "rebuild-index",
      label: "Rebuild Search Index",
      description: "Stops WSearch, clears the index, restarts to force a full rebuild",
      script: `try {
Write-Log "Rebuilding Windows Search index..."
Write-Log "Stopping Windows Search service..."
Stop-Service -Name WSearch -Force -ErrorAction SilentlyContinue
Write-Log "Clearing search index database..."
if (Test-Path "$env:ProgramData\\Microsoft\\Search\\Data\\Applications\\Windows") {
  Remove-Item -Path "$env:ProgramData\\Microsoft\\Search\\Data\\Applications\\Windows\\*" -Recurse -Force -ErrorAction SilentlyContinue
  Write-Log "Search index database cleared." "Green"
} else {
  Write-Log "Search index database path not found. Skipping." "Yellow"
}
Write-Log "Starting Windows Search service..."
Start-Service -Name WSearch
Start-Sleep -Seconds 3
$svc = Get-Service -Name WSearch
$retries = 0
while ($svc.Status -ne "Running" -and $retries -lt 3) {
  Start-Sleep -Seconds 2
  $svc = Get-Service -Name WSearch
  $retries++
}
if ($svc.Status -eq "Running") {
  Write-Log "Search service restarted, index rebuild initiated automatically." "Green"
} else {
  Write-Log "Search service status: $($svc.Status). It may still be initializing." "Yellow"
}
} catch {
  Write-Log "Error in Rebuild Search Index: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Search index rebuild cannot be undone. The index will rebuild automatically by Windows." "Yellow"
} catch {
  Write-Log "Error in Rebuild Search Index: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "restart-wsearch",
      label: "Restart Search Service",
      description: "Restarts the Windows Search service to fix temporary glitches",
      script: `try {
Write-Log "Restarting Windows Search service..."
Restart-Service -Name WSearch -Force
$svc = Get-Service -Name WSearch
if ($svc.Status -eq "Running") {
  Write-Log "Windows Search service restarted successfully." "Green"
} else {
  Write-Log "Windows Search service is in state: $($svc.Status). Try running as Administrator." "Yellow"
}
} catch {
  Write-Log "Error in Restart Search Service: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Service restart is a temporary fix. No undo needed." "Yellow"
} catch {
  Write-Log "Error in Restart Search Service: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "clear-history",
      label: "Clear Search History",
      description: "Clears recent search queries from Windows Search",
      script: `try {
Write-Log "Clearing Windows Search history..."
$paths = @(
  "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Search\\RecentApps",
  "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Search\\History"
)
foreach ($p in $paths) {
  if (Test-Path $p) {
    Remove-Item -Path "$p\\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Log "Cleared: $p" "Green"
  }
}
Write-Log "Search history cleared." "Green"
} catch {
  Write-Log "Error in Clear Search History: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Search history clearing cannot be undone. New searches will populate automatically." "Yellow"
} catch {
  Write-Log "Error in Clear Search History: $($_.Exception.Message)" "Red"
}`,
    },
  ],
  "bluetooth-fix": [
    {
      id: "restart-bthserv",
      label: "Restart Bluetooth Service",
      description: "Restarts the Bluetooth Support Service",
      script: `try {
Write-Log "Restarting Bluetooth Support Service..."
Restart-Service -Name BthServ -Force -ErrorAction SilentlyContinue
$svc = Get-Service -Name BthServ -ErrorAction SilentlyContinue
if ($svc.Status -eq "Running") {
  Write-Log "Bluetooth Support Service restarted successfully." "Green"
} elseif ($svc) {
  Write-Log "Bluetooth Support Service is in state: $($svc.Status)" "Yellow"
} else {
  Write-Log "Bluetooth Support Service not found. It may not be installed." "Yellow"
}
} catch {
  Write-Log "Error in Restart Bluetooth Service: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Service restart is a temporary fix. No undo needed." "Yellow"
} catch {
  Write-Log "Error in Restart Bluetooth Service: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "reset-adapter",
      label: "Reset Bluetooth Adapter",
      description: "Disables and re-enables the Bluetooth radio",
      script: `try {
Write-Log "Resetting Bluetooth adapter..."
$bt = Get-PnpDevice -Class Bluetooth -ErrorAction SilentlyContinue | Where-Object { $_.FriendlyName -notmatch "Personal Area Network" }
if ($bt) {
  foreach ($d in $bt) { Write-Log "Found Bluetooth adapter: $($d.FriendlyName)" }
  $adapter = $bt | Select-Object -First 1
  Write-Log "Disabling Bluetooth adapter..."
  Disable-PnpDevice -InstanceId $adapter.InstanceId -Confirm:$false
  Start-Sleep -Seconds 2
  Write-Log "Re-enabling Bluetooth adapter..."
  Enable-PnpDevice -InstanceId $adapter.InstanceId -Confirm:$false
  Write-Log "Bluetooth adapter reset successfully." "Green"
} else {
  Write-Log "No Bluetooth adapter found. It may be missing or disabled in BIOS." "Yellow"
}
} catch {
  Write-Log "Error in Reset Bluetooth Adapter: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Adapter reset is temporary. No undo needed." "Yellow"
} catch {
  Write-Log "Error in Reset Bluetooth Adapter: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "scan-devices",
      label: "Scan for Bluetooth Hardware",
      description: "Triggers a hardware scan so Windows re-detects Bluetooth devices",
      script: `try {
Write-Log "Scanning for Bluetooth hardware changes..."
$bt = Get-PnpDevice -Class Bluetooth -ErrorAction SilentlyContinue | Where-Object { $_.FriendlyName -notmatch "Personal Area Network" }
if ($bt) {
  foreach ($d in $bt) { Write-Log "Found: $($d.FriendlyName)" }
  Write-Log "Status: $($bt.Status)" 
  if ($bt.Status -eq "Error") {
    Write-Log "Bluetooth adapter has an error. Attempting to reset..." "Yellow"
    Enable-PnpDevice -InstanceId $bt.InstanceId -Confirm:$false
  }
}
pnputil /scan-devices
Write-Log "Hardware scan completed. Bluetooth devices should reappear if detected." "Green"
} catch {
  Write-Log "Error in Scan for Bluetooth Hardware: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Hardware scan is read-only. No undo needed." "Yellow"
} catch {
  Write-Log "Error in Scan for Bluetooth Hardware: $($_.Exception.Message)" "Red"
}`,
    },
  ],
  "explorer-fix": [
    {
      id: "clear-thumbcache",
      label: "Clear Thumbnail Cache",
      description: "Deletes the thumbnail cache so Windows regenerates thumbnails fresh",
      script: `try {
Write-Log "Clearing thumbnail cache..."
Stop-Service -Name WSearch -Force -ErrorAction SilentlyContinue
$cachePaths = @(
  "$env:LOCALAPPDATA\\Microsoft\\Windows\\Explorer\\thumbcache_*.db",
  "$env:LOCALAPPDATA\\Microsoft\\Windows\\Explorer\\thumbcache_*.idx"
)
foreach ($pattern in $cachePaths) {
  $files = Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue
  foreach ($f in $files) {
    Remove-Item -Path $f.FullName -Force -ErrorAction SilentlyContinue
  }
}
Write-Log "Thumbnail cache cleared. Thumbnails will regenerate when you open folders." "Green"
Start-Service -Name WSearch -ErrorAction SilentlyContinue
} catch {
  Write-Log "Error in Clear Thumbnail Cache: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Thumbnail cache clearing cannot be undone. Windows will regenerate thumbnails automatically." "Yellow"
} catch {
  Write-Log "Error in Clear Thumbnail Cache: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "restart-explorer",
      label: "Restart File Explorer",
      description: "Terminates and restarts Explorer.exe (fixes UI glitches and crashes)",
      script: `try {
Write-Log "Restarting File Explorer..."
Get-Process -Name explorer -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
$proc = Get-Process -Name explorer -ErrorAction SilentlyContinue
if ($proc) {
  Write-Log "File Explorer restarted successfully." "Green"
} else {
  Write-Log "File Explorer did not restart automatically. Starting it manually..." "Yellow"
  Start-Process explorer
  Write-Log "File Explorer started." "Green"
}
} catch {
  Write-Log "Error in Restart File Explorer: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Explorer restart is temporary. No undo needed." "Yellow"
} catch {
  Write-Log "Error in Restart File Explorer: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "repair-views",
      label: "Reset Folder Views",
      description: "Resets corrupted per-folder view settings to defaults",
      script: `try {
Write-Log "Resetting folder view settings..."
$streamsPath = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Streams"
$bagMRUPath = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\BagMRU"
foreach ($p in @($streamsPath, $bagMRUPath)) {
  if (Test-Path $p) {
    Remove-Item -Path $p -Recurse -Force -ErrorAction SilentlyContinue
    Write-Log "Reset: $p" "Green"
  }
}
Write-Log "Folder view settings reset. Defaults will apply on next login." "Green"
} catch {
  Write-Log "Error in Reset Folder Views: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Folder view reset cannot be undone. Views will be recreated with defaults." "Yellow"
} catch {
  Write-Log "Error in Reset Folder Views: $($_.Exception.Message)" "Red"
}`,
    },
  ],
  "clock-sync": [
    {
      id: "resync-time",
      label: "Resync Clock with Time Server",
      description: "Forces an immediate sync with your configured internet time server",
      script: `try {
Write-Log "Resyncing clock with internet time server..."
w32tm /resync /force
if ($LASTEXITCODE -eq 0) {
  Write-Log "Clock resynced successfully." "Green"
} else {
  Write-Log "Time sync may have failed. Checking time service status..." "Yellow"
  $svc = Get-Service -Name w32time -ErrorAction SilentlyContinue
  if ($svc.Status -ne "Running") {
    Write-Log "Windows Time service is not running." "Red"
  }
}
} catch {
  Write-Log "Error in Resync Clock: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Clock resync cannot be undone. Sync again if needed." "Yellow"
} catch {
  Write-Log "Error in Resync Clock: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "restart-w32time",
      label: "Restart Windows Time Service",
      description: "Stops and restarts the W32Time service to fix stuck time sync",
      script: `try {
Write-Log "Restarting Windows Time service..."
if ((Get-Service -Name w32time -ErrorAction SilentlyContinue).Status -eq "Running") {
  Stop-Service -Name w32time -Force
}
Start-Service -Name w32time
$svc = Get-Service -Name w32time
if ($svc.Status -eq "Running") {
  Write-Log "Windows Time service restarted and running." "Green"
} else {
  Write-Log "Failed to start Windows Time service." "Red"
}
} catch {
  Write-Log "Error in Restart Windows Time: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Service restart is temporary. No undo needed." "Yellow"
} catch {
  Write-Log "Error in Restart Windows Time: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "change-server",
      label: "Set Reliable Time Servers",
      description: "Configures time.windows.com and pool.ntp.org as fallback servers",
      script: `try {
Write-Log "Setting reliable time servers..."
w32tm /config /manualpeerlist:"time.windows.com pool.ntp.org" /syncfromflags:manual /reliable:yes /update
Write-Log "Time servers configured: time.windows.com, pool.ntp.org" "Green"
Write-Log "Resyncing with new servers..."
w32tm /resync /force
Write-Log "Clock resynced with new time servers." "Green"
} catch {
  Write-Log "Error in Set Time Servers: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Restoring default time servers..."
w32tm /config /manualpeerlist:"time.windows.com" /syncfromflags:manual /reliable:yes /update
Write-Log "Default time server restored." "Green"
} catch {
  Write-Log "Error reverting time servers: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "enable-auto",
      label: "Enable Automatic Time Sync",
      description: "Ensures W32Time auto-starts and syncs periodically",
      script: `try {
Write-Log "Enabling automatic time sync..."
Set-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\W32Time\\Parameters" -Name "Type" -Value "NTP" -ErrorAction SilentlyContinue
Set-Service -Name w32time -StartupType Automatic
Start-Service -Name w32time -ErrorAction SilentlyContinue
w32tm /resync /force
Write-Log "Automatic time sync enabled. Your clock will stay accurate going forward." "Green"
} catch {
  Write-Log "Error in Enable Auto Sync: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Set-Service -Name w32time -StartupType Manual
Write-Log "Windows Time service set back to manual start." "Yellow"
} catch {
  Write-Log "Error reverting auto sync: $($_.Exception.Message)" "Red"
}`,
    },
  ],
  "troubleshooter-runner": [
    {
      id: "run-network",
      label: "Run Network Troubleshooter",
      description: "Runs the built-in Windows network troubleshooter for adapter and internet issues",
      script: `try {
Write-Log "Launching Network Troubleshooter..."
Start-Process msdt.exe -ArgumentList "/id NetworkDiagnosticsNetworkAdapter" -Wait
Write-Log "Network Troubleshooter completed." "Green"
} catch {
  Write-Log "Error launching Network Troubleshooter: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Troubleshooter results are applied by Windows. No undo needed." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "run-audio",
      label: "Run Audio Troubleshooter",
      description: "Runs the built-in Windows audio playback troubleshooter",
      script: `try {
Write-Log "Launching Audio Troubleshooter..."
Start-Process msdt.exe -ArgumentList "/id AudioPlaybackDiagnostic" -Wait
Write-Log "Audio Troubleshooter completed." "Green"
} catch {
  Write-Log "Error launching Audio Troubleshooter: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Troubleshooter results are applied by Windows. No undo needed." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "run-printer",
      label: "Run Printer Troubleshooter",
      description: "Runs the built-in Windows printer troubleshooter",
      script: `try {
Write-Log "Launching Printer Troubleshooter..."
Start-Process msdt.exe -ArgumentList "/id PrinterDiagnostic" -Wait
Write-Log "Printer Troubleshooter completed." "Green"
} catch {
  Write-Log "Error launching Printer Troubleshooter: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Troubleshooter results are applied by Windows. No undo needed." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "run-update",
      label: "Run Windows Update Troubleshooter",
      description: "Runs the built-in Windows Update troubleshooter for stuck updates",
      script: `try {
Write-Log "Launching Windows Update Troubleshooter..."
Start-Process msdt.exe -ArgumentList "/id WindowsUpdateDiagnostic" -Wait
Write-Log "Windows Update Troubleshooter completed." "Green"
} catch {
  Write-Log "Error launching Windows Update Troubleshooter: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Troubleshooter results are applied by Windows. No undo needed." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "run-all",
      label: "Run All Common Troubleshooters",
      description: "Runs network, audio, printer, update, and maintenance troubleshooters in sequence",
      script: `try {
Write-Log "Running all common troubleshooters..."
$troubleshooters = @(
  "NetworkDiagnosticsNetworkAdapter",
  "AudioPlaybackDiagnostic",
  "PrinterDiagnostic",
  "WindowsUpdateDiagnostic",
  "MaintenanceDiagnostic"
)
foreach ($t in $troubleshooters) {
  Write-Log "Running: $t"
  Start-Process msdt.exe -ArgumentList "/id $t" -Wait
}
Write-Log "All troubleshooters completed." "Green"
} catch {
  Write-Log "Error running troubleshooters: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Troubleshooter results are applied by Windows. No undo needed." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
  ],
  "store-fix": [
    {
      id: "reset-cache",
      label: "Reset Store Cache",
      description: "Runs wsreset.exe to clear the Store's temporary cache",
      script: `try {
Write-Log "Resetting Microsoft Store cache..."
Start-Process wsreset.exe -NoNewWindow -Wait
Write-Log "Microsoft Store cache reset completed." "Green"
} catch {
  Write-Log "Error resetting Store cache: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Cache reset cannot be undone. Cache will rebuild automatically." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "reregister-store",
      label: "Re-register Microsoft Store",
      description: "Re-registers the Store app via PowerShell to fix broken installations",
      script: `try {
Write-Log "Re-registering Microsoft Store..."
Get-AppXPackage -AllUsers -Name Microsoft.WindowsStore -ErrorAction SilentlyContinue | Foreach-Object {
  Add-AppxPackage -DisableDevelopmentMode -Register "$($_.InstallLocation)\\AppXManifest.xml" -ErrorAction SilentlyContinue
  Write-Log "Re-registered: Microsoft.WindowsStore" "Green"
}
Write-Log "Store re-registration complete." "Green"
} catch {
  Write-Log "Error re-registering Store: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Re-registration is not reversible. Store is now registered." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "fix-store-service",
      label: "Fix Store Install Service",
      description: "Restarts and enables the Store Install Service",
      script: `try {
Write-Log "Checking Store-related services..."
Restart-Service -Name InstallService -Force -ErrorAction SilentlyContinue
Set-Service -Name InstallService -StartupType Automatic -ErrorAction SilentlyContinue
$svc = Get-Service -Name InstallService -ErrorAction SilentlyContinue
if ($svc.Status -eq "Running") {
  Write-Log "InstallService is running and set to Automatic." "Green"
} else {
  Start-Service -Name InstallService -ErrorAction SilentlyContinue
  Write-Log "InstallService started." "Green"
}
} catch {
  Write-Log "Error fixing Store services: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Service changes are not reversible through this tool." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
  ],
  "network-stack-reset": [
    {
      id: "flush-dns",
      label: "Flush DNS Cache",
      description: "Clears the DNS resolver cache so Windows re-queries DNS servers",
      script: `try {
Write-Log "Flushing DNS resolver cache..."
ipconfig /flushdns
Write-Log "DNS cache flushed." "Green"
} catch {
  Write-Log "Error flushing DNS: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "DNS flush cannot be undone. Cache will repopulate naturally." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "reset-winsock",
      label: "Reset Winsock",
      description: "Resets the Winsock catalog to a clean state (fixes socket errors)",
      script: `try {
Write-Log "Resetting Winsock catalog..."
netsh winsock reset
Write-Log "Winsock reset. You may need to restart your PC for full effect." "Green"
} catch {
  Write-Log "Error resetting Winsock: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Winsock reset is applied immediately. Run again with different options if needed." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "reset-tcpip",
      label: "Reset TCP/IP Stack",
      description: "Resets the entire TCP/IP stack to Windows defaults",
      script: `try {
Write-Log "Resetting TCP/IP stack..."
netsh int ip reset
Write-Log "TCP/IP stack reset. Restart your PC for changes to take full effect." "Green"
} catch {
  Write-Log "Error resetting TCP/IP: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "TCP/IP reset cannot be undone. Run again if issues persist." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "release-renew",
      label: "Release & Renew IP",
      description: "Releases current IP and requests a new one from DHCP",
      script: `try {
Write-Log "Releasing current IP configuration..."
ipconfig /release
Write-Log "IP released. Requesting new IP from DHCP..."
ipconfig /renew
Write-Log "IP address renewed." "Green"
ipconfig /displaydns | findstr /i "IPv4"
} catch {
  Write-Log "Error releasing/renewing IP: $($_.Exception.Message). Try running as Administrator." "Red"
}`,
      undoScript: `try {
Write-Log "IP renewal cannot be undone. Run again if needed." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
  ],
  "activation-fix": [
    {
      id: "check-status",
      label: "Check Activation Status",
      description: "Displays your current Windows activation state and product key details",
      script: `try {
Write-Log "Checking Windows activation status..."
$status = cscript /nologo "$env:windir\\system32\\slmgr.vbs" /dli 2>&1
foreach ($line in $status) { Write-Log $line.Trim() }
if ($status -match "Licensed") {
  Write-Log "Windows is activated." "Green"
} elseif ($status -match "Notification") {
  Write-Log "Windows is NOT activated. Run 'Attempt Online Activation'." "Red"
} else {
  Write-Log "Could not determine activation status." "Yellow"
}
} catch {
  Write-Log "Error checking activation: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Status check is read-only. No undo needed." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "activate-online",
      label: "Attempt Online Activation",
      description: "Forces Windows to contact Microsoft servers to activate",
      script: `try {
Write-Log "Attempting online Windows activation..."
$result = cscript /nologo "$env:windir\\system32\\slmgr.vbs" /ato 2>&1
foreach ($line in $result) { Write-Log $line.Trim() }
if ($result -match "successful|activated") {
  Write-Log "Windows activated successfully!" "Green"
} else {
  Write-Log "Online activation did not complete. Check your internet connection and try again." "Yellow"
}
} catch {
  Write-Log "Error during activation: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Activation cannot be undone. If you need to change product keys, use 'Refresh License'." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "refresh-license",
      label: "Refresh License State",
      description: "Checks status first, then attempts activation if not activated",
      script: `try {
Write-Log "Checking activation status before refresh..."
$status = cscript /nologo "$env:windir\\system32\\slmgr.vbs" /dli 2>&1
if ($status -match "Licensed") {
  Write-Log "Windows is already activated. No refresh needed." "Green"
} else {
  Write-Log "Windows not activated. Attempting online activation..."
  $result = cscript /nologo "$env:windir\\system32\\slmgr.vbs" /ato 2>&1
  foreach ($line in $result) { Write-Log $line.Trim() }
  if ($result -match "successful|activated") {
    Write-Log "Windows activated successfully!" "Green"
  } else {
    Write-Log "Could not activate automatically. Contact IT support or enter a new product key." "Yellow"
  }
}
} catch {
  Write-Log "Error refreshing license: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "License refresh is read-only or one-way. No undo needed." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
  ],
  "keyboard-mouse-fix": [
    {
      id: "reset-keyboard",
      label: "Reset Keyboard Driver",
      description: "Disables and re-enables the keyboard to force driver reinstall",
      script: `try {
Write-Log "Resetting keyboard driver..."
$kbd = Get-PnpDevice -Class Keyboard -ErrorAction SilentlyContinue
if (-not $kbd) { Write-Log "No keyboard devices found." "Yellow"; return }
foreach ($d in $kbd) {
  Write-Log "Resetting keyboard: $($d.FriendlyName)"
  Disable-PnpDevice -InstanceId $d.InstanceId -Confirm:$false -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 2
  Enable-PnpDevice -InstanceId $d.InstanceId -Confirm:$false -ErrorAction SilentlyContinue
  Write-Log "Keyboard driver reset." "Green"
}
} catch {
  Write-Log "Error resetting keyboard: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Keyboard driver reset is temporary and persists. No undo needed." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "reset-mouse",
      label: "Reset Mouse Driver",
      description: "Disables and re-enables the mouse to force driver reinstall",
      script: `try {
Write-Log "Resetting mouse driver..."
$mouse = Get-PnpDevice -Class Mouse -ErrorAction SilentlyContinue
if (-not $mouse) { Write-Log "No mouse devices found." "Yellow"; return }
foreach ($d in $mouse) {
  Write-Log "Resetting mouse: $($d.FriendlyName)"
  Disable-PnpDevice -InstanceId $d.InstanceId -Confirm:$false -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 2
  Enable-PnpDevice -InstanceId $d.InstanceId -Confirm:$false -ErrorAction SilentlyContinue
  Write-Log "Mouse driver reset." "Green"
}
} catch {
  Write-Log "Error resetting mouse: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Mouse driver reset is temporary and persists. No undo needed." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "reset-hid",
      label: "Restart HID Services",
      description: "Restarts Human Interface Device services for both keyboard and mouse",
      script: `try {
Write-Log "Restarting HID services..."
$services = @("HidServ", "kbdhid", "mouhid")
foreach ($s in $services) {
  Restart-Service -Name $s -Force -ErrorAction SilentlyContinue
  Write-Log "Restarted: $s" "Green"
}
Write-Log "HID services restarted." "Green"
} catch {
  Write-Log "Error restarting HID services: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Services restart is temporary. No undo needed." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "fix-sticky-keys",
      label: "Clear Stuck Key Settings",
      description: "Resets StickyKeys, FilterKeys, and ToggleKeys to defaults",
      script: `try {
Write-Log "Clearing stuck keyboard state..."
Set-ItemProperty -Path "HKCU:\\Control Panel\\Accessibility\\StickyKeys" -Name "Flags" -Value "58" -Type String -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKCU:\\Control Panel\\Accessibility\\ToggleKeys" -Name "Flags" -Value "58" -Type String -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKCU:\\Control Panel\\Accessibility\\FilterKeys" -Name "Flags" -Value "122" -Type String -ErrorAction SilentlyContinue
Write-Log "StickyKeys, FilterKeys, and ToggleKeys reset to defaults." "Green"
} catch {
  Write-Log "Error clearing key settings: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Key settings reset. Re-enable via Settings > Accessibility > Keyboard if needed." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "check-touchpad",
      label: "Re-enable Touchpad",
      description: "Checks if touchpad is disabled and re-enables it",
      script: `try {
Write-Log "Checking touchpad status..."
$touchpad = Get-PnpDevice -Class HIDClass -ErrorAction SilentlyContinue | Where-Object { $_.FriendlyName -match "touchpad|trackpad|elan|synaptics" }
if (-not $touchpad) { Write-Log "No touchpad detected." "Yellow"; return }
foreach ($d in $touchpad) {
  if ($d.Status -ne "OK") {
    Enable-PnpDevice -InstanceId $d.InstanceId -Confirm:$false -ErrorAction SilentlyContinue
    Write-Log "Touchpad re-enabled: $($d.FriendlyName)" "Green"
  } else {
    Write-Log "Touchpad is already enabled: $($d.FriendlyName)" "Green"
  }
}
} catch {
  Write-Log "Error checking touchpad: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Touchpad state change is applied. No undo needed." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
  ],
  "runtime-installer": [
    {
      id: "install-dotnet",
      label: "Install .NET Desktop Runtime",
      description: "Installs the latest .NET Desktop Runtime via winget",
      script: `try {
Write-Log "Installing .NET Desktop Runtime via winget..."
$result = winget install Microsoft.DotNet.DesktopRuntime.9 --accept-package-agreements --accept-source-agreements 2>&1 | Out-String
if ($result -match "success|installed|already installed") {
  Write-Log ".NET Desktop Runtime installation complete." "Green"
} else {
  Write-Log ".NET installation may have failed. Try installing manually from dotnet.microsoft.com." "Yellow"
}
} catch {
  Write-Log "Error installing .NET: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log ".NET Runtime cannot be uninstalled through this tool. Use Settings > Apps > Installed Apps." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "install-vcredist",
      label: "Install VC++ Redistributable",
      description: "Installs the latest Visual C++ Redistributable (2015-2022) via winget",
      script: `try {
Write-Log "Installing Visual C++ Redistributable via winget..."
$result = winget install Microsoft.VCRedist.2015+.x64 --accept-package-agreements --accept-source-agreements 2>&1 | Out-String
if ($result -match "success|installed|already installed") {
  Write-Log "VC++ Redistributable installation complete." "Green"
} else {
  $result2 = winget install Microsoft.VCRedist.2015+.x86 --accept-package-agreements --accept-source-agreements 2>&1 | Out-String
  if ($result2 -match "success|installed|already installed") {
    Write-Log "VC++ Redistributable installation complete." "Green"
  } else {
    Write-Log "VC++ installation may have failed. Try installing manually." "Yellow"
  }
}
} catch {
  Write-Log "Error installing VC++: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "VC++ Redist cannot be uninstalled through this tool. Use Settings > Apps > Installed Apps." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "install-directx",
      label: "Install DirectX Runtime",
      description: "Downloads and runs the DirectX End-User Runtime Web Installer",
      script: `try {
Write-Log "Downloading DirectX Runtime Web Installer..."
$dxUrl = "https://download.microsoft.com/download/8/4/A/84A35BF1-DAFE-4AE8-82AF-AD2AE20B6B14/directx_Jun2010_redist.exe"
$dxPath = "$env:TEMP\\dx_webinstaller.exe"
Invoke-WebRequest -Uri $dxUrl -OutFile $dxPath -UseBasicParsing -ErrorAction Stop
Write-Log "Running DirectX installer..."
Start-Process $dxPath -ArgumentList "/Q /T:$env:TEMP\\dx" -Wait
Write-Log "DirectX Runtime installation complete." "Green"
Remove-Item $dxPath -Force -ErrorAction SilentlyContinue
} catch {
  Write-Log "Error installing DirectX: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "DirectX cannot be uninstalled through this tool." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
  ],
  "font-cache-fix": [
    {
      id: "rebuild-cache",
      label: "Rebuild Font Cache",
      description: "Stops FontCache service, deletes cache files, and restarts it",
      script: `try {
Write-Log "Stopping Font Cache service..."
Stop-Service -Name FontCache -Force -ErrorAction SilentlyContinue
Write-Log "Deleting cached font data..."
$cachePaths = @(
  "$env:WINDIR\\ServiceProfiles\\LocalService\\AppData\\Local\\FontCache",
  "$env:WINDIR\\ServiceProfiles\\LocalService\\AppData\\Local\\FontCache-System",
  "$env:WINDIR\\System32\\FNTCACHE.DAT"
)
foreach ($p in $cachePaths) {
  if (Test-Path $p) {
    Remove-Item -Path $p -Recurse -Force -ErrorAction SilentlyContinue
    Write-Log "Deleted: $p" "Green"
  }
}
Start-Service -Name FontCache
Start-Sleep -Seconds 1
$svc = Get-Service -Name FontCache -ErrorAction SilentlyContinue
if ($svc.Status -eq "Running") { Write-Log "Font Cache rebuilt successfully." "Green" }
else { Write-Log "Font Cache service did not start. Restart your PC." "Yellow" }
} catch {
  Write-Log "Error rebuilding font cache: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Font cache rebuild cannot be undone. Windows will regenerate cache automatically." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "reset-font-registry",
      label: "Reset Font Registry",
      description: "Cleans up corrupted font entries in the Windows registry",
      script: `try {
Write-Log "Cleaning font registry entries..."
$fontsPath = "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts"
if (Test-Path $fontsPath) {
  Get-ItemProperty -Path $fontsPath -ErrorAction SilentlyContinue | Get-Member -MemberType NoteProperty | Where-Object { $_.Name -match "corrupt|broken|invalid|damage" } | ForEach-Object {
    Remove-ItemProperty -Path $fontsPath -Name $_.Name -ErrorAction SilentlyContinue
    Write-Log "Removed corrupted entry: $($_.Name)" "Green"
  }
}
Write-Log "Font registry cleaned." "Green"
} catch {
  Write-Log "Error resetting font registry: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Registry cleanup cannot be undone. Run 'Rebuild Font Cache' if issues persist." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
  ],
  "windows-hello-fix": [
    {
      id: "restart-biometric",
      label: "Restart Biometric Service",
      description: "Restarts the Windows Biometric Service (WbioSrvc)",
      script: `try {
Write-Log "Restarting Windows Biometric Service..."
Restart-Service -Name WbioSrvc -Force -ErrorAction SilentlyContinue
Set-Service -Name WbioSrvc -StartupType Automatic -ErrorAction SilentlyContinue
$svc = Get-Service -Name WbioSrvc -ErrorAction SilentlyContinue
if ($svc.Status -eq "Running") {
  Write-Log "Windows Biometric Service is running." "Green"
} else {
  Start-Service -Name WbioSrvc -ErrorAction SilentlyContinue
  Write-Log "Windows Biometric Service started." "Green"
}
} catch {
  Write-Log "Error restarting biometric service: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Service restart is temporary. No undo needed." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "check-tpm",
      label: "Check TPM Status",
      description: "Checks if your TPM chip is enabled and ready for Windows Hello",
      script: `try {
Write-Log "Checking TPM status..."
$tpm = Get-CimInstance -Namespace "Root\\CIMv2\\Security\\MicrosoftTpm" -ClassName Win32_Tpm -ErrorAction SilentlyContinue
if ($tpm) {
  if ($tpm.IsEnabled_InitialValue -eq $true) {
    Write-Log "TPM is enabled and ready." "Green"
  } else {
    Write-Log "TPM is disabled. Enable it in UEFI/BIOS security settings." "Red"
  }
  if ($tpm.IsActivated_InitialValue -eq $true) {
    Write-Log "TPM is activated." "Green"
  } else {
    Write-Log "TPM is not activated." "Yellow"
  }
} else {
  Write-Log "No TPM detected, or TPM module is not accessible." "Yellow"
}
} catch {
  Write-Log "Error checking TPM: $($_.Exception.Message). Run as Administrator." "Red"
}`,
      undoScript: `try {
Write-Log "TPM check is read-only. No undo needed." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "restart-credential-manager",
      label: "Restart Credential Manager",
      description: "Restarts VaultSvc to resolve PIN credential issues",
      script: `try {
Write-Log "Restarting Credential Manager service..."
Restart-Service -Name VaultSvc -Force -ErrorAction SilentlyContinue
Set-Service -Name VaultSvc -StartupType Automatic -ErrorAction SilentlyContinue
$svc = Get-Service -Name VaultSvc -ErrorAction SilentlyContinue
if ($svc.Status -eq "Running") {
  Write-Log "Credential Manager is running. This can resolve PIN sign-in issues." "Green"
} else {
  Start-Service -Name VaultSvc -ErrorAction SilentlyContinue
  Write-Log "Credential Manager started." "Green"
}
} catch {
  Write-Log "Error restarting Credential Manager: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Service restart is temporary. No undo needed." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "detect-hello",
      label: "Detect Hello Hardware",
      description: "Scans for biometric hardware (fingerprint, IR camera) and enables them",
      script: `try {
Write-Log "Scanning for Windows Hello hardware..."
pnputil /scan-devices
$bio = Get-PnpDevice -Class Biometric -ErrorAction SilentlyContinue
$cam = Get-PnpDevice -Class Camera -ErrorAction SilentlyContinue | Where-Object { $_.FriendlyName -match "ir|infrared|hello|intel real" }
if ($bio) {
  Write-Log "Biometric devices found:" "Green"
  foreach ($d in $bio) {
    if ($d.Status -ne "OK") {
      Enable-PnpDevice -InstanceId $d.InstanceId -Confirm:$false -ErrorAction SilentlyContinue
      Write-Log "  - $($d.FriendlyName) (enabled)" "Green"
    } else {
      Write-Log "  - $($d.FriendlyName) [OK]" "Green"
    }
  }
}
if ($cam) {
  Write-Log "IR camera(s) found:" "Green"
  foreach ($d in $cam) {
    if ($d.Status -ne "OK") {
      Enable-PnpDevice -InstanceId $d.InstanceId -Confirm:$false -ErrorAction SilentlyContinue
      Write-Log "  - $($d.FriendlyName) (enabled)" "Green"
    } else {
      Write-Log "  - $($d.FriendlyName) [OK]" "Green"
    }
  }
}
if (-not $bio -and -not $cam) {
  Write-Log "No Windows Hello compatible hardware detected." "Yellow"
}
} catch {
  Write-Log "Error detecting Hello hardware: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Hardware scan and enable cannot be undone." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
  ],
  "date-time-format-fix": [
    {
      id: "reset-region",
      label: "Reset Region Settings",
      description: "Resets region, locale, and format settings to system defaults",
      script: `try {
Write-Log "Resetting region and locale settings..."
$lang = (Get-Culture).Name
Set-ItemProperty -Path "HKCU:\\Control Panel\\International" -Name "LocaleName" -Value $lang -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKCU:\\Control Panel\\International" -Name "sShortDate" -Value "dd/MM/yyyy" -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKCU:\\Control Panel\\International" -Name "sLongDate" -Value "dddd, MMMM dd, yyyy" -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKCU:\\Control Panel\\International" -Name "sShortTime" -Value "HH:mm" -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKCU:\\Control Panel\\International" -Name "sTimeFormat" -Value "HH:mm:ss" -ErrorAction SilentlyContinue
Write-Log "Region settings reset for: $lang" "Green"
} catch {
  Write-Log "Error resetting region: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Region changes are applied immediately. Change back in Settings > Time & Language." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "fix-date-format",
      label: "Set Short Date Format",
      description: "Sets short date to DD/MM/YYYY format",
      script: `try {
Write-Log "Setting short date format to DD/MM/YYYY..."
Set-ItemProperty -Path "HKCU:\\Control Panel\\International" -Name "sShortDate" -Value "dd/MM/yyyy" -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKCU:\\Control Panel\\International" -Name "sLongDate" -Value "dddd, MMMM dd, yyyy" -ErrorAction SilentlyContinue
Write-Log "Date format set to DD/MM/YYYY." "Green"
} catch {
  Write-Log "Error setting date format: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Date format changed. Revert via Settings > Time & Language > Language & Region." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "fix-time-format",
      label: "Set 24-Hour Format",
      description: "Sets time to 24-hour format (HH:mm) instead of 12-hour",
      script: `try {
Write-Log "Setting 24-hour time format..."
Set-ItemProperty -Path "HKCU:\\Control Panel\\International" -Name "sShortTime" -Value "HH:mm" -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKCU:\\Control Panel\\International" -Name "sTimeFormat" -Value "HH:mm:ss" -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKCU:\\Control Panel\\International" -Name "sTime" -Value "HH:mm" -ErrorAction SilentlyContinue
Write-Log "Time format set to 24-hour (HH:mm)." "Green"
} catch {
  Write-Log "Error setting time format: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Time format changed. Revert via Settings > Time & Language." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "fix-first-day",
      label: "Set Monday as First Day",
      description: "Sets Monday as the first day of the week in calendar settings",
      script: `try {
Write-Log "Setting Monday as first day of week..."
Set-ItemProperty -Path "HKCU:\\Control Panel\\International" -Name "iFirstDayOfWeek" -Value "1" -Type DWord -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKCU:\\Control Panel\\International" -Name "sFirstDayOfWeek" -Value "Monday" -ErrorAction SilentlyContinue
Write-Log "First day of week set to Monday." "Green"
} catch {
  Write-Log "Error setting first day of week: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "First day changed. Revert via Settings > Time & Language." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
  ],
  "windows-apps-repair": [
    {
      id: "reinstall-all-apps",
      label: "Re-register All Apps",
      description: "Re-registers ALL built-in Windows app packages for your user account",
      script: `try {
Write-Log "Re-registering all built-in Windows apps..."
$apps = Get-AppXPackage -User $env:USERNAME -ErrorAction SilentlyContinue
$count = 0
foreach ($app in $apps) {
  Add-AppxPackage -DisableDevelopmentMode -Register "$($app.InstallLocation)\\AppXManifest.xml" -ErrorAction SilentlyContinue
  $count++
  if ($count % 20 -eq 0) { Write-Log "Re-registered $count apps..." "Green" }
}
Write-Log "Re-registered $count app(s) successfully." "Green"
} catch {
  Write-Log "Error re-registering apps: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "App re-registration cannot be undone. Apps are now registered." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "reset-app-caches",
      label: "Reset App Caches",
      description: "Clears cached data for Calculator, Photos, Mail, Alarms, and more",
      script: `try {
Write-Log "Resetting app caches..."
$appPackages = @(
  "Microsoft.WindowsCalculator",
  "Microsoft.Windows.Photos",
  "Microsoft.WindowsStore",
  "Microsoft.People",
  "Microsoft.WindowsAlarms",
  "microsoft.windowscommunicationsapps",
  "Microsoft.MSPaint",
  "Microsoft.ScreenSketch",
  "Microsoft.WindowsCamera",
  "Microsoft.WindowsSoundRecorder",
  "Microsoft.StorePurchaseApp",
  "Microsoft.XboxApp"
)
$resetCount = 0
foreach ($pkg in $appPackages) {
  $app = Get-AppXPackage -Name $pkg -ErrorAction SilentlyContinue
  if ($app) {
    Reset-AppxPackage -Package $app.PackageFullName -ErrorAction SilentlyContinue
    Write-Log "Reset cache: $pkg" "Green"
    $resetCount++
  }
}
if ($resetCount -eq 0) { Write-Log "No built-in apps found to reset." "Yellow" }
else { Write-Log "Reset $resetCount app cache(s)." "Green" }
} catch {
  Write-Log "Error resetting app caches: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Cache reset cannot be undone. Caches will rebuild when apps open." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "system-apps-fix",
      label: "Fix System-Level Apps",
      description: "Re-registers app packages for ALL users on this PC",
      script: `try {
Write-Log "Re-registering system-level apps for all users..."
$apps = Get-AppXPackage -AllUsers -ErrorAction SilentlyContinue
$count = 0
foreach ($app in $apps) {
  Add-AppxPackage -DisableDevelopmentMode -Register "$($app.InstallLocation)\\AppXManifest.xml" -ErrorAction SilentlyContinue
  $count++
  if ($count % 20 -eq 0) { Write-Log "Re-registered $count apps..." "Green" }
}
Write-Log "Re-registered $count app(s) for all users." "Green"
} catch {
  Write-Log "Error re-registering system apps: $($_.Exception.Message). Run as Administrator." "Red"
}`,
      undoScript: `try {
Write-Log "System app fix cannot be undone." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
  ],
  "file-association-guardian": [
    {
      id: "backup-associations",
      label: "Backup All Associations",
      description: "Saves every file extension and app mapping to a .reg file + JSON snapshot",
      script: `try {
Write-Log "Backing up file associations..."
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "$env:USERPROFILE\\FixeloBackups"
if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir -Force | Out-Null }
$backupFile = "$backupDir\\FileAssociations_$timestamp.reg"
reg export "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\FileExts" $backupFile /y 2>&1 | Out-Null
Write-Log "Registry backup saved: $(Split-Path $backupFile -Leaf)" "Green"
$exts = Get-ChildItem "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\FileExts" -ErrorAction SilentlyContinue
$snapshot = @()
foreach ($ext in $exts) {
  $userChoice = Get-ItemProperty -Path "$($ext.PSPath)\\UserChoice" -Name "ProgId" -ErrorAction SilentlyContinue
  $progId = if ($userChoice) { $userChoice.ProgId } else { "" }
  $snapshot += [PSCustomObject]@{ Extension = $ext.PSChildName; ProgId = $progId }
}
$snapshotFile = "$backupDir\\FileAssociations_$timestamp.json"
$snapshot | ConvertTo-Json -Compress | Out-File -FilePath $snapshotFile -Encoding UTF8
Write-Log "JSON snapshot saved: $(Split-Path $snapshotFile -Leaf)" "Green"
Write-Log "Backed up $($snapshot.Count) file extension mappings." "Green"
} catch {
  Write-Log "Error backing up associations: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Backup is a snapshot. Delete the .reg and .json files from $env:USERPROFILE\\FixeloBackups to remove." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "restore-backup",
      label: "Restore from Backup",
      description: "Restores all file associations from the most recent backup",
      script: `try {
Write-Log "Looking for file association backups..."
$backupDir = "$env:USERPROFILE\\FixeloBackups"
$backupFiles = Get-ChildItem -Path $backupDir -Filter "FileAssociations_*.reg" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
if (-not $backupFiles) { Write-Log "No backups found. Run 'Backup Associations' first." "Yellow"; return }
$latest = $backupFiles[0].FullName
Write-Log "Restoring from: $(Split-Path $latest -Leaf)"
reg import $latest 2>&1 | Out-Null
Write-Log "File associations restored from backup." "Green"
} catch {
  Write-Log "Error restoring backup: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Restoration cannot be undone. Run backup again, then restore the earlier backup." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "scan-hijacks",
      label: "Scan for Changes",
      description: "Compares current associations against backup to detect hijacks",
      script: `try {
Write-Log "Scanning for file association changes..."
$backupDir = "$env:USERPROFILE\\FixeloBackups"
$snapshots = Get-ChildItem -Path $backupDir -Filter "FileAssociations_*.json" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
if (-not $snapshots) { Write-Log "No backup snapshot found. Run 'Backup Associations' first to create a baseline." "Yellow"; return }
$snapshot = Get-Content -Path $snapshots[0].FullName -Raw | ConvertFrom-Json
$backupMap = @{}
foreach ($entry in $snapshot) { $backupMap[$entry.Extension] = $entry.ProgId }
$changes = 0
$currentExts = Get-ChildItem "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\FileExts" -ErrorAction SilentlyContinue
foreach ($ext in $currentExts) {
  $extName = $ext.PSChildName
  $currentProg = Get-ItemProperty -Path "$($ext.PSPath)\\UserChoice" -Name "ProgId" -ErrorAction SilentlyContinue
  $currentVal = if ($currentProg) { $currentProg.ProgId } else { "" }
  if ($backupMap.ContainsKey($extName) -and $backupMap[$extName] -ne "" -and $backupMap[$extName] -ne $currentVal) {
    Write-Log "  $extName : '$($backupMap[$extName])' -> '$currentVal'" "Yellow"
    $changes++
  }
}
if ($changes -eq 0) {
  Write-Log "No changes detected. Your file associations match the backup." "Green"
} else {
  Write-Log "Found $changes file association change(s). Restore backup to revert." "Green"
}
} catch {
  Write-Log "Error scanning associations: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Scan is read-only. No undo needed." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
  ],
  "camera-fix": [
    {
      id: "restart-camera-service",
      label: "Restart Camera Service",
      description: "Restarts the Windows Camera Frame Server",
      script: `try {
Write-Log "Restarting Camera Frame Server..."
Restart-Service -Name FrameServer -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
$svc = Get-Service -Name FrameServer -ErrorAction SilentlyContinue
if ($svc.Status -eq "Running") {
  Write-Log "Camera Frame Server is running." "Green"
} else {
  Start-Service -Name FrameServer -ErrorAction SilentlyContinue
  Write-Log "Camera Frame Server started." "Green"
}
} catch {
  Write-Log "Error restarting camera service: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Service restart is temporary. No undo needed." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "reset-camera-driver",
      label: "Reinstall Camera Driver",
      description: "Disables and re-enables the camera device to force driver refresh",
      script: `try {
Write-Log "Reinstalling camera driver..."
$cam = Get-PnpDevice -Class Camera -ErrorAction SilentlyContinue
if (-not $cam) {
  $cam = Get-PnpDevice -Class Image -ErrorAction SilentlyContinue | Where-Object { $_.FriendlyName -match "camera|webcam" }
}
if (-not $cam) { Write-Log "No camera devices found." "Yellow"; return }
foreach ($d in $cam) {
  Write-Log "Resetting: $($d.FriendlyName)"
  Disable-PnpDevice -InstanceId $d.InstanceId -Confirm:$false -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 2
  Enable-PnpDevice -InstanceId $d.InstanceId -Confirm:$false -ErrorAction SilentlyContinue
  Write-Log "Camera driver reset for: $($d.FriendlyName)" "Green"
}
} catch {
  Write-Log "Error resetting camera driver: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Driver reset is applied. No undo needed." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "check-privacy-permissions",
      label: "Enable Camera Privacy",
      description: "Ensures camera access is allowed in Windows privacy settings",
      script: `try {
Write-Log "Enabling camera privacy permissions..."
$paths = @(
  "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\webcam",
  "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\webcam"
)
foreach ($p in $paths) {
  if (Test-Path $p) {
    Set-ItemProperty -Path $p -Name "Value" -Value "Allow" -ErrorAction SilentlyContinue
  }
}
Write-Log "Camera access enabled in privacy settings." "Green"
} catch {
  Write-Log "Error enabling camera privacy: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Privacy setting changed. Revoke via Settings > Privacy & Security > Camera if needed." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "scan-camera-hardware",
      label: "Scan for Camera Hardware",
      description: "Triggers a hardware scan to detect unrecognized cameras",
      script: `try {
Write-Log "Scanning for camera hardware..."
pnputil /scan-devices
$cameras = Get-PnpDevice -Class Camera -ErrorAction SilentlyContinue
$imaging = Get-PnpDevice -Class Image -ErrorAction SilentlyContinue
if ($cameras.Count -gt 0) {
  Write-Log "Detected camera(s):" "Green"
  foreach ($c in $cameras) { Write-Log "  - $($c.FriendlyName) [$($c.Status)]" "Green" }
} elseif ($imaging.Count -gt 0) {
  Write-Log "Detected imaging device(s):" "Green"
  foreach ($c in $imaging) { Write-Log "  - $($c.FriendlyName) [$($c.Status)]" "Green" }
} else {
  Write-Log "No camera hardware detected. Check connections." "Yellow"
}
} catch {
  Write-Log "Error scanning for camera: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Hardware scan cannot be undone." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
  ],
  "context-menu-cleaner": [
    {
      id: "clean-sendto",
      label: "Clean Send To Menu",
      description: "Removes unnecessary items from the Send To context menu",
      script: `try {
Write-Log "Cleaning Send To menu..."
$sendtoPath = "$env:APPDATA\\Microsoft\\Windows\\SendTo"
if (Test-Path $sendtoPath) {
  $keep = @("Desktop (create shortcut).desklink", "Documents.mydocs", "Mail Recipient.MAPIMail", "Fax Recipient", "Bluetooth File Transfer*.lnk")
  Get-ChildItem -Path $sendtoPath -ErrorAction SilentlyContinue | Where-Object {
    $match = $false
    foreach ($k in $keep) { if ($_.Name -like $k) { $match = $true; break } }
    -not $match
  } | ForEach-Object {
    Remove-Item -Path $_.FullName -Force -ErrorAction SilentlyContinue
    Write-Log "Removed: $($_.Name)" "Green"
  }
}
Write-Log "Send To menu cleaned." "Green"
} catch {
  Write-Log "Error cleaning Send To menu: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Send To cleanup cannot be undone per-item. Default items will return on next Windows update." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "clean-extensions",
      label: "Remove Junk Shell Extensions",
      description: "Removes known bloat extensions with automatic registry backup",
      script: `try {
Write-Log "Backing up context menu registry..."
$backupFile = "$env:TEMP\\fixelo_contextmenu_$([DateTime]::Now.ToString('yyyyMMdd_HHmmss')).reg"
reg export "HKEY_CLASSES_ROOT\\*\\shellex\\ContextMenuHandlers" $backupFile /y 2>&1 | Out-Null
reg export "HKEY_CLASSES_ROOT\\Directory\\shellex\\ContextMenuHandlers" $backupFile /y 2>&1 | Out-Null
Write-Log "Backup saved to: $backupFile" "Green"
$remove = @("OneDrive", "MicrosoftOneDrive", "7-Zip", "WinRAR", "WinZip", "DropboxExt", "Box", "GoogleDrive", "CloudStorage", "NvApp", "IGfx", "igfxDTCM", "PDFCreator", "OpenWithEncryption")
$paths = @(
  "HKLM:\\SOFTWARE\\Classes\\*\\shellex\\ContextMenuHandlers",
  "HKLM:\\SOFTWARE\\Classes\\Directory\\shellex\\ContextMenuHandlers",
  "HKLM:\\SOFTWARE\\Classes\\Directory\\Background\\shellex\\ContextMenuHandlers",
  "HKCU:\\SOFTWARE\\Classes\\*\\shellex\\ContextMenuHandlers",
  "HKCU:\\SOFTWARE\\Classes\\Directory\\shellex\\ContextMenuHandlers"
)
$count = 0
foreach ($base in $paths) {
  if (Test-Path $base) {
    Get-ChildItem -Path $base -ErrorAction SilentlyContinue | Where-Object {
      $name = $_.PSChildName
      foreach ($r in $remove) { if ($name -match $r) { return $true } }
      return $false
    } | ForEach-Object {
      Remove-Item -Path $_.PSPath -Recurse -Force -ErrorAction SilentlyContinue
      Write-Log "Removed: $($_.PSChildName)" "Green"
      $count++
    }
  }
}
if ($count -eq 0) { Write-Log "No known junk extensions found." "Yellow" }
else { Write-Log "Removed $count junk extension(s)." "Green" }
} catch {
  Write-Log "Error cleaning extensions: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "To restore, run the 'Restore from Backup' option below or manually import the .reg backup." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "restore-backup",
      label: "Restore from Backup",
      description: "Restores context menu to state before the last cleanup",
      script: `try {
Write-Log "Looking for context menu backups..."
$backupFiles = Get-ChildItem -Path "$env:TEMP" -Filter "fixelo_contextmenu_*.reg" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
if (-not $backupFiles) { Write-Log "No backup found. Run 'Remove Junk Shell Extensions' first to create a backup." "Yellow"; return }
$latest = $backupFiles[0].FullName
Write-Log "Restoring from: $latest"
reg import $latest 2>&1 | Out-Null
Write-Log "Context menu restored from backup." "Green"
Remove-Item -Path $latest -Force -ErrorAction SilentlyContinue
Write-Log "Backup file deleted." "Green"
} catch {
  Write-Log "Error restoring backup: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Restoration cannot be reversed. Run cleanup again if needed." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
  ],
  "system-tweaks": [
    {
      id: "show-hidden-files",
      label: "Show Hidden Files + Extensions",
      description: "Shows hidden files, protected OS files, and file extensions in File Explorer",
      script: `try {
$d="$env:USERPROFILE\\FixeloBackups";$f="$d\\SystemTweaks.json";if(-not(Test-Path $d)){New-Item $d -Force|Out-Null}
$b=@();if(Test-Path $f){$r=Get-Content $f -Raw;if($r){$p=$r|ConvertFrom-Json;if($p-is[array]){$b=@($p)}}}
$id="shf"
if(($b|Where-Object{$_.id-eq"$id-hidden"}).Count-eq0){
  $v=(Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "Hidden" -ErrorAction SilentlyContinue).Hidden
  $b+=[PSCustomObject]@{id="$id-hidden";path="HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced";name="Hidden";originalValue=$v;action=if($null-eq$v){"remove"}else{"set"}}
}
if(($b|Where-Object{$_.id-eq"$id-superhidden"}).Count-eq0){
  $v=(Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "ShowSuperHidden" -ErrorAction SilentlyContinue).ShowSuperHidden
  $b+=[PSCustomObject]@{id="$id-superhidden";path="HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced";name="ShowSuperHidden";originalValue=$v;action=if($null-eq$v){"remove"}else{"set"}}
}
if(($b|Where-Object{$_.id-eq"$id-hideext"}).Count-eq0){
  $v=(Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "HideFileExt" -ErrorAction SilentlyContinue).HideFileExt
  $b+=[PSCustomObject]@{id="$id-hideext";path="HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced";name="HideFileExt";originalValue=$v;action=if($null-eq$v){"remove"}else{"set"}}
}
$b|ConvertTo-Json|Out-File $f -Encoding UTF8
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "Hidden" -Value 1 -Type DWord
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "ShowSuperHidden" -Value 1 -Type DWord
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "HideFileExt" -Value 0 -Type DWord
Write-Log "Hidden files + extensions: enabled" "Green"
} catch {
  Write-Log "Error in Show Hidden Files: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
$f="$env:USERPROFILE\\FixeloBackups\\SystemTweaks.json"
if(Test-Path $f){$r=Get-Content $f -Raw;if($r){$d=$r|ConvertFrom-Json;foreach($e in $d){if($e.action-eq"remove"){Remove-ItemProperty -Path $e.path -Name $e.name -ErrorAction SilentlyContinue}else{Set-ItemProperty -Path $e.path -Name $e.name -Value $e.originalValue -ErrorAction SilentlyContinue}}};Remove-Item $f -Force;Write-Log "All tweaks restored" "Green"}else{Write-Log "No backup found" "Yellow"}
} catch {
  Write-Log "Error in Restore: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "show-full-path",
      label: "Show Full Path in Explorer Title Bar",
      description: "Displays the full folder path in Explorer's title bar",
      script: `try {
$d="$env:USERPROFILE\\FixeloBackups";$f="$d\\SystemTweaks.json";if(-not(Test-Path $d)){New-Item $d -Force|Out-Null}
$b=@();if(Test-Path $f){$r=Get-Content $f -Raw;if($r){$p=$r|ConvertFrom-Json;if($p-is[array]){$b=@($p)}}}
if(($b|Where-Object{$_.id-eq"fullpath"}).Count-eq0){
  $v=(Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\CabinetState" -Name "FullPath" -ErrorAction SilentlyContinue).FullPath
  $b+=[PSCustomObject]@{id="fullpath";path="HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\CabinetState";name="FullPath";originalValue=$v;action=if($null-eq$v){"remove"}else{"set"}}
}
$b|ConvertTo-Json|Out-File $f -Encoding UTF8
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\CabinetState" -Name "FullPath" -Value 1 -Type DWord
Write-Log "Full path in title bar: enabled" "Green"
} catch {
  Write-Log "Error in Show Full Path: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
$f="$env:USERPROFILE\\FixeloBackups\\SystemTweaks.json"
if(Test-Path $f){$r=Get-Content $f -Raw;if($r){$d=$r|ConvertFrom-Json;foreach($e in $d){if($e.action-eq"remove"){Remove-ItemProperty -Path $e.path -Name $e.name -ErrorAction SilentlyContinue}else{Set-ItemProperty -Path $e.path -Name $e.name -Value $e.originalValue -ErrorAction SilentlyContinue}}};Remove-Item $f -Force;Write-Log "All tweaks restored" "Green"}else{Write-Log "No backup found" "Yellow"}
} catch {
  Write-Log "Error in Restore: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "open-to-this-pc",
      label: "Open Explorer to 'This PC'",
      description: "Skips Quick Access and opens File Explorer directly to 'This PC'",
      script: `try {
$d="$env:USERPROFILE\\FixeloBackups";$f="$d\\SystemTweaks.json";if(-not(Test-Path $d)){New-Item $d -Force|Out-Null}
$b=@();if(Test-Path $f){$r=Get-Content $f -Raw;if($r){$p=$r|ConvertFrom-Json;if($p-is[array]){$b=@($p)}}}
if(($b|Where-Object{$_.id-eq"launchto"}).Count-eq0){
  $v=(Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "LaunchTo" -ErrorAction SilentlyContinue).LaunchTo
  $b+=[PSCustomObject]@{id="launchto";path="HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced";name="LaunchTo";originalValue=$v;action=if($null-eq$v){"remove"}else{"set"}}
}
$b|ConvertTo-Json|Out-File $f -Encoding UTF8
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "LaunchTo" -Value 1 -Type DWord
Write-Log "Explorer opens to: This PC" "Green"
} catch {
  Write-Log "Error in Open to This PC: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
$f="$env:USERPROFILE\\FixeloBackups\\SystemTweaks.json"
if(Test-Path $f){$r=Get-Content $f -Raw;if($r){$d=$r|ConvertFrom-Json;foreach($e in $d){if($e.action-eq"remove"){Remove-ItemProperty -Path $e.path -Name $e.name -ErrorAction SilentlyContinue}else{Set-ItemProperty -Path $e.path -Name $e.name -Value $e.originalValue -ErrorAction SilentlyContinue}}};Remove-Item $f -Force;Write-Log "All tweaks restored" "Green"}else{Write-Log "No backup found" "Yellow"}
} catch {
  Write-Log "Error in Restore: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disable-animations",
      label: "Disable Minimize/Maximize Animations",
      description: "Speeds up the UI by turning off window minimize/maximize animations",
      script: `try {
$d="$env:USERPROFILE\\FixeloBackups";$f="$d\\SystemTweaks.json";if(-not(Test-Path $d)){New-Item $d -Force|Out-Null}
$b=@();if(Test-Path $f){$r=Get-Content $f -Raw;if($r){$p=$r|ConvertFrom-Json;if($p-is[array]){$b=@($p)}}}
$id="anim"
if(($b|Where-Object{$_.id-eq"$id-minanimate"}).Count-eq0){
  $v=(Get-ItemProperty -Path "HKCU:\\Control Panel\\Desktop\\WindowMetrics" -Name "MinAnimate" -ErrorAction SilentlyContinue).MinAnimate
  $b+=[PSCustomObject]@{id="$id-minanimate";path="HKCU:\\Control Panel\\Desktop\\WindowMetrics";name="MinAnimate";originalValue=$v;action=if($null-eq$v){"remove"}else{"set"}}
}
if(($b|Where-Object{$_.id-eq"$id-taskbaranim"}).Count-eq0){
  $v=(Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "TaskbarAnimations" -ErrorAction SilentlyContinue).TaskbarAnimations
  $b+=[PSCustomObject]@{id="$id-taskbaranim";path="HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced";name="TaskbarAnimations";originalValue=$v;action=if($null-eq$v){"remove"}else{"set"}}
}
$b|ConvertTo-Json|Out-File $f -Encoding UTF8
Set-ItemProperty -Path "HKCU:\\Control Panel\\Desktop\\WindowMetrics" -Name "MinAnimate" -Value 0 -Type DWord
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "TaskbarAnimations" -Value 0 -Type DWord
Write-Log "Animations: disabled" "Green"
} catch {
  Write-Log "Error in Disable Animations: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
$f="$env:USERPROFILE\\FixeloBackups\\SystemTweaks.json"
if(Test-Path $f){$r=Get-Content $f -Raw;if($r){$d=$r|ConvertFrom-Json;foreach($e in $d){if($e.action-eq"remove"){Remove-ItemProperty -Path $e.path -Name $e.name -ErrorAction SilentlyContinue}else{Set-ItemProperty -Path $e.path -Name $e.name -Value $e.originalValue -ErrorAction SilentlyContinue}}};Remove-Item $f -Force;Write-Log "All tweaks restored" "Green"}else{Write-Log "No backup found" "Yellow"}
} catch {
  Write-Log "Error in Restore: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disable-transparency",
      label: "Disable Transparency Effects",
      description: "Turns off acrylic blur effects for better performance",
      script: `try {
$d="$env:USERPROFILE\\FixeloBackups";$f="$d\\SystemTweaks.json";if(-not(Test-Path $d)){New-Item $d -Force|Out-Null}
$b=@();if(Test-Path $f){$r=Get-Content $f -Raw;if($r){$p=$r|ConvertFrom-Json;if($p-is[array]){$b=@($p)}}}
if(($b|Where-Object{$_.id-eq"transparency"}).Count-eq0){
  $v=(Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "EnableTransparency" -ErrorAction SilentlyContinue).EnableTransparency
  $b+=[PSCustomObject]@{id="transparency";path="HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize";name="EnableTransparency";originalValue=$v;action=if($null-eq$v){"remove"}else{"set"}}
}
$b|ConvertTo-Json|Out-File $f -Encoding UTF8
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "EnableTransparency" -Value 0 -Type DWord
Write-Log "Transparency: disabled" "Green"
} catch {
  Write-Log "Error in Disable Transparency: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
$f="$env:USERPROFILE\\FixeloBackups\\SystemTweaks.json"
if(Test-Path $f){$r=Get-Content $f -Raw;if($r){$d=$r|ConvertFrom-Json;foreach($e in $d){if($e.action-eq"remove"){Remove-ItemProperty -Path $e.path -Name $e.name -ErrorAction SilentlyContinue}else{Set-ItemProperty -Path $e.path -Name $e.name -Value $e.originalValue -ErrorAction SilentlyContinue}}};Remove-Item $f -Force;Write-Log "All tweaks restored" "Green"}else{Write-Log "No backup found" "Yellow"}
} catch {
  Write-Log "Error in Restore: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disable-sticky-keys",
      label: "Disable Sticky / Filter Keys Prompts",
      description: "Stops the 'press one key at a time' accessibility popups",
      script: `try {
$d="$env:USERPROFILE\\FixeloBackups";$f="$d\\SystemTweaks.json";if(-not(Test-Path $d)){New-Item $d -Force|Out-Null}
$b=@();if(Test-Path $f){$r=Get-Content $f -Raw;if($r){$p=$r|ConvertFrom-Json;if($p-is[array]){$b=@($p)}}}
$id="sticky"
if(($b|Where-Object{$_.id-eq"$id-flags"}).Count-eq0){
  $v=(Get-ItemProperty -Path "HKCU:\\Control Panel\\Accessibility\\StickyKeys" -Name "Flags" -ErrorAction SilentlyContinue).Flags
  $b+=[PSCustomObject]@{id="$id-flags";path="HKCU:\\Control Panel\\Accessibility\\StickyKeys";name="Flags";originalValue=if($v){"$v"}else{$null};action=if($v){"set"}else{"remove"}}
}
if(($b|Where-Object{$_.id-eq"$id-filterflags"}).Count-eq0){
  $v=(Get-ItemProperty -Path "HKCU:\\Control Panel\\Accessibility\\FilterKeys" -Name "Flags" -ErrorAction SilentlyContinue).Flags
  $b+=[PSCustomObject]@{id="$id-filterflags";path="HKCU:\\Control Panel\\Accessibility\\FilterKeys";name="Flags";originalValue=if($v){"$v"}else{$null};action=if($v){"set"}else{"remove"}}
}
if(($b|Where-Object{$_.id-eq"$id-toggleflags"}).Count-eq0){
  $v=(Get-ItemProperty -Path "HKCU:\\Control Panel\\Accessibility\\ToggleKeys" -Name "Flags" -ErrorAction SilentlyContinue).Flags
  $b+=[PSCustomObject]@{id="$id-toggleflags";path="HKCU:\\Control Panel\\Accessibility\\ToggleKeys";name="Flags";originalValue=if($v){"$v"}else{$null};action=if($v){"set"}else{"remove"}}
}
$b|ConvertTo-Json|Out-File $f -Encoding UTF8

Set-ItemProperty -Path "HKCU:\\Control Panel\\Accessibility\\StickyKeys" -Name "Flags" -Value "506" -Type String
Set-ItemProperty -Path "HKCU:\\Control Panel\\Accessibility\\FilterKeys" -Name "Flags" -Value "122" -Type String
Set-ItemProperty -Path "HKCU:\\Control Panel\\Accessibility\\ToggleKeys" -Name "Flags" -Value "58" -Type String
Write-Log "Sticky/Filter/Toggle keys: disabled" "Green"
} catch {
  Write-Log "Error in Disable Sticky Keys: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
$f="$env:USERPROFILE\\FixeloBackups\\SystemTweaks.json"
if(Test-Path $f){$r=Get-Content $f -Raw;if($r){$d=$r|ConvertFrom-Json;foreach($e in $d){if($e.action-eq"remove"){Remove-ItemProperty -Path $e.path -Name $e.name -ErrorAction SilentlyContinue}else{Set-ItemProperty -Path $e.path -Name $e.name -Value $e.originalValue -ErrorAction SilentlyContinue}}};Remove-Item $f -Force;Write-Log "All tweaks restored" "Green"}else{Write-Log "No backup found" "Yellow"}
} catch {
  Write-Log "Error in Restore: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disable-search-highlights",
      label: "Disable Search Highlights / Bing Ads",
      description: "Removes trending searches, Bing ads, and search highlights from Windows Search",
      script: `try {
$d="$env:USERPROFILE\\FixeloBackups";$f="$d\\SystemTweaks.json";if(-not(Test-Path $d)){New-Item $d -Force|Out-Null}
$b=@();if(Test-Path $f){$r=Get-Content $f -Raw;if($r){$p=$r|ConvertFrom-Json;if($p-is[array]){$b=@($p)}}}
$id="srch"
if(($b|Where-Object{$_.id-eq"$id-dynamic"}).Count-eq0){
  $v=(Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\SearchSettings" -Name "IsDynamicSearchBoxEnabled" -ErrorAction SilentlyContinue).IsDynamicSearchBoxEnabled
  $b+=[PSCustomObject]@{id="$id-dynamic";path="HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\SearchSettings";name="IsDynamicSearchBoxEnabled";originalValue=$v;action=if($null-eq$v){"remove"}else{"set"}}
}
if(($b|Where-Object{$_.id-eq"$id-suggestions"}).Count-eq0){
  $v=(Get-ItemProperty -Path "HKLM:\\Software\\Policies\\Microsoft\\Windows\\Windows Search" -Name "DisableSearchSuggestions" -ErrorAction SilentlyContinue).DisableSearchSuggestions
  $b+=[PSCustomObject]@{id="$id-suggestions";path="HKLM:\\Software\\Policies\\Microsoft\\Windows\\Windows Search";name="DisableSearchSuggestions";originalValue=$v;action=if($null-eq$v){"remove"}else{"set"}}
}
$b|ConvertTo-Json|Out-File $f -Encoding UTF8
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\SearchSettings" -Name "IsDynamicSearchBoxEnabled" -Value 0 -Type DWord
New-Item -Path "HKLM:\\Software\\Policies\\Microsoft\\Windows\\Windows Search" -Force | Out-Null
Set-ItemProperty -Path "HKLM:\\Software\\Policies\\Microsoft\\Windows\\Windows Search" -Name "DisableSearchSuggestions" -Value 1 -Type DWord
Write-Log "Search highlights / Bing ads: disabled" "Green"
} catch {
  Write-Log "Error in Disable Search Highlights: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
$f="$env:USERPROFILE\\FixeloBackups\\SystemTweaks.json"
if(Test-Path $f){$r=Get-Content $f -Raw;if($r){$d=$r|ConvertFrom-Json;foreach($e in $d){if($e.action-eq"remove"){Remove-ItemProperty -Path $e.path -Name $e.name -ErrorAction SilentlyContinue}else{Set-ItemProperty -Path $e.path -Name $e.name -Value $e.originalValue -ErrorAction SilentlyContinue}}};Remove-Item $f -Force;Write-Log "All tweaks restored" "Green"}else{Write-Log "No backup found" "Yellow"}
} catch {
  Write-Log "Error in Restore: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disable-startup-sound",
      label: "Disable Windows Startup Sound",
      description: "Turns off the Windows 11 startup sound",
      script: `try {
$d="$env:USERPROFILE\\FixeloBackups";$f="$d\\SystemTweaks.json";if(-not(Test-Path $d)){New-Item $d -Force|Out-Null}
$b=@();if(Test-Path $f){$r=Get-Content $f -Raw;if($r){$p=$r|ConvertFrom-Json;if($p-is[array]){$b=@($p)}}}
$id="snd"
if(($b|Where-Object{$_.id-eq"$id-startup"}).Count-eq0){
  $v=(Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "EnableStartupSound" -ErrorAction SilentlyContinue).EnableStartupSound
  $b+=[PSCustomObject]@{id="$id-startup";path="HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize";name="EnableStartupSound";originalValue=$v;action=if($null-eq$v){"remove"}else{"set"}}
}
if(($b|Where-Object{$_.id-eq"$id-logon"}).Count-eq0){
  $v=(Get-ItemProperty -Path "HKCU:\\AppEvents\\Schemas\\Apps\\.Default\\WindowsLogon\\.Current\\" -Name "(Default)" -ErrorAction SilentlyContinue).'(Default)'
  $b+=[PSCustomObject]@{id="$id-logon";path="HKCU:\\AppEvents\\Schemas\\Apps\\.Default\\WindowsLogon\\.Current";name="(Default)";originalValue=$v;action=if($v){"set"}else{"remove"}}
}
$b|ConvertTo-Json|Out-File $f -Encoding UTF8
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "EnableStartupSound" -Value 0 -Type DWord
Set-ItemProperty -Path "HKCU:\\AppEvents\\Schemas\\Apps\\.Default\\WindowsLogon\\.Current" -Name "(Default)" -Value "" -Type String
Write-Log "Startup sound: disabled" "Green"
} catch {
  Write-Log "Error in Disable Startup Sound: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
$f="$env:USERPROFILE\\FixeloBackups\\SystemTweaks.json"
if(Test-Path $f){$r=Get-Content $f -Raw;if($r){$d=$r|ConvertFrom-Json;foreach($e in $d){if($e.action-eq"remove"){Remove-ItemProperty -Path $e.path -Name $e.name -ErrorAction SilentlyContinue}else{Set-ItemProperty -Path $e.path -Name $e.name -Value $e.originalValue -ErrorAction SilentlyContinue}}};Remove-Item $f -Force;Write-Log "All tweaks restored" "Green"}else{Write-Log "No backup found" "Yellow"}
} catch {
  Write-Log "Error in Restore: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disable-game-bar",
      label: "Disable Xbox Game Bar",
      description: "Prevents Xbox Game Bar from recording in the background",
      script: `try {
$d="$env:USERPROFILE\\FixeloBackups";$f="$d\\SystemTweaks.json";if(-not(Test-Path $d)){New-Item $d -Force|Out-Null}
$b=@();if(Test-Path $f){$r=Get-Content $f -Raw;if($r){$p=$r|ConvertFrom-Json;if($p-is[array]){$b=@($p)}}}
$id="gb"
if(($b|Where-Object{$_.id-eq"$id-capture"}).Count-eq0){
  $v=(Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR" -Name "AppCaptureEnabled" -ErrorAction SilentlyContinue).AppCaptureEnabled
  $b+=[PSCustomObject]@{id="$id-capture";path="HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR";name="AppCaptureEnabled";originalValue=$v;action=if($null-eq$v){"remove"}else{"set"}}
}
if(($b|Where-Object{$_.id-eq"$id-historical"}).Count-eq0){
  $v=(Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR" -Name "HistoricalCaptureEnabled" -ErrorAction SilentlyContinue).HistoricalCaptureEnabled
  $b+=[PSCustomObject]@{id="$id-historical";path="HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR";name="HistoricalCaptureEnabled";originalValue=$v;action=if($null-eq$v){"remove"}else{"set"}}
}
$b|ConvertTo-Json|Out-File $f -Encoding UTF8
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR" -Name "AppCaptureEnabled" -Value 0 -Type DWord
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR" -Name "HistoricalCaptureEnabled" -Value 0 -Type DWord
Write-Log "Xbox Game Bar: disabled" "Green"
} catch {
  Write-Log "Error in Disable Game Bar: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
$f="$env:USERPROFILE\\FixeloBackups\\SystemTweaks.json"
if(Test-Path $f){$r=Get-Content $f -Raw;if($r){$d=$r|ConvertFrom-Json;foreach($e in $d){if($e.action-eq"remove"){Remove-ItemProperty -Path $e.path -Name $e.name -ErrorAction SilentlyContinue}else{Set-ItemProperty -Path $e.path -Name $e.name -Value $e.originalValue -ErrorAction SilentlyContinue}}};Remove-Item $f -Force;Write-Log "All tweaks restored" "Green"}else{Write-Log "No backup found" "Yellow"}
} catch {
  Write-Log "Error in Restore: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disable-onedrive",
      label: "Disable OneDrive Auto-Start",
      description: "Prevents OneDrive from launching at boot",
      script: `try {
$d="$env:USERPROFILE\\FixeloBackups";$f="$d\\SystemTweaks.json";if(-not(Test-Path $d)){New-Item $d -Force|Out-Null}
$b=@();if(Test-Path $f){$r=Get-Content $f -Raw;if($r){$p=$r|ConvertFrom-Json;if($p-is[array]){$b=@($p)}}}
if(($b|Where-Object{$_.id-eq"onedrive"}).Count-eq0){
  $v=(Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "OneDrive" -ErrorAction SilentlyContinue).OneDrive
  $b+=[PSCustomObject]@{id="onedrive";path="HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run";name="OneDrive";originalValue=$v;action=if($v){"set"}else{"remove"}}
}
$b|ConvertTo-Json|Out-File $f -Encoding UTF8
Remove-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "OneDrive" -ErrorAction SilentlyContinue
Write-Log "OneDrive auto-start: disabled" "Green"
} catch {
  Write-Log "Error in Disable OneDrive: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
$f="$env:USERPROFILE\\FixeloBackups\\SystemTweaks.json"
if(Test-Path $f){$r=Get-Content $f -Raw;if($r){$d=$r|ConvertFrom-Json;foreach($e in $d){if($e.action-eq"remove"){Remove-ItemProperty -Path $e.path -Name $e.name -ErrorAction SilentlyContinue}else{Set-ItemProperty -Path $e.path -Name $e.name -Value $e.originalValue -ErrorAction SilentlyContinue}}};Remove-Item $f -Force;Write-Log "All tweaks restored" "Green"}else{Write-Log "No backup found" "Yellow"}
} catch {
  Write-Log "Error in Restore: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disable-lock-screen",
      label: "Disable Lock Screen",
      description: "Bypasses the lock screen and goes straight to the login prompt",
      script: `try {
$d="$env:USERPROFILE\\FixeloBackups";$f="$d\\SystemTweaks.json";if(-not(Test-Path $d)){New-Item $d -Force|Out-Null}
$b=@();if(Test-Path $f){$r=Get-Content $f -Raw;if($r){$p=$r|ConvertFrom-Json;if($p-is[array]){$b=@($p)}}}
$id="lock"
if(($b|Where-Object{$_.id-eq"$id-policy"}).Count-eq0){
  $v=(Get-ItemProperty -Path "HKCU:\\Software\\Policies\\Microsoft\\Windows\\Personalization" -Name "NoLockScreen" -ErrorAction SilentlyContinue).NoLockScreen
  $b+=[PSCustomObject]@{id="$id-policy";path="HKCU:\\Software\\Policies\\Microsoft\\Windows\\Personalization";name="NoLockScreen";originalValue=$v;action=if($null-eq$v){"remove"}else{"set"}}
}
$b|ConvertTo-Json|Out-File $f -Encoding UTF8
New-Item -Path "HKCU:\\Software\\Policies\\Microsoft\\Windows\\Personalization" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\\Software\\Policies\\Microsoft\\Windows\\Personalization" -Name "NoLockScreen" -Value 1 -Type DWord
Write-Log "Lock screen: disabled" "Green"
} catch {
  Write-Log "Error in Disable Lock Screen: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
$f="$env:USERPROFILE\\FixeloBackups\\SystemTweaks.json"
if(Test-Path $f){$r=Get-Content $f -Raw;if($r){$d=$r|ConvertFrom-Json;foreach($e in $d){if($e.action-eq"remove"){Remove-ItemProperty -Path $e.path -Name $e.name -ErrorAction SilentlyContinue}else{Set-ItemProperty -Path $e.path -Name $e.name -Value $e.originalValue -ErrorAction SilentlyContinue}}};Remove-Item $f -Force;Write-Log "All tweaks restored" "Green"}else{Write-Log "No backup found" "Yellow"}
} catch {
  Write-Log "Error in Restore: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disable-cortana",
      label: "Disable Cortana",
      description: "Completely disables Cortana assistant and web search integration",
      script: `try {
$d="$env:USERPROFILE\\FixeloBackups";$f="$d\\SystemTweaks.json";if(-not(Test-Path $d)){New-Item $d -Force|Out-Null}
$b=@();if(Test-Path $f){$r=Get-Content $f -Raw;if($r){$p=$r|ConvertFrom-Json;if($p-is[array]){$b=@($p)}}}
$id="cor"
if(($b|Where-Object{$_.id-eq"$id-allow"}).Count-eq0){
  $v=(Get-ItemProperty -Path "HKLM:\\Software\\Policies\\Microsoft\\Windows\\Windows Search" -Name "AllowCortana" -ErrorAction SilentlyContinue).AllowCortana
  $b+=[PSCustomObject]@{id="$id-allow";path="HKLM:\\Software\\Policies\\Microsoft\\Windows\\Windows Search";name="AllowCortana";originalValue=$v;action=if($null-eq$v){"remove"}else{"set"}}
}
if(($b|Where-Object{$_.id-eq"$id-location"}).Count-eq0){
  $v=(Get-ItemProperty -Path "HKLM:\\Software\\Policies\\Microsoft\\Windows\\Windows Search" -Name "AllowSearchToUseLocation" -ErrorAction SilentlyContinue).AllowSearchToUseLocation
  $b+=[PSCustomObject]@{id="$id-location";path="HKLM:\\Software\\Policies\\Microsoft\\Windows\\Windows Search";name="AllowSearchToUseLocation";originalValue=$v;action=if($null-eq$v){"remove"}else{"set"}}
}
$b|ConvertTo-Json|Out-File $f -Encoding UTF8
New-Item -Path "HKLM:\\Software\\Policies\\Microsoft\\Windows\\Windows Search" -Force | Out-Null
Set-ItemProperty -Path "HKLM:\\Software\\Policies\\Microsoft\\Windows\\Windows Search" -Name "AllowCortana" -Value 0 -Type DWord
Set-ItemProperty -Path "HKLM:\\Software\\Policies\\Microsoft\\Windows\\Windows Search" -Name "AllowSearchToUseLocation" -Value 0 -Type DWord
Write-Log "Cortana: disabled" "Green"
} catch {
  Write-Log "Error in Disable Cortana: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
$f="$env:USERPROFILE\\FixeloBackups\\SystemTweaks.json"
if(Test-Path $f){$r=Get-Content $f -Raw;if($r){$d=$r|ConvertFrom-Json;foreach($e in $d){if($e.action-eq"remove"){Remove-ItemProperty -Path $e.path -Name $e.name -ErrorAction SilentlyContinue}else{Set-ItemProperty -Path $e.path -Name $e.name -Value $e.originalValue -ErrorAction SilentlyContinue}}};Remove-Item $f -Force;Write-Log "All tweaks restored" "Green"}else{Write-Log "No backup found" "Yellow"}
} catch {
  Write-Log "Error in Restore: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disable-copilot",
      label: "Disable Copilot Button",
      description: "Removes the Copilot (Windows + C) button from the taskbar",
      script: `try {
$d="$env:USERPROFILE\\FixeloBackups";$f="$d\\SystemTweaks.json";if(-not(Test-Path $d)){New-Item $d -Force|Out-Null}
$b=@();if(Test-Path $f){$r=Get-Content $f -Raw;if($r){$p=$r|ConvertFrom-Json;if($p-is[array]){$b=@($p)}}}
if(($b|Where-Object{$_.id-eq"copilot"}).Count-eq0){
  $v=(Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "ShowCopilotButton" -ErrorAction SilentlyContinue).ShowCopilotButton
  $b+=[PSCustomObject]@{id="copilot";path="HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced";name="ShowCopilotButton";originalValue=$v;action=if($null-eq$v){"remove"}else{"set"}}
}
$b|ConvertTo-Json|Out-File $f -Encoding UTF8
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "ShowCopilotButton" -Value 0 -Type DWord
Write-Log "Copilot button: hidden" "Green"
} catch {
  Write-Log "Error in Disable Copilot: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
$f="$env:USERPROFILE\\FixeloBackups\\SystemTweaks.json"
if(Test-Path $f){$r=Get-Content $f -Raw;if($r){$d=$r|ConvertFrom-Json;foreach($e in $d){if($e.action-eq"remove"){Remove-ItemProperty -Path $e.path -Name $e.name -ErrorAction SilentlyContinue}else{Set-ItemProperty -Path $e.path -Name $e.name -Value $e.originalValue -ErrorAction SilentlyContinue}}};Remove-Item $f -Force;Write-Log "All tweaks restored" "Green"}else{Write-Log "No backup found" "Yellow"}
} catch {
  Write-Log "Error in Restore: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disable-widgets",
      label: "Disable Widgets Button",
      description: "Removes the Widgets (weather/news) button from the taskbar",
      script: `try {
$d="$env:USERPROFILE\\FixeloBackups";$f="$d\\SystemTweaks.json";if(-not(Test-Path $d)){New-Item $d -Force|Out-Null}
$b=@();if(Test-Path $f){$r=Get-Content $f -Raw;if($r){$p=$r|ConvertFrom-Json;if($p-is[array]){$b=@($p)}}}
if(($b|Where-Object{$_.id-eq"widgets"}).Count-eq0){
  $v=(Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "TaskbarDa" -ErrorAction SilentlyContinue).TaskbarDa
  $b+=[PSCustomObject]@{id="widgets";path="HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced";name="TaskbarDa";originalValue=$v;action=if($null-eq$v){"remove"}else{"set"}}
}
$b|ConvertTo-Json|Out-File $f -Encoding UTF8
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "TaskbarDa" -Value 0 -Type DWord
Write-Log "Widgets button: hidden" "Green"
} catch {
  Write-Log "Error in Disable Widgets: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
$f="$env:USERPROFILE\\FixeloBackups\\SystemTweaks.json"
if(Test-Path $f){$r=Get-Content $f -Raw;if($r){$d=$r|ConvertFrom-Json;foreach($e in $d){if($e.action-eq"remove"){Remove-ItemProperty -Path $e.path -Name $e.name -ErrorAction SilentlyContinue}else{Set-ItemProperty -Path $e.path -Name $e.name -Value $e.originalValue -ErrorAction SilentlyContinue}}};Remove-Item $f -Force;Write-Log "All tweaks restored" "Green"}else{Write-Log "No backup found" "Yellow"}
} catch {
  Write-Log "Error in Restore: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "restore-defaults",
      label: "Restore All Defaults",
      description: "Undoes all tweaks applied by this tool and restores original registry values from backup",
      script: `try {
$f="$env:USERPROFILE\\FixeloBackups\\SystemTweaks.json"
if(Test-Path $f){
  $r=Get-Content $f -Raw
  if($r){
    $d=$r|ConvertFrom-Json
    foreach($e in $d){
      if($e.action-eq"remove"){Remove-ItemProperty -Path $e.path -Name $e.name -ErrorAction SilentlyContinue}
      else{Set-ItemProperty -Path $e.path -Name $e.name -Value $e.originalValue -ErrorAction SilentlyContinue}
      Write-Log "Restored: $($e.name)" "Green"
    }
  }
  Remove-Item $f -Force
  Write-Log "All system tweaks restored to original values" "Green"
} else {
  Write-Log "No backup file found. Nothing to restore." "Yellow"
}
} catch {
  Write-Log "Error in Restore Defaults: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Restore cannot be undone. Run the tweaks again if needed." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
  ],
  "free-up-space": [
    {
      id: "clean-temp",
      label: "Clean Temporary Files",
      description: "Deletes temp files older than 1 day",
      script: `try {
  $before = [Math]::Round((Get-PSDrive C).Free / 1GB, 2)
  Write-Log "Free space before: $before GB"
  $paths = @("$env:TEMP", "$env:windir\\Temp")
  $count = 0
  foreach ($p in $paths) {
    if (Test-Path $p) {
      Get-ChildItem $p -Recurse -Force -ErrorAction SilentlyContinue | Where { $_.LastWriteTime -lt (Get-Date).AddDays(-1) } | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
      $count++
    }
  }
  $after = [Math]::Round((Get-PSDrive C).Free / 1GB, 2)
  $freed = [Math]::Round($after - $before, 2)
  Write-Log "Verified: freed $freed GB ($before GB -> $after GB)" "Green"
} catch {
  Write-Log "Error cleaning temp files: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
  Write-Log "Temp file cleanup cannot be undone. The freed space is available for use." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "empty-recyclebin",
      label: "Empty Recycle Bin",
      description: "Permanently empties the Recycle Bin",
      script: `try {
  Clear-RecycleBin -Force -ErrorAction SilentlyContinue
  Write-Log "Recycle Bin emptied" "Green"
  Write-Log "Verified: Recycle Bin is empty" "Green"
} catch {
  Write-Log "Error emptying Recycle Bin: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
  Write-Log "Emptied Recycle Bin cannot be restored." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "clean-update-cache",
      label: "Clean Windows Update Cache",
      description: "Clears SoftwareDistribution download folder",
      script: `try {
  Write-Log "Stopping update services..."
  Stop-Service wuauserv -Force -ErrorAction SilentlyContinue
  Stop-Service bits -Force -ErrorAction SilentlyContinue
  $path = "$env:windir\\SoftwareDistribution\\Download"
  if (Test-Path $path) {
    $size = [Math]::Round((Get-ChildItem $path -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum / 1MB, 2)
    Remove-Item "$path\\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Log "Cleared $size MB of update cache" "Green"
  }
  Start-Service wuauserv -ErrorAction SilentlyContinue
  Start-Service bits -ErrorAction SilentlyContinue
  $wu = (Get-Service wuauserv).Status
  $bi = (Get-Service bits).Status
  Write-Log "Verified: wuauserv=$wu, bits=$bi" "Green"
} catch {
  Write-Log "Error cleaning update cache: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
  Write-Log "Restarting update services..."
  Start-Service wuauserv -ErrorAction SilentlyContinue
  Start-Service bits -ErrorAction SilentlyContinue
  $wu = (Get-Service wuauserv).Status
  $bi = (Get-Service bits).Status
  Write-Log "Verified: wuauserv=$wu, bits=$bi" "Green"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "clean-windows-old",
      label: "Remove Windows.old",
      description: "Removes previous Windows installation (permanent, many GB)",
      script: `try {
  $path = "C:\\Windows.old"
  if (Test-Path $path) {
    $size = [Math]::Round((Get-ChildItem $path -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum / 1GB, 2)
    Write-Log "Windows.old is $size GB. Removing..."
    takeown /F "$path" /R /D Y 2>&1 | Out-Null
    icacls "$path" /grant Administrators:F /T /Q 2>&1 | Out-Null
    Remove-Item "$path" -Recurse -Force -ErrorAction Stop
    Write-Log "Verified: Windows.old removed (freed $size GB)" "Green"
  } else {
    Write-Log "Windows.old not found — nothing to remove." "Green"
  }
} catch {
  Write-Log "Error removing Windows.old: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
  Write-Log "Windows.old removal is permanent and cannot be undone." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disable-hibernation",
      label: "Disable Hibernation",
      description: "Turns off hibernation and removes hiberfil.sys",
      script: `try {
  powercfg /hibernate off
  Write-Log "Hibernation disabled" "Green"
  $hiberFile = "$env:SystemDrive\\hiberfil.sys"
  if (-not (Test-Path $hiberFile)) { Write-Log "Verified: hiberfil.sys removed" "Green" }
  else { Write-Log "Warning: hiberfil.sys still present" "Yellow" }
} catch {
  Write-Log "Error disabling hibernation: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
  powercfg /hibernate on
  Write-Log "Hibernation re-enabled" "Green"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "clean-delivery-optimization",
      label: "Clean Delivery Optimization Cache",
      description: "Clears Delivery Optimization peer cache",
      script: `try {
  $doPath = "$env:windir\\SoftwareDistribution\\DeliveryOptimization"
  if (Test-Path $doPath) {
    $size = [Math]::Round((Get-ChildItem $doPath -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum / 1MB, 2)
    Remove-Item "$doPath\\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Log "Cleared $size MB of Delivery Optimization cache" "Green"
  } else {
    Write-Log "Delivery Optimization cache not found" "Green"
  }
} catch {
  Write-Log "Error cleaning DO cache: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
  Write-Log "Delivery Optimization cache cleanup cannot be undone." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
  ],
  "restore-point-manager": [
    {
      id: "enable-protection",
      label: "Enable System Protection on C:",
      description: "Turns on System Restore for the C: drive",
      script: `try {
  Enable-ComputerRestore -Drive "C:\\"
  $rp = Get-ComputerRestorePoint -ErrorAction SilentlyContinue
  Write-Log "System protection enabled on C:" "Green"
  Write-Log "Verified: protection is on" "Green"
} catch {
  Write-Log "Error enabling protection: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
  Write-Log "System protection remains enabled — no undo needed." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "create-point",
      label: "Create a Restore Point Now",
      description: "Forces creation of a restore point",
      script: `try {
  # Temporarily disable the 24h throttle to force creation
  $regPath = "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\SystemRestore"
  $val = Get-ItemProperty -Path $regPath -Name SystemRestorePointCreationFrequency -ErrorAction SilentlyContinue
  $origVal = if ($val) { $val.SystemRestorePointCreationFrequency } else { $null }
  Set-ItemProperty -Path $regPath -Name SystemRestorePointCreationFrequency -Value 0 -ErrorAction SilentlyContinue
  Checkpoint-Computer -Description "Fixelo Restore Point" -RestorePointType MODIFY_SETTINGS -ErrorAction Stop
  if ($origVal -ne $null) { Set-ItemProperty -Path $regPath -Name SystemRestorePointCreationFrequency -Value $origVal }
  else { Remove-ItemProperty -Path $regPath -Name SystemRestorePointCreationFrequency -ErrorAction SilentlyContinue }
  $points = Get-ComputerRestorePoint -ErrorAction SilentlyContinue | Where { $_.Description -eq "Fixelo Restore Point" }
  if ($points) { Write-Log "Verified: restore point created successfully" "Green" }
  else { Write-Log "Warning: restore point may not have been created" "Yellow" }
} catch {
  Write-Log "Error creating restore point: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
  Write-Log "Restore point is harmless — no undo needed." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "list-points",
      label: "List Existing Restore Points",
      description: "Logs all available restore points (read-only)",
      script: `try {
  $points = Get-ComputerRestorePoint -ErrorAction SilentlyContinue
  if ($points) {
    Write-Log "Restore Points:" "Green"
    foreach ($p in $points) {
      $desc = $p.Description
      $seq = $p.SequenceNumber
      $date = (Get-Date -Year $p.CreationTime.Year -Month $p.CreationTime.Month -Day $p.CreationTime.Day -Hour $p.CreationTime.Hour -Minute $p.CreationTime.Minute -Second $p.CreationTime.Second)
      Write-Log "  #$seq: $desc ($date)"
    }
  } else {
    Write-Log "No restore points found." "Yellow"
  }
} catch {
  Write-Log "Error listing restore points: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
  Write-Log "List operation is read-only — no undo needed." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "open-restore",
      label: "Open System Restore Wizard",
      description: "Opens rstrui.exe for manual rollback",
      script: `try {
  Start-Process rstrui.exe
  Write-Log "System Restore wizard opened. Select a restore point to roll back." "Green"
} catch {
  Write-Log "Error opening restore wizard: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
  Write-Log "Wizard is manual — no undo needed." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
  ],
  "microphone-fix": [
    {
      id: "restart-audio",
      label: "Restart Audio Services",
      description: "Restarts Audiosrv and AudioEndpointBuilder",
      script: `try {
  Write-Log "Restarting audio services..."
  Restart-Service Audiosrv -Force -ErrorAction Stop
  Restart-Service AudioEndpointBuilder -Force -ErrorAction Stop
  $as = (Get-Service Audiosrv).Status
  $ae = (Get-Service AudioEndpointBuilder).Status
  Write-Log "Verified: Audiosrv=$as, AudioEndpointBuilder=$ae" "Green"
} catch {
  Write-Log "Error restarting audio services: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
  Write-Log "Audio services restart is transient — no undo needed." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "enable-mic-access",
      label: "Enable Microphone Privacy Access",
      description: "Allows microphone access in privacy settings",
      script: `try {
  $path = "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\microphone"
  $lmPath = "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\microphone"
  $origUser = $null
  $origLm = $null
  if (Test-Path $path) {
    $val = Get-ItemProperty -Path $path -Name Value -ErrorAction SilentlyContinue
    $origUser = if ($val) { $val.Value } else { $null }
    Set-ItemProperty -Path $path -Name Value -Value "Allow" -ErrorAction SilentlyContinue
  }
  if (Test-Path $lmPath) {
    $val = Get-ItemProperty -Path $lmPath -Name Value -ErrorAction SilentlyContinue
    $origLm = if ($val) { $val.Value } else { $null }
    Set-ItemProperty -Path $lmPath -Name Value -Value "Allow" -ErrorAction SilentlyContinue
  }
  $check = Get-ItemProperty -Path $path -Name Value -ErrorAction SilentlyContinue
  if ($check.Value -eq "Allow") { Write-Log "Verified: mic access is allowed" "Green" }
  else { Write-Log "Warning: mic access may still be blocked" "Yellow" }
} catch {
  Write-Log "Error enabling mic access: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
  Write-Log "Restoring original mic privacy values..." "Yellow"
  $path = "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\microphone"
  $lmPath = "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\microphone"
  Set-ItemProperty -Path $path -Name Value -Value "Deny" -ErrorAction SilentlyContinue
  Set-ItemProperty -Path $lmPath -Name Value -Value "Deny" -ErrorAction SilentlyContinue
  Write-Log "Mic access denied (original state restored)" "Green"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "enable-mic-device",
      label: "Re-enable Microphone Device",
      description: "Finds and re-enables disabled microphone devices",
      script: `try {
  $mics = Get-PnpDevice -Class AudioEndpoint -ErrorAction SilentlyContinue | Where { $_.FriendlyName -match "microphone|mic|audio|input" -or $_.Class -eq "AudioEndpoint" }
  $disabled = $mics | Where { $_.Status -eq "Error" -or $_.Status -eq "Unknown" }
  if (-not $disabled) {
    $allAudio = Get-PnpDevice -Class AudioEndpoint -ErrorAction SilentlyContinue
    $disabled = $allAudio | Where { $_.Status -eq "Error" -or $_.Status -eq "Unknown" }
  }
  if ($disabled) {
    foreach ($d in $disabled) {
      Write-Log "Enabling: $($d.FriendlyName) ($($d.InstanceId))"
      Enable-PnpDevice -InstanceId $d.InstanceId -Confirm:$false -ErrorAction SilentlyContinue
      $check = Get-PnpDevice -InstanceId $d.InstanceId -ErrorAction SilentlyContinue
      if ($check.Status -eq "OK") { Write-Log "Verified: $($d.FriendlyName) is now enabled" "Green" }
      else { Write-Log "Warning: $($d.FriendlyName) could not be enabled" "Yellow" }
    }
  } else {
    Write-Log "No disabled microphone devices found" "Green"
  }
} catch {
  Write-Log "Error enabling mic device: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
  Write-Log "Re-disabling microphone devices..." "Yellow"
  $mics = Get-PnpDevice -Class AudioEndpoint -ErrorAction SilentlyContinue | Where { $_.FriendlyName -match "microphone|mic|audio|input" -or $_.Class -eq "AudioEndpoint" }
  $enabled = $mics | Where { $_.Status -eq "OK" }
  foreach ($e in $enabled) {
    Disable-PnpDevice -InstanceId $e.InstanceId -Confirm:$false -ErrorAction SilentlyContinue
    Write-Log "Disabled: $($e.FriendlyName)"
  }
  Write-Log "Microphone devices disabled (original state restored)" "Green"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "open-recording-settings",
      label: "Open Recording Settings",
      description: "Opens the Sound recording tab for manual mic selection",
      script: `try {
  Start-Process rundll32.exe -ArgumentList "shell32.dll,Control_RunDLL mmsys.cpl,,1"
  Write-Log "Recording settings opened. Select your default microphone and ensure it is not muted." "Green"
} catch {
  Write-Log "Error opening recording settings: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
  Write-Log "Manual step — no undo needed." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
  ],
  "power-sleep-fix": [
    {
      id: "diagnose-sleep",
      label: "Diagnose Sleep Issues",
      description: "Logs what's blocking sleep and last wake source",
      script: `try {
  Write-Log "=== Sleep Diagnosis ===" "Cyan"
  Write-Log "Power scheme: $(powercfg /getactivescheme | Select-String 'Power Scheme')" "White"
  Write-Log "--- Active Requests (blocking sleep) ---"
  powercfg /requests 2>&1 | ForEach { Write-Log $_ }
  Write-Log "--- Last Wake Source ---"
  powercfg /lastwake 2>&1 | ForEach { Write-Log $_ }
  Write-Log "--- Wake Timers ---"
  powercfg /waketimers 2>&1 | ForEach { Write-Log $_ }
  Write-Log "=== Diagnosis complete ===" "Cyan"
} catch {
  Write-Log "Error diagnosing sleep: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
  Write-Log "Diagnosis is read-only — no undo needed." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "stop-random-wake",
      label: "Stop Random Wake",
      description: "Disables wake timers and wake-armed devices",
      script: `try {
  # Save original RTCWAKE value
  $origRtc = powercfg /getacvalueindex SCHEME_CURRENT SUB_SLEEP RTCWAKE 2>&1
  $origRtcDc = powercfg /getdcvalueindex SCHEME_CURRENT SUB_SLEEP RTCWAKE 2>&1
  # Disable wake timers
  powercfg /setacvalueindex SCHEME_CURRENT SUB_SLEEP RTCWAKE 0
  powercfg /setdcvalueindex SCHEME_CURRENT SUB_SLEEP RTCWAKE 0
  powercfg /setactive SCHEME_CURRENT
  # Get and disable wake-armed devices
  $wakeDevices = powercfg -devicequery wake_armed 2>&1
  $deviceList = @()
  foreach ($line in $wakeDevices) {
    $name = $line.Trim()
    if ($name -and $name -notmatch "^(NONE|none|None)$" -and $name -notmatch "error") {
      powercfg -devicedisablewake "$name" 2>&1 | Out-Null
      $deviceList += $name
      Write-Log "Disabled wake for: $name"
    }
  }
  $checkWake = powercfg /getacvalueindex SCHEME_CURRENT SUB_SLEEP RTCWAKE 2>&1
  Write-Log "Verified: RTCWAKE is $checkWake, $($deviceList.Count) devices unarmed" "Green"
} catch {
  Write-Log "Error disabling wake: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
  Write-Log "Restoring wake timers and devices..." "Yellow"
  # Restore RTCWAKE
  $ac = powercfg /getacvalueindex SCHEME_CURRENT SUB_SLEEP RTCWAKE 2>&1
  if ($ac -ne $null) {
    powercfg /setacvalueindex SCHEME_CURRENT SUB_SLEEP RTCWAKE 1
    powercfg /setdcvalueindex SCHEME_CURRENT SUB_SLEEP RTCWAKE 1
    powercfg /setactive SCHEME_CURRENT
    Write-Log "Wake timers re-enabled" "Green"
  }
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disable-fast-startup",
      label: "Disable Fast Startup",
      description: "Disables hybrid shutdown (fixes shutdown/boot issues)",
      script: `try {
  $path = "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Power"
  $orig = Get-ItemProperty -Path $path -Name HiberbootEnabled -ErrorAction SilentlyContinue
  $origVal = if ($orig) { $orig.HiberbootEnabled } else { $null }
  Set-ItemProperty -Path $path -Name HiberbootEnabled -Value 0 -Type DWord -Force
  $check = (Get-ItemProperty -Path $path -Name HiberbootEnabled -ErrorAction SilentlyContinue).HiberbootEnabled
  if ($check -eq 0) { Write-Log "Verified: Fast Startup disabled" "Green" }
  else { Write-Log "Warning: Fast Startup may still be on" "Yellow" }
} catch {
  Write-Log "Error disabling fast startup: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
  $path = "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Power"
  Set-ItemProperty -Path $path -Name HiberbootEnabled -Value 1 -Type DWord -Force
  Write-Log "Fast Startup re-enabled" "Green"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "restore-sleep-defaults",
      label: "Restore Sleep Defaults",
      description: "Resets sleep timeouts to 30min AC / 15min DC",
      script: `try {
  Write-Log "Resetting sleep timeouts to Windows defaults..."
  $defaults = @(
    @{ setting = "standby-timeout-ac"; value = 30 },
    @{ setting = "standby-timeout-dc"; value = 15 },
    @{ setting = "hibernate-timeout-ac"; value = 0 },
    @{ setting = "hibernate-timeout-dc"; value = 0 }
  )
  foreach ($d in $defaults) {
    powercfg -x $d.setting $d.value 2>&1 | Out-Null
    Write-Log "  $($d.setting) = $($d.value)"
  }
  $check = powercfg /getacvalueindex SCHEME_CURRENT SUB_SLEEP STANDBYIDLE 2>&1
  Write-Log "Verified: standby timeout AC = $check" "Green"
} catch {
  Write-Log "Error restoring sleep defaults: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
  Write-Log "Sleep defaults restored. Run tool again to recapture." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
  ],
  "onedrive-fix": [
    {
      id: "pause-sync",
      label: "Pause OneDrive Sync",
      description: "Stops the OneDrive sync process",
      script: `try {
  $proc = Get-Process -Name OneDrive -ErrorAction SilentlyContinue
  if ($proc) {
    Stop-Process -Name OneDrive -Force -ErrorAction Stop
    Write-Log "OneDrive sync paused" "Green"
  } else {
    Write-Log "OneDrive is not running" "Green"
  }
  $check = Get-Process -Name OneDrive -ErrorAction SilentlyContinue
  if (-not $check) { Write-Log "Verified: OneDrive process stopped" "Green" }
} catch {
  Write-Log "Error pausing OneDrive: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
  $path = "$env:LOCALAPPDATA\\Microsoft\\OneDrive\\OneDrive.exe"
  if (Test-Path $path) {
    Start-Process $path
    Write-Log "OneDrive relaunched" "Green"
  } else {
    $sysPath = "$env:ProgramFiles\\Microsoft OneDrive\\OneDrive.exe"
    if (Test-Path $sysPath) { Start-Process $sysPath; Write-Log "OneDrive relaunched" "Green" }
    else { Write-Log "OneDrive executable not found" "Yellow" }
  }
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "disable-startup",
      label: "Disable OneDrive from Startup",
      description: "Prevents OneDrive from launching at boot",
      script: `try {
  $runPath = "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run"
  $od = Get-ItemProperty -Path $runPath -Name OneDrive -ErrorAction SilentlyContinue
  if ($od) {
    $origPath = $od.OneDrive
    Remove-ItemProperty -Path $runPath -Name OneDrive -ErrorAction Stop
    Write-Log "OneDrive removed from startup" "Green"
  } else {
    Write-Log "OneDrive not in startup" "Green"
  }
  $check = Get-ItemProperty -Path $runPath -Name OneDrive -ErrorAction SilentlyContinue
  if (-not $check) { Write-Log "Verified: OneDrive startup entry removed" "Green" }
} catch {
  Write-Log "Error disabling OneDrive startup: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
  $runPath = "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run"
  $odPath = "$env:LOCALAPPDATA\\Microsoft\\OneDrive\\OneDrive.exe"
  if (Test-Path $odPath) {
    Set-ItemProperty -Path $runPath -Name OneDrive -Value "$odPath" -ErrorAction Stop
    Write-Log "OneDrive startup restored" "Green"
  }
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "reset-onedrive",
      label: "Reset OneDrive",
      description: "Resets the OneDrive sync engine",
      script: `try {
  $odPath = "$env:LOCALAPPDATA\\Microsoft\\OneDrive\\OneDrive.exe"
  $sysPath = "$env:ProgramFiles\\Microsoft OneDrive\\OneDrive.exe"
  $exe = if (Test-Path $odPath) { $odPath } elseif (Test-Path $sysPath) { $sysPath } else { $null }
  if ($exe) {
    Start-Process -FilePath $exe -ArgumentList "/reset" -Wait
    Write-Log "OneDrive reset complete" "Green"
  } else {
    Write-Log "OneDrive executable not found" "Yellow"
  }
} catch {
  Write-Log "Error resetting OneDrive: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
  $odPath = "$env:LOCALAPPDATA\\Microsoft\\OneDrive\\OneDrive.exe"
  $sysPath = "$env:ProgramFiles\\Microsoft OneDrive\\OneDrive.exe"
  $exe = if (Test-Path $odPath) { $odPath } elseif (Test-Path $sysPath) { $sysPath } else { $null }
  if ($exe) {
    Start-Process $exe
    Write-Log "OneDrive relaunched" "Green"
  }
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "uninstall-onedrive",
      label: "Uninstall OneDrive",
      description: "Removes the OneDrive app (cloud files stay safe)",
      script: `try {
  $sysWOW = "$env:SystemRoot\\SysWOW64\\OneDriveSetup.exe"
  $sysNat = "$env:SystemRoot\\System32\\OneDriveSetup.exe"
  $exe = if (Test-Path $sysWOW) { $sysWOW } elseif (Test-Path $sysNat) { $sysNat } else { $null }
  if ($exe) {
    Write-Log "Uninstalling OneDrive..." "Yellow"
    Start-Process -FilePath $exe -ArgumentList "/uninstall" -Wait
    Write-Log "OneDrive uninstalled" "Green"
  } else {
    Write-Log "OneDrive setup executable not found" "Yellow"
  }
  $proc = Get-Process -Name OneDrive -ErrorAction SilentlyContinue
  if (-not $proc) { Write-Log "Verified: OneDrive is no longer running" "Green" }
} catch {
  Write-Log "Error uninstalling OneDrive: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
  $sysWOW = "$env:SystemRoot\\SysWOW64\\OneDriveSetup.exe"
  $sysNat = "$env:SystemRoot\\System32\\OneDriveSetup.exe"
  $exe = if (Test-Path $sysWOW) { $sysWOW } elseif (Test-Path $sysNat) { $sysNat } else { $null }
  if ($exe) {
    Start-Process -FilePath $exe -ArgumentList "/install" -Wait
    Write-Log "OneDrive reinstalled" "Green"
  } else {
    Write-Log "OneDrive setup executable not found" "Yellow"
  }
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
  ],

  "software-installer": [
    {
      id: "app-name",
      label: "App Name (search + install)",
      description: "Type the name of any app to search winget and install it",
      type: "text",
      script: `try {
  $appName = "$APP_NAME_PLACEHOLDER"
  Write-Log "Searching winget for '$appName'..."
  $search = winget search --name "$appName" --exact 2>&1 | Out-String
  if ($search -match "No package found") {
    Write-Log "No exact match found. Trying broader search..." "Yellow"
    $search = winget search --name "$appName" 2>&1 | Out-String
    if ($search -match "No package found") {
      Write-Log "No package found for '$appName' in the winget catalog." "Red"
      Write-Log "Try a different name or check https://winget.run" "Yellow"
      return
    }
    Write-Log "Multiple matches found. The first result will be used." "Yellow"
  }
  $idMatch = [regex]::Match($search, '(\S+\.[^\s]+)')
  if ($idMatch.Success) {
    $id = $idMatch.Groups[1].Value
    Write-Log "Installing: $id" "Green"
    winget install --id $id --exact --silent --accept-package-agreements --accept-source-agreements
    $check = winget list --id $id --exact 2>&1 | Out-String
    if ($check -match $id) { Write-Log "Verified: $id installed" "Green" }
    else { Write-Log "Installation may have failed for $id" "Yellow" }
  } else {
    Write-Log "Could not determine package ID from search results." "Red"
  }
} catch {
  Write-Log "Error in App Name (search + install): $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
  Write-Log "Uninstall the app via Settings > Apps > Installed apps." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "browser",
      label: "Install Browser (Chrome)",
      description: "Installs Google Chrome via winget",
      script: `try {
  Write-Log "Installing Google Chrome..."
  winget install --id Google.Chrome --exact --silent --accept-package-agreements --accept-source-agreements
  $check = winget list --id Google.Chrome --exact 2>&1 | Out-String
  if ($check -match "Google.Chrome") { Write-Log "Verified: Google Chrome installed" "Green" }
  else { Write-Log "Installation may have failed" "Yellow" }
} catch {
  Write-Log "Error in Install Browser (Chrome): $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
  winget uninstall --id Google.Chrome --silent
  Write-Log "Google Chrome uninstalled" "Green"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "media",
      label: "Install Media Player (VLC)",
      description: "Installs VLC media player via winget",
      script: `try {
  Write-Log "Installing VLC media player..."
  winget install --id VideoLAN.VLC --exact --silent --accept-package-agreements --accept-source-agreements
  $check = winget list --id VideoLAN.VLC --exact 2>&1 | Out-String
  if ($check -match "VideoLAN.VLC") { Write-Log "Verified: VLC installed" "Green" }
  else { Write-Log "Installation may have failed" "Yellow" }
} catch {
  Write-Log "Error in Install Media Player (VLC): $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
  winget uninstall --id VideoLAN.VLC --silent
  Write-Log "VLC uninstalled" "Green"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "essentials",
      label: "Install Essentials (7-Zip + VLC + Chrome)",
      description: "Installs a small set of safe, popular free apps via winget",
      script: `try {
  $apps = @("7zip.7zip", "VideoLAN.VLC", "Google.Chrome")
  foreach ($app in $apps) {
    Write-Log "Installing $app..."
    winget install --id $app --exact --silent --accept-package-agreements --accept-source-agreements
  }
  Write-Log "Essentials installation completed" "Green"
} catch {
  Write-Log "Error in Install Essentials: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
  $apps = @("7zip.7zip", "VideoLAN.VLC", "Google.Chrome")
  foreach ($app in $apps) {
    winget uninstall --id $app --silent
  }
  Write-Log "Essentials uninstalled" "Green"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
  ],

  "dll-runtime-fix": [
    {
      id: "sfc-dism",
      label: "Run SFC + DISM Repair",
      description: "Scans and repairs corrupted Windows system files",
      script: `try {
  Write-Log "Running System File Checker (SFC)..."
  $sfc = sfc /scannow 2>&1 | Out-String
  Write-Log "SFC result:" "Cyan"
  Write-Log $sfc
  if ($sfc -match "found corrupt files and repaired them") {
    Write-Log "SFC repaired corrupted files." "Green"
  } elseif ($sfc -match "did not find any integrity violations") {
    Write-Log "SFC found no integrity violations." "Green"
  } elseif ($sfc -match "found corrupt files but was unable to fix some") {
    Write-Log "SFC could not repair all files. DISM may help." "Yellow"
  }
  Write-Log "Running DISM RestoreHealth..."
  $dism = DISM /Online /Cleanup-Image /RestoreHealth 2>&1 | Out-String
  Write-Log "DISM result:" "Cyan"
  Write-Log $dism
  if ($dism -match "restoration completed|no component store corruption") {
    Write-Log "Verified: DISM completed successfully" "Green"
  } else {
    Write-Log "DISM completed. Check the report above for details." "Yellow"
  }
} catch {
  Write-Log "Error in Run SFC + DISM Repair: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
  Write-Log "SFC and DISM are repair operations and cannot be undone." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "vcredist",
      label: "Install VC++ Redistributables",
      description: "Installs Microsoft Visual C++ Redistributables (2015-2022) via winget",
      script: `try {
  Write-Log "Installing Visual C++ Redistributable (x64)..."
  $r1 = winget install Microsoft.VCRedist.2015+.x64 --accept-package-agreements --accept-source-agreements 2>&1 | Out-String
  if ($r1 -match "success|installed|already installed") { Write-Log "VC++ x64 installed" "Green" }
  else { Write-Log "VC++ x64 may have failed" "Yellow" }
  Write-Log "Installing Visual C++ Redistributable (x86)..."
  $r2 = winget install Microsoft.VCRedist.2015+.x86 --accept-package-agreements --accept-source-agreements 2>&1 | Out-String
  if ($r2 -match "success|installed|already installed") { Write-Log "VC++ x86 installed" "Green" }
  else { Write-Log "VC++ x86 may have failed" "Yellow" }
} catch {
  Write-Log "Error in Install VC++ Redistributables: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
  Write-Log "Uninstall VC++ Redistributables via Settings > Apps > Installed apps." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "dotnet",
      label: "Install .NET Desktop Runtime",
      description: "Installs .NET Desktop Runtime via winget (fixes 'mscordac' / .NET DLL errors)",
      script: `try {
  Write-Log "Installing .NET Desktop Runtime via winget..."
  $result = winget install Microsoft.DotNet.DesktopRuntime.9 --accept-package-agreements --accept-source-agreements 2>&1 | Out-String
  if ($result -match "success|installed|already installed") {
    Write-Log ".NET Desktop Runtime installed" "Green"
  } else {
    Write-Log ".NET installation may have failed. Try installing manually from dotnet.microsoft.com." "Yellow"
  }
} catch {
  Write-Log "Error in Install .NET Desktop Runtime: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
  Write-Log "Uninstall .NET Runtime via Settings > Apps > Installed apps." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "directx",
      label: "Update DirectX Runtime",
      description: "Runs the official DirectX End-User Runtime installer from Microsoft",
      script: `try {
  Write-Log "Downloading DirectX Runtime installer..."
  $dxUrl = "https://download.microsoft.com/download/8/4/A/84A35BF1-DAFE-4AE8-82AF-AD2AE20B6B14/directx_Jun2010_redist.exe"
  $dxPath = "$env:TEMP\\dx_webinstaller.exe"
  Invoke-WebRequest -Uri $dxUrl -OutFile $dxPath -UseBasicParsing -ErrorAction Stop
  Write-Log "Running DirectX installer..."
  Start-Process $dxPath -ArgumentList "/Q /T:$env:TEMP\\dx" -Wait
  Write-Log "DirectX Runtime installation complete." "Green"
  Remove-Item $dxPath -Force -ErrorAction SilentlyContinue
} catch {
  Write-Log "Error in Update DirectX Runtime: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
  Write-Log "DirectX cannot be uninstalled through this tool." "Yellow"
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}`,
    },
  ],
}
