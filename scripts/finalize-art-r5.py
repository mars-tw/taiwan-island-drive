from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib
import numpy as np
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'docs/art'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
m=json.loads((ART/'asset-manifest-r5.json').read_text(encoding='utf-8'))
assert m['status']=='VERIFIED'
for row in m['sources']+m['outputs']+m.get('reference_images',[]):assert sha(ROOT/row['path'])==row['sha256'],row['path']
cutouts=[r for r in m['outputs'] if 'corners_transparent' in r]
assert all(r['corners_transparent'] for r in cutouts)
for r in cutouts:
 im=Image.open(ROOT/r['path']);assert im.mode=='RGBA';a=np.array(im);assert np.all(a[a[:,:,3]==0,:3]==0)
pose_diff=[]
for i in range(1,7):
 a=np.array(Image.open(ROOT/f'public/art/r5/passenger-{i}-0.png'));b=np.array(Image.open(ROOT/f'public/art/r5/passenger-{i}-1.png'));delta=float(np.mean(np.abs(a.astype(float)-b.astype(float))))
 assert delta>1;pose_diff.append({'passenger':i,'rgba_mean_abs_diff':round(delta,3)})
before=ART/'compare/r5-before';after=ART/'compare/r5-after';pairs=[]
for p in sorted(before.glob('*.png')):
 q=after/p.name
 if not q.exists():continue
 assert Image.open(p).size==Image.open(q).size
 pairs.append({'before':str(p.relative_to(ROOT)).replace('\\','/'),'after':str(q.relative_to(ROOT)).replace('\\','/'),'before_sha256':sha(p),'after_sha256':sha(q),'size':Image.open(p).size})
assert len(pairs)==22
(ART/'compare/pairs-r5.json').write_text(json.dumps({'status':'VERIFIED','pairs':pairs},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
font=ImageFont.truetype('C:/Windows/Fonts/msjh.ttc',20)
board=Image.new('RGB',(1040,7*440),'#d4efff');d=ImageDraw.Draw(board)
for row,name in enumerate(['phone-home','phone-math','phone-train','phone-car','phone-flight','phone-passport','phone-safety']):
 for col,folder in enumerate([before,after]):
  im=Image.open(folder/(name+'.png')).convert('RGB');im.thumbnail((500,400),Image.Resampling.LANCZOS);x=col*520+(520-im.width)//2;y=row*440+36;board.paste(im,(x,y));d.text((col*520+12,row*440+8),f'{"改前 2.8.0" if col==0 else "改後 2.9.0"} · {name}',font=font,fill='#143b61')
board.save(ART/'compare/R5-before-after.jpg',quality=87)
v=json.loads((ART/'visual-r5.json').read_text(encoding='utf-8'));store=[r for r in v['shots'] if '/screenshots/' in r['path']]
assert len(store)==14
for r in store:
 assert (r['width'],r['height']) in [(1290,2796),(2064,2752)]
 assert sha(ROOT/r['path'])==r['sha256']
selected=[r for r in store if '-03-split' not in r['path']]
(ROOT/'docs/store/screenshots/art-r5/SELECTED.json').write_text(json.dumps({'status':'VERIFIED','note':'Six distinct storefront choices per device; all are actual headless Web captures, not native evidence. Split retained as extra, not part of the recommended six.','shots':selected},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
result={'status':'VERIFIED','runtime_files':m['runtime_files'],'runtime_bytes':m['runtime_bytes'],'runtime_mib':round(m['runtime_bytes']/1048576,3),'generation_calls':m['generation_calls'],'cutouts':len(cutouts),'character_gates':sum(r.get('dual_gate',False) for r in m['outputs']),'source_and_output_hashes':True,'pose_diff':pose_diff,'pairs':len(pairs),'store_images':len(store),'recommended_images':len(selected),'limitations':['Pose pixel difference establishes distinct frames, not a complete locomotion study.','Human blind tests and native-device performance not verified.']}
(ART/'asset-verification-r5.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(result))
