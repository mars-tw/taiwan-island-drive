"""Remove only this task's superseded captures after their final replacements exist."""
import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/content/r30'
assert ROOT == Path.cwd().resolve()
assert subprocess.check_output(['git','branch','--show-current'],cwd=ROOT).decode().strip() == 'r1-fun-polish'
baseline = json.loads((OUT / 'baseline.json').read_text(encoding='utf-8'))
protected = set(baseline['untracked'])
final = json.loads((OUT / 'browser-cake-nine.json').read_text(encoding='utf-8'))
assert final['status'] == 'VERIFIED'
adopted = {r['path']:r for r in final['shots']}
files = []
for directory in ['replay-1', 'replay-2']:
    for p in sorted((OUT / directory).glob('*.png')):
        replacement = OUT / 'nine' / directory / p.name
        rel = replacement.relative_to(ROOT).as_posix()
        assert rel in adopted and hashlib.sha256(replacement.read_bytes()).hexdigest() == adopted[rel]['sha256']
        files.append(p)
files += [OUT / f'browser-{scope}.json' for scope in ['cake','crossing','tickets','smoke'] if (OUT / f'browser-{scope}.json').exists()]
rows = []
for p in files:
    p.resolve().relative_to(OUT.resolve())
    assert not p.is_symlink() and p.is_file()
    rel = p.relative_to(ROOT).as_posix()
    assert rel not in protected
    rows.append(dict(path=rel, bytes=p.stat().st_size, sha256=hashlib.sha256(p.read_bytes()).hexdigest()))
receipt = dict(status='PREPARED', root=str(OUT.resolve()), files=rows)
(OUT / 'intermediate-cleanup.json').write_text(json.dumps(receipt,indent=2),encoding='utf-8')
for p in files:
    p.unlink()
assert all(not p.exists() for p in files)
receipt.update(status='VERIFIED', deletedFiles=len(rows), releasedBytes=sum(r['bytes'] for r in rows))
(OUT / 'intermediate-cleanup.json').write_text(json.dumps(receipt,indent=2),encoding='utf-8')
print(json.dumps({k:receipt[k] for k in ['status','deletedFiles','releasedBytes']}))
