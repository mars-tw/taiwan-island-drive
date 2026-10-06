param(
 [string]$BaseUrl = 'http://localhost:5178/flight/',
 [string]$Session = 'flight-layout'
)
$ErrorActionPreference = 'Stop'
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) { throw 'Node.js and npx are required.' }
$taskProjectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$taskProofFolder = Join-Path $taskProjectRoot 'output/playwright'
New-Item -ItemType Directory -Path $taskProofFolder -Force | Out-Null
Push-Location $taskProjectRoot
try {
 & npx --yes --package @playwright/cli playwright-cli "-s=$Session" open $BaseUrl
 if ($LASTEXITCODE -ne 0) { throw 'Could not open the browser.' }
 $taskCode = [IO.File]::ReadAllText((Join-Path $PSScriptRoot 'flight-layout-check.js')).Replace('http://localhost:5190/flight/', $BaseUrl) -replace '\r?\n', ' '
 $taskOutput = & npx --yes --package @playwright/cli playwright-cli "-s=$Session" run-code $taskCode
 $taskOutput | Set-Content -LiteralPath (Join-Path $taskProofFolder 'flight-layout-report.txt') -Encoding utf8
 $taskJson = $taskOutput | Where-Object { $_ -match '^\{"status"' } | Select-Object -First 1
 if (-not $taskJson) { throw ($taskOutput -join [Environment]::NewLine) }
 $taskReport = $taskJson | ConvertFrom-Json
 if ($taskReport.status -ne 'PASS' -or $taskReport.cases -ne 28) { throw 'Layout verification did not pass all 28 cases.' }
 $taskJson | Set-Content -LiteralPath (Join-Path $taskProofFolder 'flight-layout-report.json') -Encoding utf8
 [pscustomobject]@{ Result=$taskReport.status; Sizes=$taskReport.sizes; Cases=$taskReport.cases; Report='output/playwright/flight-layout-report.json' }
} finally { Pop-Location }
