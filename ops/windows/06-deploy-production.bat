@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0powershell\06-deploy-production.ps1" %*
exit /b %ERRORLEVEL%
