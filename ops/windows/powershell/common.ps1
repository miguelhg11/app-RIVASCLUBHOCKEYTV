param(
  [Parameter(Mandatory = $true)][ValidateSet("check", "login", "backup", "migrate", "vercel-env", "github-secrets", "deploy", "verify", "rotate", "rollback", "maintenance")][string]$Operation,
  [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Project = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
Set-Location -LiteralPath $Project

function Require-Command([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) { throw "Falta el ejecutable requerido: $Name" }
}
function Has-Command([string]$Name) {
  return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}
function Invoke-Supabase([string[]]$Arguments) {
  Require-Command "npx"
  & npx supabase @Arguments
  if ($LASTEXITCODE -ne 0) { throw "Supabase CLI terminó con código $LASTEXITCODE" }
}
function Invoke-Vercel([string[]]$Arguments) {
  Require-Command "vercel"
  & vercel @Arguments
  if ($LASTEXITCODE -ne 0) { throw "Vercel CLI terminó con código $LASTEXITCODE" }
}
function Confirm-Action([string]$Message) {
  if ($DryRun) { Write-Host "DRY RUN: $Message"; return }
  $answer = Read-Host "$Message Escribe CONFIRMAR para continuar"
  if ($answer -cne "CONFIRMAR") { throw "Operación cancelada." }
}
function Read-SecretText([string]$Prompt) {
  $secure = Read-Host $Prompt -AsSecureString
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
  finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    $secure.Dispose()
  }
}

try {
  switch ($Operation) {
    "check" {
      Require-Command "node"; Require-Command "npm"; Require-Command "git"; Require-Command "npx"
      npm run check:env; if ($LASTEXITCODE -ne 0) { throw "check:env falló" }
      npm run check:supabase-schema; if ($LASTEXITCODE -ne 0) { throw "check:supabase-schema falló" }
      npm run typecheck; if ($LASTEXITCODE -ne 0) { throw "typecheck falló" }
      npm run lint; if ($LASTEXITCODE -ne 0) { throw "lint falló" }
    }
    "login" {
      Require-Command "gh"; Require-Command "vercel"; Require-Command "gcloud"
      gh auth login; Invoke-Vercel @("login")
      Invoke-Supabase @("login")
      gcloud auth login
    }
    "backup" {
      Confirm-Action "Se creará un backup lógico de Supabase."
      $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
      $backup = Join-Path $Project "scratch\supabase-backup-$stamp.sql"
      Invoke-Supabase @("db", "dump", "--file", $backup)
      if (-not (Test-Path -LiteralPath $backup) -or (Get-Item -LiteralPath $backup).Length -eq 0) { throw "El backup no se creó correctamente" }
      Write-Host "Backup creado y excluido de Git: $backup"
    }
    "migrate" {
      Invoke-Supabase @("db", "push", "--dry-run", "--include-all")
      Confirm-Action "Se aplicarán únicamente las migraciones pendientes mostradas."
      Invoke-Supabase @("db", "push", "--include-all", "--yes")
      Invoke-Supabase @("db", "push", "--dry-run", "--include-all")
    }
    "vercel-env" {
      Invoke-Vercel @("env", "ls", "production")
      $name = Read-Host "Nombre de variable"
      if ([string]::IsNullOrWhiteSpace($name) -or $name -notmatch '^[A-Z][A-Z0-9_]+$') { throw "Nombre de variable no válido" }
      $environment = Read-Host "Entorno (production/preview/development) [production]"
      if ([string]::IsNullOrWhiteSpace($environment)) { $environment = "production" }
      if ($environment -notin @("production", "preview", "development")) { throw "Entorno no válido" }
      if ($DryRun) { Write-Host "DRY RUN: se actualizaría $name en $environment"; break }
      $plain = Read-SecretText "Valor secreto"
      try {
        $plain | & vercel env add $name $environment --force --sensitive
        if ($LASTEXITCODE -ne 0) { throw "No se pudo configurar $name" }
      } finally { $plain = $null }
    }
    "github-secrets" {
      Require-Command "gh"
      $name = Read-Host "Nombre del secreto GitHub"
      if ([string]::IsNullOrWhiteSpace($name) -or $name -notmatch '^[A-Z][A-Z0-9_]+$') { throw "Nombre de secreto no válido" }
      if ($DryRun) { Write-Host "DRY RUN: se actualizaría el secreto $name"; break }
      $plain = Read-SecretText "Valor secreto"
      try {
        $plain | & gh secret set $name
        if ($LASTEXITCODE -ne 0) { throw "No se pudo configurar $name" }
      } finally { $plain = $null }
    }
    "deploy" {
      & $PSCommandPath -Operation verify -DryRun:$DryRun
      Confirm-Action "Se desplegará la aplicación en producción."
      Invoke-Vercel @("deploy", "--prod")
    }
    "verify" {
      Require-Command "npm"
      npm run typecheck; if ($LASTEXITCODE -ne 0) { throw "typecheck falló" }
      npm run lint; if ($LASTEXITCODE -ne 0) { throw "lint falló" }
      npm run build; if ($LASTEXITCODE -ne 0) { throw "build falló" }
      npm audit --omit=dev; if ($LASTEXITCODE -ne 0) { throw "npm audit falló" }
    }
    "rotate" {
      Confirm-Action "Se retirará SESSION_SECRET_PREVIOUS y se redesplegará producción. Hazlo solo 48 horas después de la rotación."
      Invoke-Vercel @("env", "rm", "SESSION_SECRET_PREVIOUS", "production", "-y")
      Invoke-Vercel @("deploy", "--prod", "--yes")
    }
    "rollback" { Confirm-Action "Se abrirá el flujo de rollback de Vercel."; Invoke-Vercel @("rollback") }
    "maintenance" { & $PSCommandPath -Operation check -DryRun:$DryRun; & $PSCommandPath -Operation verify -DryRun:$DryRun }
  }
  exit 0
} catch {
  Write-Error $_.Exception.Message
  exit 1
} finally {
  Remove-Variable -Name Project -ErrorAction SilentlyContinue
}
