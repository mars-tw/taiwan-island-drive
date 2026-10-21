"""Five original phone captures per lesson, byte-for-byte copies."""
import hashlib,json,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/content/r37'
GROUPS={
 'cake':['wrong-support','late-brake-edge','rescued','stage-2-tray-edge','complete'],
 'crossing':['stage-2-unobserved','stage-2-only-source-main','stage-2-turning-right','stage-2-departing','stage-2-joined-right-lane'],
 'tickets':['stage-3-wrong-shape','stage-3-wrong-color','stage-3-hold-half-0','stage-3-hold-paused-0','stage-3-closed-departing']}
def main():
 m=json.loads((OUT/'browser-all.json').read_text(encoding='utf8'));assert m['status']=='VERIFIED'
 images={r['path']:r for r in m['shots']};target=OUT/'review-set';target.mkdir(exist_ok=True);rows=[]
 for kind,names in GROUPS.items():
  for name in names:
   source=f'docs/content/r37/phone-{kind}-{name}.png';row=images[source];assert(row['width'],row['height'])==(390,844)
   content=(ROOT/source).read_bytes();assert hashlib.sha256(content).hexdigest()==row['sha256']
   dest=target/f'{len(rows)+1:02d}-{kind}-{name}.png';shutil.copy2(ROOT/source,dest)
   rows.append(dict(path=dest.relative_to(ROOT).as_posix(),source=source,width=390,height=844,sha256=row['sha256']))
 assert len(list(target.glob('*.png')))==15
 (OUT/'review-set.json').write_text(json.dumps(dict(status='VERIFIED',method='original headless phone captures; no resizing or annotation',allocation={k:5 for k in GROUPS},shots=rows),ensure_ascii=False,indent=2),encoding='utf8')
 print('VERIFIED 15 original phone captures, five per lesson')
if __name__=='__main__':main()
