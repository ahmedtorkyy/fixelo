@echo off
set "TARGET=%USERPROFILE%\Downloads\Fix_add-spanish-keyboard-system.bat"
set "LOGFILE=%USERPROFILE%\Desktop\Fixelo_Debug_Log.txt"

:: Self-elevate so the target doesn't spawn a new window
fltmc >nul 2>&1
if %errorLevel% neq 0 (
    powershell -NoProfile -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

:: We are now elevated
if not exist "%TARGET%" (
    echo ERROR: Target file not found at %TARGET% > "%LOGFILE%"
    echo Check filename and update TARGET in this script. >> "%LOGFILE%"
    notepad "%LOGFILE%"
    pause
    exit /b
)

echo Fixelo Deep Debug Log > "%LOGFILE%"
echo Started at %DATE% %TIME% >> "%LOGFILE%"
echo Target: %TARGET% >> "%LOGFILE%"
echo ============================== >> "%LOGFILE%"

echo Running: fltmc admin check >> "%LOGFILE%"
fltmc >> "%LOGFILE%" 2>&1
echo Exit code: %ERRORLEVEL% >> "%LOGFILE%"
echo. >> "%LOGFILE%"

echo Running target via call... >> "%LOGFILE%"
echo. >> "%LOGFILE%"
call "%TARGET%" >> "%LOGFILE%" 2>&1
echo. >> "%LOGFILE%"
echo Target exit code: %ERRORLEVEL% >> "%LOGFILE%"

echo ============================== >> "%LOGFILE%"
echo Debug complete at %DATE% %TIME% >> "%LOGFILE%"

echo Log saved to %LOGFILE%
notepad "%LOGFILE%"
