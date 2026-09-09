@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0powershell\03-apply-supabase-migrations.ps1" %*
exit /b %ERRORLEVEL%
