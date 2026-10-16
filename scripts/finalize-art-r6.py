"""Verify local receipts and create comparison indexes, never composite store screenshots."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json, hashlib, subprocess
import shutil
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'docs/art'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
read=lambda p:json.loads((ROOT/p).read_text(encoding='utf-8-sig'))
manifest=read('docs/art/asset-manifest-r6.json')
for row in manifest['outputs']+manifest['sources']+manifest['reference_images']:
    assert sha(ROOT/row['path'])==row['sha256'],row['path']
native=read('resources/branding/native-icons-r6-report.json')
for row in native['outputs']:assert sha(ROOT/row['file'])==row['sha256'],row['file']
assert len(native['outputs'])==13 and all(r['unchanged'] for r in native['protectedOriginals'])
bundle=read('output/native/bundle-manifest.json');assert bundle['sourceVersion']=='2.10.0'
assert all(not r['path'].startswith(('docs/','source/')) for r in bundle['files'])
(ART/'native-bundle-r6.json').write_text(json.dumps(bundle,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
visual=read('docs/art/visual-r6.json');assert visual['status']=='VERIFIED' and not visual['failures'] and not visual['errors'] and not visual['external']
store=ROOT/'docs/store/screenshots/art-r6';selected=[]
labels=['01-home','02-car-driving','03-flight-playing','04-load','05-split','06-celebration']
for device,expected in [('iphone-store',(1290,2796)),('ipad-store',(2064,2752))]:
    for label in labels:
        path=store/(device+'-'+label+'.png');assert Image.open(path).size==expected
        selected.append({'path':path.relative_to(ROOT).as_posix(),'size':expected,'sha256':sha(path),'native':False})
(store/'SELECTED.json').write_text(json.dumps({'status':'VERIFIED','sourceVersion':'2.10.0','order':labels,'method':'Six distinct real runtime scenes; no altered completion state, no composited UI or captions. Headless web, not native screenshots.','shots':selected},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
before=ROOT/'docs/art/compare/r6-before';after=ROOT/'docs/art/compare/r6-after';pairs=[]
for row in read('docs/art/compare/r6-before/manifest.json')['shots']:
    original=ROOT/row['path'];new=after/original.name
    assert new.exists() and Image.open(original).size==Image.open(new).size
    pairs.append({'screen':original.stem,'before':original.relative_to(ROOT).as_posix(),'after':new.relative_to(ROOT).as_posix(),'size':Image.open(new).size,'before_sha256':sha(original),'after_sha256':sha(new),'before_method':'R6 pre-work live capture of 2.9.0'})
# The older full math scenes are explicitly identified as historical R5 evidence.
for old,label in [('02-load','04-load'),('03-split','05-split'),('05-awards','06-celebration')]:
    source=ROOT/f'docs/art/evidence/r5/phone-{old}.png';current=ROOT/f'docs/art/evidence/r6/phone-{label}.png'
    original=before/f'phone-{label}.png';new=after/f'phone-{label}.png';shutil.copyfile(source,original);shutil.copyfile(current,new)
    assert Image.open(original).size==Image.open(new).size
    pairs.append({'screen':'phone-'+label,'before':original.relative_to(ROOT).as_posix(),'after':new.relative_to(ROOT).as_posix(),'size':Image.open(new).size,'before_sha256':sha(original),'after_sha256':sha(new),'before_source':source.relative_to(ROOT).as_posix(),'before_method':'Historical R5 2.9.0 original runtime evidence; not a new R6 pre-work capture'})
(ART/'compare/pairs-r6.json').write_text(json.dumps({'status':'VERIFIED','pairs':pairs},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
font=ImageFont.truetype('C:/Windows/Fonts/msjh.ttc',22)
overview=['phone-home','phone-car','phone-flight','phone-math','phone-05-split','phone-06-celebration']
board=Image.new('RGB',(1040,6*470),'#dcf2fc');draw=ImageDraw.Draw(board)
for line,name in enumerate(overview):
    row=next(r for r in pairs if r['screen']==name)
    for col,key in enumerate(['before','after']):
        im=Image.open(ROOT/row[key]).convert('RGB');im.thumbnail((490,420),Image.Resampling.LANCZOS)
        x=col*520+(520-im.width)//2;y=line*470+40;board.paste(im,(x,y))
        draw.text((col*520+12,line*470+8),('改前 2.9.0' if col==0 else '改後 2.10.0')+' · '+name,font=font,fill='#143b61')
board.save(ART/'compare/R6-before-after.jpg',quality=88,optimize=True)
evidence={
 '1-gameplay':{'status':'VERIFIED','images':[s['path'] for s in selected if any(label in s['path'] for label in ['02-car-driving','03-flight-playing'])],'criterion':'Live steering/pedals and golden road stars; live aircraft, treasure rings and child controls. Text masking is a self-review, not a human study.'},
 '2-vehicles':{'status':'VERIFIED','images':['docs/art/evidence/r6/phone-01-home.png','docs/art/evidence/r6/phone-car-menu.png','docs/art/thumbnail-64-r6.png'],'criterion':'Four vehicle shapes x five paints verified through 20 real UI selections. Three vehicle thumbnails self-reviewed at 64px.'},
 '3-movement':{'status':'VERIFIED','images':['docs/art/evidence/r6/phone-04-load.png','docs/art/evidence/r6/phone-05-split.png','docs/art/evidence/r6/phone-subtract.png'],'motion_receipt':'docs/art/visual-r6.json','criterion':'700ms transit with two limb poses; stable child ID on both directions; carriage doors/windows/coupler; rear carriage 650ms retreat and stay sign.'},
 '4-celebration':{'status':'VERIFIED','images':['docs/art/evidence/r6/phone-06-celebration.png','docs/store/screenshots/art-r6/ipad-store-06-celebration.png'],'criterion':'Full viewport, no task progression strip; departure, two flag poses, ribbons, separate sum/subtraction medals.'},
 '5-brand-navigation':{'status':'EXECUTED','images':['docs/art/evidence/r6/phone-car-menu.png','docs/art/evidence/r6/phone-flight-menu.png','docs/art/thumbnail-64-r6.png','store/assets/app-store-icon-r6-1024.png'],'native_receipt':'resources/branding/native-icons-r6-report.json','human_test':'BLOCKED: no three unfamiliar participants; no 3-second recognition claim.'}}
(ART/'acceptance-r6.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
old=subprocess.check_output(['git','ls-tree','-rl','HEAD','public'],cwd=ROOT,text=True,encoding='utf-8')
oldbytes=sum(int(line.split('\t')[0].split()[-1]) for line in old.splitlines() if line.split('\t')[0].split()[-1].isdigit())
tracked=subprocess.check_output(['git','ls-files','-z','--','public'],cwd=ROOT).decode('utf-8').split('\0')
controlled={ROOT/p for p in tracked if p}|{ROOT/r['path'] for r in manifest['outputs']}
newbytes=sum(p.stat().st_size for p in controlled if p.is_file())
native_delta=sum((ROOT/r['file']).stat().st_size-int(subprocess.check_output(['git','cat-file','-s','HEAD:'+r['file']],cwd=ROOT,text=True)) for r in native['outputs'])
report={'status':'VERIFIED','baseline_commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'runtime_art_files':len(manifest['outputs']),'runtime_art_bytes':manifest['runtime_bytes'],'native_icon_pngs':len(native['outputs']),'native_icon_bytes':sum((ROOT/r['file']).stat().st_size for r in native['outputs']),'native_icon_delta_bytes':native_delta,'native_web_bundle_bytes':bundle['totalBytes'],'native_web_bundle_files':bundle['fileCount'],'public_before_bytes':oldbytes,'public_after_bytes':newbytes,'public_delta_bytes':newbytes-oldbytes,'source_and_evidence_bundled':False,'pairs':len(pairs),'store_screenshots':len(selected),'visual_checks':len(visual['rows']),'native_originals_preserved':len(native['protectedOriginals'])}
report['public_delta_scope']='Tracked public files plus new R6 runtime art; excludes pre-existing ignored source archives and generated downloads.'
(ART/'release-proof-r6.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
