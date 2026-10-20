import hashlib,json,shutil
from pathlib import Path
root=Path(__file__).resolve().parents[1];out=root/'docs/evidence/content-r33';out.mkdir(parents=True,exist_ok=True)
cases=[
 ('before-stop-line','docs/content/r32/phone-crossing-1-child-on-zebra.png'),
 ('after-stop-line','docs/content/r33/phone-crossing-stage-1-new-car-yields.png'),
 ('before-seated','docs/content/r32/phone-tickets-stage-1-seated-1.png'),
 ('after-seated','docs/content/r33/phone-tickets-stage-1-seated-3.png'),
 ('phone-bay-main-road','docs/content/r33/phone-cake-bay-main-road.png'),
 ('phone-landscape','docs/content/r33/layout/layout/device-844x390-cabin.png'),
 ('ipad','docs/content/r33/layout/layout/device-768x1024-cabin.png')]
rows=[]
for name,source in cases:
 p=root/source;assert p.is_file(),source
 target=out/(name+'.png');shutil.copy2(p,target)
 digest=hashlib.sha256(p.read_bytes()).hexdigest();assert hashlib.sha256(target.read_bytes()).hexdigest()==digest
 rows.append(dict(path=target.relative_to(root).as_posix(),source=source,sha256=digest))
(out/'before-after.json').write_text(json.dumps(dict(status='VERIFIED',method='byte-identical raw copies, no resize or montage',shots=rows),ensure_ascii=False,indent=2),encoding='utf-8')
print('VERIFIED before/after and three viewports')
