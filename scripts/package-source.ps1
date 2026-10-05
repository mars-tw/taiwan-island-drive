param(
  [string]$OutputPath = ''
)

$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if ([string]::IsNullOrWhiteSpace($OutputPath)) {
  $OutputPath = Join-Path $projectRoot 'release/island-drive-source.zip'
}
$archivePath = [IO.Path]::GetFullPath($OutputPath)
if ([IO.Path]::GetExtension($archivePath) -ne '.zip') { throw 'Output must be a .zip file.' }
$allowed = @(
  'README.md', 'LICENSE', 'CONTRIBUTING.md', '.gitignore', '.gitattributes', '.github',
  'package.json', 'package-lock.json', 'index.html', 'vite.config.js',
  'src', 'public', 'blender', 'docs', 'tests', 'scripts', 'dist'
)
# Discover the localized launcher name without requiring a BOM for PowerShell 5.
$allowed += @(Get-ChildItem -LiteralPath $projectRoot -Filter '*.cmd' -File | Select-Object -ExpandProperty Name)
$required = @('README.md', 'LICENSE', 'package.json', 'package-lock.json', 'src', 'public', 'public/THIRD_PARTY_NOTICES.txt', 'blender', 'dist/index.html', 'dist/precache.json', 'dist/THIRD_PARTY_NOTICES.txt')
foreach ($name in $required) {
  if (-not (Test-Path -LiteralPath (Join-Path $projectRoot $name))) {
    throw "Required delivery file is missing: $name. Build assets and run npm run build first."
  }
}
if (-not (Get-ChildItem -LiteralPath (Join-Path $projectRoot 'blender') -Filter '*.blend' -File -Recurse)) {
  throw 'A real Blender .blend source file is required.'
}
if (-not (Get-ChildItem -LiteralPath (Join-Path $projectRoot 'public') -Filter '*.glb' -File -Recurse)) {
  throw 'Blender-exported GLB files are required.'
}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archiveFolder = Split-Path -Parent $archivePath
New-Item -ItemType Directory -Path $archiveFolder -Force | Out-Null
if (Test-Path -LiteralPath $archivePath) {
  Remove-Item -LiteralPath $archivePath -Force
}
$boundary = $projectRoot.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
$zip = [IO.Compression.ZipFile]::Open($archivePath, [IO.Compression.ZipArchiveMode]::Create)
try {
  foreach ($name in $allowed) {
    $target = Join-Path $projectRoot $name
    if (-not (Test-Path -LiteralPath $target)) { continue }
    $item = Get-Item -LiteralPath $target
    if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { continue }
    $files = if ($item.PSIsContainer) { Get-ChildItem -LiteralPath $target -File -Recurse } else { @($item) }
    foreach ($file in $files) {
      $fullPath = [IO.Path]::GetFullPath($file.FullName)
      if (-not $fullPath.StartsWith($boundary, [StringComparison]::OrdinalIgnoreCase)) {
        throw "File is outside the project root: $fullPath"
      }
      if ($file.Attributes -band [IO.FileAttributes]::ReparsePoint) { continue }
      $entry = $fullPath.Substring($boundary.Length).Replace('\', '/')
      if ($entry -match '(^|/)(node_modules|\.audit-tmp|downloads|release|\.git)(/|$)') { continue }
      if ($entry -match '\.(zip|blend[0-9]+|log)$' -or $file.Name -like '.env*') { continue }
      if ($fullPath -eq $archivePath) { continue }
      [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $fullPath, $entry, [IO.Compression.CompressionLevel]::Optimal) | Out-Null
    }
  }
} finally {
  $zip.Dispose()
}
Get-Item -LiteralPath $archivePath | Select-Object FullName, Length
