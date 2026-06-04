export const CHECK_MY_PC_SCRIPT = `@echo off
cd /d "%~dp0"
net session >nul 2>&1
if %errorLevel% neq 0 (
powershell -NoProfile -Command "Start-Process '%~sf0' -Verb RunAs"
exit /b
)
set "PSFILE=%TEMP%\\fixelo_diag_%RANDOM%.ps1"
powershell -NoProfile -Command "$raw=[IO.File]::ReadAllText('%~f0');$idx=$raw.LastIndexOf('__PSSCRIPT__');$ps=$raw.Substring($idx+12).TrimStart([char]13,[char]10);[IO.File]::WriteAllText('%PSFILE%',$ps,[Text.Encoding]::UTF8)"
powershell -NoProfile -ExecutionPolicy Bypass -File "%PSFILE%"
del /f /q "%PSFILE%" 2>nul
exit /b
__PSSCRIPT__
$script:log = ""

function Write-Log([string]$msg, [string]$color = "White") {
    Write-Host $msg -ForegroundColor $color
    $script:log += "[$(Get-Date -Format 'HH:mm:ss')] $msg" + [Environment]::NewLine
}

Write-Log "=== Fixelo PC Diagnostic Report ===" "Cyan"
Write-Log ""
Write-Log "--- System Info ---" "Yellow"
Write-Log "Computer: $env:COMPUTERNAME"
Write-Log "User: $env:USERNAME"
Write-Log "OS: $((Get-CimInstance Win32_OperatingSystem).Caption) $((Get-CimInstance Win32_OperatingSystem).Version)"
Write-Log "Architecture: $env:PROCESSOR_ARCHITECTURE"
Write-Log "CPU: $((Get-CimInstance Win32_Processor | Select-Object -First 1).Name)"
$ram = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 2)
Write-Log ("RAM: {0} GB" -f $ram)
$os = Get-CimInstance Win32_OperatingSystem
$freeMem = [math]::Round($os.FreePhysicalMemory / 1MB, 2)
$totalMem = [math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
Write-Log ("Free Memory: {0} GB / {1} GB" -f $freeMem, $totalMem)
Write-Log ""

Write-Log "--- Disk Health ---" "Yellow"
Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3" | ForEach-Object {
    $free = [math]::Round($_.FreeSpace / 1GB, 2)
    $total = [math]::Round($_.Size / 1GB, 2)
    $pct = [math]::Round(($_.FreeSpace / $_.Size) * 100, 1)
    Write-Log ("Drive {0} {1} GB free / {2} GB total ({3}% free)" -f $_.DeviceID, $free, $total, $pct)
}
Write-Log ""

Write-Log "--- Startup Programs ---" "Yellow"
$startupItems = Get-ItemProperty "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" -ErrorAction SilentlyContinue
if ($startupItems) {
    $startupItems.PSObject.Properties | Where-Object { $_.Name -notmatch "^PS" } | ForEach-Object {
        Write-Log "HKCU Run: $($_.Name)"
    }
}
$startupItems2 = Get-ItemProperty "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" -ErrorAction SilentlyContinue
if ($startupItems2) {
    $startupItems2.PSObject.Properties | Where-Object { $_.Name -notmatch "^PS" } | ForEach-Object {
        Write-Log "HKLM Run: $($_.Name)"
    }
}
Get-CimInstance Win32_StartupCommand | ForEach-Object {
    Write-Log "Startup: $($_.Name) - $($_.Command)"
}
Write-Log ""

Write-Log "--- Running Services ---" "Yellow"
$problematic = @("SysMain", "WSearch", "DiagTrack", "dmwappushservice")
foreach ($svc in $problematic) {
    $s = Get-Service -Name $svc -ErrorAction SilentlyContinue
    if ($s) { Write-Log "$($svc): $($s.Status)" }
}
Write-Log ""

Write-Log "--- Network Adapters ---" "Yellow"
Get-NetAdapter | Where-Object { $_.Status -eq "Up" } | ForEach-Object {
    Write-Log "$($_.Name): $($_.LinkSpeed) ($($_.InterfaceDescription))"
}
$dns = Get-DnsClientServerAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Select-Object -First 5
foreach ($d in $dns) { Write-Log "DNS: $($d.InterfaceAlias) - $($d.ServerAddresses -join ', ')" }
Write-Log ""

Write-Log "--- Windows Update Status ---" "Yellow"
$wuSvc = Get-Service -Name "wuauserv" -ErrorAction SilentlyContinue
if ($wuSvc) { Write-Log "Windows Update Service: $($wuSvc.Status)" }
Write-Log ""

Write-Log "--- Temperature Check ---" "Yellow"
try {
    $temp = Get-CimInstance MSAcpi_ThermalZoneTemperature -Namespace "root/wmi" -ErrorAction Stop
    foreach ($t in $temp) {
        $celsius = [math]::Round(($t.CurrentTemperature - 2732) / 10, 1)
        Write-Log ("Thermal Zone: {0} C" -f $celsius)
    }
} catch {
    Write-Log "Temperature data not available (not all systems support this)"
}
Write-Log ""

Write-Log "--- Error Events (last 24 hours) ---" "Yellow"
$yesterday = (Get-Date).AddDays(-1)
$errors = Get-EventLog -LogName System -EntryType Error -After $yesterday -ErrorAction SilentlyContinue | Select-Object -First 10
if ($errors) {
    foreach ($e in $errors) { Write-Log "Error: $($e.Source) - $($e.Message.Substring(0, [math]::Min(100, $e.Message.Length)))" }
} else {
    Write-Log "No critical errors in the last 24 hours"
}
Write-Log ""

Write-Log "--- GPU Info ---" "Yellow"
$gpu = Get-CimInstance Win32_VideoController | Select-Object -First 1
if ($gpu) {
    Write-Log "GPU: $($gpu.Name)"
    Write-Log "Driver: $($gpu.DriverVersion)"
    $gpuMem = [math]::Round($gpu.AdapterRAM / 1MB, 0)
    Write-Log ("VRAM: {0} MB" -f $gpuMem)
}
Write-Log ""

Write-Log "=== Diagnostic Complete ===" "Cyan"
Write-Log "The full report has been copied to your clipboard."
Write-Log "Go back to fixelo.com and paste it in the diagnosis page."

$logPath = "$env:USERPROFILE/Desktop/Fixelo_Log.txt"
[IO.File]::WriteAllText($logPath, $script:log, [Text.Encoding]::UTF8)
try { Set-Clipboard -Value $script:log } catch {}
Write-Log "Report saved to your Desktop as Fixelo_Log.txt" "Green"
Read-Host "Press Enter to close"
`