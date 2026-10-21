"""Read back release evidence, source ownership, dimensions and cleanup receipts."""
import hashlib
import json
import subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/content/r35'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p):return json.loads((ROOT/p).read_text(encoding='utf-8-sig'))
def log(p):
 b=(OUT/p).read_bytes()
 return b.decode('utf-16') if b.startswith(b'\xff\xfe') else b.decode('utf-8')
assert Path.cwd().resolve()==ROOT
assert subprocess.check_output(['git','branch','--show-current']).decode().strip()=='r1-fun-polish'
assert read('package.json')['version']==read('package-lock.json')['version']==read('public/models/catalog.json')['visualVersion']=='2.47.0'
assert 'versionCode 43' in (ROOT/'android/app/build.gradle').read_text()
assert (ROOT/'ios/App/App.xcodeproj/project.pbxproj').read_text().count('CURRENT_PROJECT_VERSION = 43;')==2
assert 'tests 337' in log('tests-output.txt') and 'pass 337' in log('tests-output.txt') and 'fail 0' in log('tests-output.txt')
assert 'PWA precache manifest:' in log('build-output.txt')
assert 'PASS 132 integration checks' in log('merge-output.txt')
assert 'PASS 101 checks' in log('store-output.txt')
baseline=read('docs/content/r35/baseline.json')
for r in baseline['preexistingUntracked']:assert sha(ROOT/r['path'])==r['sha256'],r['path']
for f,digest in baseline['existingValidationFiles'].items():assert hashlib.sha256((ROOT/f).read_bytes().replace(b'\r\n',b'\n')).hexdigest()==digest,f
images={}
for scope in ['all','layout','offline','store','performance']:
 m=read(f'docs/content/r35/{scope+"/" if scope!="all" else ""}browser-{scope}.json')
 assert m['status']=='VERIFIED' and not m['errors'] and not m['external'],scope
 for f,digest in m['sourceFingerprint'].items():assert sha(ROOT/f)==digest,(scope,f)
 if scope=='layout':
  assert sum('right-turn-lower-lane' in r['path'] for r in m['shots'])==24
  assert sum('crossing-single-background' in r['path'] for r in m['shots'])==8
 for r in m['shots']:
  assert sha(ROOT/r['path'])==r['sha256'],r['path']
  assert not r['clipping'] and not any(c['bad'] for c in r['controls'])
  images[r['path']]=r
all_shots={r['path']:r for r in read('docs/content/r35/browser-all.json')['shots']}
for stage in [1,2,3]:
 for person in [0,1,2]:
  half=all_shots[f'docs/content/r35/phone-tickets-stage-{stage}-hold-half-{person}.png']['state']
  paused=all_shots[f'docs/content/r35/phone-tickets-stage-{stage}-hold-paused-{person}.png']['state']
  full=all_shots[f'docs/content/r35/phone-tickets-stage-{stage}-hold-full-{person}.png']['state']
  seated=all_shots[f'docs/content/r35/phone-tickets-stage-{stage}-seated-{person+1}.png']['state']
  assert half['boardTime']==paused['boardTime'] and half['escortStable']==paused['escortStable']
  assert .25<float(half['escortStable'])<.4 and float(full['escortStable'])==.65
  assert int(seated['boardingWaits'])==person+1
 for label in ['stopped','high-speed','tray-edge']:
  name=f'phone-cake-stage-{stage}-{label}.png'
  if stage==1 and label=='high-speed':name='phone-cake-wrong-support.png'
  if stage==1 and label=='tray-edge':name='phone-cake-late-brake-edge.png'
  state=all_shots['docs/content/r35/'+name]['state']
  if label=='stopped':assert float(state['speed'])==0
  elif label=='high-speed':assert float(state['speed'])>=4
  else:assert state['edge']=='true'
review=read('docs/content/r35/review-set.json')
assert review['allocation']=={'cake':5,'crossing':5,'tickets':5}
assert len(review['shots'])==15==len(list((OUT/'review-set').glob('*.png')))
for r in review['shots']:assert sha(ROOT/r['path'])==sha(ROOT/r['source'])==r['sha256'] and (r['width'],r['height'])==(390,844)
inspection=read('docs/content/r35/review-inspection.json')
assert len(inspection['rows'])==15
for r in inspection['rows']:assert r['status']=='VERIFIED' and sha(ROOT/r['path'])==r['sha256']
for r in read('docs/evidence/content-r35/before-after.json')['shots']:assert sha(ROOT/r['path'])==sha(ROOT/r['source'])==r['sha256']
regressions={}
for kind,name in [('merge','merge-path.json'),('store-regression','review-path.json')]:
 m=read(f'docs/content/r35/{kind}/{name}')
 assert not m['errors'] and not m['externalRequests'] and not any(r['problems'] for r in m['rows'])
 regressions[kind]=len(m['rows']);assert len(m['rows'])==(132 if kind=='merge' else 101)
 c=read(f'docs/store/screenshots/content-r35/{kind}/manifest.json')
 assert c['sourceVersion']=='2.47.0'
 for r in c['shots']:assert sha(ROOT/r['path'])==r['sha256']
 if kind=='store-regression':assert c['status']=='VERIFIED' and c['buildWorkerSha256']==sha(ROOT/'dist/sw.js')
coalescing=read('docs/content/r35/merge/render-coalescing.json')
assert coalescing['receipts'] and all(r['presentedFinalFrame'] and r['coalescedDrawCalls']>0 for r in coalescing['receipts'])
cleanup=read('docs/content/r35/cleanup-result.json')
assert cleanup['status']=='EXECUTED'
for r in cleanup['files']:assert not (ROOT/r['path']).exists(),r['path']
assert read('docs/content/r35/secret-scan.json')['hits']==0
art=read('docs/content/r35/art-manifest.json');assert art['generationCalls']==4 and art['newRuntimeArt']==4
for r in art['files']:assert sha(ROOT/r['path'])==r['sha256']
assert read('docs/content/r35/art/64px-metrics.json')['status']=='VERIFIED'
assert read('docs/content/r35/art/64px-metrics-before-color.json')['status']=='BLOCKED'
perf=read('docs/content/r35/performance/performance.json')
store=[r for r in images.values() if r['path'].startswith('docs/store/screenshots/content-r35/tickets-visible')]
assert sorted((r['width'],r['height']) for r in store)==[(1290,2796),(2064,2752)]
result=dict(status='VERIFIED',version='2.47.0',nativeSourceBuild=43,unitTests=337,regressions=regressions,
 rawImages=len(images),reviewImages=15,preexistingUntrackedUnchanged=len(baseline['preexistingUntracked']),
 existingValidationSourcesUnchanged=len(baseline['existingValidationFiles']),deletedFiles=cleanup['deletedFiles'],releasedBytes=cleanup['releasedBytes'],
 retainedInputs=len(cleanup['retained']),newRuntimeArt=4,generationCalls=4,p95=[r['p95'] for r in perf['rows']],performanceStatus=perf['status'],
 renderer='headless Chromium --disable-gpu --use-angle=swiftshader',blocked=['physical iPhone/iPad and native speech','family playtest','clean-machine performance','independent Muse score >=8'])
(OUT/'release-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(result,ensure_ascii=False))
