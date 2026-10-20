"""Verify final R32 captures, source hashes, saves, regressions and exact review copies."""
import hashlib
import json
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/content/r32'
def read(p):
    return json.loads((ROOT / p).read_text(encoding='utf-8-sig'))
def write(p, v):
    (ROOT / p).write_text(json.dumps(v, ensure_ascii=False, indent=2), encoding='utf-8')
def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()
def log(p):
    b=(ROOT/p).read_bytes()
    return b.decode('utf-16') if b.startswith(b'\xff\xfe') else b.decode('utf-8')

assert Path.cwd().resolve() == ROOT.resolve()
assert subprocess.check_output(['git','branch','--show-current']).decode().strip() == 'r1-fun-polish'
assert read('package.json')['version'] == '2.44.0'
baseline=read('docs/content/r32/baseline.json')
for f,digest in baseline['existingTestByteHashes'].items():
    assert sha(ROOT/f)==digest, f
assert all((ROOT/f).is_file() for f in baseline['untracked'])
cleanup=read('docs/content/r32/cleanup-result.json')
assert cleanup['status']=='EXECUTED'
assert all(not (ROOT/r['path']).exists() for r in cleanup['files'])
images={}
for scope in ['all','layout','offline','store','performance']:
    path=f'docs/content/r32/{scope+"/" if scope!="all" else ""}browser-{scope}.json'
    m=read(path)
    assert m['status']=='VERIFIED',scope
    assert not m['errors'] and not m['external']
    for f,digest in m['sourceFingerprint'].items():
        assert sha(ROOT/f)==digest,(scope,f)
    assert len({r['path'] for r in m['shots']})==len(m['shots']),scope+' unique paths'
    for r in m['shots']:
        assert sha(ROOT/r['path'])==r['sha256'],r['path']
        assert not any(c['bad'] for c in r['controls'])
        assert not r['clipping']
        images[r['path']]=r

groups={
 'cake':['wrong-support','late-brake-edge','rescued','bay-parked','bay-main-road'],
 'crossing':['1-child-before','1-child-on-zebra','1-child-arrived','stage-1-clear-needs-recheck','stage-1-ready'],
 'tickets':['stage-1-wrong-color','stage-1-invitation-0','stage-1-threshold-0','stage-1-aisle-0','stage-1-seated-1'],
}
review=OUT/'review-set'
review.mkdir(exist_ok=True)
rows=[]
for kind,states in groups.items():
    for state in states:
        source=f'docs/content/r32/phone-{kind}-{state}.png'
        r=images[source]
        assert (r['width'],r['height'])==(390,844)
        target=review/f'{len(rows)+1:02d}-{kind}-{state}.png'
        shutil.copyfile(ROOT/source,target)
        assert sha(target)==r['sha256']
        rows.append(dict(path=target.relative_to(ROOT).as_posix(),source=source,sha256=r['sha256'],width=390,height=844,lesson=kind))
assert len(list(review.iterdir()))==15
write('docs/content/r32/review-set.json',dict(status='VERIFIED',allocation={k:5 for k in groups},method='byte-identical original phone captures, no montage or resize',shots=rows))

for stage in [1,2,3]:
    for who in ['child','bike','grandma']:
        for step in ['before','on-zebra','arrived']:
            assert f'docs/content/r32/phone-crossing-{stage}-{who}-{step}.png' in images
    for step in ['car-approach','car-passing','car-leaving','car-left']:
        assert f'docs/content/r32/phone-crossing-stage-{stage}-{step}.png' in images
    for step in ['wrong-shape','wrong-color','threshold-0','aisle-0','seated-1','seated-3']:
        assert f'docs/content/r32/phone-tickets-stage-{stage}-{step}.png' in images

threshold=images['docs/content/r32/phone-tickets-stage-1-threshold-0.png']
aisle=images['docs/content/r32/phone-tickets-stage-1-aisle-0.png']
seat=images['docs/content/r32/phone-tickets-stage-1-seated-1.png']
assert '69%' in threshold['text']
assert '86%' in aisle['text']
assert all('已入座 0/3 人' in r['text'] for r in [threshold,aisle])
assert '已入座 1/3 人' in seat['text']
for k in groups:
    a=images[f'docs/content/r32/phone-{k}-opening.png']['state']
    b=images[f'docs/content/r32/phone-{k}-replay-opening.png']['state']
    assert a['layoutSeed']=='0' and b['layoutSeed']=='1'
    assert a['bend']!=b['bend'] if k=='cake' else a['trafficSource']!=b['trafficSource'] if k=='crossing' else a['targetName']!=b['targetName']
assert 'tests 326' in log('docs/content/r32/tests-output.txt') and 'fail 0' in log('docs/content/r32/tests-output.txt')
assert 'built in' in log('docs/content/r32/build-output.txt')
regressions={}
for k,manifest in [('merge','docs/content/r32/merge/merge-path.json'),('store','docs/content/r32/store-regression/review-path.json')]:
    m=read(manifest)
    assert not m['errors'] and not m['externalRequests']
    assert all(not row.get('problems') for row in m['rows'])
    regressions[k]=len(m['rows'])
    assert 'PASS' in log(f'docs/content/r32/{k}-output.txt')
    capture=read(f'docs/store/screenshots/content-r32/{"merge-regression" if k=="merge" else "store-regression"}/manifest.json')
    assert capture['status']==('EXECUTED' if k=='merge' else 'VERIFIED') and capture['sourceVersion']=='2.44.0'
    if k=='store':
        assert capture['buildWorkerSha256']==sha(ROOT/'dist/sw.js')
    for row in capture['shots']:
        assert sha(ROOT/row['path'])==row['sha256'],row['path']
performance=read('docs/content/r32/performance/performance.json')
assert performance['status']=='VERIFIED' and all(r['p95']<=18 for r in performance['rows'])
assert read('docs/content/r32/secret-scan.json')['hits']==0
store=read('docs/content/r32/store/browser-store.json')['shots']
store=[r for r in store if r['path'].startswith('docs/store/')]
assert sorted((r['width'],r['height']) for r in store)==[(1290,2796),(2064,2752)]
art=[]
for f in ['docs/content/r32/art/train-cabin-source.png','public/art/content-r32/train-cabin.webp']:
    art.append(dict(path=f,sha256=sha(ROOT/f)))
write('docs/content/r32/art-manifest.json',dict(status='VERIFIED',newGeneratedArt=1,generationCalls=1,tool='image_gen.imagegen',model_slug=None,prompts='docs/content/r32/art/PROMPTS.json',sources=art))
result=dict(status='VERIFIED',version='2.44.0',nativeSourceBuild=40,unitTests=326,regressions=regressions,originalImages=len(images),reviewImages=15,newArt=1,deletedFiles=cleanup['deletedFiles'],releasedBytes=cleanup['releasedBytes'],preexistingFilesPreserved=len(baseline['untracked']),unchangedExistingTests=len(baseline['existingTests']),p95=[r['p95'] for r in performance['rows']],blocked=['physical devices and native voice','family playtest and three adult interpretation','clean-machine performance','independent Muse >=8 review'])
write('docs/content/r32/release-verification.json',result)
print(json.dumps(result,ensure_ascii=False))
