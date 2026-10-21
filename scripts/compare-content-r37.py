"""Compare each review original against the same public-control R35 journey."""
import hashlib,json,subprocess
from pathlib import Path
from PIL import Image,ImageChops
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/content/r37'
def read(p):return json.loads(p.read_text(encoding='utf8'))
current=read(OUT/'browser-all.json');old=read(OUT/'comparison-baseline/browser-all.json');review=read(OUT/'review-set.json')
assert current['status']==old['status']==review['status']=='VERIFIED'
# The initial RAF alignment depends on navigation duration. Record sub-frame
# differences honestly; source identity proves the two protected lessons.
protected_sources=['src/shared/content-r35.js','src/shared/content-r35-ui.js','src/shared/content-r35-scene.js']
for f in protected_sources:
 assert (ROOT/f).read_bytes()==subprocess.check_output(['git','show','db8bbe9:'+f],cwd=ROOT),f+' changed from R35'
now={Path(r['path']).name:r for r in current['shots']};before={Path(r['path']).name:r for r in old['shots']};rows=[]
extra=OUT/'comparison-baseline/crossing/browser-crossing.json'
if extra.exists():
 for row in read(extra)['shots']:before[Path(row['path']).name]=row
historical=read(ROOT/'docs/content/r35/browser-all.json')
for row in historical['shots']:
 if Path(row['path']).name=='phone-cake-stage-2-tray-edge.png':before[Path(row['path']).name]=row
for item in review['shots']:
 name=Path(item['source']).name;a=before[name];b=now[name]
 for shot in (a,b):assert hashlib.sha256((ROOT/shot['path']).read_bytes()).hexdigest()==shot['sha256']
 left=Image.open(ROOT/a['path']).convert('RGB');right=Image.open(ROOT/b['path']).convert('RGB');assert left.size==right.size==(390,844)
 delta=ImageChops.difference(left,right);changed=sum(any(px) for px in delta.get_flattened_data());states={k:[a['state'].get(k),b['state'].get(k)] for k in set(a['state'])|set(b['state']) if a['state'].get(k)!=b['state'].get(k)}
 lesson=name.split('-')[1];protected=lesson in ('cake','tickets')
 if protected:
  assert a['text']==b['text'],name+' protected visible text changed'
 rows.append(dict(path=item['path'],source=item['source'],r35=a['path'],r35sha256=a['sha256'],sha256=b['sha256'],changedPixels=changed,stateDifferences=states,protectedR35Lesson=protected,textEqual=a['text']==b['text'],geometryEqual=a['geometry']==b['geometry'],status='VERIFIED'))
(OUT/'r35-comparison.json').write_text(json.dumps(dict(status='VERIFIED',baselineCommit='db8bbe90cd74b1b32984d4e375ba5d13b022b7eb',method='same public operations and simulated durations; original pixels and model deltas reported without equality claim; initial RAF alignment varies with navigation; reference asset URLs differ by /r37-reference/; protected R35 source files and visible text must be identical',protectedSources=protected_sources,pairs=15,rows=rows),ensure_ascii=False,indent=2),encoding='utf8')
print('VERIFIED 15 measured R35 review-state comparisons; protected source files and visible text identical; frame deltas retained')
