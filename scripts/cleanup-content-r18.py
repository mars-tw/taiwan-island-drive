"""Remove only superseded tracked evidence; retain historical verifier inputs."""
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/content/r18'
PLAN = OUT / 'cleanup-plan.json'

def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT).decode('utf-8')

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def image_paths(value):
    if isinstance(value, dict):
        for key, item in value.items():
            if key in ('path', 'original', 'source') and isinstance(item, str):
                yield item
            elif isinstance(item, (list, dict)):
                yield from image_paths(item)
    elif isinstance(value, list):
        for item in value:
            yield from image_paths(item)

def prepare():
    tracked = set(git('ls-files', '-z').split('\0'))
    dirty = set(git('diff', '--name-only', '-z').split('\0'))
    dependencies = set()
    # Historical release verifiers load browser manifests then read every PNG
    # and verify its hash. Those inputs must survive this cleanup.
    for manifest in (ROOT / 'docs/content').glob('r*/**/browser*.json'):
        if '/r18/' in manifest.as_posix():
            continue
        try:
            dependencies.update(image_paths(json.loads(manifest.read_text(encoding='utf-8-sig'))))
        except (ValueError, UnicodeError):
            pass
    for manifest in (ROOT / 'docs/evidence').rglob('*.json'):
        if '/content-r18/' in manifest.as_posix():
            continue
        try:
            dependencies.update(image_paths(json.loads(manifest.read_text(encoding='utf-8-sig'))))
        except (ValueError, UnicodeError):
            pass
    scripts = '\n'.join(p.read_text(encoding='utf-8', errors='replace') for p in (ROOT / 'scripts').rglob('*') if p.is_file() and p.suffix in ('.js', '.mjs', '.py', '.ps1'))
    deleted, retained = [], []
    for rel in sorted(tracked):
        if not re.match(r'docs/content/r(?:[1-9]|1[0-7])/', rel) and not re.match(r'docs/evidence/content-r(?:[1-9]|1[0-7])/', rel):
            continue
        path = ROOT / rel
        if path.suffix.lower() not in ('.png', '.webp', '.jpg', '.jpeg', '.gif', '.mp4', '.webm') or not path.is_file():
            continue
        path.resolve().relative_to(ROOT.resolve())
        reason = ('generated source or art contract' if '/art/' in rel else
                  'historical browser manifest is a verifier input' if rel in dependencies else
                  'explicit or templated script filename reference' if rel in scripts or path.name in scripts else
                  'pre-existing modified file' if rel in dirty else '')
        row = dict(path=rel, bytes=path.stat().st_size)
        if reason:
            retained.append(dict(**row, reason=reason))
        else:
            deleted.append(dict(**row, sha256=sha(path)))
    result = dict(status='PREPARED', root=str(ROOT), policy='Tracked old-round media only; preserve Markdown, store screenshots, untracked files, source art and all known script inputs.', files=deleted, retained=retained, filesToDelete=len(deleted), bytesToRelease=sum(x['bytes'] for x in deleted))
    PLAN.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({k: result[k] for k in ('status', 'filesToDelete', 'bytesToRelease')}))

def apply():
    plan = json.loads(PLAN.read_text(encoding='utf-8'))
    assert Path(plan['root']).resolve() == ROOT.resolve()
    tracked = set(git('ls-files', '-z').split('\0'))
    dirty = set(git('diff', '--name-only', '-z').split('\0'))
    for row in plan['files']:
        path = ROOT / row['path']
        path.resolve().relative_to(ROOT.resolve())
        assert row['path'] in tracked and row['path'] not in dirty
        assert path.is_file() and not path.is_symlink() and sha(path) == row['sha256']
    # Validate the complete allowlist before the first deletion.
    for row in plan['files']:
        (ROOT / row['path']).unlink()
    assert all(not (ROOT / row['path']).exists() for row in plan['files'])
    plan['status'] = 'EXECUTED'
    plan['deletedFiles'] = len(plan['files'])
    plan['releasedBytes'] = sum(x['bytes'] for x in plan['files'])
    (OUT / 'cleanup-result.json').write_text(json.dumps(plan, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({k: plan[k] for k in ('status', 'deletedFiles', 'releasedBytes')}))

if __name__ == '__main__':
    apply() if '--apply' in sys.argv else prepare()
