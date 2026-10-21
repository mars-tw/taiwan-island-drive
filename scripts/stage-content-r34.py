"""Stage only the explicit R34 allowlist; preserve all prior untracked files."""
import hashlib
import json
import subprocess
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/content/r34'
git = lambda *args: subprocess.check_output(['git', *args], cwd=ROOT).decode('utf-8')
assert ROOT == Path.cwd().resolve()
assert git('branch', '--show-current').strip() == 'r1-fun-polish'
assert json.loads((OUT / 'release-verification.json').read_text(encoding='utf-8'))['status'] == 'VERIFIED'
paths = [
 'README.md', 'android/app/build.gradle', 'ios/App/App.xcodeproj/project.pbxproj',
 'package.json', 'package-lock.json', 'public/models/catalog.json', 'src/games/car/config.js',
 'src/shared/content-r1-ui.js', 'src/shared/content-r33-scene.js', 'src/shared/content-r33.css',
 'tests/shared/content-r34.test.js', 'docs/OPTIM_PLAN_CONTENT_R34.md', 'docs/CODEX_RESPONSE_CONTENT_R34.md',
 'scripts/check-content-r34.mjs', 'scripts/cleanup-content-r34.py', 'scripts/scan-content-r34-secrets.py',
 'scripts/playwright-cpu-r34.mjs', 'scripts/playwright-regression-r34.mjs',
 'scripts/prepare-content-r34-review.py', 'scripts/record-content-r34-inspection.py',
 'scripts/verify-content-r34.py', 'scripts/write-content-r34-report.py', 'scripts/stage-content-r34.py',
 'docs/content/r34', 'docs/evidence/content-r34', 'docs/store/screenshots/content-r34',
]
deleted = [r['path'] for r in json.loads((OUT / 'cleanup-result.json').read_text(encoding='utf-8'))['files']]
assert set(git('diff', '--name-only', '-z').split('\0')) - {''} <= set(paths + deleted)
baseline = json.loads((OUT / 'baseline.json').read_text(encoding='utf-8'))
for f, digest in baseline['untracked'].items():
 assert hashlib.sha256((ROOT / f).read_bytes()).hexdigest() == digest
 assert not any(f == p or f.startswith(p + '/') for p in paths), f
(OUT / 'stage-plan.json').write_text(json.dumps(dict(status='PREPARED', branch='r1-fun-polish', explicitPaths=paths + deleted), ensure_ascii=False, indent=2), encoding='utf-8')
subprocess.run(['git', 'add', '--', *paths, *deleted], cwd=ROOT, check=True)
staged = {p for p in git('diff', '--cached', '--name-only', '-z').split('\0') if p}
assert all(any(f == p or f.startswith(p + '/') for p in paths + deleted) for f in staged)
assert not staged.intersection(baseline['untracked'])
subprocess.run(['git', 'diff', '--cached', '--check'], cwd=ROOT, check=True)
print('VERIFIED explicit staged files:', len(staged))
