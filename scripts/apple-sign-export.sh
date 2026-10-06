#!/usr/bin/env bash
# macOS only. Never enable shell tracing or publish the temporary work directory.
set +x
set -euo pipefail
umask 077

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/output/apple-release"
BUNDLE_ID='tw.mars.islandtransport'
MODE="${1:-build}"
TASK_TMP=''
KEYCHAIN=''
KEYCHAIN_INSTALLED=false
PREVIOUS_KEYCHAINS=()
INSTALLED_PROFILES=()
STAGE='preflight'

fail() { printf 'Apple release failed: %s\n' "$1" >&2; exit 1; }
cleanup() {
  local code=$?
  trap - EXIT INT TERM
  for profile in ${INSTALLED_PROFILES[@]+"${INSTALLED_PROFILES[@]}"}; do rm -f "$profile"; done
  if [ "$KEYCHAIN_INSTALLED" = true ]; then
    security list-keychains -d user -s ${PREVIOUS_KEYCHAINS[@]+"${PREVIOUS_KEYCHAINS[@]}"} >/dev/null 2>&1 || true
    security delete-keychain "$KEYCHAIN" >/dev/null 2>&1 || true
  fi
  if [ -n "$TASK_TMP" ] && [ -d "$TASK_TMP" ]; then rm -rf "$TASK_TMP"; fi
  if [ "$code" -ne 0 ]; then printf 'Stopped at %s; private logs were removed. No upload is claimed.\n' "$STAGE" >&2; fi
  exit "$code"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

case "$MODE" in build|verify-ipa) ;; *) fail 'supported modes: build, verify-ipa' ;; esac
[ "$(uname -s)" = Darwin ] || fail 'requires macOS with Xcode 26.6'
for cmd in python3 security codesign plutil ditto openssl xcodebuild; do command -v "$cmd" >/dev/null || fail "missing tool: $cmd"; done
if [ -d '/Applications/Xcode_26.6.app/Contents/Developer' ]; then export DEVELOPER_DIR='/Applications/Xcode_26.6.app/Contents/Developer'; fi
xcodebuild -version | head -n 1 | grep -qx 'Xcode 26.6' || fail 'select the stable Xcode 26.6 installation'
export APPLE_TEAM_ID="${APPLE_TEAM_ID:-}"
export APPLE_MARKETING_VERSION="${APPLE_MARKETING_VERSION:-1.0.0}"
export APPLE_BUILD_NUMBER="${APPLE_BUILD_NUMBER:-1}"
python3 - <<'PY'
import os,re
for key,pattern in [('APPLE_TEAM_ID',r'[A-Z0-9]{10}'),('APPLE_MARKETING_VERSION',r'[0-9]+\.[0-9]+\.[0-9]+'),('APPLE_BUILD_NUMBER',r'[1-9][0-9]*')]:
    if not re.fullmatch(pattern,os.environ[key]): raise SystemExit('Invalid '+key)
PY
TASK_TMP="$(mktemp -d "${RUNNER_TEMP:-${TMPDIR:-/tmp}}/island-apple.XXXXXXXX")"

# Fail closed for development, ad-hoc, enterprise, wildcard and expired profiles.
check_profile() {
  python3 - "$1" <<'PY'
import datetime,os,plistlib,re,sys
p=plistlib.load(open(sys.argv[1],'rb')); e=p.get('Entitlements',{}); team=os.environ['APPLE_TEAM_ID']
checks={
 'profile UUID':bool(re.fullmatch(r'[0-9A-Fa-f]{8}(?:-[0-9A-Fa-f]{4}){3}-[0-9A-Fa-f]{12}',p.get('UUID',''))),
 'profile team':p.get('TeamIdentifier')==[team] and e.get('com.apple.developer.team-identifier')==team,
 'explicit application identifier':e.get('application-identifier')==team+'.tw.mars.islandtransport',
 'App Store profile':e.get('get-task-allow') is False and e.get('beta-reports-active') is True and 'ProvisionedDevices' not in p and not p.get('ProvisionsAllDevices',False),
 'iOS platform':'iOS' in p.get('Platform',[]),
 'profile expiry':isinstance(p.get('ExpirationDate'),datetime.datetime) and p['ExpirationDate'].replace(tzinfo=datetime.timezone.utc)>datetime.datetime.now(datetime.timezone.utc),
 'profile certificates':bool(p.get('DeveloperCertificates')),
}
for label,ok in checks.items():
    if not ok: raise SystemExit('Rejected '+label)
PY
}

verify_app() {
  local app="$1" check_dir="$2"
  mkdir -p "$check_dir"
  codesign --verify --deep --strict "$app" >"$check_dir/signature.log" 2>&1 || fail 'invalid or unsigned application/framework signature'
  security cms -D -i "$app/embedded.mobileprovision" >"$check_dir/profile.plist" 2>"$check_dir/profile.log" || fail 'missing or invalid embedded App Store profile'
  check_profile "$check_dir/profile.plist"
  codesign -d --entitlements :- "$app" >"$check_dir/entitlements.plist" 2>"$check_dir/entitlements.log"
  codesign -dv --verbose=4 "$app" >"$check_dir/identity.txt" 2>&1
  codesign -d --extract-certificates "$check_dir/cert" "$app" >"$check_dir/cert.log" 2>&1
  openssl x509 -inform DER -in "$check_dir/cert0" -checkend 0 -noout >"$check_dir/expiry.log" 2>&1 || fail 'expired signing certificate'
  openssl x509 -inform DER -in "$check_dir/cert0" -noout -subject -nameopt RFC2253 >"$check_dir/subject.txt"
  python3 - "$app" "$check_dir" <<'PY'
import fnmatch,hashlib,json,os,pathlib,plistlib,re,sys
app=pathlib.Path(sys.argv[1]); d=pathlib.Path(sys.argv[2]); team=os.environ['APPLE_TEAM_ID']
info=plistlib.load(open(app/'Info.plist','rb')); p=plistlib.load(open(d/'profile.plist','rb')); ent=plistlib.load(open(d/'entitlements.plist','rb'))
expected=team+'.tw.mars.islandtransport'; identity=(d/'identity.txt').read_text(); subject=(d/'subject.txt').read_text()
def permitted(value,allowed):
    if isinstance(value,bool): return isinstance(allowed,bool) and value==allowed
    if isinstance(value,str): return isinstance(allowed,str) and fnmatch.fnmatchcase(value,allowed)
    if isinstance(value,list): return isinstance(allowed,list) and all(any(permitted(v,a) for a in allowed) for v in value)
    if isinstance(value,dict): return isinstance(allowed,dict) and all(k in allowed and permitted(v,allowed[k]) for k,v in value.items())
    return value==allowed
checks={
 'bundle ID':info.get('CFBundleIdentifier')=='tw.mars.islandtransport',
 'marketing version':info.get('CFBundleShortVersionString')==os.environ['APPLE_MARKETING_VERSION'],
 'build number':info.get('CFBundleVersion')==os.environ['APPLE_BUILD_NUMBER'],
 'device platform':'iPhoneOS' in info.get('CFBundleSupportedPlatforms',[]),
 'device families':set(info.get('UIDeviceFamily',[]))=={1,2},
 'SDK':bool(re.fullmatch(r'iphoneos(?:2[6-9]|[3-9][0-9])(?:\.[0-9]+)*',info.get('DTSDKName',''))),
 'distribution certificate':bool(re.search(r'(?:^|,|subject=\s*)CN=Apple Distribution:',subject)) and bool(re.search(r'(?:^|,|subject=\s*)OU='+team+r'(?:,|$)',subject)),
 'signing team':('TeamIdentifier='+team) in identity,
 'embedded profile certificate':hashlib.sha1((d/'cert0').read_bytes()).digest() in [hashlib.sha1(c).digest() for c in p['DeveloperCertificates']],
 'application entitlement':ent.get('application-identifier')==expected and ent.get('com.apple.developer.team-identifier')==team,
 'release entitlements':ent.get('get-task-allow') is False and ent.get('beta-reports-active') is True,
 'profile entitlement coverage':all(k in p['Entitlements'] and permitted(v,p['Entitlements'][k]) for k,v in ent.items()),
 'not internal-only':not info.get('TestFlightInternalTestingOnly',False),
}
for label,ok in checks.items():
    if not ok: raise SystemExit('Rejected '+label)
manifest=plistlib.load(open(app/'PrivacyInfo.xcprivacy','rb'))
if manifest.get('NSPrivacyTracking') is not False or not any(v.get('NSPrivacyAccessedAPIType')=='NSPrivacyAccessedAPICategoryUserDefaults' and 'CA92.1' in v.get('NSPrivacyAccessedAPITypeReasons',[]) for v in manifest.get('NSPrivacyAccessedAPITypes',[])): raise SystemExit('Rejected required privacy manifest')
for f in ['index.html','car/index.html','train/index.html','flight/index.html','privacy.html','support.html','models/coupe.glb','models/train.glb','models/aircraft.glb']:
    if not (app/'public'/f).is_file() or not (app/'public'/f).stat().st_size: raise SystemExit('Missing bundled game resource: '+f)
config=json.loads((app/'capacitor.config.json').read_text())
if config.get('appId')!='tw.mars.islandtransport' or config.get('server',{}).get('url'): raise SystemExit('Rejected native bundle configuration')
PY
}

verify_ipa() {
  local ipa="$1"
  [ -f "$ipa" ] || fail 'IPA file missing'
  python3 - "$ipa" <<'PY'
import pathlib,sys,zipfile
with zipfile.ZipFile(sys.argv[1]) as z:
    for n in z.namelist():
        p=pathlib.PurePosixPath(n)
        if p.is_absolute() or '..' in p.parts or '\\' in n: raise SystemExit('Unsafe IPA path')
PY
  ditto -x -k "$ipa" "$TASK_TMP/ipa"
  local apps=("$TASK_TMP/ipa/Payload/"*.app)
  [ "${#apps[@]}" -eq 1 ] && [ -d "${apps[0]}" ] || fail 'IPA must contain exactly one device application'
  verify_app "${apps[0]}" "$TASK_TMP/check-ipa"
}

if [ "$MODE" = verify-ipa ]; then
  STAGE='IPA verification'
  [ "$#" -eq 2 ] || fail 'verify-ipa requires one IPA path'
  verify_ipa "$2"
  printf 'IPA signature, identity, profile, entitlements and bundled resources verified locally.\n'
  exit 0
fi

for name in APPLE_DISTRIBUTION_P12_BASE64 APPLE_DISTRIBUTION_P12_PASSWORD APPLE_APP_STORE_PROFILE_BASE64; do [ -n "${!name:-}" ] || fail "missing secret: $name"; done
[ -f "$ROOT/ios/App/App/public/index.html" ] || fail 'run native:build, package verification and cap sync ios first'
[ ! -e "$OUT/IslandTransport.ipa" ] && [ ! -e "$OUT/verification.json" ] || fail 'output already exists; use a fresh checkout to avoid publishing stale IPA'
mkdir -p "$OUT"
STAGE='secure signing import'
python3 - "$TASK_TMP" <<'PY'
import base64,os,pathlib,sys
d=pathlib.Path(sys.argv[1])
for env,file in [('APPLE_DISTRIBUTION_P12_BASE64','distribution.p12'),('APPLE_APP_STORE_PROFILE_BASE64','distribution.mobileprovision')]:
    try: data=base64.b64decode(''.join(os.environ[env].split()),validate=True)
    except Exception: raise SystemExit('Invalid base64 secret: '+env)
    if not data: raise SystemExit('Empty decoded secret: '+env)
    (d/file).write_bytes(data)
PY
security cms -D -i "$TASK_TMP/distribution.mobileprovision" >"$TASK_TMP/profile.plist" 2>"$TASK_TMP/profile.log"
check_profile "$TASK_TMP/profile.plist"
PROFILE_UUID="$(python3 -c 'import plistlib,sys; print(plistlib.load(open(sys.argv[1],"rb"))["UUID"])' "$TASK_TMP/profile.plist")"
KEYCHAIN="$TASK_TMP/signing.keychain-db"
KEYCHAIN_PASSWORD="$(openssl rand -base64 32)"
security list-keychains -d user >"$TASK_TMP/previous-keychains.txt"
while IFS= read -r entry; do PREVIOUS_KEYCHAINS+=("$entry"); done < <(python3 -c 'import shlex,sys; print("\n".join(shlex.split(open(sys.argv[1]).read())))' "$TASK_TMP/previous-keychains.txt")
security create-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN" >/dev/null 2>&1
KEYCHAIN_INSTALLED=true
security set-keychain-settings -lut 21600 "$KEYCHAIN"
security unlock-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN"
security list-keychains -d user -s "$KEYCHAIN" ${PREVIOUS_KEYCHAINS[@]+"${PREVIOUS_KEYCHAINS[@]}"}
security import "$TASK_TMP/distribution.p12" -k "$KEYCHAIN" -P "$APPLE_DISTRIBUTION_P12_PASSWORD" -T /usr/bin/codesign -T /usr/bin/security >"$TASK_TMP/import.log" 2>&1
security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$KEYCHAIN_PASSWORD" "$KEYCHAIN" >"$TASK_TMP/partition.log" 2>&1
unset APPLE_DISTRIBUTION_P12_BASE64 APPLE_DISTRIBUTION_P12_PASSWORD APPLE_APP_STORE_PROFILE_BASE64 KEYCHAIN_PASSWORD
security find-identity -v -p codesigning "$KEYCHAIN" >"$TASK_TMP/identities.txt"
CERT_SHA="$(python3 - "$TASK_TMP" <<'PY'
import hashlib,pathlib,plistlib,re,sys
d=pathlib.Path(sys.argv[1]); p=plistlib.load(open(d/'profile.plist','rb'))
allowed={hashlib.sha1(c).hexdigest().upper() for c in p['DeveloperCertificates']}
matches=[m[0] for m in re.findall(r'^\s*\d+\)\s+([A-F0-9]{40})\s+"(Apple Distribution:[^"\n]+)"', (d/'identities.txt').read_text(),re.M) if m[0] in allowed]
if len(matches)!=1: raise SystemExit('Need exactly one valid Apple Distribution identity matching the profile')
print(matches[0])
PY
)"
for folder in "$HOME/Library/MobileDevice/Provisioning Profiles" "$HOME/Library/Developer/Xcode/UserData/Provisioning Profiles"; do
  mkdir -p "$folder"
  profile="$folder/$PROFILE_UUID.mobileprovision"
  [ ! -e "$profile" ] || fail 'refusing to overwrite an existing provisioning profile'
  INSTALLED_PROFILES+=("$profile")
  cp "$TASK_TMP/distribution.mobileprovision" "$profile"
done

# Edit only a temporary copy of the App target. Do not force an App profile onto SPM frameworks.
mkdir -p "$TASK_TMP/work/ios"
ditto "$ROOT/ios/App" "$TASK_TMP/work/ios/App"
[ ! -f "$ROOT/ios/debug.xcconfig" ] || cp "$ROOT/ios/debug.xcconfig" "$TASK_TMP/work/ios/debug.xcconfig"
ln -s "$ROOT/node_modules" "$TASK_TMP/work/node_modules"
PROJECT="$TASK_TMP/work/ios/App/App.xcodeproj"
plutil -convert json -o "$TASK_TMP/project.json" "$PROJECT/project.pbxproj"
python3 - "$PROJECT/project.pbxproj" "$TASK_TMP/project.json" "$PROFILE_UUID" "$CERT_SHA" <<'PY'
import json,os,pathlib,re,sys
path=pathlib.Path(sys.argv[1]); data=json.load(open(sys.argv[2])); objects=data['objects']; text=path.read_text()
targets=[v for v in objects.values() if v.get('isa')=='PBXNativeTarget' and v.get('name')=='App' and v.get('productType')=='com.apple.product-type.application']
if len(targets)!=1: raise SystemExit('Expected one App target')
config_ids=objects[targets[0]['buildConfigurationList']]['buildConfigurations']
settings={'CODE_SIGN_STYLE':'Manual','CODE_SIGN_IDENTITY':sys.argv[4],'DEVELOPMENT_TEAM':os.environ['APPLE_TEAM_ID'],'PROVISIONING_PROFILE_SPECIFIER':sys.argv[3],'MARKETING_VERSION':os.environ['APPLE_MARKETING_VERSION'],'CURRENT_PROJECT_VERSION':os.environ['APPLE_BUILD_NUMBER']}
for cid in config_ids:
    if objects[cid]['buildSettings'].get('PRODUCT_BUNDLE_IDENTIFIER')!='tw.mars.islandtransport': raise SystemExit('Unexpected source bundle ID')
    pattern=r'(?m)^\t\t'+re.escape(cid)+r' /\*[^\n]*\*/ = \{.*?^\t\t\};'
    matches=list(re.finditer(pattern,text,re.S))
    if len(matches)!=1: raise SystemExit('Unsupported Xcode project structure')
    block=matches[0].group(0)
    for key,value in settings.items():
        line='\t\t\t\t'+key+' = "'+value+'";'
        key_pattern=r'(?m)^\t\t\t\t'+re.escape(key)+r' = [^\n]*;'
        if re.search(key_pattern,block): block=re.sub(key_pattern,lambda _:line,block)
        else: block=block.replace('buildSettings = {','buildSettings = {\n'+line,1)
    text=text[:matches[0].start()]+block+text[matches[0].end():]
path.write_text(text)
PY
STAGE='signed device archive'
xcodebuild -project "$PROJECT" -scheme App -configuration Release -destination 'generic/platform=iOS' -archivePath "$TASK_TMP/IslandTransport.xcarchive" -derivedDataPath "$TASK_TMP/derived" OTHER_CODE_SIGN_FLAGS="--keychain $KEYCHAIN" archive >"$TASK_TMP/archive.log" 2>&1 || fail 'signed archive command failed'
verify_app "$TASK_TMP/IslandTransport.xcarchive/Products/Applications/App.app" "$TASK_TMP/check-archive"
python3 - "$TASK_TMP/ExportOptions.plist" "$PROFILE_UUID" "$CERT_SHA" <<'PY'
import os,plistlib,sys
options={'method':'app-store-connect','destination':'export','signingStyle':'manual','teamID':os.environ['APPLE_TEAM_ID'],'signingCertificate':sys.argv[3],'provisioningProfiles':{'tw.mars.islandtransport':sys.argv[2]},'manageAppVersionAndBuildNumber':False,'testFlightInternalTestingOnly':False,'uploadSymbols':True,'stripSwiftSymbols':True}
plistlib.dump(options,open(sys.argv[1],'wb'))
PY
STAGE='App Store export'
xcodebuild -exportArchive -archivePath "$TASK_TMP/IslandTransport.xcarchive" -exportPath "$TASK_TMP/export" -exportOptionsPlist "$TASK_TMP/ExportOptions.plist" >"$TASK_TMP/export.log" 2>&1 || fail 'App Store IPA export failed'
ipas=("$TASK_TMP/export/"*.ipa)
[ "${#ipas[@]}" -eq 1 ] && [ -f "${ipas[0]}" ] || fail 'expected one exported IPA'
STAGE='exported IPA verification'
verify_ipa "${ipas[0]}"
# Only a signed/verified IPA and this non-secret report leave the temporary directory.
cp "${ipas[0]}" "$OUT/IslandTransport.ipa"
python3 - "$OUT" "$TASK_TMP/ExportOptions.plist" <<'PY'
import datetime,hashlib,json,os,pathlib,plistlib,sys
d=pathlib.Path(sys.argv[1]); options=plistlib.load(open(sys.argv[2],'rb'))
if options['method']!='app-store-connect' or options['destination']!='export' or options['testFlightInternalTestingOnly'] is not False: raise SystemExit('Rejected export policy')
report={'schemaVersion':1,'generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'bundleId':'tw.mars.islandtransport','teamId':os.environ['APPLE_TEAM_ID'],'marketingVersion':os.environ['APPLE_MARKETING_VERSION'],'buildNumber':os.environ['APPLE_BUILD_NUMBER'],'xcode':'26.6','signed':True,'signatureVerified':True,'profileVerified':True,'entitlementsVerified':True,'bundledResourcesVerified':True,'exportMethod':'app-store-connect','internalOnly':False,'sha256':hashlib.sha256((d/'IslandTransport.ipa').read_bytes()).hexdigest(),'appleValidated':False,'uploaded':False,'appStoreApproved':False}
(d/'verification.json').write_text(json.dumps(report,indent=2)+'\n')
PY
printf 'Signed IPA exported and verified locally. No Apple validation or upload was performed.\n'
