@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0powershell\00-check-prerequisites.ps1" %*
exit /b %ERRORLEVEL%
