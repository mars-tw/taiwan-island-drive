"""Verify actual captures and preserve exactly five phone screenshots per lesson."""
import hashlib
import json
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/content/r31'
def read(p):
    return json.loads((ROOT / p).read_text(encoding='utf-8-sig'))
def write(p, value):
    (ROOT / p).write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding='utf-8')
def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()
def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT).decode('utf-8').strip()

assert Path.cwd().resolve() == ROOT
assert git('branch', '--show-current') == 'r1-fun-polish'
assert read('package.json')['version'] == '2.43.0'
baseline = read('docs/content/r31/baseline.json')
for rel, digest in baseline['existingTests'].items():
    assert sha(ROOT / rel) == digest, rel
assert all((ROOT / rel).is_file() for rel in baseline['untracked'])
cleanup = read('docs/content/r31/cleanup-result.json')
assert cleanup['status'] == 'EXECUTED'
assert all(not (ROOT / row['path']).exists() for row in cleanup['files'])
deleted=set(filter(None,git('diff','--no-renames','--name-only','--diff-filter=D').splitlines())) | set(filter(None,git('diff','--cached','--no-renames','--name-only','--diff-filter=D').splitlines()))
if not deleted:
    deleted=set(filter(None,git('show','--format=','--no-renames','--name-only','--diff-filter=D','HEAD').splitlines()))
assert deleted=={row['path'] for row in cleanup['files']}
art=read('docs/content/r31/art-manifest.json')
assert art['newGeneratedArt']==art['generationCalls']==0
assert all(sha(ROOT/row['path'])==row['sha256'] for row in art['sources'])
assert read('docs/content/r31/secret-scan.json')['hits'] == 0
merge = read('docs/content/r31/merge/merge-path.json')
store = read('docs/content/r31/store-regression/review-path.json')
assert len(merge['rows']) == 132 and not merge['errors'] and not merge['externalRequests']
assert len(store['rows']) == 101 and not store['errors'] and not store['externalRequests']
assert all(not row.get('problems') for row in merge['rows'] + store['rows'])
store_manifest = read('docs/store/screenshots/content-r31/store-regression/manifest.json')
assert store_manifest['status'] == 'VERIFIED'
assert store_manifest['buildWorkerSha256'] == sha(ROOT / 'dist/sw.js')

shots = {}
for scope in ['all', 'controlled', 'layout', 'offline', 'store', 'performance']:
    path = f'docs/content/r31/{"offline/" if scope == "offline" else ""}browser-{scope}.json'
    data = read(path)
    assert data['status'] == 'VERIFIED', scope
    if scope == 'store':
        assert sorted((r['width'],r['height']) for r in data['shots']) == [(1290,2796),(2064,2752)]
    for rel, digest in data['sourceFingerprint'].items():
        assert sha(ROOT / rel) == digest, (scope, rel)
    assert not data['errors'] and not data['failed'] and not data['external']
    for row in data['shots']:
        assert sha(ROOT / row['path']) == row['sha256'], row['path']
        assert not any(c['bad'] for c in row['controls'])
        assert not row['layout']['overlaps'] and not row['layout']['iconOverlaps']
        assert not row['textClipping']
        if row['width'] <= 1032:
            assert not any(word in row['text'] for word in ['鍵盤', 'WASD', '方向鍵', '空白鍵'])
        shots[row['path']] = row

groups = {
 'cake': ['controlled-initial', 'controlled-brake-support', 'controlled-upright', 'stage-3-main-road', 'replay-new-conditions'],
 'crossing': ['stage-1-car-still-wait', 'stage-1-new-car-clear-unconfirmed', 'stage-1-ready', 'stage-1-departing', 'replay-new-conditions'],
 'tickets': ['stage-1-wrong-shape', 'stage-1-selected-friend-0', 'stage-1-paused-still', 'stage-1-aisle', 'stage-1-seated-1'],
}
review = OUT / 'review-set'
review.mkdir(exist_ok=True)
rows = []
for kind, states in groups.items():
    for state in states:
        source = f'docs/content/r31/phone-{kind}-{state}.png'
        row = shots[source]
        assert (row['width'], row['height']) == (390, 844)
        dest = review / f'{len(rows)+1:02d}-{kind}-{state}.png'
        shutil.copyfile(ROOT / source, dest)
        assert sha(dest) == row['sha256']
        rows.append(dict(path=dest.relative_to(ROOT).as_posix(), source=source, sha256=sha(dest), width=390, height=844, lesson=kind, phase=row['phase']))
assert len(list(review.glob('*'))) == 15
write('docs/content/r31/review-set.json', dict(status='VERIFIED', method='byte-identical original headless phone screenshots; no resizing or montage', allocation={k:5 for k in groups}, shots=rows, additionalAcceptanceImages=['docs/content/r31/phone-tickets-stage-1-wrong-color.png', 'docs/content/r31/phone-tickets-replay-new-conditions.png'], note='Balanced 15-frame limit prioritizes the full four-step boarding sequence; both error cases and all three replay cards are indexed in the report.'))

# Same-station, same-child sequence: count changes only on the seated frame.
boarding = [shots[f'docs/content/r31/phone-tickets-stage-1-{s}.png'] for s in ['selected-friend-0','paused-still','aisle','seated-1']]
assert all('已入座 0/3 人' in row['text'] for row in boarding[:3])
assert '已入座 1/3 人' in boarding[3]['text']
assert '邀小安上車' in boarding[0]['text']
assert '按住陪同' in boarding[1]['text']
assert boarding[1]['state']['holdProgress'] == shots['docs/content/r31/phone-tickets-stage-1-paused.png']['state']['holdProgress']
for row in [shots[f'docs/content/r31/phone-cake-{s}.png'] for s in groups['cake'][:3]]:
    assert sum(h['needed']=='true' for h in row['highlights']) == 1
for stage in range(1,4):
    new = shots[f'docs/content/r31/phone-crossing-stage-{stage}-new-car-invalidated.png']['state']
    side = new['staleSide']
    assert new['lookedRight' if side=='left' else 'lookedLeft'] == 'true'
    assert shots[f'docs/content/r31/phone-crossing-stage-{stage}-ready.png']['state']['refreshes'] == '1'
    assert shots[f'docs/content/r31/phone-crossing-stage-{stage}-ready.png']['state']['crossed'] == '3'

proof = ROOT / 'docs/evidence/content-r31'
proof.mkdir(parents=True, exist_ok=True)
pairs = [
 ('docs/content/r30/phone-cake-controlled-high-support.png','before-r30-cake.png'),
 ('docs/content/r31/phone-cake-controlled-brake-support.png','after-r31-cake.png'),
 ('docs/content/r31/phone-crossing-stage-1-car-still-wait.png','after-phone.png'),
 ('docs/content/r31/layout/device-844x390-crossing-new-car.png','after-phone-landscape.png'),
 ('docs/content/r31/layout/device-768x1024-crossing-new-car.png','after-ipad.png'),
]
proof_rows=[]
for source,name in pairs:
    dest=proof/name
    shutil.copyfile(ROOT/source,dest)
    proof_rows.append(dict(path=dest.relative_to(ROOT).as_posix(), source=source, sha256=sha(dest)))
write('docs/evidence/content-r31/manifest.json',dict(status='VERIFIED',method='Original before/after and three viewport copies; cross-round images are illustrative, not a controlled physics comparison',shots=proof_rows))

perf=read('docs/content/r31/performance.json')
assert perf['status']=='VERIFIED'
assert all(row['p95']<=18 for row in perf['rows'])
for f in ['package.json','package-lock.json','src/games/car/config.js','public/sw.js','ios/App/App.xcodeproj/project.pbxproj','android/app/build.gradle']:
    text=(ROOT/f).read_text(encoding='utf-8')
    assert '2.43.0' in text and '2.42.0' not in text, f
assert 'CURRENT_PROJECT_VERSION = 39' in (ROOT/'ios/App/App.xcodeproj/project.pbxproj').read_text()
assert 'versionCode 39' in (ROOT/'android/app/build.gradle').read_text()
write('docs/content/r31/release-verification.json',dict(status='VERIFIED',version='2.43.0',nativeSourceBuild=39,mergeChecks=len(merge['rows']),storeChecks=len(store['rows']),existingTestsUnchanged=len(baseline['existingTests']),preexistingUntrackedPreserved=len(baseline['untracked']),verifiedSourceScreenshots=len(shots),reviewScreenshots=15,deletedFiles=cleanup['deletedFiles'],releasedBytes=cleanup['releasedBytes'],performanceReference=[dict(width=r['width'],height=r['height'],p95=r['p95']) for r in perf['rows']],limitations=['physical devices','native speech output','parent-child playtest and masked-text recognition','clean workstation performance','independent Muse score >=8']))
print('VERIFIED R31 source hashes, state sequences, 15 originals, version, cleanup and reference p95')
