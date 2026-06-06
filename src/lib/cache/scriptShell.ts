// Builds a self-contained .bat that auto-elevates (UAC), runs the embedded
// PowerShell, logs every step, and saves the log to Desktop + clipboard.

// Logging preamble injected at the top of every script.
// (Kept under the old name so existing callers don't need changing.)
export function psRequireAdmin(): string {
  return `$script:log = ""
function Write-Log([string]$msg, [string]$color = "White") {
    Write-Host $msg -ForegroundColor $color
    $script:log += "[$(Get-Date -Format 'HH:mm:ss')] $msg" + [Environment]::NewLine
}`
}

const PS_FOOTER = `$logPath = "$env:USERPROFILE\\Desktop\\Fixelo_Log.txt"
[IO.File]::WriteAllText($logPath, $script:log, [Text.Encoding]::UTF8)
try { Set-Clipboard -Value $script:log } catch {}
Write-Log "Log saved to your Desktop as Fixelo_Log.txt" "Green"
Read-Host "Press Enter to close"`

export function wrapPsInBat(title: string, psBody: string): string {
  // Append the log-saving footer so every script always writes its log.
  const fullPs = `${psBody}

${PS_FOOTER}`

  return `@echo off
title Fixelo - ${title}
fltmc >nul 2>&1
if %errorLevel% neq 0 (
powershell -NoProfile -Command "Start-Process '%~sf0' -Verb RunAs"
exit
)
set "PSFILE=%TEMP%\\Fixelo_%RANDOM%.ps1"
powershell -NoProfile -Command "$raw=[IO.File]::ReadAllText('%~f0');$idx=$raw.LastIndexOf('__PSSCRIPT__');$ps=$raw.Substring($idx+12).TrimStart([char]13,[char]10);[IO.File]::WriteAllText('%PSFILE%',$ps,[Text.Encoding]::UTF8)"
powershell -NoProfile -ExecutionPolicy Bypass -File "%PSFILE%"
del /f /q "%PSFILE%" 2>nul
exit /b
__PSSCRIPT__
${fullPs}`
}
