"""Reproducible crops, transparent-edge cleanup and compression of generated masters."""
from pathlib import Path
from PIL import Image
from scipy import ndimage
import numpy as np
import json, re, shutil, hashlib
ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'docs/art'; OUT=ROOT/'public/art/r7'; SRC=ART/'source/r7'
OUT.mkdir(parents=True,exist_ok=True);SRC.mkdir(parents=True,exist_ok=True)
spec=json.loads((ART/'PROMPTS_R7.json').read_text(encoding='utf-8'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
masters={};sources=[];outputs=[]
for r in spec['records']:
    p=Path(re.search(r'as (C:\\[^\r\n]+\.png) by default',r['output_hint']).group(1))
    dst=SRC/(r['id']+'.png')
    if not p.exists():p=dst
    if p.resolve()!=dst.resolve():shutil.copyfile(p,dst)
    im=Image.open(dst).convert('RGBA');masters[r['id']]=im
    sources.append({'path':dst.relative_to(ROOT).as_posix(),'sha256':sha(dst)})
    if r.get('transparent_background'):
        mask=SRC/(r['id']+'-mask.png');im.getchannel('A').save(mask)
        bg=Image.new('RGBA',im.size,'white');bg.alpha_composite(im);opaque=SRC/(r['id']+'-opaque.png');bg.convert('RGB').save(opaque)
        for p in [mask,opaque]:sources.append({'path':p.relative_to(ROOT).as_posix(),'sha256':sha(p)})

def save(name,im,size,cutout=True,remove_white=False):
    a=np.array(im.convert('RGBA'))
    if remove_white:
        white=a[:,:,:3].min(2)>225
        labels,n=ndimage.label(white)
        edge=np.unique(np.r_[labels[0],labels[-1],labels[:,0],labels[:,-1]])
        bg=np.isin(labels,edge[edge>0]);a[bg]=0
    if cutout:
        a[a[:,:,3]<30]=0
        # Keep the dominant connected subject; excludes neighbouring cell overspill.
        labels,n=ndimage.label(a[:,:,3]>80);areas=np.bincount(labels.ravel());ident=areas[1:].argmax()+1
        mask=ndimage.binary_dilation(labels==ident,iterations=2);a[~mask]=0
        im=Image.fromarray(a);im=im.crop(im.getbbox());im.thumbnail((size[0]-12,size[1]-12),Image.Resampling.LANCZOS)
        canvas=Image.new('RGBA',size);canvas.alpha_composite(im,((size[0]-im.width)//2,(size[1]-im.height)//2))
    else:canvas=Image.fromarray(a).resize(size,Image.Resampling.LANCZOS)
    p=OUT/name
    if p.suffix=='.webp':canvas.convert('RGB').save(p,quality=83,method=6)
    else:
        a=np.array(canvas);a[a[:,:,3]==0,:3]=0;canvas=Image.fromarray(a);canvas.save(p,optimize=True)
    row={'path':p.relative_to(ROOT).as_posix(),'bytes':p.stat().st_size,'size':size,'sha256':sha(p)}
    if cutout:
        a=np.array(canvas);v=a[:,:,3]>128;rgb=a[:,:,:3][v]/255;lum=rgb@np.array([.2126,.7152,.0722]);sat=(rgb.max(1)-rgb.min(1))/np.maximum(rgb.max(1),.001)
        mask=SRC/(p.stem+'-runtime-mask.png');canvas.getchannel('A').save(mask);sources.append({'path':mask.relative_to(ROOT).as_posix(),'sha256':sha(mask)})
        row.update(alpha_corners=all(a[y,x,3]==0 for y,x in [(0,0),(0,-1),(-1,0),(-1,-1)]),occupancy=float(v.mean()),mean_luminance=float(lum.mean()),near_black=float((lum<.1).mean()),mean_saturation=float(sat.mean()),low_saturation=float((sat<.2).mean()))
        assert row['alpha_corners'] and .03<row['occupancy']<.96,row
    outputs.append(row)

save('coast.webp',masters['qingshui-coast'],(1536,1024),False)
save('logo.png',masters['logo'],(480,250))
for size in [192,512]:save(f'app-icon-{size}.png',masters['app-icon-proposal'],(size,size),False)
im=masters['coach-acting'];w,h=im.size
for i,name in enumerate(['coach-straight','coach-turn','coach-reward']):save(name+'.png',im.crop((i*w//3,0,(i+1)*w//3,h)),(384,384))
im=masters['coach-sheet'];w,h=im.size
save('coach-radio.png',im.crop((int(w*.367),int(h*.525),int(w*.66),h)),(256,256),remove_white=True)
sheet=ART/'character-sheets';sheet.mkdir(parents=True,exist_ok=True);shutil.copyfile(SRC/'coach-sheet.png',sheet/'alu-turnaround-r7.png')
im=masters['ui-objects'];w,h=im.size
for name,box,size in [('panel',(0,0,.46,.5),(768,420)),('badge',(.46,0,.715,.5),(192,192)),('turn-sign',(.715,0,1,.5),(128,192)),('car-rear',(0,.52,.405,1),(384,256)),('flight-rear',(.405,.52,.795,1),(384,256)),('finish-flag',(.795,.52,1,1),(128,192))]:
    save(name+'.png',im.crop(tuple(round(v*(w if i%2==0 else h)) for i,v in enumerate(box))),size)
thumb=Image.new('RGB',(8*80,160),'#80d6fa')
for i,name in enumerate(['coach-straight','coach-turn','coach-reward','coach-radio','car-rear','flight-rear','badge','app-icon-192']):
    im=Image.open(OUT/(name+'.png')).convert('RGBA');im.thumbnail((64,64),Image.Resampling.LANCZOS)
    for row,bg in enumerate(['white','#80d6fa']):
        tile=Image.new('RGBA',(80,80),bg);tile.alpha_composite(im,((80-im.width)//2,(80-im.height)//2));thumb.paste(tile.convert('RGB'),(i*80,row*80))
thumb.save(ART/'thumbnail-64-r7.png')
for row in outputs:
    if '/coach-' in row['path']:
        row['dual_gate']=.3<=row['mean_luminance']<=.75 and row['near_black']<.35 and row['mean_saturation']>=.32 and row['low_saturation']<.2
        assert row['dual_gate'],row
(ART/'asset-manifest-r7.json').write_text(json.dumps({'status':'VERIFIED','tool':spec['tool'],'model_slug':None,'model_note':spec['model_note'],'generation_calls':len(spec['records']),'sources':sources,'outputs':outputs,'new_runtime_bytes':sum(r['bytes'] for r in outputs),'postprocess':'Generated alpha preserved; connected components, crop, LANCZOS resize, transparent RGB zero; WebP q83. Radio white removed only by edge-connected mask.'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('VERIFIED',len(outputs),'runtime images;',sum(r['bytes'] for r in outputs),'bytes')
