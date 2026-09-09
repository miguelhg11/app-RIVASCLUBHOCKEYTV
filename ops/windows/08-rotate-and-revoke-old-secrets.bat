@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0powershell\08-rotate-and-revoke-old-secrets.ps1" %*
exit /b %ERRORLEVEL%
