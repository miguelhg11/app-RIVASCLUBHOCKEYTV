@echo off
setlocal
cd /d "%~dp0"

echo QA E2E authorization session
echo Credentials are requested securely and are not written to disk.
echo.

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0authorize-qa-e2e.ps1"
set "exitCode=%ERRORLEVEL%"

if not "%exitCode%"=="0" (
  echo.
  echo Authorization session failed with exit code %exitCode%.
  pause
)

endlocal & exit /b %exitCode%
