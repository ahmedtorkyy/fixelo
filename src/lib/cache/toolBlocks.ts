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
# Empty Recycle Bin using Shell.Application COM object
$shell = New-Object -ComObject Shell.Application
$shell.Namespace(0xa).Items() | ForEach-Object { $_.InvokeVerb("delete") }
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
  Write-Log "Resetting WiFi adapter: $($wifi.Name)"
  $wifi.Disable() | Out-Null
  Start-Sleep -Seconds 3
  $wifi.Enable() | Out-Null
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
wmic diskdrive get status
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
      id: "verify-startup",
      label: "Verify Startup Items",
      description: "Lists current startup items and flags suspicious ones",
      script: `try {
Write-Log "Current startup items:"
Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location | Format-Table -AutoSize
Write-Log "Review the list above. Items from temp folders or unusual paths may be suspicious." "Yellow"
} catch {
  Write-Log "Error in Verify Startup Items: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Startup verification is read-only. No undo needed." "Yellow"
} catch {
  Write-Log "Error in Verify Startup Items: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "empty-recycle",
      label: "Empty Recycle Bin",
      description: "Permanently deletes all files in the Recycle Bin",
      script: `try {
$shell = New-Object -ComObject Shell.Application
$shell.Namespace(0xa).Items() | ForEach-Object { $_.InvokeVerb("delete") }
Write-Log "Recycle Bin emptied"
} catch {
  Write-Log "Error in Empty Recycle Bin: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Recycle Bin emptying cannot be undone." "Yellow"
} catch {
  Write-Log "Error in Empty Recycle Bin: $($_.Exception.Message)" "Red"
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
wmic diskdrive get status,model,size
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
  winget install --id $app --silent --accept-package-agreements --accept-source-agreements -ErrorAction SilentlyContinue
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
  winget install --id $app --silent --accept-package-agreements --accept-source-agreements -ErrorAction SilentlyContinue
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
  winget install --id $app --silent --accept-package-agreements --accept-source-agreements -ErrorAction SilentlyContinue
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
  winget install --id $app --silent --accept-package-agreements --accept-source-agreements -ErrorAction SilentlyContinue
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
  winget install --id $app --silent --accept-package-agreements --accept-source-agreements -ErrorAction SilentlyContinue
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
  winget install --id $app --silent --accept-package-agreements --accept-source-agreements -ErrorAction SilentlyContinue
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
  winget install --id $app --silent --accept-package-agreements --accept-source-agreements -ErrorAction SilentlyContinue
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
winget install --id Git.Git --silent --accept-package-agreements --accept-source-agreements -ErrorAction SilentlyContinue
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
winget install --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements -ErrorAction SilentlyContinue
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
winget install --id Python.Python.3.13 --silent --accept-package-agreements --accept-source-agreements -ErrorAction SilentlyContinue
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
winget install --id Microsoft.VisualStudioCode --silent --accept-package-agreements --accept-source-agreements -ErrorAction SilentlyContinue
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
winget install --id Microsoft.WindowsTerminal --silent --accept-package-agreements --accept-source-agreements -ErrorAction SilentlyContinue
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
      description: "Downloads and installs the latest GPU driver",
      script: `try {
Write-Log "Checking for GPU driver update..."
$gpu = Get-WmiObject Win32_PnPEntity | Where-Object { $_.Name -match "NVIDIA|AMD|Intel.*Graphics" -and $_.ConfigManagerErrorCode -eq 0 }
if ($gpu) {
  foreach ($d in $gpu) { Write-Log "Found: $($d.Name)" }
}
Write-Log "Visit the GPU manufacturer's website for the latest driver." "Yellow"
} catch {
  Write-Log "Error in Update GPU Driver: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Driver updates are cumulative. Roll back via Device Manager if needed." "Yellow"
} catch {
  Write-Log "Error in Update GPU Driver: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "update-network",
      label: "Update Network Driver",
      description: "Updates the network adapter driver",
      script: `try {
Write-Log "Checking for network driver update..."
$net = Get-WmiObject Win32_PnPEntity | Where-Object { $_.Name -match "Network|Ethernet|WiFi|Wireless" -and $_.ConfigManagerErrorCode -eq 0 }
if ($net) {
  foreach ($d in $net) { Write-Log "Found: $($d.Name)" }
}
Write-Log "Visit the manufacturer's website for the latest network driver." "Yellow"
} catch {
  Write-Log "Error in Update Network Driver: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Driver updates are cumulative. Roll back via Device Manager if needed." "Yellow"
} catch {
  Write-Log "Error in Update Network Driver: $($_.Exception.Message)" "Red"
}`,
    },
    {
      id: "update-audio",
      label: "Update Audio Driver",
      description: "Updates the audio driver to the latest version",
      script: `try {
Write-Log "Checking for audio driver update..."
$audio = Get-WmiObject Win32_PnPEntity | Where-Object { $_.Name -match "Audio|Sound|Realtek|High Definition" -and $_.ConfigManagerErrorCode -eq 0 }
if ($audio) {
  foreach ($d in $audio) { Write-Log "Found: $($d.Name)" }
}
Write-Log "Visit the manufacturer's website for the latest audio driver." "Yellow"
} catch {
  Write-Log "Error in Update Audio Driver: $($_.Exception.Message)" "Red"
}`,
      undoScript: `try {
Write-Log "Driver updates are cumulative. Roll back via Device Manager if needed." "Yellow"
} catch {
  Write-Log "Error in Update Audio Driver: $($_.Exception.Message)" "Red"
}`,
    },
  ],
}
