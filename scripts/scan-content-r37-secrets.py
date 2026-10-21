"""Report match locations only, never credential contents."""
import json,re,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/content/r37'
names=set(subprocess.check_output(['git','ls-files','-z'],cwd=ROOT).decode('utf8').split('\0'))
names.update(p.relative_to(ROOT).as_posix() for base in ['src','scripts','tests','docs/content/r37'] for p in (ROOT/base).rglob('*') if p.is_file())
names.update(['docs/OPTIM_PLAN_CONTENT_R37.md','docs/CODEX_RESPONSE_CONTENT_R37.md'])
pattern=re.compile(rb'sk-proj-[A-Za-z0-9_-]{20,}|sk-[a-z0-9]{40}')
hits=[];count=0
for name in sorted(names):
 p=ROOT/name
 if not name or not p.is_file() or p.is_symlink() or p.suffix.lower() not in ('.js','.mjs','.json','.md','.html','.css','.txt','.py','.xml','.gradle','.plist','.pbxproj','.yaml','.yml','.ps1'):continue
 p.resolve().relative_to(ROOT.resolve());data=p.read_bytes();count+=1
 for m in pattern.finditer(data):hits.append(dict(path=name,line=data[:m.start()].count(b'\n')+1))
result=dict(status='VERIFIED' if not hits else 'BLOCKED',scannedTextFiles=count,matches=len(hits),locations=hits,method='tracked and R37 text files; no secrets directory, no values printed')
(OUT/'secret-scan.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({k:result[k] for k in ['status','scannedTextFiles','matches']}));assert not hits
