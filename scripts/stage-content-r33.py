"""Stage an explicit ownership allowlist, excluding all pre-existing untracked input."""
import hashlib,json,subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[1]
assert Path.cwd().resolve()==root
def git(*args):return subprocess.check_output(['git',*args]).decode('utf-8')
assert git('branch','--show-current').strip()=='r1-fun-polish'
assert not git('diff','--cached','--name-only').strip(),'Existing staged work must be preserved'
b=json.loads((root/'docs/content/r33/baseline.json').read_text(encoding='utf-8'))
for f,h in b['untracked'].items():assert hashlib.sha256((root/f).read_bytes()).hexdigest()==h,f
for f,h in b['existingTests'].items():assert hashlib.sha256((root/f).read_bytes()).hexdigest()==h,f
files=['README.md','android/app/build.gradle','ios/App/App.xcodeproj/project.pbxproj','package.json','package-lock.json','public/sw.js','src/games/car/config.js','src/shared/content-r1-ui.js','src/shared/content-r33.js','src/shared/content-r33-scene.js','src/shared/content-r33.css','tests/shared/content-r33.test.js','docs/art/ART_DIRECTION.md','docs/OPTIM_PLAN_CONTENT_R33.md','docs/CODEX_RESPONSE_CONTENT_R33.md']
files += ['scripts/'+n for n in ['audit-content-r33-art.mjs','capture-content-r33-bay-entry.mjs','check-content-r33.mjs','cleanup-content-r33.py','cleanup-content-r33-intermediates.py','finalize-content-r33.py','prepare-content-r33-art.mjs','prepare-content-r33-evidence.py','prepare-content-r33-review.py','record-content-r33-inspection.py','scan-content-r33-secrets.py','write-content-r33-report.py','stage-content-r33.py']]
directories=['docs/content/r33','docs/evidence/content-r33','docs/store/screenshots/content-r33','public/art/content-r33']
cleanup=json.loads((root/'docs/content/r33/cleanup-result.json').read_text(encoding='utf-8'))
deleted=[r['path'] for r in cleanup['files']]
assert all(not (root/f).exists() for f in deleted)
tracked=set(git('ls-files','-z').split('\0'))
subprocess.run(['git','add','--',*files,*directories,*[f for f in deleted if f in tracked]],check=True)
staged=[f for f in git('diff','--cached','--name-only','-z').split('\0') if f]
assert not (set(staged)&set(b['untracked']))
assert all(f in files or f in deleted or any(f.startswith(d+'/') for d in directories) for f in staged)
receipt=root/'docs/content/r33/staged-paths.json'
receipt.write_text(json.dumps(dict(status='EXECUTED',branch='r1-fun-polish',paths=staged),ensure_ascii=False,indent=2),encoding='utf-8')
subprocess.run(['git','add','--','docs/content/r33/staged-paths.json'],check=True)
subprocess.run(['git','diff','--cached','--check'],check=True)
print(git('diff','--cached','--shortstat').strip())
