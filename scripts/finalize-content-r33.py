"""Read back final evidence and preserve input ownership; no network or publication."""
import hashlib,json,shutil,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/content/r33'
def read(p):return json.loads((ROOT/p).read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def write(p,v):(ROOT/p).write_text(json.dumps(v,ensure_ascii=False,indent=2),encoding='utf-8')
assert Path.cwd().resolve()==ROOT
assert subprocess.check_output(['git','branch','--show-current']).decode().strip()=='r1-fun-polish'
assert read('package.json')['version']=='2.45.0'
assert 'versionCode 41' in (ROOT/'android/app/build.gradle').read_text()
assert (ROOT/'ios/App/App.xcodeproj/project.pbxproj').read_text().count('CURRENT_PROJECT_VERSION = 41;')==2
unit=(OUT/'tests-output.txt').read_bytes();unit=unit.decode('utf-16') if unit.startswith(b'\xff\xfe') else unit.decode('utf-8')
assert 'tests 331' in unit and 'pass 331' in unit and 'fail 0' in unit
baseline=read('docs/content/r33/baseline.json')
assert not baseline['dirty']
for f,h in baseline['untracked'].items():assert sha(ROOT/f)==h,f
for f,h in baseline['existingTests'].items():assert sha(ROOT/f)==h,f
images={}
for scope in ['all','layout','offline','store','performance']:
 p=f'docs/content/r33/{scope+"/" if scope!="all" else ""}browser-{scope}.json';m=read(p)
 assert m['status']=='VERIFIED' and not m['errors'] and not m['external'],p
 for f,h in m['sourceFingerprint'].items():assert sha(ROOT/f)==h,(scope,f)
 for row in m['shots']:
  assert sha(ROOT/row['path'])==row['sha256'],row['path']
  assert not row['clipping'] and all(not c['bad'] for c in row['controls'])
  images[row['path']]=row
groups={
 'cake':['wrong-support','late-brake-edge','rescued','bay-leaving','bay-main-road'],
 'crossing':['stage-1-car-approach','1-child-on-zebra','2-grandma-on-zebra','2-bike-on-zebra','stage-3-finished'],
 'tickets':['stage-1-wrong-shape','stage-1-threshold-too-early-0','stage-1-threshold-stable-0','stage-1-aisle-too-early-0','stage-1-seated-3']}
review=OUT/'review-set';review.mkdir(exist_ok=True);rows=[]
for kind,names in groups.items():
 for name in names:
  source=f'docs/content/r33/phone-{kind}-{name}.png';r=images[source]
  assert (r['width'],r['height'])==(390,844)
  target=review/f'{len(rows)+1:02d}-{kind}-{name}.png';shutil.copy2(ROOT/source,target)
  assert sha(target)==r['sha256']
  rows.append(dict(path=target.relative_to(ROOT).as_posix(),source=source,sha256=r['sha256'],width=390,height=844))
assert len(list(review.iterdir()))==15
write('docs/content/r33/review-set.json',dict(status='VERIFIED',method='byte-identical raw phone captures; no resizing or collage',allocation={k:len(v) for k,v in groups.items()},shots=rows))
inspection=read('docs/content/r33/review-inspection.json');assert len(inspection['rows'])==15
for row in inspection['rows']:assert row['status']=='VERIFIED' and sha(ROOT/row['path'])==row['sha256']
proof=read('docs/evidence/content-r33/before-after.json')
for row in proof['shots']:assert sha(ROOT/row['path'])==sha(ROOT/row['source'])==row['sha256']
bay=[images[f'docs/content/r33/phone-cake-bay-{s}.png']['geometry'] for s in ['parked','leaving','main-road']]
assert len({(g['car']['x'],g['car']['y']) for g in bay})==3
assert bay[0]['pan']!=bay[2]['pan']
balance=[images[f'docs/content/r33/phone-cake-{s}.png']['geometry'] for s in ['rescued','wrong-support','late-brake-edge']]
offsets=[abs(g['displacement']) for g in balance];assert offsets[0]<offsets[1]<offsets[2],offsets
for stage in [1,2,3]:
 for who in ['child','bike','grandma']:
  assert f'docs/content/r33/phone-crossing-{stage}-{who}-on-zebra.png' in images
 for n in [1,2,3]:assert f'docs/content/r33/phone-tickets-stage-{stage}-seated-{n}.png' in images
 for stop in ['threshold','aisle']:
  for action in ['too-early','stable']:assert f'docs/content/r33/phone-tickets-stage-{stage}-{stop}-{action}-0.png' in images
cleanup=read('docs/content/r33/cleanup-result.json');assert cleanup['status']=='EXECUTED'
assert all(not (ROOT/r['path']).exists() for r in cleanup['files'])
assert read('docs/content/r33/secret-scan.json')['hits']==0
assert read('docs/content/r33/art/color-audit.json')['status']=='VERIFIED'
regressions={}
for kind,file in [('merge','merge-path.json'),('store-regression','review-path.json')]:
 m=read(f'docs/content/r33/{kind}/{file}');assert not m['errors'] and not m['externalRequests'];assert all(not r['problems'] for r in m['rows']);regressions[kind]=len(m['rows'])
perf=read('docs/content/r33/performance/performance.json')
store=[r for r in images.values() if r['path'].startswith('docs/store/screenshots/content-r33/cabin-')]
assert sorted((r['width'],r['height']) for r in store)==[(1290,2796),(2064,2752)]
art=[{'path':f,'sha256':sha(ROOT/f)} for f in ['docs/content/r33/art/seated-atlas-source.png','docs/content/r33/art/bay-panorama-source.png','docs/content/r33/art/standing-atlas-source.png','public/art/content-r33/bay-panorama.webp']+[f'public/art/content-r33/passenger-{n}-seated.png' for n in [1,2,3]]+[f'public/art/content-r33/passenger-{n}-standing.png' for n in [1,2,3]]]
write('docs/content/r33/art-manifest.json',dict(status='VERIFIED',generationCalls=3,newDesigns=7,newRuntimeArt=7,tool='image_gen.imagegen',model_slug=None,prompts=['docs/content/r33/art/PROMPTS.json','docs/content/r33/art/PROMPT_BAY.json','docs/content/r33/art/PROMPT_STANDING.json'],files=art))
write('docs/content/r33/pixel-measurements.json',dict(status='VERIFIED',bay=bay,cake=balance,absoluteDisplacements=offsets))
result=dict(status='VERIFIED',version='2.45.0',nativeSourceBuild=41,unitTests=331,regressions=regressions,rawImages=len(images),reviewImages=15,deletedFiles=cleanup['deletedFiles'],releasedBytes=cleanup['releasedBytes'],retainedInputs=len(cleanup['retained']),existingTestsUnchanged=len(baseline['existingTests']),preexistingUntrackedUnchanged=len(baseline['untracked']),p95=[r['p95'] for r in perf['rows']],performanceStatus=perf['status'],blocked=['physical devices','family playtest','clean-machine frame timing','independent Muse score >=8'])
write('docs/content/r33/release-verification.json',result)
print(json.dumps(result,ensure_ascii=False))
