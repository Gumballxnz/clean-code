# Install script for Clean Code Skill (Windows PowerShell)
$ErrorActionPreference = "Stop"

$repoOwner = "Gumballxnz"
$repoName = "clean-code"
$targetDir = Join-Path $env:USERPROFILE ".gemini\config\skills\clean-code"

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "   Instalador Oficial: Clean Code Skill (Antigravity)   " -ForegroundColor Yellow
Write-Host "========================================================`n" -ForegroundColor Cyan

$sourceDir = $PSScriptRoot
$isRemote = $false

if (-not $sourceDir -or -not (Test-Path (Join-Path $sourceDir "SKILL.md"))) {
    $isRemote = $true
    $tempDir = Join-Path $env:TEMP "clean-code-install-$(Get-Random)"
    Write-Host "Baixando versao mais recente do repositorio $repoOwner/$repoName..." -ForegroundColor Gray
    
    $zipUrl = "https://github.com/$repoOwner/$repoName/archive/refs/heads/main.zip"
    $zipFile = Join-Path $env:TEMP "clean-code-main.zip"
    
    Invoke-WebRequest -Uri $zipUrl -OutFile $zipFile
    Expand-Archive -Path $zipFile -DestinationPath $tempDir -Force
    $sourceDir = Join-Path $tempDir "clean-code-main"
}

Write-Host "Instalando skill globalmente em:" -ForegroundColor Gray
Write-Host " -> $targetDir" -ForegroundColor White

if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

$filesToCopy = @("SKILL.md", "package.json", "LICENSE")
foreach ($file in $filesToCopy) {
    $src = Join-Path $sourceDir $file
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination (Join-Path $targetDir $file) -Force
    }
}

$dirsToCopy = @("scripts", "templates")
foreach ($dir in $dirsToCopy) {
    $srcDir = Join-Path $sourceDir $dir
    if (Test-Path $srcDir) {
        $destDir = Join-Path $targetDir $dir
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        Copy-Item -Path "$srcDir\*" -Destination $destDir -Recurse -Force
    }
}

Write-Host "`nInstalando dependencias necessarias (TypeScript)..." -ForegroundColor Gray
Push-Location $targetDir
try {
    npm install --omit=dev --silent
} catch {
    Write-Warning "Nao foi possivel rodar 'npm install'. Certifique-se de que o Node.js esta instalado."
} finally {
    Pop-Location
}

if ($isRemote -and (Test-Path $tempDir)) {
    Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path $zipFile -Force -ErrorAction SilentlyContinue
}

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host " [OK] Clean Code Skill instalada com sucesso!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host "Como usar:" -ForegroundColor Yellow
Write-Host " 1. No chat do Antigravity, basta digitar:" -ForegroundColor White
Write-Host "    /clean-code" -ForegroundColor Cyan
Write-Host " 2. Ou rodar diretamente via terminal:" -ForegroundColor White
Write-Host "    node `"$targetDir\scripts\clean_code.js`" `"<pasta_do_projeto>`"" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Green
