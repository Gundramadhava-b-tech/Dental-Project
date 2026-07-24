# ============================================================
#  run-load-test.ps1  –  OSA Diagnostic Baseline Load Test
# ============================================================
#
#  Usage:
#    .\load-tests\run-load-test.ps1
#    .\load-tests\run-load-test.ps1 -BaseUrl "https://your-api.com/api"
#
#  Prerequisites:
#    1. k6  installed  → https://k6.io/docs/get-started/installation/
#       Quick install (Chocolatey):  choco install k6
#       Quick install (winget):      winget install k6
#    2. Node.js  installed           → https://nodejs.org
#
# ============================================================

param(
    [string]$BaseUrl      = "http://localhost:5000/api",
    [string]$PhysicianId  = "test-physician-load"
)

$ErrorActionPreference = "Stop"
$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$ResultsFile = Join-Path $ScriptDir "results.json"
$ExcelFile   = Join-Path $ScriptDir "load-test-report.xlsx"

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  OSA Diagnostic  –  Baseline Load Test Runner" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Base URL      : $BaseUrl"    -ForegroundColor Yellow
Write-Host "  Physician ID  : $PhysicianId" -ForegroundColor Yellow
Write-Host "  VUs           : 100"          -ForegroundColor Yellow
Write-Host "  Duration      : 1 minute"     -ForegroundColor Yellow
Write-Host ""

# ── Check k6 is installed ──────────────────────────────────────────────────────
if (-not (Get-Command k6 -ErrorAction SilentlyContinue)) {
    Write-Host "❌  k6 not found." -ForegroundColor Red
    Write-Host ""
    Write-Host "    Install it with one of:"
    Write-Host "      choco install k6"
    Write-Host "      winget install k6"
    Write-Host "      Or download from: https://k6.io/docs/get-started/installation/"
    exit 1
}

# ── Check Node.js is installed ────────────────────────────────────────────────
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌  Node.js not found. Install from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# ── Install exceljs if not already present ────────────────────────────────────
$nodeModules = Join-Path $ScriptDir "node_modules"
if (-not (Test-Path $nodeModules)) {
    Write-Host "📦  Installing dependencies (exceljs)..." -ForegroundColor Cyan
    Push-Location $ScriptDir
    npm install
    Pop-Location
    Write-Host ""
}

# ── Run k6 load test ──────────────────────────────────────────────────────────
Write-Host "🚀  Starting load test..." -ForegroundColor Green
Write-Host ""

$k6Args = @(
    "run",
    "--out", "json=$ResultsFile",
    "--env", "BASE_URL=$BaseUrl",
    "--env", "PHYSICIAN_ID=$PhysicianId",
    (Join-Path $ScriptDir "baseline.js")
)

k6 @k6Args

if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne 99) {
    Write-Host ""
    Write-Host "⚠️  k6 exited with code $LASTEXITCODE (thresholds may have failed)." -ForegroundColor Yellow
}

# ── Check results file was created ────────────────────────────────────────────
if (-not (Test-Path $ResultsFile)) {
    Write-Host ""
    Write-Host "❌  results.json was not created. Check if k6 ran successfully." -ForegroundColor Red
    exit 1
}

# ── Generate Excel report ─────────────────────────────────────────────────────
Write-Host ""
Write-Host "📊  Generating Excel report..." -ForegroundColor Cyan
Write-Host ""

Push-Location $ScriptDir
node generate-excel.js $ResultsFile $ExcelFile
Pop-Location

Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host "  Done!  Excel report: $ExcelFile" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host ""

# ── Optionally open the Excel file ────────────────────────────────────────────
$open = Read-Host "  Open Excel report now? (Y/N)"
if ($open -match "^[Yy]") {
    Start-Process $ExcelFile
}
