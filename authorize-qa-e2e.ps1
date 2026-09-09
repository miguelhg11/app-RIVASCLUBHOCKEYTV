$ErrorActionPreference = 'Stop'

function ConvertFrom-SecureInput {
    param([Security.SecureString]$Value)

    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Value)
    try {
        [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    }
}

try {
    $baseUrl = Read-Host 'QA base URL (default: https://rivasyoutubelivehandoff.vercel.app)'
    if ([string]::IsNullOrWhiteSpace($baseUrl)) {
        $baseUrl = 'https://rivasyoutubelivehandoff.vercel.app'
    }

    $adminEmail = Read-Host 'QA admin email'
    $adminPassword = Read-Host 'QA admin password' -AsSecureString
    $limitedEmail = Read-Host 'QA limited-user email'
    $limitedPassword = Read-Host 'QA limited-user password' -AsSecureString

    $env:QA_BASE_URL = $baseUrl
    $env:QA_ADMIN_EMAIL = $adminEmail
    $env:QA_ADMIN_PASSWORD = ConvertFrom-SecureInput $adminPassword
    $env:QA_LIMITED_EMAIL = $limitedEmail
    $env:QA_LIMITED_PASSWORD = ConvertFrom-SecureInput $limitedPassword

    Write-Host ''
    Write-Host 'QA environment authorized for this child console.' -ForegroundColor Green
    Write-Host 'Run QA commands in the new console. Close it when finished.'
    Start-Process -FilePath 'cmd.exe' -ArgumentList '/d', '/k' -WorkingDirectory (Get-Location).Path -Wait
} catch {
    Write-Error $_.Exception.Message
    exit 1
} finally {
    $env:QA_ADMIN_PASSWORD = $null
    $env:QA_LIMITED_PASSWORD = $null
    if ($adminPassword) { $adminPassword.Dispose() }
    if ($limitedPassword) { $limitedPassword.Dispose() }
}
