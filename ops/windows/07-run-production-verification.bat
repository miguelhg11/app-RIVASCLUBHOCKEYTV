@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0powershell\07-run-production-verification.ps1" %*
exit /b %ERRORLEVEL%
