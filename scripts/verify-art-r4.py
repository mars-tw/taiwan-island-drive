"""Read-only provenance, delivery and secret-format gate. Never traverses secrets."""
from pathlib import Path
from PIL import Image
import json, hashlib, re
ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'docs/art/asset-manifest.json').read_text(encoding='utf-8'))
errors=[]
for entry in manifest['sources']+manifest['outputs']:
    for row in [entry]+[entry[k] for k in ['alpha_mask','opaque_rgb'] if k in entry]:
        p=ROOT/row['path']
        if not p.is_file() or hashlib.sha256(p.read_bytes()).hexdigest()!=row['sha256']:errors.append('hash: '+row['path'])
    if entry in manifest['outputs']:
        im=Image.open(ROOT/entry['path'])
        if tuple(entry['size'])!=im.size:errors.append('dimensions: '+entry['path'])
        if im.mode=='RGBA' and any(entry['corner_alpha']):errors.append('opaque corner: '+entry['path'])
assert manifest['coach_dual_gate']
excluded={'.git','node_modules','.secrets'}
patterns=[re.compile(rb'sk-proj-[A-Za-z0-9_-]{20}'),re.compile(rb'sk-[a-z0-9]{40}')]
checked=0;hits=[]
def walk(folder):
    global checked
    for p in folder.iterdir():
        if p.is_symlink() or p.name in excluded:continue
        if p.is_dir():walk(p)
        elif p.is_file():
            checked+=1
            if any(x.search(p.read_bytes()) for x in patterns):hits.append(p.relative_to(ROOT).as_posix())
walk(ROOT)
sources=['src','public','android/app/build.gradle','ios/App/App.xcodeproj/project.pbxproj']
old=[]
for scope in sources:
    p=ROOT/scope
    for f in (p.rglob('*') if p.is_dir() else [p]):
        if not f.is_file() or any(x in f.parts for x in ['build','public'] if scope.startswith('android')):continue
        if f.suffix in ['.js','.json','.webmanifest','.gradle','.pbxproj'] and '2.7.0' in f.read_text(encoding='utf-8',errors='ignore'):old.append(f.relative_to(ROOT).as_posix())
result={'status':'VERIFIED' if not errors and not hits and not old and all(x['pass'] for x in manifest['character_gates']) else 'BLOCKED','asset_errors':errors,'character_gates':manifest['character_gates'],'secret_format_scan':{'files':checked,'hit_count':len(hits),'paths':hits,'excluded':sorted(excluded),'no_secret_values_logged':True},'old_app_version_paths':old,'runtime_image_bytes':manifest['runtime_bytes'],'runtime_image_files':manifest['runtime_files'],'original_visual_designs':manifest['original_visual_designs'],'model_slug':None,'tool':'image_gen.imagegen'}
(ROOT/'docs/art/asset-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(result))
if result['status']!='VERIFIED':raise SystemExit(1)
