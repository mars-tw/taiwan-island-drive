"""Select fifteen byte-identical raw phone captures, five per existing lesson."""
import hashlib
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/content/r34'
GROUPS = {
    'cake': ['wrong-support', 'late-brake-edge', 'rescued', 'stage-2-bend-1', 'bay-main-road'],
    'crossing': ['stage-2-new-car-yields', 'stage-2-new-car-blocked', 'stage-2-recheck-restored', 'stage-2-joined-right-lane', 'stage-3-finished'],
    'tickets': ['stage-2-wrong-shape', 'stage-3-wrong-color', 'stage-3-threshold-too-early-0', 'stage-3-threshold-stable-0', 'stage-3-seated-3'],
}

def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()

def main():
    m = json.loads((OUT / 'browser-all.json').read_text(encoding='utf-8'))
    assert m['status'] == 'VERIFIED'
    for p, digest in m['sourceFingerprint'].items():
        assert sha(ROOT / p) == digest, p
    images = {r['path']: r for r in m['shots']}
    target = OUT / 'review-set'
    target.mkdir(exist_ok=True)
    rows = []
    for kind, names in GROUPS.items():
        for name in names:
            source = f'docs/content/r34/phone-{kind}-{name}.png'
            record = images[source]
            assert (record['width'], record['height']) == (390, 844)
            assert sha(ROOT / source) == record['sha256']
            dest = target / f'{len(rows)+1:02d}-{kind}-{name}.png'
            shutil.copy2(ROOT / source, dest)
            assert sha(dest) == record['sha256']
            rows.append(dict(path=dest.relative_to(ROOT).as_posix(), source=source, sha256=record['sha256'], width=390, height=844))
    assert len(list(target.iterdir())) == 15
    result = dict(status='VERIFIED', method='byte-identical original phone captures; no resizing or collage', allocation={k: len(v) for k, v in GROUPS.items()}, shots=rows)
    (OUT / 'review-set.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    print('VERIFIED 15 original phone images, 5 per lesson')

if __name__ == '__main__':
    main()
