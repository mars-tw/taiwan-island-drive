"""Release readback: source scope, complete journeys, evidence and cleanup."""
import hashlib
import json
import subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/content/r36'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p):return json.loads((ROOT/p).read_text(encoding='utf-8-sig'))
def log(name):
 b=(OUT/name).read_bytes();return b.decode('utf-16') if b.startswith(b'\xff\xfe') else b.decode('utf-8')
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT).decode('utf-8')
assert Path.cwd().resolve()==ROOT.resolve()
assert git('branch','--show-current').strip()=='r1-fun-polish'
assert read('package.json')['version']==read('package-lock.json')['version']==read('public/models/catalog.json')['visualVersion']=='2.47.1'
assert 'versionCode 44' in (ROOT/'android/app/build.gradle').read_text()
assert (ROOT/'ios/App/App.xcodeproj/project.pbxproj').read_text().count('CURRENT_PROJECT_VERSION = 44;')==2
assert 'tests 338' in log('unit-tests.txt') and 'pass 338' in log('unit-tests.txt') and 'fail 0' in log('unit-tests.txt')
assert 'PWA precache manifest: 265' in log('build.txt')
assert 'PASS 132 integration checks' in log('merge-output.txt')
assert 'PASS 101 checks' in log('store-output.txt')
baseline=read('docs/content/r36/baseline.json')
for name,digest in baseline['preexistingUntracked'].items():assert sha(ROOT/name)==digest,name
allowed={'src/games/car/config.js','src/shared/content-r31.js','src/shared/content-r31-scene.js','src/shared/content-r32-scene.js',
 'src/shared/content-r1-ui.js','src/shared/content-r35.css','tests/shared/content-r31.test.js',
 'scripts/check-merge.mjs','scripts/check-store-review.mjs','scripts/playwright-cpu-r34.mjs'}
changed=[]
for name,digest in baseline['sources'].items():
 if sha(ROOT/name)!=digest:assert name in allowed,name;changed.append(name)
test_diff=git('diff','--numstat','--','tests')
assert all(line.split('\t')[1]=='0' for line in test_diff.splitlines()),'existing test removed or weakened'
for name in ['scripts/check-merge.mjs','scripts/check-store-review.mjs']:
 old=subprocess.check_output(['git','show',f"{baseline['commit']}:{name}"],cwd=ROOT).decode('utf-8').replace('\r\n','\n')
 new=(ROOT/name).read_text(encoding='utf-8').replace("args:['--mute-audio','--use-angle=d3d11'", "args:['--use-angle=d3d11'")
 assert old==new,'existing regression assertions changed'
assert not git('diff','--name-only','--','public/art'), 'existing runtime art changed'
images={};scopes={}
for scope in ['all','layout','offline','store','performance']:
 m=read(f'docs/content/r36/{scope+"/" if scope!="all" else ""}browser-{scope}.json')
 assert m['status']=='VERIFIED' and not m['errors'] and not m['external'],scope
 assert m['verifiedBeforeCleanup']['allAudioSuppressed'],scope
 for name,digest in m['sourceFingerprint'].items():assert sha(ROOT/name)==digest,(scope,name)
 for r in m['shots']:
  assert sha(ROOT/r['path'])==r['sha256'],r['path'];assert not r['audio']['speech'] and not r['audio']['pending']
  assert r['audio']['harness']['suppressed'];images[r['path']]=r
 scopes[scope]=dict(captured=m['capturedShots'],retained=len(m['shots']),checks=len(m['checks']))
 assert f"VERIFIED {len(m['checks'])} checks, {m['capturedShots']} raw captures" in log(f'content-{scope}.txt')
 if scope in ['all','offline']:
  for kind in ['cake','crossing','tickets']:
   completed=[r for r in m['checks'] if r['label'].startswith(kind+' completed')]
   assert len(completed)==1 and completed[0]['completed'] and completed[0]['contentVersion']==33
   assert completed[0]['visited']==[0,1,2]
 if scope=='layout':assert len(m['checks'])==8
assert sum(s['captured'] for s in scopes.values())==564
assert 'VERIFIED R35 reference build' in log('reference-build.txt')
assert 'EXECUTED 15 paired visual states from R35 and R36' in log('visual-comparison.txt')
review=read('docs/content/r36/review-set.json');inspection=read('docs/content/r36/review-inspection.json')
assert len(review['shots'])==len(inspection['rows'])==len(list((OUT/'review-set').glob('*.png')))==15
assert review['allocation']=={'cake':5,'crossing':5,'tickets':5}
for r,note in zip(review['shots'],inspection['rows']):
 assert sha(ROOT/r['path'])==sha(ROOT/r['source'])==r['sha256']==note['sha256']
 assert (r['width'],r['height'])==(390,844) and note['status']=='VERIFIED' and note['inspection']
comparison=read('docs/content/r36/r35-comparison.json')
assert comparison['status']=='VERIFIED' and comparison['identicalPresentationPairs']==comparison['pairs']==15
assert all(r['presentationEqual'] and not r['stateDifferences'] for r in comparison['rows'])
regressions={}
for scope,filename,count in [('merge','merge-path.json',132),('store-regression','review-path.json',101)]:
 m=read(f'docs/content/r36/{scope}/{filename}')
 assert not m['errors'] and not m['externalRequests'] and len(m['rows'])==count
 assert not any(r['problems'] for r in m['rows']);regressions[scope]=len(m['rows'])
 manifest=read(f'docs/store/screenshots/content-r36/{scope}/manifest.json')
 assert manifest['sourceVersion']=='2.47.1'
 for r in manifest['shots']:assert sha(ROOT/r['path'])==r['sha256']
coalescing=read('docs/content/r36/merge/render-coalescing.json')
assert coalescing['receipts'] and all(r['presentedFinalFrame'] and r['coalescedDrawCalls']>0 for r in coalescing['receipts'])
store=read('docs/content/r36/store-captures.json');assert store['status']=='VERIFIED'
assert sorted((r['width'],r['height']) for r in store['shots'])==[(1290,2796),(2064,2752)]
for r in store['shots']:assert sha(ROOT/r['path'])==r['sha256'] and r['audio']['suppressed']
cleanup=read('docs/content/r36/cleanup-result.json');intermediate=read('docs/content/r36/intermediate-cleanup-result.json')
for receipt in [cleanup,intermediate]:
 assert receipt['status']=='EXECUTED'
 for r in receipt['files']:assert not (ROOT/r['path']).exists(),r['path']
for r in cleanup['retained']:assert (ROOT/r['path']).is_file(),r['path']
assert read('docs/content/r36/secret-scan.json')['hits']==0
perf=read('docs/content/r36/performance/performance.json')
assert perf['status']=='VERIFIED' and all(r['p95']<=18 for r in perf['rows'])
result=dict(status='VERIFIED',version='2.47.1',nativeSourceBuild=44,branch='r1-fun-polish',unitTests=338,
 regressions=regressions,scopes=scopes,reviewImages=15,comparisonPairs=15,identicalPresentationPairs=15,
 rgbExactComparisonImages=comparison['exactImages'],pixelComparisonStatus=comparison['pixelComparisonStatus'],
 preservedPreexistingUntracked=len(baseline['preexistingUntracked']),unchangedExistingSources=len(baseline['sources'])-len(changed),changedSourceAllowlist=changed,
 newRuntimeArt=0,generatedArtCalls=0,oldMediaDeleted=cleanup['deletedFiles'],oldMediaReleasedBytes=cleanup['releasedBytes'],
 intermediatesDeleted=intermediate['deletedFiles'],intermediateReleasedBytes=intermediate['releasedBytes'],retainedHistoricalInputs=len(cleanup['retained']),
 p95=[r['p95'] for r in perf['rows']],renderer='silent headless Chromium; --mute-audio; software rendering',
 blocked=['physical iPhone/iPad and native sound','family playtest','clean-machine performance','independent Muse score >=8'])
(OUT/'release-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(result,ensure_ascii=False))
