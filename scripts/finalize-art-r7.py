"""Read back raw screenshots and release evidence; no compositing of store screenshots."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib,shutil,subprocess,re
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'docs/art';STORE=ROOT/'docs/store/screenshots/art-r7'
BASELINE='d29ab17'
read=lambda p:json.loads((ROOT/p).read_text(encoding='utf-8'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
write=lambda p,j:p.write_text(json.dumps(j,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
assert read('package.json')['version']=='2.11.0'
assert read('package-lock.json')['packages']['']['version']=='2.11.0'
ios=(ROOT/'ios/App/App.xcodeproj/project.pbxproj').read_text(encoding='utf-8');android=(ROOT/'android/app/build.gradle').read_text(encoding='utf-8')
assert ios.count('MARKETING_VERSION = 2.11.0;')==2 and ios.count('CURRENT_PROJECT_VERSION = 7;')==2
assert 'versionCode 7' in android and 'versionName "2.11.0"' in android
assert subprocess.check_output(['git','branch','--show-current']).decode().strip()=='r1-fun-polish'
assert read('docs/art/visual-r7.json')['status']=='VERIFIED'
assert read('docs/art/acceptance-r7.json')['status']=='VERIFIED'
assert read('docs/art/car-framing-r7.json')['status']=='VERIFIED'
for f in ['docs/art/merge-evidence-r7/merge-path.json','docs/art/store-evidence-r7/review-path.json']:
    j=read(f);assert not j['errors'] and not j['externalRequests'],f
manifest=read('docs/art/asset-manifest-r7.json')
for r in manifest['sources']+manifest['outputs']:assert sha(ROOT/r['path'])==r['sha256'],r['path']
for r in manifest['outputs']:assert sha(ROOT/'dist'/Path(r['path']).relative_to('public'))==r['sha256'],r['path']
manifest['references']=[{'path':p,'sha256':sha(ROOT/p)} for p in ['public/art/r6/coach.png','public/art/r6/car.png']]
rounding=read('docs/art/coupe-rounding-r7.json')
assert sha(ROOT/'public/models/coupe.glb')==rounding['output_sha256']
assert sha(ROOT/'dist/models/coupe.glb')==rounding['output_sha256']
assert sha(ROOT/'docs/art/source/r7/coupe-original.glb')==rounding['source_sha256']
manifest['model_rework']={**rounding,'original_path':'docs/art/source/r7/coupe-original.glb','blend_source':'docs/art/source/r7/coupe-rounded.blend','blend_sha256':sha(ROOT/'docs/art/source/r7/coupe-rounded.blend'),'runtime_path':'public/models/coupe.glb','runtime_delta_bytes':(ROOT/'public/models/coupe.glb').stat().st_size-(ROOT/'docs/art/source/r7/coupe-original.glb').stat().st_size,'browser_runtime_verified':True,'browser_evidence':'docs/art/acceptance-r7.json','camera_evidence':'docs/art/car-framing-r7.json'}
manifest['integration']={'runtime_outputs':13,'proposal_only':['public/art/r7/turn-sign.png'],'retained_3d':'Existing Blender base; coupe body bevels and weighted normals reworked in Blender 5.2 headless CLI, wheel hierarchy and semantic atlas metadata preserved. No new base mesh.'}
write(ART/'asset-manifest-r7.json',manifest)

# Baseline captures preceded the build. The old harness's final extra reduced-motion
# step timed out after the rebuild; never label it a complete passing baseline run.
before_folder=ART/'compare/r7-before'
before_shots=[{'path':p.relative_to(ROOT).as_posix(),'size':Image.open(p).size,'sha256':sha(p)} for p in sorted(before_folder.glob('*.png'))]
write(before_folder/'manifest.json',{'status':'EXECUTED','checkedOutSourceVersion':'2.10.0','checkedOutSourceCommit':'d29ab17','servedBuildStamp':'not independently recorded before replacing the old build','scope':'Unmodified existing-preview baseline screen captures, not a claim that the whole baseline harness passed.','supplemental_check':'BLOCKED: final reduced-motion step timed out while the build was being replaced; covered by final R7 full matrix instead.','shots':before_shots})
capture=read('docs/art/compare/r7-before/capture.json');capture['status']='EXECUTED';capture['scope']='Captured baseline screenshots only. Supplemental final reduced-motion check timed out after rebuild.';write(before_folder/'capture.json',capture)

labels=['01-home','02-car-driving','03-flight-playing','04-load','05-split','06-celebration']
after=ART/'compare/r7-after';after.mkdir(parents=True,exist_ok=True);pairs=[]
for device in ['phone','iphone-store','ipad-store']:
    for label in labels:
        before=ART/f'compare/r7-before/{device}-{label}.png'
        source=(STORE if device.endswith('store') else ART/'evidence/r7')/f'{device}-{label}.png'
        dst=after/source.name;shutil.copyfile(source,dst)
        assert Image.open(before).size==Image.open(dst).size
        pairs.append({'device':device,'scene':label,'size':Image.open(dst).size,'before':before.relative_to(ROOT).as_posix(),'after':dst.relative_to(ROOT).as_posix(),'before_sha256':sha(before),'after_sha256':sha(dst),'method':'Same screen and viewport, real UI and matched capture timing; no screenshot edits.'})
write(ART/'compare/pairs-r7.json',pairs)

selected=[]
for device,size in [('iphone-store',(1290,2796)),('ipad-store',(2064,2752))]:
    settled=ART/f'evidence/r7/{device}-celebration-settled.png';shutil.copyfile(settled,STORE/f'{device}-06-celebration-settled.png')
    for label in ['01-home','02-car-reward','03-flight-target','04-load','05-split-action','06-celebration-settled']:
        p=STORE/f'{device}-{label}.png';assert Image.open(p).size==size
        selected.append({'device':device,'scene':label,'path':p.relative_to(ROOT).as_posix(),'size':size,'sha256':sha(p),'native':False,'method':'Unmodified headless Chromium, real UI and wall-clock playback; reward and passenger transfer are actual runtime actions.'})
write(STORE/'SELECTED.json',{'status':'VERIFIED','version':'2.11.0','shots':selected,'not_proven':['Native device capture','Independent 8/10 score','Child 3-second recognition study']})

canvas=Image.new('RGB',(1080,850),'#e4f5ff');draw=ImageDraw.Draw(canvas);font=ImageFont.truetype('C:/Windows/Fonts/msjh.ttc',17)
names=['學院首頁','海岸駕駛','空中找星','裝滿列車','分開車廂','結算慶祝']
for i,label in enumerate(labels):
    x=(i%3)*360;y=(i//3)*425
    for col,phase in enumerate(['r7-before','r7-after']):
        im=Image.open(ART/f'compare/{phase}/phone-{label}.png').convert('RGB');im.thumbnail((178,390),Image.Resampling.LANCZOS);canvas.paste(im,(x+col*180,y+31))
        draw.text((x+col*180+4,y+6),('改前 ' if col==0 else '改後 ')+names[i],font=font,fill='#143b61')
canvas.save(ART/'compare/R7-before-after.jpg',quality=88)

native=read('resources/branding/native-icons-r7-report.json');native_delta=0
for r in native['outputs']:
    path=r['file'];old=subprocess.check_output(['git','show',f'{BASELINE}:{path}']);native_delta+=(ROOT/path).stat().st_size-len(old)
production_files=['package.json','src/games/car/config.js','car/index.html','android/app/build.gradle','ios/App/App.xcodeproj/project.pbxproj']
assert all('2.10.0' not in (ROOT/f).read_text(encoding='utf-8') for f in production_files)
old= json.loads(subprocess.check_output(['git','show',f'{BASELINE}:package.json']).decode())
new=read('package.json');assert old['dependencies']==new['dependencies'] and old['devDependencies']==new['devDependencies']
assert not subprocess.check_output(['git','diff',BASELINE,'--name-only','--','tests']).strip()
assert set(subprocess.check_output(['git','diff',BASELINE,'--name-only','--','public/models']).decode().splitlines())=={'public/models/coupe.glb','public/models/catalog.json'}
report={'status':'VERIFIED','version':'2.11.0','native_source_build':7,'branch':subprocess.check_output(['git','branch','--show-current']).decode().strip(),'generation_calls':6,'web_asset_files':14,'integrated_web_files':13,'runtime_image_bytes':manifest['new_runtime_bytes'],'coupe_model_delta_bytes':manifest['model_rework']['runtime_delta_bytes'],'native_icon_delta_bytes':native_delta,'comparison_pairs':len(pairs),'store_selected':len(selected),'new_sdk_dependencies':0,'existing_tests_modified':False,'existing_glb_modified':['coupe.glb'],'native_binary_built':False,'new_model_slug':None,'tool':'image_gen.imagegen','dist_index_sha256':sha(ROOT/'dist/index.html'),'source_master_bytes':sum((ROOT/r['path']).stat().st_size for r in manifest['sources']),'limits':['3D base and 2D illustration remain different media; child recognition not tested','No independent 8 point rescore','No native device run','Frame timing under concurrent load is only a reference']}
audit=read('docs/art/source-audit-r7.json');assert audit['status']=='VERIFIED' and audit['secret_matches']==0
report.update(source_audit_sha256=sha(ART/'source-audit-r7.json'),dist_entries=audit['dist_entries'],secret_matches=0,car_projection_viewports=len(read('docs/art/car-framing-r7.json')['rows']))
write(ART/'release-proof-r7.json',report)
print(json.dumps(report,ensure_ascii=False))
