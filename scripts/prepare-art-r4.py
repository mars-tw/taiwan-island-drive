"""Deterministic, user-requested resize/alpha cleanup of generated R4 masters."""
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
import json, hashlib, shutil
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'docs/art'; SRC=ART/'source'; OUT=ROOT/'public/art/r4'
SRC.mkdir(parents=True,exist_ok=True); OUT.mkdir(parents=True,exist_ok=True)
spec=json.loads((ART/'PROMPTS.json').read_text(encoding='utf-8'))
masters={}; source_rows=[]; outputs=[]
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def rel(p): return p.relative_to(ROOT).as_posix()
for rec in spec['records']:
    dst=SRC/(rec['id']+'.png')
    # Once delivered, repository masters are the reproducible source of truth.
    if not dst.is_file():shutil.copyfile(Path(rec['path']),dst)
    im=Image.open(dst);masters[rec['id']]=im.copy()
    source_rows.append({'id':rec['id'],'path':rel(dst),'sha256':sha(dst),'size':im.size,'mode':im.mode,'tool':rec['tool'],'model_slug':None})
    if im.mode=='RGBA':
        mask=SRC/(rec['id']+'-mask.png');im.getchannel('A').save(mask,optimize=True)
        # Preserve the unmodified RGB payload and supplied native alpha separately.
        opaque=SRC/(rec['id']+'-opaque.png');im.convert('RGB').save(opaque,optimize=True)
        source_rows[-1].update(alpha_mask={'path':rel(mask),'sha256':sha(mask)},opaque_rgb={'path':rel(opaque),'sha256':sha(opaque)})

def clean(im):
    a=np.array(im.convert('RGBA'));alpha=a[:,:,3];alpha[alpha<12]=0;alpha[alpha>240]=255
    a[:,:,:3][alpha==0]=0
    return Image.fromarray(a)
def save(name,im,size=None,trim=False):
    im=clean(im) if im.mode=='RGBA' else im.convert('RGB')
    if trim:
        bounds=im.getchannel('A').getbbox();im=im.crop(bounds)
        im=ImageOps.expand(im,border=max(4,int(max(im.size)*.025)),fill=(0,0,0,0))
    if size: im.thumbnail(size,Image.Resampling.LANCZOS)
    p=OUT/name;im.save(p,optimize=True,**({'quality':83,'method':6} if p.suffix=='.webp' else {}))
    row={'path':rel(p),'sha256':sha(p),'bytes':p.stat().st_size,'size':im.size,'mode':im.mode}
    if im.mode=='RGBA':
        arr=np.asarray(im); alpha=arr[:,:,3]; visible=alpha>127
        rgb=arr[:,:,:3][visible]/255.;hi=rgb.max(1);lo=rgb.min(1)
        sat=np.divide(hi-lo,hi,out=np.zeros_like(hi),where=hi>0)
        lum=rgb@np.array([.2126,.7152,.0722])
        row.update(alpha_occupancy=round(float(visible.mean()),4),corner_alpha=[int(alpha[y,x]) for x,y in [(0,0),(im.width-1,0),(0,im.height-1),(im.width-1,im.height-1)]],visible_bbox=im.getchannel('A').getbbox(),mean_luminance=round(float(lum.mean()),4),near_black=round(float((lum<.1).mean()),4),mean_saturation=round(float(sat.mean()),4),low_saturation=round(float((sat<.2).mean()),4))
    outputs.append(row);return im

save('coast.webp',masters['background'],(1536,1024))
save('coach.png',masters['coach'],(384,576),True)
save('logo.png',masters['logo'],(480,240),True)
# The generated sign's orange/white top enamel edge becomes a slim panel texture.
# Cropping the frame prevents a second, stretched frame from crossing live text.
save('panel.png',masters['panel'].crop((155,88,1375,138)).convert('RGB'),(768,40))
kit=masters['traffic-kit']
for name,box in [('car',(0,160,435,574)),('train',(435,160,818,574)),('flight',(818,160,1254,574)),('badge',(0,603,435,1120)),('signal',(435,603,818,1120)),('bag',(818,603,1254,1120))]:
    save(name+'.png',kit.crop(box),(144,144),True)
save('app-icon-512.png',masters['app-icon'],(512,512))
save('app-icon-192.png',masters['app-icon'],(192,192))
passengers=masters['passengers-v2'];cw,ch=passengers.width//3,passengers.height//2
for i in range(6):
    x,y=(i%3)*cw,(i//3)*ch
    save(f'passenger-{i+1}.png',passengers.crop((x,y,x+cw,y+ch)),(96,96),True)

# 64px native presentation, on both white and sky, without enlarged-only proof.
thumb=Image.new('RGB',(910,220),'#e2f5ff');draw=ImageDraw.Draw(thumb)
for i,name in enumerate(['coach','car','train','flight','badge','signal','bag','app-icon-192']+[f'passenger-{i+1}' for i in range(6)]):
    im=Image.open(OUT/(name+'.png')).convert('RGBA');im.thumbnail((64,64),Image.Resampling.LANCZOS)
    for y,bg in [(20,'white'),(124,'#65bfe9')]:
        cell=Image.new('RGBA',(64,64),bg);cell.alpha_composite(im,((64-im.width)//2,(64-im.height)//2));thumb.paste(cell.convert('RGB'),(i*65,y))
    draw.text((i*65+1,91),name[:9],fill='#143b61')
thumb.save(ART/'thumbnail-64.png')
coach=next(r for r in outputs if r['path'].endswith('/coach.png'))
gate=(.30<=coach['mean_luminance']<=.75 and coach['near_black']<.35 and coach['mean_saturation']>=.32 and coach['low_saturation']<.20)
manifest={'status':'VERIFIED' if gate else 'BLOCKED','date':'2026-10-16','tool':'image_gen.imagegen','model_slug':None,'model_note':'The actual built-in model slug is not exposed. Do not infer gpt-image-2 from a planning document.','generation_calls':6,'runtime_files':len(outputs),'runtime_bytes':sum(r['bytes'] for r in outputs),'postprocess':'Pillow 12.2.0; native-alpha preserve; alpha <12 cleared, >240 opaque; transparent RGB zeroed; trim/padding; LANCZOS runtime resize; background WebP q83. No fabricated drawings.','style_prefix':spec['style_prefix'],'license':'AI-generated for this project through the built-in OpenAI image tool; no third-party reference artwork supplied. Generated content is not automatically covered by the source-code MIT license.','sources':source_rows,'outputs':outputs,'coach_dual_gate':gate,'thumbnail_proof':'docs/art/thumbnail-64.png','limitations':['Static front three-quarter coach only; no character animation or three-view turnaround.','Native icon catalogs not replaced; app icon is a web-integrated proposal.']}
manifest['generation_calls']=len(spec['records'])
manifest['original_visual_designs']=17
manifest['character_gates']=[{'path':r['path'],'pass':.30<=r['mean_luminance']<=.75 and r['near_black']<.35 and r['mean_saturation']>=.32 and r['low_saturation']<.20} for r in outputs if r['path'].endswith('/coach.png') or '/passenger-' in r['path']]
if not all(r['pass'] for r in manifest['character_gates']):manifest['status']='BLOCKED'
(ART/'asset-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:manifest[k] for k in ['status','generation_calls','runtime_files','runtime_bytes','coach_dual_gate']}));print(json.dumps(coach))
if not gate: raise SystemExit('Coach brightness/saturation gate failed')
