"""Remove this run's superseded diagnostic copies, preserving all inherited files."""
import hashlib
import json
import subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/content/r35'
assert Path.cwd().resolve()==ROOT
branch=subprocess.check_output(['git','branch','--show-current'],cwd=ROOT).decode().strip()
assert branch=='r1-fun-polish'
if (OUT/'intermediate-cleanup-result.json').exists():
 receipt=json.loads((OUT/'intermediate-cleanup-result.json').read_text(encoding='utf-8'))
 assert receipt['status']=='EXECUTED' and all(not (ROOT/r['path']).exists() for r in receipt['files'])
 receipt['branchVerifiedAtReadback']=branch
 (OUT/'intermediate-cleanup-result.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps({k:receipt[k] for k in ['status','deletedFiles','releasedBytes']}));raise SystemExit(0)
baseline=json.loads((OUT/'baseline.json').read_text(encoding='utf-8'))
inherited={r['path'] for r in baseline['preexistingUntracked']}|set(baseline['preexistingModified'])
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
files=[]
for name in ['cake','crossing','tickets']:
 target=(OUT/name).resolve();assert target.is_relative_to(OUT.resolve()) and target.name==name
 if target.exists():files.extend(p for p in target.rglob('*') if p.is_file())
files.extend((OUT/'layout').glob('diagnostic-*.png'))
rows=[]
for p in sorted(set(files)):
 p.resolve().relative_to(OUT.resolve());assert not p.is_symlink()
 rel=p.relative_to(ROOT).as_posix();assert rel not in inherited
 rows.append(dict(path=rel,bytes=p.stat().st_size,sha256=sha(p)))
plan=dict(status='PREPARED',root=str(ROOT),branch=branch,scope='only R35 intermediate cake/crossing/tickets scopes and superseded layout diagnostic screenshots',files=rows)
(OUT/'intermediate-cleanup-plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
for r in rows:assert sha(ROOT/r['path'])==r['sha256']
for r in rows:(ROOT/r['path']).unlink()
assert all(not (ROOT/r['path']).exists() for r in rows)
plan.update(status='EXECUTED',deletedFiles=len(rows),releasedBytes=sum(r['bytes'] for r in rows))
(OUT/'intermediate-cleanup-result.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:plan[k] for k in ['status','deletedFiles','releasedBytes']}))
