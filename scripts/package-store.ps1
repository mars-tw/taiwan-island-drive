param([string]$OutputPath='')
$ErrorActionPreference='Stop'
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if([string]::IsNullOrWhiteSpace($OutputPath)){$OutputPath=Join-Path $taskRoot 'release/island-transport-store-1.0.0.zip'}
$taskZipPath=[IO.Path]::GetFullPath($OutputPath)
$taskFiles=@('release/native/island-transport-test.apk','release/native/island-transport-upload-signed.aab','release/island-drive-source.zip')
foreach($taskFile in $taskFiles){if(-not(Test-Path -LiteralPath (Join-Path $taskRoot $taskFile))){throw "Missing package artifact: $taskFile"}}
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
New-Item -ItemType Directory -Path (Split-Path -Parent $taskZipPath) -Force | Out-Null
if(Test-Path -LiteralPath $taskZipPath){Remove-Item -LiteralPath $taskZipPath -Force}
$taskBoundary=$taskRoot.TrimEnd([IO.Path]::DirectorySeparatorChar)+[IO.Path]::DirectorySeparatorChar
$taskZip=[IO.Compression.ZipFile]::Open($taskZipPath,[IO.Compression.ZipArchiveMode]::Create)
try{
 $taskEntries=@{}
 $taskEntries['release/native/island-transport-test.apk']='android/island-transport-test.apk'
 $taskEntries['release/native/island-transport-upload-signed.aab']='android/island-transport-upload-signed.aab'
 $taskEntries['release/island-drive-source.zip']='source/island-drive-source.zip'
 foreach($taskDir in @('store','docs')){
  foreach($taskFile in (Get-ChildItem -LiteralPath (Join-Path $taskRoot $taskDir) -Recurse -File -Force)){
   $taskFull=[IO.Path]::GetFullPath($taskFile.FullName)
   if(-not$taskFull.StartsWith($taskBoundary,[StringComparison]::OrdinalIgnoreCase)){throw 'Store artifact outside project'}
   $taskRelative=$taskFull.Substring($taskBoundary.Length).Replace('\','/')
   if($taskRelative-match'(^|/)(\.capture-audit|\.audit-tmp|__pycache__)(/|$)' -or $taskRelative-match'\.(log|pyc|jks|keystore|p12|mobileprovision)$'){continue}
   if($taskDir-eq'docs'-and$taskFile.Name-notmatch'^(store|native)'){continue}
   $taskEntries[$taskRelative]=$taskRelative
  }
 }
 foreach($taskIosArtifact in @('release/native/IslandTransport-simulator.app.zip','release/native/IslandTransport-unsigned.xcarchive.zip')){if(Test-Path -LiteralPath (Join-Path $taskRoot $taskIosArtifact)){$taskEntries[$taskIosArtifact]='ios/'+[IO.Path]::GetFileName($taskIosArtifact)}}
 foreach($taskEntry in $taskEntries.GetEnumerator()){
  [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($taskZip,(Join-Path $taskRoot $taskEntry.Key),$taskEntry.Value,[IO.Compression.CompressionLevel]::Optimal)|Out-Null
 }
 $taskNote=$taskZip.CreateEntry('READ-ME-FIRST.txt');$taskWriter=[IO.StreamWriter]::new($taskNote.Open(),[Text.UTF8Encoding]::new($false));try{$taskWriter.WriteLine('Island Transport Academy: prepared application and submission package.');$taskWriter.WriteLine('Android test APK is installable. Upload-signed AAB still requires a Google Play account and App Signing setup.');$taskWriter.WriteLine('iOS device archive and simulator application are unsigned; no IPA or App Store submission is claimed.');$taskWriter.WriteLine('Both developer accounts are not enrolled. Seller identity and platform forms remain owner tasks.');$taskWriter.WriteLine('Store screenshots are actual gameplay browser captures with explicit simulated metadata, not native-device captures.');$taskWriter.WriteLine('Private keys and passwords are excluded. They remain only in the owner credential store.')}finally{$taskWriter.Dispose()}
}finally{$taskZip.Dispose()}
Get-Item -LiteralPath $taskZipPath | Select-Object FullName,Length
