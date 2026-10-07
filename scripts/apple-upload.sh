#!/usr/bin/env bash
# Uses only Apple's upload tools from the selected Xcode. No Apple ID password is accepted.
set +x
set -euo pipefail
umask 077
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/output/apple-release"
IPA="$OUT/IslandTransport.ipa"
MODE="${APPLE_RELEASE_MODE:-build-only}"
TASK_TMP=''
STAGE='preflight'
fail() { printf 'Apple platform operation failed: %s\n' "$1" >&2; exit 1; }
cleanup() {
  local code=$?
  trap - EXIT INT TERM
  if [ -n "$TASK_TMP" ] && [ -d "$TASK_TMP" ]; then rm -rf "$TASK_TMP"; fi
  if [ "$code" -ne 0 ]; then printf 'Stopped at %s; no platform success was recorded.\n' "$STAGE" >&2; fi
  exit "$code"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
case "$MODE" in build-only) printf 'Build-only: no connection to Apple.\n'; exit 0 ;; validate|upload-testflight) ;; *) fail 'choose build-only, validate or upload-testflight explicitly' ;; esac
[ "$(uname -s)" = Darwin ] || fail 'requires macOS with stable Xcode and iPhoneOS SDK 26 or later'
selection="$(bash "$ROOT/scripts/apple-sign-export.sh" select-xcode)"
export DEVELOPER_DIR="$(printf '%s' "$selection" | python3 -c 'import json,sys; print(json.load(sys.stdin)["developerDir"])')"
export APPLE_XCODE_VERSION="$(printf '%s' "$selection" | python3 -c 'import json,sys; print(json.load(sys.stdin)["version"])')"
export APPLE_XCODE_BUILD="$(printf '%s' "$selection" | python3 -c 'import json,sys; print(json.load(sys.stdin)["build"])')"
export APPLE_IPHONEOS_SDK="$(printf '%s' "$selection" | python3 -c 'import json,sys; print(json.load(sys.stdin)["sdk"])')"
for name in APPLE_TEAM_ID APPLE_MARKETING_VERSION APPLE_BUILD_NUMBER APP_STORE_CONNECT_API_KEY_BASE64 APP_STORE_CONNECT_KEY_ID APP_STORE_CONNECT_ISSUER_ID; do [ -n "${!name:-}" ] || fail "missing setting: $name"; done
[ ! -e "$OUT/platform-result.json" ] || fail 'platform result already exists; refusing to reuse a previous run'
python3 - "$OUT" <<'PY'
import hashlib,json,os,pathlib,re,sys
d=pathlib.Path(sys.argv[1]); r=json.loads((d/'verification.json').read_text())
expected={'bundleId':'tw.mars.islandtransport','teamId':os.environ['APPLE_TEAM_ID'],'marketingVersion':os.environ['APPLE_MARKETING_VERSION'],'buildNumber':os.environ['APPLE_BUILD_NUMBER'],'xcode':os.environ['APPLE_XCODE_VERSION'],'xcodeBuild':os.environ['APPLE_XCODE_BUILD'],'sdk':os.environ['APPLE_IPHONEOS_SDK'],'signed':True,'signatureVerified':True,'profileVerified':True,'entitlementsVerified':True,'bundledResourcesVerified':True,'exportMethod':'app-store-connect','internalOnly':False}
if any(r.get(k)!=v for k,v in expected.items()) or r.get('sha256')!=hashlib.sha256((d/'IslandTransport.ipa').read_bytes()).hexdigest(): raise SystemExit('IPA provenance or digest mismatch')
if not re.fullmatch(r'[A-Z0-9]{10}',os.environ['APP_STORE_CONNECT_KEY_ID']) or not re.fullmatch(r'[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}',os.environ['APP_STORE_CONNECT_ISSUER_ID']): raise SystemExit('Invalid API key/issuer identifier')
PY
STAGE='local IPA re-verification'
bash "$ROOT/scripts/apple-sign-export.sh" verify-ipa "$IPA"
TASK_TMP="$(mktemp -d "${RUNNER_TEMP:-${TMPDIR:-/tmp}}/island-upload.XXXXXXXX")"
mkdir -p "$TASK_TMP/private_keys"
python3 - "$TASK_TMP/private_keys" <<'PY'
import base64,os,pathlib,sys
try: data=base64.b64decode(''.join(os.environ['APP_STORE_CONNECT_API_KEY_BASE64'].split()),validate=True)
except Exception: raise SystemExit('Invalid API key base64')
if b'-----BEGIN PRIVATE KEY-----' not in data or b'-----END PRIVATE KEY-----' not in data: raise SystemExit('Expected a PEM p8 private key')
(pathlib.Path(sys.argv[1])/('AuthKey_'+os.environ['APP_STORE_CONNECT_KEY_ID']+'.p8')).write_bytes(data)
PY
unset APP_STORE_CONNECT_API_KEY_BASE64
openssl pkey -in "$TASK_TMP/private_keys/AuthKey_$APP_STORE_CONNECT_KEY_ID.p8" -check -noout >"$TASK_TMP/key-check.log" 2>&1 || fail 'invalid API private key'
XCODE_CONTENTS="$(cd "$DEVELOPER_DIR/.." && pwd)"
STAGE='Apple upload tool discovery'
TRANSPORTER=''
while IFS= read -r candidate; do [ ! -x "$candidate" ] || { TRANSPORTER="$candidate"; break; }; done < <(find "$XCODE_CONTENTS/SharedFrameworks" -name iTMSTransporter \( -type f -o -type l \) 2>/dev/null)
UPLOAD_TOOL="$TRANSPORTER"
UPLOAD_TOOL_KIND='transporter'
if [ -z "$UPLOAD_TOOL" ]; then
  UPLOAD_TOOL="$(/usr/bin/xcrun --find altool 2>/dev/null || true)"
  UPLOAD_TOOL_KIND='altool'
fi
[ -n "$UPLOAD_TOOL" ] && [ -x "$UPLOAD_TOOL" ] || fail 'No official upload tool found in the selected Xcode'
UPLOAD_TOOL="$(python3 - "$UPLOAD_TOOL" "$XCODE_CONTENTS" <<'PY'
import pathlib,sys
tool=pathlib.Path(sys.argv[1]).resolve(); root=pathlib.Path(sys.argv[2]).resolve()
if not tool.is_relative_to(root): raise SystemExit('Upload tool is outside the selected Xcode')
print(tool)
PY
)"
export APPLE_UPLOAD_TOOL_KIND="$UPLOAD_TOOL_KIND"
printf 'Selected Apple upload tool: %s\n' "$UPLOAD_TOOL_KIND"
if [ "$UPLOAD_TOOL_KIND" = altool ]; then
  "$UPLOAD_TOOL" --help >"$TASK_TMP/altool-help.log" 2>&1 || true
  python3 - "$TASK_TMP/altool-help.log" <<'PY'
import pathlib,sys
help_text=pathlib.Path(sys.argv[1]).read_text(errors='replace')
required=('--validate-app','--upload-app','--apiKey','--apiIssuer')
if not all(flag in help_text for flag in required): raise SystemExit('Selected altool lacks required App Store API-key commands')
PY
fi
cd "$TASK_TMP"
# Apple's altool guide documents API_PRIVATE_KEYS_DIR; no home-directory key is used.
export API_PRIVATE_KEYS_DIR="$TASK_TMP/private_keys"
run_apple_tool() {
  local operation="$1"
  local action='--validate-app'
  local -a command
  if [ "$UPLOAD_TOOL_KIND" = transporter ]; then
    command=("$UPLOAD_TOOL" -m "$operation" -assetFile "$IPA" -apiKey "$APP_STORE_CONNECT_KEY_ID" -apiIssuer "$APP_STORE_CONNECT_ISSUER_ID" -v informational)
  else
    [ "$operation" != upload ] || action='--upload-app'
    command=("$UPLOAD_TOOL" "$action" -f "$IPA" -t ios --apiKey "$APP_STORE_CONNECT_KEY_ID" --apiIssuer "$APP_STORE_CONNECT_ISSUER_ID" --output-format json)
  fi
  if "${command[@]}" >"$TASK_TMP/$operation.log" 2>&1; then return 0; fi
  python3 - "$TASK_TMP/$operation.log" <<'PY'
import pathlib,re,sys
codes=sorted(set(re.findall(r'\bITMS-[0-9]+\b',pathlib.Path(sys.argv[1]).read_text(errors='replace'))))
print('Apple error codes: '+(', '.join(codes) if codes else 'none returned; authentication/network/tool failure'),file=sys.stderr)
PY
  return 1
}
STAGE='Apple validation'
run_apple_tool verify || fail 'Apple validation failed; upload was not attempted'
if [ "$MODE" = upload-testflight ]; then
  STAGE='Apple upload'
  run_apple_tool upload || fail 'Apple upload failed; no acceptance is claimed'
fi
python3 - "$OUT" "$MODE" <<'PY'
import datetime,hashlib,json,os,pathlib,sys
d=pathlib.Path(sys.argv[1]); uploaded=sys.argv[2]=='upload-testflight'
report={'generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'mode':sys.argv[2],'uploadTool':os.environ['APPLE_UPLOAD_TOOL_KIND'],'sha256':hashlib.sha256((d/'IslandTransport.ipa').read_bytes()).hexdigest(),'appleValidated':True,'uploadCommandAccepted':uploaded,'status':'upload_accepted_processing_unverified' if uploaded else 'apple_validation_passed_no_upload','appleProcessingVerified':False,'testFlightAvailableVerified':False,'appStoreApproved':False}
(d/'platform-result.json').write_text(json.dumps(report,indent=2)+'\n')
PY
if [ "$MODE" = upload-testflight ]; then printf 'Apple accepted the upload command. Processing/TestFlight availability and App Store review remain unverified.\n'; else printf 'Apple validation passed. No upload was performed.\n'; fi
