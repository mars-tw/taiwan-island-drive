"""Copy fifteen native phone captures, five per lesson, with original hashes."""
import hashlib
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT/'docs/content/r36'
GROUPS = {
    'cake': ['wrong-support', 'late-brake-edge', 'rescued', 'stage-2-tray-edge', 'bay-main-road'],
    'crossing': ['stage-2-unobserved', 'stage-2-car-passing', '2-grandma-on-zebra', 'stage-2-grandma-waiting-b', 'stage-2-joined-right-lane'],
    'tickets': ['stage-3-wrong-shape', 'stage-3-wrong-color', 'stage-3-hold-half-0', 'stage-3-hold-paused-0', 'stage-3-seated-3'],
}
manifest = json.loads((OUT/'browser-all.json').read_text(encoding='utf-8'))
assert manifest['status'] == 'VERIFIED'
images = {r['path']:r for r in manifest['shots']}
target = OUT/'review-set'
target.mkdir(exist_ok=True)
rows = []
for kind, names in GROUPS.items():
    for name in names:
        source = f'docs/content/r36/phone-{kind}-{name}.png'
        row = images[source]
        assert (row['width'], row['height']) == (390, 844)
        assert hashlib.sha256((ROOT/source).read_bytes()).hexdigest() == row['sha256']
        destination = target/f'{len(rows)+1:02d}-{kind}-{name}.png'
        shutil.copy2(ROOT/source, destination)
        assert hashlib.sha256(destination.read_bytes()).hexdigest() == row['sha256']
        rows.append(dict(path=destination.relative_to(ROOT).as_posix(), source=source,
                         sha256=row['sha256'], width=390, height=844))
assert len(list(target.iterdir())) == 15
(OUT/'review-set.json').write_text(json.dumps(dict(status='VERIFIED', allocation={k:len(v) for k,v in GROUPS.items()},
    method='byte-identical original headless phone screenshots; no resizing or annotations', shots=rows),ensure_ascii=False,indent=2),encoding='utf-8')
print('VERIFIED 15 native 390x844 screenshots, five per lesson')
