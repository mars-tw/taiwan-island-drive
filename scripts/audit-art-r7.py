"""Read-only source/client secret scan and R7 branch/version provenance."""
from pathlib import Path
import hashlib,json,re,subprocess
ROOT=Path(__file__).resolve().parents[1];BASELINE='d29ab17'
items=subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard','-z'],cwd=ROOT).decode().split('\0')
files={ROOT/n for n in items if n and not any(part in ['.git','node_modules','.secrets','output','.audit-tmp'] for part in Path(n).parts)}
files.update(p for p in (ROOT/'dist').rglob('*') if p.is_file() and p.suffix.lower() in ['.js','.html','.css','.json','.webmanifest'])
pattern=re.compile(rb'sk-proj-[A-Za-z0-9_-]{20,}|sk-[a-z0-9]{40}',re.I)
binary={'.png','.jpg','.jpeg','.webp','.glb','.blend','.woff','.woff2','.ttf','.otf','.mp3','.ogg','.wav','.mp4','.zip','.ico','.pdf'}
hits=[];count=0
for p in sorted(files):
    if not p.is_file() or p.suffix.lower() in binary:continue
    count+=1
    if pattern.search(p.read_bytes()):hits.append(p.relative_to(ROOT).as_posix())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
model=(ROOT/'public/models/coupe.glb').read_bytes();doc=json.loads(model[20:20+int.from_bytes(model[12:16],'little')]);raw=json.dumps(doc)
reviews=[ROOT/p for p in ['docs/art/ART_RESCORE3_MUSE.md','docs/art/ART_RESCORE2_MUSE.md','docs/art/ART_REVIEW_MUSE.md']]
report={'status':'VERIFIED' if not hits else 'BLOCKED','baseline':BASELINE,'scope':'Tracked and new source text plus current dist client JS/HTML/CSS/JSON; .git, node_modules, secret directories, output and binary art excluded.','scanned_text_files':count,'secret_matches':len(hits),'matched_paths':hits,'new_model_private_absolute_paths':len(re.findall(r'C:\\\\Users|/Users/|/home/',raw,re.I)),'test_changes':subprocess.check_output(['git','diff',BASELINE,'--name-only','--','tests'],cwd=ROOT).decode().splitlines(),'branch':subprocess.check_output(['git','branch','--show-current'],cwd=ROOT).decode().strip(),'version':json.loads((ROOT/'package.json').read_text(encoding='utf-8'))['version'],'review_sources':[{'path':p.relative_to(ROOT).as_posix(),'sha256':sha(p)} for p in reviews if p.exists()],'review_sources_missing':[p.relative_to(ROOT).as_posix() for p in reviews if not p.exists()],'dist_entries':{p:sha(ROOT/'dist'/p) for p in ['index.html','car/index.html','train/index.html','flight/index.html']}}
assert not hits and not report['test_changes'] and report['branch']=='r1-fun-polish'
(ROOT/'docs/art/source-audit-r7.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:report[k] for k in ['status','scanned_text_files','secret_matches','new_model_private_absolute_paths','test_changes','branch','version']},ensure_ascii=False))
