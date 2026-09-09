@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0powershell\10-full-maintenance.ps1" %*
exit /b %ERRORLEVEL%
