@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0powershell\02-backup-supabase.ps1" %*
exit /b %ERRORLEVEL%
