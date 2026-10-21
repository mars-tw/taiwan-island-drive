"""Final local readback: tests, scoped sources, original media and cleanup."""
import hashlib,json,re,subprocess,struct
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/content/r37'
def read(p):return json.loads((ROOT/p).read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256((ROOT/p).read_bytes()).hexdigest()
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT).decode('utf8')
def log(name):
 b=(OUT/name).read_bytes();return b.decode('utf16') if b.startswith(b'\xff\xfe') else b.decode('utf8')
assert Path.cwd().resolve()==ROOT.resolve();assert git('branch','--show-current').strip()=='r1-fun-polish'
assert read('package.json')['version']==read('package-lock.json')['version']==read('public/models/catalog.json')['visualVersion']=='2.47.2'
assert 'versionCode 45' in (ROOT/'android/app/build.gradle').read_text();assert (ROOT/'ios/App/App.xcodeproj/project.pbxproj').read_text().count('CURRENT_PROJECT_VERSION = 45;')==2
assert 'tests 342' in log('unit-tests.txt') and 'pass 342' in log('unit-tests.txt') and 'fail 0' in log('unit-tests.txt')
assert 'PWA precache manifest: 265' in log('build.txt')
assert 'PASS 132 integration checks' in log('merge-output.txt');assert 'PASS 101 checks' in log('store-regression-output.txt')
baseline=read('docs/content/r37/baseline.json')
for p,h in baseline['preexistingUntracked'].items():assert sha(p)==h,p+' preexisting file changed'
for f in ['src/shared/content-r35.js','src/shared/content-r35-ui.js','src/shared/content-r35-scene.js']:
 assert (ROOT/f).read_bytes()==subprocess.check_output(['git','show','db8bbe9:'+f],cwd=ROOT)
# Existing test files must be byte-identical to this round's start.
assert not git('diff',baseline['commit'],'--','tests/shared/content-r31.test.js','tests/shared/content-r35.test.js')
media=0
for name in ['browser-all.json','layout/browser-layout.json','store/browser-store.json','offline/browser-offline.json','switching/browser-switching.json']:
 m=read('docs/content/r37/'+name);assert m['status']=='VERIFIED';assert not m['errors'] and not m['external']
 for f,h in m['sourceFingerprint'].items():assert sha(f)==h,f+' no longer equals tested source'
 for s in m['shots']:
  assert sha(s['path'])==s['sha256'];assert struct.unpack('>II',(ROOT/s['path']).read_bytes()[16:24])==(s['width'],s['height']);media+=1
for name in ['merge/screenshots/manifest.json','store-regression/screenshots/manifest.json']:
 for s in read('docs/content/r37/'+name)['shots']:assert sha(s['path'])==s['sha256'];media+=1
review=read('docs/content/r37/review-set.json');inspection=read('docs/content/r37/review-inspection.json')
assert review['allocation']==dict(cake=5,crossing=5,tickets=5);assert len(review['shots'])==len(inspection['shots'])==15
assert len(list((OUT/'review-set').glob('*.png')))==15
for s,n in zip(review['shots'],inspection['shots']):assert sha(s['path'])==sha(s['source'])==s['sha256']==n['sha256'];assert(s['width'],s['height'])==(390,844)
comparison=read('docs/content/r37/r35-comparison.json');assert comparison['status']=='VERIFIED' and comparison['pairs']==15
walk=read('docs/content/r37/walk-evidence.json');assert walk['status']=='VERIFIED' and not walk['errors'];assert [s['state']['crossed'] for s in walk['shots']]==['0','0','1']
for s in walk['shots']:assert sha(s['path'])==s['sha256']
for f,h in walk['sourceFingerprint'].items():assert sha(f)==h
assert read('docs/content/r37/serial-checks.json')['status']=='VERIFIED'
performance=read('docs/content/r37/performance/performance.json');assert performance['status']=='VERIFIED';assert all(r['p95']<=18 for r in performance['rows'])
assert read('docs/content/r37/secret-scan.json')['matches']==0
for name in ['cleanup-result.json','intermediate-cleanup.json']:
 c=read('docs/content/r37/'+name)
 for r in c['files']:assert not (ROOT/r['path']).exists(),r['path']+' was not deleted'
store=[s for s in read('docs/content/r37/store/browser-store.json')['shots'] if s['path'].startswith('docs/store/screenshots/content-r37/')]
assert {(s['width'],s['height']) for s in store}=={(1290,2796),(2064,2752)}
assert not (ROOT/'dist/r37-reference').exists();assert not (OUT/'crossing').exists()
for link in re.findall(r'\]\(([^)]+)\)',(ROOT/'docs/CODEX_RESPONSE_CONTENT_R37.md').read_text(encoding='utf8')):
 target=(ROOT/'docs'/link).resolve();target.relative_to(ROOT.resolve());assert target.is_file(),link+' broken report link'
assert not git('diff','--check')
result=dict(status='VERIFIED',branch='r1-fun-polish',version='2.47.2',nativeSourceBuild=45,unitTests=342,mergeChecks=132,storeChecks=101,reviewOriginals=15,hashedTestMedia=media,generatedArt=0,scope='R37 crossing presentation; R35 cake and ticket implementation preserved',limitations=['physical devices','parent-child playtest','clean workstation timing','independent Muse re-review','protected cake/ticket requested redesigns'])
(OUT/'verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8');print(json.dumps(result,ensure_ascii=True))
