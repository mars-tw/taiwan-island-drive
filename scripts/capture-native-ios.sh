#!/usr/bin/env bash
set +x
set -euo pipefail
umask 077
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/output/native-ios-screenshots"
VERIFY_PYTHON="${NATIVE_SCREENSHOT_PYTHON:-python3}"
TASK_TMP=''
CREATED_DEVICES=()
cleanup() {
  local code=$?
  trap - EXIT INT TERM
  for device in ${CREATED_DEVICES[@]+"${CREATED_DEVICES[@]}"}; do
    xcrun simctl shutdown "$device" >/dev/null 2>&1 || true
    xcrun simctl delete "$device" >/dev/null 2>&1 || true
  done
  [ -z "$TASK_TMP" ] || rm -rf "$TASK_TMP"
  exit "$code"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
[ "$(uname -s)" = Darwin ] || { printf 'Native screenshot capture requires macOS.\n' >&2; exit 1; }
[ ! -e "$OUT" ] || { printf 'Use a fresh checkout; refusing stale screenshot output.\n' >&2; exit 1; }
[ -n "${DEVELOPER_DIR:-}" ] && [ -n "${APPLE_XCODE_BUILD:-}" ] || { printf 'Run stable select-xcode preflight first.\n' >&2; exit 1; }
[ -f "$ROOT/ios/App/App/public/index.html" ] || { printf 'Native bundle and cap sync ios are required.\n' >&2; exit 1; }
TASK_TMP="$(mktemp -d "${RUNNER_TEMP:-${TMPDIR:-/tmp}}/island-native-ui.XXXXXXXX")"
mkdir -p "$OUT" "$TASK_TMP/work/ios"
PROJECT_HASH="$(shasum -a 256 "$ROOT/ios/App/App.xcodeproj/project.pbxproj" | cut -d ' ' -f 1)"
ditto "$ROOT/ios/App" "$TASK_TMP/work/ios/App"
[ ! -f "$ROOT/ios/debug.xcconfig" ] || cp "$ROOT/ios/debug.xcconfig" "$TASK_TMP/work/ios/debug.xcconfig"
ln -s "$ROOT/node_modules" "$TASK_TMP/work/node_modules"
ruby "$ROOT/scripts/prepare-native-ui-tests.rb" "$TASK_TMP/work" "$ROOT"
PROJECT="$TASK_TMP/work/ios/App/App.xcodeproj"
xcrun simctl list runtimes --json >"$OUT/runtimes.json"
xcrun simctl list devicetypes --json >"$OUT/device-types.json"
python3 - "$OUT" <<'PY'
import json,pathlib,sys
d=pathlib.Path(sys.argv[1]); runtimes=json.loads((d/'runtimes.json').read_text())['runtimes']; types=json.loads((d/'device-types.json').read_text())['devicetypes']
available=[r for r in runtimes if r.get('isAvailable') and r.get('identifier','').startswith('com.apple.CoreSimulator.SimRuntime.iOS-') and int(r['version'].split('.')[0])>=26]
if not available: raise SystemExit('No available iOS 26+ simulator runtime; no screenshot success is claimed')
runtime=max(available,key=lambda r:tuple(int(x) for x in r['version'].split('.')))
choices=[('iphone',['iPhone 16 Pro','iPhone 17 Pro','iPhone 16 Pro Max','iPhone 17 Pro Max']),('ipad',['iPad Pro 13-inch (M4)','iPad Pro 13-inch (M5)'])]
devices=[]
for family,names in choices:
    match=next((t for n in names for t in types if t['name']==n),None)
    if not match: raise SystemExit('Required '+family+' simulator type not installed')
    devices.append({'family':family,'deviceType':match['identifier'],'name':match['name'],'runtimeId':runtime['identifier'],'runtimeVersion':runtime['version']})
(d/'device-plan.json').write_text(json.dumps(devices,indent=2)+'\n')
PY
while IFS='|' read -r FAMILY DEVICE_TYPE RUNTIME_ID DEVICE_NAME; do
  mkdir -p "$OUT/$FAMILY"
  UDID="$(xcrun simctl create "Island Native Proof $FAMILY" "$DEVICE_TYPE" "$RUNTIME_ID")"
  CREATED_DEVICES+=("$UDID")
  xcrun simctl boot "$UDID"
  xcrun simctl bootstatus "$UDID" -b
  xcrun simctl status_bar "$UDID" override --time '9:41' --batteryState charged --batteryLevel 100 --cellularBars 4 --wifiBars 3
  xcodebuild -project "$PROJECT" -scheme NativeScreenshotProof -configuration Release -sdk iphonesimulator -destination "platform=iOS Simulator,id=$UDID" -derivedDataPath "$TASK_TMP/derived" CODE_SIGNING_ALLOWED=YES CODE_SIGN_IDENTITY=- DEVELOPMENT_TEAM= build-for-testing >"$OUT/$FAMILY/build.log" 2>&1
  APP="$TASK_TMP/derived/Build/Products/Release-iphonesimulator/App.app"
  python3 - "$APP" <<'PY'
import pathlib,plistlib,sys
i=plistlib.load(open(pathlib.Path(sys.argv[1])/'Info.plist','rb'))
if (i.get('CFBundleIdentifier'),i.get('CFBundleShortVersionString'),i.get('CFBundleVersion'))!=('tw.mars.islandtransport','1.0.0','1'): raise SystemExit('Unexpected native binary identity/version')
PY
  xcrun simctl install "$UDID" "$APP"
  xcrun simctl launch "$UDID" tw.mars.islandtransport >"$OUT/$FAMILY/launch.log"
  if ! xcodebuild -project "$PROJECT" -scheme NativeScreenshotProof -destination "platform=iOS Simulator,id=$UDID" -derivedDataPath "$TASK_TMP/derived" -resultBundlePath "$OUT/$FAMILY/capture.xcresult" -parallel-testing-enabled NO -only-testing:NativeScreenshotTests/NativeScreenshotTests/testCaptureNavigation test-without-building >"$OUT/$FAMILY/capture.log" 2>&1; then
    printf 'Native %s navigation/capture failed; inspect xcresult.\n' "$FAMILY" >&2
    exit 1
  fi
  CONTAINER="$(xcrun simctl get_app_container "$UDID" tw.mars.islandtransport.screenshottests.xctrunner data)"
  ditto "$CONTAINER/Documents/NativeScreens" "$OUT/$FAMILY/screens"
  GATE='failed'
  if xcodebuild -project "$PROJECT" -scheme NativeScreenshotProof -destination "platform=iOS Simulator,id=$UDID" -derivedDataPath "$TASK_TMP/derived" -resultBundlePath "$OUT/$FAMILY/parent-gate.xcresult" -parallel-testing-enabled NO -only-testing:NativeScreenshotTests/NativeScreenshotTests/testParentGateDenied test-without-building >"$OUT/$FAMILY/parent-gate.log" 2>&1; then
    if CONTAINER="$(xcrun simctl get_app_container "$UDID" tw.mars.islandtransport.screenshottests.xctrunner data)" && ditto "$CONTAINER/Documents/NativeScreens" "$OUT/$FAMILY/parent-gate-evidence"; then
      if "$VERIFY_PYTHON" "$ROOT/scripts/verify-native-ios-screenshots.py" --check-parent-gate "$OUT/$FAMILY/parent-gate-evidence/parent-gate-result.json"; then
        GATE='passed'
      else
        printf 'Parent-gate result missing/invalid; keeping failed gate status.\n' >&2
      fi
    else
      printf 'Parent-gate result could not be retrieved; keeping failed gate status.\n' >&2
    fi
  fi
  python3 - "$OUT/$FAMILY/run.json" "$UDID" "$DEVICE_NAME" "$GATE" "$APP" <<'PY'
import hashlib,json,pathlib,sys
app=pathlib.Path(sys.argv[5]); report={'simulatorUDID':sys.argv[2],'deviceName':sys.argv[3],'captureTest':'passed','parentGateTest':sys.argv[4],'binaryExecutableSha256':hashlib.sha256((app/'App').read_bytes()).hexdigest(),'source':'native Release app with separate XCTest runner','hardwareTest':False}
pathlib.Path(sys.argv[1]).write_text(json.dumps(report,indent=2)+'\n')
PY
  xcrun simctl shutdown "$UDID"
done < <(python3 - "$OUT/device-plan.json" <<'PY'
import json,sys
for d in json.load(open(sys.argv[1])): print('|'.join(d[k] for k in ['family','deviceType','runtimeId','name']))
PY
)
[ "$(shasum -a 256 "$ROOT/ios/App/App.xcodeproj/project.pbxproj" | cut -d ' ' -f 1)" = "$PROJECT_HASH" ] || { printf 'Production project changed unexpectedly.\n' >&2; exit 1; }
"$VERIFY_PYTHON" "$ROOT/scripts/verify-native-ios-screenshots.py" "$OUT"
