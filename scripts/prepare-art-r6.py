"""Crop and compress generated art; preserve source/mask/opaque masters and receipts."""
from pathlib import Path
from PIL import Image, ImageDraw
import json, hashlib, shutil, re
import numpy as np
from scipy import ndimage
ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'docs/art'; OUT=ROOT/'public/art/r6'; SRC=ART/'source/r6'
OUT.mkdir(parents=True,exist_ok=True); SRC.mkdir(parents=True,exist_ok=True)
spec=json.loads((ART/'PROMPTS_R6.json').read_text(encoding='utf-8'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
masters={}; sources=[]; outputs=[]
for rec in spec['records']:
    # The built-in result supplies a concrete local output, never infer a model slug.
    path=re.search(r'as (C:\\[^\r\n]+\.png) by default',rec['output_hint']).group(1)
    target=SRC/(rec['id']+'.png');shutil.copyfile(path,target)
    im=Image.open(target).convert('RGBA');masters[rec['id']]=im
    files=[target]
    if rec['transparent_background']:
        mask=SRC/(rec['id']+'-mask.png');im.getchannel('A').save(mask)
        opaque=SRC/(rec['id']+'-opaque.png');bg=Image.new('RGBA',im.size,'white');bg.alpha_composite(im);bg.convert('RGB').save(opaque);files += [mask,opaque]
    sources.extend({'path':f.relative_to(ROOT).as_posix(),'sha256':sha(f)} for f in files)

def save(name,im,size,cutout=True,box=None):
    im=im.convert('RGBA')
    if cutout:
        a=np.array(im);a[:,:,3]=np.where(a[:,:,3]<20,0,np.where(a[:,:,3]>235,255,a[:,:,3]));a[a[:,:,3]==0,:3]=0
        im=Image.fromarray(a); bounds=im.getbbox(); assert bounds, name
        im=im.crop(bounds);im.thumbnail((size[0]-8,size[1]-8),Image.Resampling.LANCZOS)
        canvas=Image.new('RGBA',size);canvas.alpha_composite(im,((size[0]-im.width)//2,(size[1]-im.height)//2))
    else:canvas=im.resize(size,Image.Resampling.LANCZOS)
    p=OUT/name
    if p.suffix=='.webp':canvas.convert('RGB').save(p,quality=84,method=6)
    else:canvas.save(p,optimize=True)
    r={'path':p.relative_to(ROOT).as_posix(),'size':size,'bytes':p.stat().st_size,'sha256':sha(p),'source_box':box}
    if cutout:
        a=np.array(canvas);visible=a[:,:,3]>128;rgb=a[:,:,:3][visible]/255
        lum=rgb@np.array([.2126,.7152,.0722]);sat=(rgb.max(1)-rgb.min(1))/np.maximum(rgb.max(1),.001)
        r.update(alpha_corners=all(a[y,x,3]==0 for y,x in [(0,0),(0,-1),(-1,0),(-1,-1)]),occupancy=round(float(visible.mean()),4),mean_luminance=round(float(lum.mean()),4),near_black=round(float((lum<.1).mean()),4),mean_saturation=round(float(sat.mean()),4),low_saturation=round(float((sat<.2).mean()),4),transparent_rgb_zero=bool((a[:,:,:3][a[:,:,3]==0]==0).all()))
        assert r['alpha_corners'] and .04<r['occupancy']<.96, r
    outputs.append(r)

save('coast.webp',masters['coast'],(1536,1024),False)
save('route-taipei.webp',masters['night-route'],(384,288),False)
im=masters['routes'];w,h=im.size
for name,col,row in [('coast',0,0),('valley',1,0),('island',0,1),('metro',1,1)]:
    save('route-'+name+'.webp',im.crop((round(col*w/2),round(row*h/2),round((col+1)*w/2),round((row+1)*h/2))),(384,288),False)
im=masters['car-atlas'];w,h=im.size
for row in range(5):
    for col,kind in enumerate(['coupe','rally','suv','van']):
        box=(round(col*w/4),round(row*h/5),round((col+1)*w/4),round((row+1)*h/5))
        save(f'{kind}-{row}.png',im.crop(box),(384,224),box=box)
im=masters['trio'];w,h=im.size
for col,name in enumerate(['car','train','flight']):
    box=(round(col*w/3),0,round((col+1)*w/3),h);cut=im.crop(box);a=np.array(cut)
    labels,n=ndimage.label(a[:,:,3]>128);areas=np.bincount(labels.ravel());ident=np.argmax(areas[1:])+1
    yy,xx=np.where(labels==ident);bounds=(max(0,xx.min()-3),max(0,yy.min()-3),min(cut.width,xx.max()+4),min(cut.height,yy.max()+4))
    save(name+'.png',cut.crop(bounds),(384,256),box=box)
# Connected components keep the raised flag intact across the nominal column gutter.
im=masters['coach'];a=np.array(im);labels,n=ndimage.label(a[:,:,3]>128)
areas=np.bincount(labels.ravel());ids=np.argsort(areas[1:])[-2:]+1
ids=sorted(ids,key=lambda i:np.where(labels==i)[1].mean())
for ident,name in zip(ids,['coach','coach-cheer']):
    component=ndimage.binary_dilation(labels==ident,iterations=3)
    cut=a.copy();cut[~component]=0
    save(name+'.png',Image.fromarray(cut),(384,576))
im=masters['ui']
save('ticket.png',im.crop((80,0,1450,263)),(768,180))
for name,box in [('badge',(140,265,545,669)),('route-badge',(580,265,950,669)),('mail-badge',(990,265,1400,669)),('confetti',(0,669,1536,1024))]:save(name+'.png',im.crop(box),(768,190) if name=='confetti' else (192,192),box=box)
save('logo.png',masters['logo'],(480,280))
for size in [192,512]:save(f'app-icon-{size}.png',masters['icon'],(size,size),False)
for r in outputs:
    if '/coach' in r['path']:
        r['dual_gate']=.30<=r['mean_luminance']<=.75 and r['near_black']<.35 and r['mean_saturation']>=.32 and r['low_saturation']<.20
        assert r['dual_gate'],r
# Source alpha cleanup is followed by RGB zero after resampling to avoid hidden fringe RGB.
for r in outputs:
    if 'alpha_corners' not in r:continue
    p=ROOT/r['path'];a=np.array(Image.open(p).convert('RGBA'));a[a[:,:,3]==0,:3]=0;Image.fromarray(a).save(p,optimize=True)
    r.update(sha256=sha(p),bytes=p.stat().st_size,transparent_rgb_zero=True)
thumb=Image.new('RGB',(8*80,160),'white')
for idx,name in enumerate(['coach','coach-cheer','car','train','flight','route-badge','logo','app-icon-192']):
    im=Image.open(OUT/(name+'.png')).convert('RGBA');im.thumbnail((64,64),Image.Resampling.LANCZOS)
    for row,bg in enumerate(['white','#80d6fa']):
        tile=Image.new('RGBA',(80,80),bg);tile.alpha_composite(im,((80-im.width)//2,(80-im.height)//2));thumb.paste(tile.convert('RGB'),(idx*80,row*80))
thumb.save(ART/'thumbnail-64-r6.png')
manifest={'status':'VERIFIED','tool':spec['tool'],'model_slug':None,'model_note':spec['model_note'],'generation_calls':len(spec['records']),'runtime_files':len(outputs),'runtime_bytes':sum(r['bytes'] for r in outputs),'sources':sources,'outputs':outputs,'postprocess':'Native alpha masks preserved, threshold <20 transparent >235 opaque, connected component separation for coach, crop and LANCZOS resize, RGB zero at alpha=0 after resampling. Background WebP q84. No replacement drawings.','animation':'R5 two limb poses per passenger retained; R6 two new coach arm/flag poses. Interpolated path >=700ms, no skeleton claim.','native_icon_receipt':'resources/branding/native-icons-r6-report.json','limitations':['Three-person human thumbnail test not performed.','No new independent Muse score.','Native icon catalogs exported locally; no native binary or physical device verification.']}
manifest['reference_images']=[{'path':p,'sha256':sha(ROOT/p)} for p in sorted({ref for r in spec['records'] for ref in r.get('reference_images',[])})]
manifest['all_prompts_share_prefix']=all(r['prompt'].startswith(spec['style_prefix']) for r in spec['records'])
assert manifest['all_prompts_share_prefix']
(ART/'asset-manifest-r6.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
main=json.loads((ART/'PROMPTS.json').read_text(encoding='utf-8'));main['round_6']={'file':'PROMPTS_R6.json','style_prefix':spec['style_prefix'],'records':spec['records']};(ART/'PROMPTS.json').write_text(json.dumps(main,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:manifest[k] for k in ['status','generation_calls','runtime_files','runtime_bytes']}))
