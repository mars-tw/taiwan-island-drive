"""Hash-bound cleanup of superseded tracked media. Never touch untracked files."""
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/content/r25'
ADDITIONAL = '--additional' in sys.argv
PLAN = OUT / ('cleanup-additional-plan.json' if ADDITIONAL else 'cleanup-plan.json')
RESULT = OUT / ('cleanup-additional-result.json' if ADDITIONAL else 'cleanup-result.json')

def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT).decode('utf-8')

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def references(value):
    if isinstance(value, dict):
        for key, item in value.items():
            if key in ('path', 'original', 'source', 'before', 'after') and isinstance(item, str):
                yield item
            elif isinstance(item, (list, dict)):
                yield from references(item)
    elif isinstance(value, list):
        for item in value:
            yield from references(item)

def prepare():
    tracked = set(git('ls-files', '-z').split('\0'))
    dirty = set(git('diff', '--name-only', '-z').split('\0'))
    dependencies = {}
    # Historical release verifiers actually read and hash these manifests'
    # images. Preserve those inputs without freezing obsolete review-set copies.
    for base in ('docs/content', 'docs/evidence'):
        for manifest in (ROOT / base).rglob('*.json'):
            rel = manifest.relative_to(ROOT).as_posix()
            if '/r25/' in rel or '/content-r25/' in rel:
                continue
            if base != 'docs/evidence' and not (manifest.name.startswith('browser') or manifest.name in ('before-images.json', 'before-after.json', 'merge-path.json', 'review-path.json')):
                continue
            try:
                for ref in references(json.loads(manifest.read_text(encoding='utf-8-sig'))):
                    dependencies.setdefault(ref, []).append(rel)
            except (ValueError, UnicodeError):
                pass
    scripts = '\n'.join(p.read_text(encoding='utf-8', errors='replace') for p in (ROOT / 'scripts').rglob('*') if p.is_file() and p.suffix in ('.js', '.mjs', '.py', '.ps1'))
    deleted, retained = [], []
    for rel in sorted(tracked):
        old_content = re.match(r'docs/content/r(?:[1-9]|1[0-9]|2[0-4])/', rel)
        old_evidence = rel.startswith('docs/evidence/') and not rel.startswith('docs/evidence/content-r25/')
        if not (old_content or old_evidence):
            continue
        path = ROOT / rel
        if path.suffix.lower() not in ('.png', '.webp', '.jpg', '.jpeg', '.gif', '.mp4', '.webm') or not path.is_file():
            continue
        path.resolve().relative_to(ROOT.resolve())
        assert not path.is_symlink()
        reason = ('generated source or art contract' if '/art/' in rel else
                  'historical verifier reads and hashes this media' if rel in dependencies else
                  'explicit or templated script filename reference' if rel in scripts or path.name in scripts else
                  'pre-existing modified file' if rel in dirty else '')
        row = dict(path=rel, bytes=path.stat().st_size, sha256=sha(path))
        if reason:
            retained.append(dict(**row, reason=reason, readers=dependencies.get(rel, [])))
        else:
            deleted.append(row)
    result = dict(status='PREPARED', root=str(ROOT), policy='Tracked unmodified old media only. Preserve Markdown, store screenshots, untracked files, art source and verified script inputs.', files=deleted, retained=retained, filesToDelete=len(deleted), bytesToRelease=sum(x['bytes'] for x in deleted))
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
    # Check the entire concrete allowlist before the first unlink.
    for row in plan['files']:
        (ROOT / row['path']).unlink()
    assert all(not (ROOT / row['path']).exists() for row in plan['files'])
    plan.update(status='EXECUTED', deletedFiles=len(plan['files']), releasedBytes=sum(x['bytes'] for x in plan['files']))
    RESULT.write_text(json.dumps(plan, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({k: plan[k] for k in ('status', 'deletedFiles', 'releasedBytes')}))

if __name__ == '__main__':
    apply() if '--apply' in sys.argv else prepare()
