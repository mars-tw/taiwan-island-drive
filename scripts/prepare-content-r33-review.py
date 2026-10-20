"""Select exactly fifteen byte-identical runtime phone frames for visual review."""
import ast,hashlib,json,shutil
from pathlib import Path
root=Path(__file__).resolve().parents[1];out=root/'docs/content/r33'
m=json.loads((out/'browser-all.json').read_text(encoding='utf-8'));assert m['status']=='VERIFIED'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
for f,h in m['sourceFingerprint'].items():assert sha(root/f)==h,f
tree=ast.parse((root/'scripts/finalize-content-r33.py').read_text(encoding='utf-8'))
groups=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='groups' for t in n.targets))
images={r['path']:r for r in m['shots']};review=out/'review-set';review.mkdir(exist_ok=True);rows=[]
for kind,names in groups.items():
 for name in names:
  source=f'docs/content/r33/phone-{kind}-{name}.png';r=images[source];assert (r['width'],r['height'])==(390,844)
  target=review/f'{len(rows)+1:02d}-{kind}-{name}.png';assert sha(root/source)==r['sha256'];shutil.copy2(root/source,target);assert sha(target)==r['sha256']
  rows.append(dict(path=target.relative_to(root).as_posix(),source=source,sha256=r['sha256'],width=390,height=844))
assert len(list(review.iterdir()))==15
(out/'review-set.json').write_text(json.dumps(dict(status='VERIFIED',method='byte-identical raw phone captures; no resizing or collage',allocation={k:len(v) for k,v in groups.items()},shots=rows),ensure_ascii=False,indent=2),encoding='utf-8')
print('VERIFIED fifteen current phone originals selected')
