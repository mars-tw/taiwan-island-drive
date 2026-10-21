"""Serial headless checks against the one existing loopback preview."""
import json,os,subprocess,sys,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/content/r37'
assert Path.cwd().resolve()==ROOT.resolve()
rows=[]
for scope in sys.argv[1:] or ['layout','store','performance','offline']:
 assert scope in ('all','layout','store','performance','offline','switching')
 env=dict(os.environ,R37_SCOPE=scope);env.pop('PLAYWRIGHT_MODULE',None)
 path=OUT/(scope+'-output.txt');start=time.time()
 with path.open('w',encoding='utf8') as f:r=subprocess.run(['node','scripts/check-content-r37.mjs'],cwd=ROOT,env=env,stdout=f,stderr=subprocess.STDOUT,creationflags=subprocess.CREATE_NO_WINDOW)
 rows.append(dict(scope=scope,exitCode=r.returncode,seconds=round(time.time()-start,2),log=path.relative_to(ROOT).as_posix()))
 (OUT/'serial-checks.json').write_text(json.dumps(dict(status='VERIFIED' if all(r['exitCode']==0 for r in rows) else 'BLOCKED',rows=rows),indent=2),encoding='utf8')
 print(scope,r.returncode,flush=True)
 if r.returncode:print(path.read_text(encoding='utf8')[-3500:]);raise SystemExit(r.returncode)
