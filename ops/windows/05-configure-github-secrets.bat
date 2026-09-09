@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0powershell\05-configure-github-secrets.ps1" %*
exit /b %ERRORLEVEL%
