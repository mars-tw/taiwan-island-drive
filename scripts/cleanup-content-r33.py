"""Hash-bound allowlist; never removes untracked, modified, store or source art."""
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/content/r33'
def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT).decode('utf-8')
def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()
def refs(v):
    if isinstance(v, dict):
        for k, x in v.items():
            if k in ('path', 'source', 'original', 'before', 'after') and isinstance(x, str):
                yield x
            elif isinstance(x, (dict, list)):
                yield from refs(x)
    elif isinstance(v, list):
        for x in v:
            yield from refs(x)
def prepare():
    assert Path.cwd().resolve() == ROOT.resolve()
    assert git('branch', '--show-current').strip() == 'r1-fun-polish'
    tracked = set(git('ls-files', '-z').split('\0'))
    dirty = set(git('diff', '--name-only', '-z').split('\0'))
    dependencies = {}
    # Historical release verifiers read browser-manifest images as SHA inputs.
    # Review-set copies are rebuilt from these sources by the historical tools.
    for base in ('docs/content', 'docs/evidence'):
        for p in (ROOT / base).rglob('*.json'):
            if OUT in p.parents:
                continue
            if not (p.name.startswith('browser') or p.name in ('before-images.json', 'before-after.json', 'merge-path.json', 'review-path.json')):
                continue
            try:
                for ref in refs(json.loads(p.read_text(encoding='utf-8-sig'))):
                    dependencies.setdefault(ref, []).append(p.relative_to(ROOT).as_posix())
            except (ValueError, UnicodeError):
                pass
    source = '\n'.join(p.read_text(encoding='utf-8', errors='replace') for base in ('scripts', 'tests') for p in (ROOT / base).rglob('*') if p.is_file() and p.suffix in ('.js', '.mjs', '.py', '.ps1'))
    files, retained = [], []
    for rel in sorted(tracked):
        if rel.startswith('docs/evidence/content-r33/'):
            continue
        if not (re.match(r'docs/content/r(?:[1-9]|[12]\d|3[012])/', rel) or rel.startswith('docs/evidence/')):
            continue
        p = ROOT / rel
        if p.suffix.lower() not in ('.png', '.webp', '.jpg', '.jpeg', '.gif', '.mp4', '.webm') or not p.is_file():
            continue
        resolved = p.resolve()
        resolved.relative_to(ROOT.resolve())
        assert not p.is_symlink()
        reason = ('original art or art contract' if '/art/' in rel else 'historical validation manifest reads and hashes media' if rel in dependencies else 'explicit validation input reference' if rel in source or p.name in source else 'pre-existing modification' if rel in dirty else '')
        row = dict(path=rel, bytes=p.stat().st_size, sha256=sha(p))
        (retained if reason else files).append(dict(**row, reason=reason, readers=dependencies.get(rel, [])) if reason else row)
    plan = dict(status='PREPARED', root=str(ROOT), branch='r1-fun-polish', files=files, retained=retained, filesToDelete=len(files), bytesToRelease=sum(r['bytes'] for r in files))
    (OUT / 'cleanup-plan.json').write_text(json.dumps(plan, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({k: plan[k] for k in ('status', 'filesToDelete', 'bytesToRelease')}))
def apply():
    plan = json.loads((OUT / 'cleanup-plan.json').read_text(encoding='utf-8'))
    assert Path(plan['root']).resolve() == ROOT.resolve() == Path.cwd().resolve()
    assert git('branch', '--show-current').strip() == plan['branch']
    tracked = set(git('ls-files', '-z').split('\0'))
    dirty = set(git('diff', '--name-only', '-z').split('\0'))
    for row in plan['files']:
        p = ROOT / row['path']
        p.resolve().relative_to(ROOT.resolve())
        assert row['path'] in tracked and row['path'] not in dirty
        assert p.is_file() and not p.is_symlink() and sha(p) == row['sha256']
    for row in plan['files']:
        (ROOT / row['path']).unlink()
    assert all(not (ROOT / row['path']).exists() for row in plan['files'])
    plan.update(status='EXECUTED', deletedFiles=len(plan['files']), releasedBytes=sum(r['bytes'] for r in plan['files']))
    (OUT / 'cleanup-result.json').write_text(json.dumps(plan, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({k: plan[k] for k in ('status', 'deletedFiles', 'releasedBytes')}))
if __name__ == '__main__':
    apply() if '--apply' in sys.argv else prepare()
