param([string]$OutputPath='')
$ErrorActionPreference='Stop'
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if([string]::IsNullOrWhiteSpace($OutputPath)){$OutputPath=Join-Path $taskRoot 'release/island-transport-store-1.0.0-logo-v2.zip'}
$taskZipPath=[IO.Path]::GetFullPath($OutputPath)
$taskAndroidApk='release/native/logo-v2/island-transport-logo-v2-test.apk'
$taskAndroidAab='release/native/logo-v2/island-transport-logo-v2-upload-signed.aab'
$taskFiles=@($taskAndroidApk,$taskAndroidAab,'release/island-drive-source.zip')
foreach($taskFile in $taskFiles){if(-not(Test-Path -LiteralPath (Join-Path $taskRoot $taskFile))){throw "Missing package artifact: $taskFile"}}
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
New-Item -ItemType Directory -Path (Split-Path -Parent $taskZipPath) -Force | Out-Null
if(Test-Path -LiteralPath $taskZipPath){Remove-Item -LiteralPath $taskZipPath -Force}
$taskBoundary=$taskRoot.TrimEnd([IO.Path]::DirectorySeparatorChar)+[IO.Path]::DirectorySeparatorChar
$taskZip=[IO.Compression.ZipFile]::Open($taskZipPath,[IO.Compression.ZipArchiveMode]::Create)
try{
 $taskEntries=@{}
 $taskEntries[$taskAndroidApk]='android/island-transport-logo-v2-test.apk'
 $taskEntries[$taskAndroidAab]='android/island-transport-logo-v2-upload-signed.aab'
 $taskEntries['release/island-drive-source.zip']='source/island-drive-source.zip'
 $taskReference=Join-Path $taskRoot 'APPLE_RELEASE_CREDENTIALS.md'
 if(Test-Path -LiteralPath $taskReference -PathType Leaf){
  $taskReferenceItem=Get-Item -LiteralPath $taskReference -Force
  if(-not ($taskReferenceItem.Attributes -band [IO.FileAttributes]::ReparsePoint)){$taskEntries['APPLE_RELEASE_CREDENTIALS.md']='APPLE_RELEASE_CREDENTIALS.md'}
 }
 foreach($taskDir in @('store','docs')){
  foreach($taskFile in (Get-ChildItem -LiteralPath (Join-Path $taskRoot $taskDir) -Recurse -File -Force)){
   $taskFull=[IO.Path]::GetFullPath($taskFile.FullName)
   if(-not$taskFull.StartsWith($taskBoundary,[StringComparison]::OrdinalIgnoreCase)){throw 'Store artifact outside project'}
   $taskRelative=$taskFull.Substring($taskBoundary.Length).Replace('\','/')
   if($taskRelative -match '(^|/)(\.capture-audit|\.audit-tmp|__pycache__|\.secrets|private_keys|\.appstoreconnect)(/|$)' -or $taskFile.Name -like '.env*'){continue}
   $taskPublicCertificate=$taskRelative -eq 'store/review/android-upload-cert.pem'
   if($taskRelative -match '\.(log|pyc|jks|keystore|p12|p8|pfx|pem|key|keychain|keychain-db|csr|mobileprovision)$' -and -not $taskPublicCertificate){continue}
   if($taskDir-eq'docs'-and$taskFile.Name-notmatch'^(store|native)'){continue}
   $taskEntries[$taskRelative]=$taskRelative
  }
 }
 foreach($taskIosArtifact in @('release/native/IslandTransport-simulator.app.zip','release/native/IslandTransport-unsigned.xcarchive.zip')){if(Test-Path -LiteralPath (Join-Path $taskRoot $taskIosArtifact)){$taskEntries[$taskIosArtifact]='ios/'+[IO.Path]::GetFileName($taskIosArtifact)}}
 foreach($taskEntry in $taskEntries.GetEnumerator()){
  [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($taskZip,(Join-Path $taskRoot $taskEntry.Key),$taskEntry.Value,[IO.Compression.CompressionLevel]::Optimal)|Out-Null
 }
 $taskNote=$taskZip.CreateEntry('READ-ME-FIRST.txt');$taskWriter=[IO.StreamWriter]::new($taskNote.Open(),[Text.UTF8Encoding]::new($false));try{
  $taskWriter.WriteLine('Island Transport Academy: prepared application and submission package.')
  $taskWriter.WriteLine('Account, binary and native simulator screenshot evidence: see docs/native-build-verification.md in this package.')
  $taskWriter.WriteLine('Apple build evidence is not platform upload, submission or approval; Apple binary upload/submission/approval remain incomplete.')
  $taskWriter.WriteLine('The named unsigned iOS archive/simulator packages are build artifacts, not App Store release delivery.')
  $taskWriter.WriteLine('Native simulator screenshots and browser preparation media must be distinguished by their manifests; neither is physical-device testing.')
  $taskWriter.WriteLine('Google signed logo-v2 AAB is accepted; Taiwan closed Alpha review was requested on 2026-10-07. Consult store/review/google-console-progress.json for checks, review and tester opt-in status. The16-address private whitelist is excluded; it does not prove12 continuous opt-ins for14 days. Android gameplay hardware QA remains pending.')
  $taskWriter.WriteLine('Private keys and passwords are excluded and remain in the owner central private vault. APPLE_RELEASE_CREDENTIALS.md contains non-secret references only.')
 }finally{$taskWriter.Dispose()}
}finally{$taskZip.Dispose()}
Get-Item -LiteralPath $taskZipPath | Select-Object FullName,Length
