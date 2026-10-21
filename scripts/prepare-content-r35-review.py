"""Select fifteen exact runtime phone images; no rescaling or annotations."""
import hashlib
import json
import shutil
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/content/r35'
GROUPS={
 'cake':['wrong-support','late-brake-edge','rescued','stage-2-tray-edge','bay-main-road'],
 'crossing':['stage-2-grandma-waiting-a','stage-2-car-passing','2-grandma-on-zebra','stage-2-grandma-waiting-b','stage-2-joined-right-lane'],
 'tickets':['stage-3-hold-start-0','stage-3-hold-half-0','stage-3-hold-paused-0','stage-3-hold-full-0','stage-3-seated-3'],
}
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
m=json.loads((OUT/'browser-all.json').read_text(encoding='utf-8'))
assert m['status']=='VERIFIED'
for p,digest in m['sourceFingerprint'].items():assert sha(ROOT/p)==digest,p
images={r['path']:r for r in m['shots']}
target=OUT/'review-set';target.mkdir(exist_ok=True)
rows=[]
for kind,names in GROUPS.items():
 for name in names:
  src=f'docs/content/r35/phone-{kind}-{name}.png';r=images[src]
  assert (r['width'],r['height'])==(390,844) and sha(ROOT/src)==r['sha256']
  dst=target/f'{len(rows)+1:02d}-{kind}-{name}.png';shutil.copy2(ROOT/src,dst)
  assert sha(dst)==r['sha256']
  rows.append(dict(path=dst.relative_to(ROOT).as_posix(),source=src,sha256=r['sha256'],width=390,height=844))
assert len(list(target.iterdir()))==15
(OUT/'review-set.json').write_text(json.dumps(dict(status='VERIFIED',method='byte-identical original phone runtime capture',allocation={k:len(v) for k,v in GROUPS.items()},shots=rows),ensure_ascii=False,indent=2),encoding='utf-8')
print('VERIFIED 15 originals, five per lesson')
