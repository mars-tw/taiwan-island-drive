"""Remove only this run's superseded, untracked intermediates; preserve every input."""
import hashlib,json,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/content/r33'
assert Path.cwd().resolve()==ROOT
assert subprocess.check_output(['git','branch','--show-current']).decode().strip()=='r1-fun-polish'
baseline=json.loads((OUT/'baseline.json').read_text(encoding='utf-8'))
tracked=set(subprocess.check_output(['git','ls-files','-z']).decode().split('\0'))
candidates=[]
for name in ['crossing','tickets']:
 candidates.extend(p for p in (OUT/name).rglob('*') if p.is_file())
candidates.extend((OUT/'offline').glob('phone-crossing-mirror*.png'))
candidates.extend((OUT/'layout').glob('diagnostic-*.png'))
candidates.extend((ROOT/'scripts/__pycache__').glob('finalize-content-r33.*.pyc'))
for name in ['browser-crossing-output.txt','browser-tickets-output.txt']:
 candidates.append(OUT/name)
for name in ['prepare-content-r33.py','wire-content-r33.py','prepare-content-r33-validation.py','refine-content-r33.py','extend-content-r33-validation.py','tune-content-r33-validation.py','integrate-content-r33-panorama.py','integrate-content-r33-standing.py']:
 candidates.append(ROOT/'scripts'/name)
inputs=set()
for scope in ['all','layout','offline','store','performance']:
 m=json.loads((OUT/(scope if scope!='all' else '')/f'browser-{scope}.json').read_text(encoding='utf-8'))
 assert m['status']=='VERIFIED'
 inputs.update(r['path'] for r in m['shots']);inputs.update(m['sourceFingerprint'])
rows=[]
for p in candidates:
 if not p.is_file():continue
 rel=p.resolve().relative_to(ROOT.resolve()).as_posix()
 assert not p.is_symlink() and rel not in tracked and rel not in baseline['untracked'] and rel not in inputs,rel
 rows.append(dict(path=rel,bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest()))
for row in rows:(ROOT/row['path']).unlink()
assert all(not (ROOT/r['path']).exists() for r in rows)
(OUT/'intermediate-cleanup.json').write_text(json.dumps(dict(status='EXECUTED',files=rows,deletedFiles=len(rows),releasedBytes=sum(r['bytes'] for r in rows)),ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(dict(status='EXECUTED',deletedFiles=len(rows),releasedBytes=sum(r['bytes'] for r in rows))))
