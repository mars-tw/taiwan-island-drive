param([string]$ToolRoot = (Join-Path $env:USERPROFILE '.codex/tools/island-transport-native'))
$ErrorActionPreference='Stop'
$ProgressPreference='SilentlyContinue'
$taskRoot=[IO.Path]::GetFullPath($ToolRoot)
New-Item -ItemType Directory -Path $taskRoot -Force | Out-Null
$taskJdk=Join-Path $taskRoot 'jdk'
if(-not(Test-Path -LiteralPath (Join-Path $taskJdk 'bin/java.exe'))){
 $taskRelease=@(Invoke-RestMethod -Uri 'https://api.adoptium.net/v3/assets/latest/21/hotspot?architecture=x64&image_type=jdk&os=windows&vendor=eclipse')[0]
 $taskPackage=$taskRelease.binary.package
 $taskZip=Join-Path $taskRoot 'jdk21.zip'
 Invoke-WebRequest -Uri $taskPackage.link -OutFile $taskZip -UseBasicParsing
 if((Get-FileHash -LiteralPath $taskZip -Algorithm SHA256).Hash.ToLowerInvariant()-ne$taskPackage.checksum){throw 'JDK checksum mismatch'}
 $taskExtract=Join-Path $taskRoot 'jdk-extracted'
 Expand-Archive -LiteralPath $taskZip -DestinationPath $taskExtract -Force
 $taskFolder=Get-ChildItem -LiteralPath $taskExtract | Where-Object PSIsContainer | Select-Object -First 1
 if(-not$taskFolder){throw 'JDK directory missing'}
 New-Item -ItemType Directory -Path $taskJdk -Force | Out-Null
 Get-ChildItem -LiteralPath $taskFolder.FullName | Copy-Item -Destination $taskJdk -Recurse -Force
}
$env:JAVA_HOME=$taskJdk
$env:PATH=(Join-Path $taskJdk 'bin')+';'+$env:PATH
$taskSdk=Join-Path $taskRoot 'android-sdk'
$taskManager=Join-Path $taskSdk 'cmdline-tools/latest/bin/sdkmanager.bat'
if(-not(Test-Path -LiteralPath $taskManager)){
 [xml]$taskRepo=(Invoke-WebRequest -Uri 'https://dl.google.com/android/repository/repository2-1.xml' -UseBasicParsing).Content
 $taskCmd=$taskRepo.SelectNodes("//*[local-name()='remotePackage']") | Where-Object {$_.path-eq'cmdline-tools;latest'} | Select-Object -First 1
 $taskArchive=$taskCmd.SelectNodes(".//*[local-name()='archive']") | Where-Object {($_.SelectSingleNode("./*[local-name()='host-os']")).InnerText-eq'windows'} | Select-Object -First 1
 $taskComplete=$taskArchive.SelectSingleNode("./*[local-name()='complete']")
 $taskDownload=$taskComplete.SelectSingleNode("./*[local-name()='url']").InnerText
 $taskChecksum=$taskComplete.SelectSingleNode("./*[local-name()='checksum']")
 $taskCmdZip=Join-Path $taskRoot 'android-command-tools.zip'
 Invoke-WebRequest -Uri ('https://dl.google.com/android/repository/'+$taskDownload) -OutFile $taskCmdZip -UseBasicParsing
 $taskAlgorithm=if($taskChecksum.InnerText.Trim().Length-eq40){'SHA1'}else{'SHA256'}
 if((Get-FileHash -LiteralPath $taskCmdZip -Algorithm $taskAlgorithm).Hash.ToLowerInvariant()-ne$taskChecksum.InnerText.Trim().ToLowerInvariant()){throw 'Android tools checksum mismatch'}
 $taskCmdExtract=Join-Path $taskRoot 'android-command-tools'
 Expand-Archive -LiteralPath $taskCmdZip -DestinationPath $taskCmdExtract -Force
 $taskLatest=Join-Path $taskSdk 'cmdline-tools/latest'
 New-Item -ItemType Directory -Path $taskLatest -Force | Out-Null
 Get-ChildItem -LiteralPath (Join-Path $taskCmdExtract 'cmdline-tools') | Copy-Item -Destination $taskLatest -Recurse -Force
}
$env:ANDROID_HOME=$taskSdk
$env:ANDROID_SDK_ROOT=$taskSdk
[pscustomobject]@{JavaHome=$taskJdk;AndroidSdk=$taskSdk;SdkManager=$taskManager;NextStep='Review SDK licenses, then install platform-tools, platforms;android-36 and build-tools;36.0.0'}
