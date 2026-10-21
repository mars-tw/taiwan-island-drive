"""Stage only this round's explicit files, preserving every inherited path."""
import hashlib
import json
import subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/content/r35'
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT).decode('utf-8')
assert Path.cwd().resolve()==ROOT
baseline=json.loads((OUT/'baseline.json').read_text(encoding='utf-8'))
assert git('branch','--show-current').strip()=='r1-fun-polish'
assert git('rev-parse','HEAD').strip()==baseline['head']
assert json.loads((OUT/'release-verification.json').read_text(encoding='utf-8'))['status']=='VERIFIED'
report=(ROOT/'docs/CODEX_RESPONSE_CONTENT_R35.md').read_text(encoding='utf-8')
assert '???' not in report and '4張runtime PNG／4次image_gen.imagegen' in report
paths=[
 'CREDITS.md','README.md','android/app/build.gradle','ios/App/App.xcodeproj/project.pbxproj',
 'package-lock.json','package.json','public/models/catalog.json','src/games/car/config.js',
 'src/shared/content-r1-ui.js','src/shared/content-r35.js','src/shared/content-r35-scene.js','src/shared/content-r35-ui.js','src/shared/content-r35.css',
 'tests/shared/content-r35.test.js','docs/art/ART_DIRECTION.md','docs/OPTIM_PLAN_CONTENT_R35.md','docs/CODEX_RESPONSE_CONTENT_R35.md',
 *['scripts/'+name for name in ['audit-content-r35-art.mjs','capture-content-r35-before.mjs','check-content-r35.mjs','cleanup-content-r35.py','cleanup-content-r35-intermediates.py','prepare-content-r35-art.mjs','prepare-content-r35-review.py','playwright-regression-r35.mjs','record-content-r35-inspection.py','scan-content-r35-secrets.py','stage-content-r35.py','verify-content-r35.py','write-content-r35-report.py']],
]
for directory in ['public/art/content-r35','docs/content/r35','docs/evidence/content-r35','docs/store/screenshots/content-r35']:
 for p in (ROOT/directory).rglob('*'):
  if p.is_file() and p.suffix!='.log':
   p.resolve().relative_to(ROOT);assert not p.is_symlink();paths.append(p.relative_to(ROOT).as_posix())
paths.extend(r['path'] for r in json.loads((OUT/'cleanup-result.json').read_text(encoding='utf-8'))['files'])
paths=sorted(set(paths));inherited={r['path'] for r in baseline['preexistingUntracked']}|set(baseline['preexistingModified'])
assert not inherited.intersection(paths)
for r in baseline['preexistingUntracked']:assert hashlib.sha256((ROOT/r['path']).read_bytes()).hexdigest()==r['sha256']
assert set(filter(None,git('diff','--name-only','-z').split('\0'))).issubset(paths)
staged=set(filter(None,git('diff','--cached','--no-renames','--name-only','-z').split('\0')))
assert staged.issubset(paths),'unexpected staged paths outside this round'
receipt='docs/content/r35/staging-plan.json';paths.append(receipt);paths=sorted(set(paths))
(ROOT/receipt).write_text(json.dumps(dict(status='PREPARED',branch='r1-fun-polish',base=baseline['head'],method='git add -- followed by explicit file paths, batched below Windows command-line limit',paths=paths),ensure_ascii=False,indent=2),encoding='utf-8')
indexed=set(filter(None,git('ls-files','-z').split('\0')))
to_add=[p for p in paths if (ROOT/p).exists() or p in indexed]
for start in range(0,len(to_add),75):subprocess.run(['git','add','--',*to_add[start:start+75]],cwd=ROOT,check=True)
actual=set(filter(None,git('diff','--cached','--no-renames','--name-only','-z').split('\0')))
assert actual==set(paths),dict(missing=sorted(set(paths)-actual),unexpected=sorted(actual-set(paths)))
print(json.dumps(dict(status='VERIFIED',stagedFiles=len(paths),inheritedFilesPreserved=len(baseline['preexistingUntracked']))))
