"""Deterministic crop/compression of image_gen originals; never draws replacement art."""
from pathlib import Path
from PIL import Image, ImageDraw
import json, hashlib, shutil
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'docs/art'; OUT=ROOT/'public/art/r5'; SRC=ART/'source/r5'
OUT.mkdir(parents=True,exist_ok=True); SRC.mkdir(parents=True,exist_ok=True)
spec=json.loads((ART/'PROMPTS_R5.json').read_text(encoding='utf-8'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
masters={};sources=[];outputs=[]
for r in spec['records']:
    p=SRC/(r['id']+'.png')
    if Path(r['path']).exists():shutil.copyfile(r['path'],p)
    elif not p.exists():raise FileNotFoundError(r['path'])
    im=Image.open(p).convert('RGBA');masters[r['id']]=im
    files=[p]
    if r['transparent_background']:
        mask=SRC/(r['id']+'-mask.png');im.getchannel('A').save(mask);opaque=SRC/(r['id']+'-opaque.png');bg=Image.new('RGBA',im.size,'#ffffff');bg.alpha_composite(im);bg.convert('RGB').save(opaque);files += [mask,opaque]
    sources.extend({'path':str(f.relative_to(ROOT)).replace('\\','/'),'sha256':sha(f)} for f in files)
def save(name,im,size,cutout=True):
    im=im.convert('RGBA')
    if cutout:
        a=np.array(im);a[:,:,3]=np.where(a[:,:,3]<12,0,np.where(a[:,:,3]>240,255,a[:,:,3]));a[a[:,:,3]==0,:3]=0;im=Image.fromarray(a);box=im.getbbox();im=im.crop(box) if box else im
    if cutout:
        im.thumbnail((size[0]-8,size[1]-8),Image.Resampling.LANCZOS)
        canvas=Image.new('RGBA',size);canvas.alpha_composite(im,((size[0]-im.width)//2,(size[1]-im.height)//2))
    else:
        canvas=im.resize(size,Image.Resampling.LANCZOS)
    p=OUT/name
    if name.endswith('.webp'):canvas.convert('RGB').save(p,quality=84,method=6)
    else:canvas.save(p,optimize=True)
    row={'path':str(p.relative_to(ROOT)).replace('\\','/'),'size':size,'bytes':p.stat().st_size,'sha256':sha(p)}
    a=np.array(canvas);visible=a[:,:,3]>128
    if cutout:
        rgb=a[:,:,:3][visible]/255;lum=rgb@np.array([.2126,.7152,.0722]);sat=(rgb.max(1)-rgb.min(1))/np.maximum(rgb.max(1),.001)
        row.update(corners_transparent=all(a[y,x,3]==0 for y,x in [(0,0),(0,-1),(-1,0),(-1,-1)]),occupancy=round(float(visible.mean()),4),mean_luminance=round(float(lum.mean()),4),near_black=round(float((lum<.1).mean()),4),mean_saturation=round(float(sat.mean()),4),low_saturation=round(float((sat<.2).mean()),4))
    outputs.append(row)
save('platform.webp',masters['background'],(1536,1024),False)
save('sky.webp',masters['sky'],(1536,864),False)
for i,name in enumerate(['car','train','flight']):
    im=masters['vehicles'];w=im.width//3;save(name+'.png',im.crop((i*w,0,(i+1)*w,im.height)),(384,256))
for i,name in enumerate(['coach','coach-cheer']):
    im=masters['coach'];w=im.width//2;save(name+'.png',im.crop((i*w,0,(i+1)*w,im.height)),(384,576))
for i in range(6):
    im=masters['passenger'];w,h=im.width//6,im.height//2
    for f in range(2):
        x=(i%3*2+f)*w;y=(i//3)*h;save(f'passenger-{i+1}-{f}.png',im.crop((x,y,x+w,y+h)),(128,192))
for i,name in enumerate(['carriage-blue','carriage-orange']):
    im=masters['carriages-v2'];h=im.height//2;save(name+'.png',im.crop((0,i*h,im.width,(i+1)*h)),(768,144))
im=masters['ui'];save('ticket.png',im.crop((0,0,1536,455)),(768,240))
for i,name in enumerate(['badge','flag','station']):save(name+'.png',im.crop((i*512,455,(i+1)*512,1024)),(192,192))
save('logo.png',masters['logo'],(480,320))
for n in [192,512]:
    p=OUT/f'app-icon-{n}.png';masters['icon'].convert('RGB').resize((n,n),Image.Resampling.LANCZOS).save(p,optimize=True);outputs.append({'path':str(p.relative_to(ROOT)).replace('\\','/'),'size':[n,n],'bytes':p.stat().st_size,'sha256':sha(p)})
characters=[r for r in outputs if '/coach' in r['path'] or '/passenger-' in r['path']]
for r in characters:r['dual_gate']=.30<=r['mean_luminance']<=.75 and r['near_black']<.35 and r['mean_saturation']>=.32 and r['low_saturation']<.20
thumb=Image.new('RGB',(16*72,170),'#d4efff');d=ImageDraw.Draw(thumb)
names=['coach','coach-cheer','car','train','flight','badge','flag','app-icon-192']+[f'passenger-{i}-0' for i in range(1,7)]
for i,name in enumerate(names):
    im=Image.open(OUT/(name+'.png')).convert('RGBA');im.thumbnail((64,64),Image.Resampling.LANCZOS)
    for y,color in [(0,'white'),(90,'#65bfe9')]:
        bg=Image.new('RGBA',(64,64),color);bg.alpha_composite(im,((64-im.width)//2,(64-im.height)//2));thumb.paste(bg.convert('RGB'),(i*72,y))
thumb.save(ART/'thumbnail-64-r5.png')
manifest={'status':'VERIFIED' if all(r['dual_gate'] for r in characters) else 'BLOCKED','tool':'image_gen.imagegen','model_slug':None,'model_note':'Tool did not expose the actual model slug.','generation_calls':len(spec['records']),'runtime_files':len(outputs),'runtime_bytes':sum(r['bytes'] for r in outputs),'original_visual_designs':27,'sources':sources,'outputs':outputs,'postprocess':'Pillow native-alpha cleanup (<12 transparent, >240 opaque), transparent RGB zero, crop and LANCZOS resize; RGB WebP q84. Original alpha, mask, opaque master retained. No replacement drawings.','animation':'Six passengers x two separately generated limb poses; two distinct coach arm/face poses. Runtime interpolates position and changes pose. No skeleton claim.','license':'Generated with OpenAI built-in image tool for this project. No third-party artwork input except project-owned R4 coach. Not automatically MIT.','limitations':['Human thumbnail and cross-title blind tests pending.','Native catalogs and device validation pending.']}
manifest['reference_images']=list({ref['path']:ref for r in spec['records'] for ref in r.get('reference_images',[])}.values())
manifest['all_prompts_share_prefix']=all(r['prompt'].startswith(spec['style_prefix']) for r in spec['records'])
assert manifest['all_prompts_share_prefix']
(ART/'asset-manifest-r5.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
main=json.loads((ART/'PROMPTS.json').read_text(encoding='utf-8'));main['round_5']={'file':'PROMPTS_R5.json','style_prefix':spec['style_prefix'],'records':spec['records']};(ART/'PROMPTS.json').write_text(json.dumps(main,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:manifest[k] for k in ['status','generation_calls','runtime_files','runtime_bytes']}));print(json.dumps([{k:r[k] for k in ['path','mean_luminance','mean_saturation','low_saturation','dual_gate']} for r in characters]))
