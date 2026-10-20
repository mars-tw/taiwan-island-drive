import json
import subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[1]
command=['rg','-l','-I','--hidden','-g','!.git/**','-g','!node_modules/**','-g','!.audit-tmp/**','-g','!dist/**','-g','!dist-native/**','-g','!output/**','-g','!release/**','-g','!.secrets/**','-e',r'sk-proj-[A-Za-z0-9_-]{20}|sk-[a-z0-9]{40}', '.']
p=subprocess.run(command,cwd=root,capture_output=True)
assert p.returncode in (0,1), 'secret scanner failed'
hits=p.stdout.decode('utf-8').splitlines()
# Never print matching secret contents. Only the count is written.
result={'status':'VERIFIED' if not hits else 'BLOCKED','hits':len(hits),'method':'rg content scan including hidden source/docs; exclude .git, dependencies, generated build/output and secret directories; never print matching values'}
(root/'docs/content/r26/secret-scan.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result))
if hits:raise SystemExit(1)
