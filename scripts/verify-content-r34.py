"""Verify current release receipts, exact captures and pre-existing ownership."""
import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/content/r34'
def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p):
    return json.loads((ROOT / p).read_text(encoding='utf-8-sig'))
def log(p):
    b = (OUT / p).read_bytes()
    return b.decode('utf-16') if b.startswith(b'\xff\xfe') else b.decode('utf-8')

assert ROOT == Path.cwd().resolve()
assert subprocess.check_output(['git', 'branch', '--show-current']).decode().strip() == 'r1-fun-polish'
assert read('package.json')['version'] == read('package-lock.json')['version'] == read('public/models/catalog.json')['visualVersion'] == '2.46.0'
assert 'versionCode 42' in (ROOT / 'android/app/build.gradle').read_text()
assert (ROOT / 'ios/App/App.xcodeproj/project.pbxproj').read_text().count('CURRENT_PROJECT_VERSION = 42;') == 2
assert 'tests 333' in log('tests-output.txt') and 'pass 333' in log('tests-output.txt') and 'fail 0' in log('tests-output.txt')
assert 'PWA precache manifest:' in log('build-output.txt')
assert 'PASS 132 integration checks' in log('merge-output.txt')
assert 'PASS 101 checks' in log('store-output.txt')
baseline = read('docs/content/r34/baseline.json')
for f, digest in {**baseline['untracked'], **baseline['existingTests']}.items():
    assert sha(ROOT / f) == digest, f
images = {}
for scope in ['all', 'layout', 'offline', 'store', 'performance']:
    m = read(f'docs/content/r34/{scope+"/" if scope != "all" else ""}browser-{scope}.json')
    assert m['status'] == 'VERIFIED' and not m['errors'] and not m['external'], scope
    for f, digest in m['sourceFingerprint'].items():
        assert sha(ROOT / f) == digest, (scope, f)
    if scope == 'layout':
        assert sum('right-turn-lower-lane' in r['path'] for r in m['shots']) == 24
        assert sum('crossing-single-background' in r['path'] for r in m['shots']) == 8
    for r in m['shots']:
        assert sha(ROOT / r['path']) == r['sha256'], r['path']
        assert not r['clipping'] and not any(c['bad'] for c in r['controls'])
        images[r['path']] = r
for r in read('docs/content/r34/review-set.json')['shots']:
    assert sha(ROOT / r['path']) == sha(ROOT / r['source']) == r['sha256']
for r in read('docs/evidence/content-r34/before-after.json')['shots']:
    assert sha(ROOT / r['path']) == r['sha256']
    if 'source' in r:
        assert sha(ROOT / r['source']) == r['sha256']
inspection = read('docs/content/r34/review-inspection.json')
assert len(inspection['rows']) == 15
for r in inspection['rows']:
    assert r['status'] == 'VERIFIED' and sha(ROOT / r['path']) == r['sha256']
regressions = {}
for kind, name in [('merge', 'merge-path.json'), ('store-regression', 'review-path.json')]:
    m = read(f'docs/content/r34/{kind}/{name}')
    assert not m['errors'] and not m['externalRequests'] and not any(r['problems'] for r in m['rows'])
    regressions[kind] = len(m['rows'])
    assert len(m['rows']) == (132 if kind == 'merge' else 101)
    c = read(f'docs/store/screenshots/content-r34/{kind}/manifest.json')
    assert c['sourceVersion'] == '2.46.0'
    if kind == 'store-regression':
        assert c['status'] == 'VERIFIED' and c['buildWorkerSha256'] == sha(ROOT / 'dist/sw.js')
    for r in c['shots']:
        assert sha(ROOT / r['path']) == r['sha256']
cleanup = read('docs/content/r34/cleanup-result.json')
assert cleanup['status'] == 'EXECUTED'
for r in cleanup['files']:
    assert not (ROOT / r['path']).exists(), r['path']
assert read('docs/content/r34/secret-scan.json')['hits'] == 0
art = read('docs/content/r34/art-manifest.json')
assert art['generationCalls'] == art['newRuntimeArt'] == 0
for r in art['files']:
    assert sha(ROOT / r['path']) == r['sha256']
perf = read('docs/content/r34/performance/performance.json')
store = [r for r in images.values() if r['path'].startswith('docs/store/screenshots/content-r34/crossing-')]
assert sorted((r['width'], r['height']) for r in store) == [(1290, 2796), (2064, 2752)]
result = dict(status='VERIFIED', version='2.46.0', nativeSourceBuild=42, unitTests=333, regressions=regressions, rawImages=len(images), reviewImages=15,
              renderer='headless Chromium with --disable-gpu --use-angle=swiftshader; physical GPU reserved for H3',
              harnessFingerprint={p: sha(ROOT / p) for p in ['scripts/check-merge.mjs', 'scripts/check-store-review.mjs', 'scripts/playwright-cpu-r34.mjs', 'scripts/playwright-regression-r34.mjs']},
              preexistingUntrackedUnchanged=len(baseline['untracked']), existingTestsUnchanged=len(baseline['existingTests']),
              deletedFiles=cleanup['deletedFiles'], releasedBytes=cleanup['releasedBytes'], retainedInputs=len(cleanup['retained']),
              p95=[r['p95'] for r in perf['rows']], performanceStatus=perf['status'], newRuntimeArt=0,
              blocked=['physical iPhone/iPad', 'family playtest', 'clean-machine performance', 'independent Muse score >=8'])
(OUT / 'release-verification.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(result, ensure_ascii=False))
