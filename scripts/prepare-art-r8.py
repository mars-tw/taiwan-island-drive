"""Preserve generated alpha; compress runtime copies; record reproducible provenance."""
from pathlib import Path
from PIL import Image
import numpy as np
from scipy import ndimage
import hashlib,json,re,shutil
ROOT=Path(__file__).resolve().parents[1]; ART=ROOT/'docs/art'; OUT=ROOT/'public/art/r8'; SRC=ART/'source/r8'
OUT.mkdir(parents=True,exist_ok=True);SRC.mkdir(parents=True,exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
spec=json.loads((ART/'PROMPTS_R8.json').read_text(encoding='utf-8'));sources=[];outputs=[]
sizes={'airborne-coast':(1536,1024),'coach-safe-window':(384,384),'train-platform':(768,512),'ocean-ticket':(768,512),'coast-star':(192,192),'coast-sign':(256,256),'logo':(520,260),'app-icon-proposal':(1024,1024)}
for r in spec['records']:
    original=Path(r['output_hint'].split(' as ',1)[1].split(' by default.',1)[0]); dst=SRC/(r['id']+'.png');shutil.copyfile(original,dst)
    im=Image.open(dst).convert('RGBA');sources.append({'path':dst.relative_to(ROOT).as_posix(),'sha256':sha(dst)})
    if r['transparent_background']:
        mask=SRC/(r['id']+'-mask.png');im.getchannel('A').save(mask)
        opaque=SRC/(r['id']+'-opaque.png');bg=Image.new('RGBA',im.size,'white');bg.alpha_composite(im);bg.convert('RGB').save(opaque)
        sources.extend({'path':p.relative_to(ROOT).as_posix(),'sha256':sha(p)} for p in [mask,opaque])
        a=np.array(im);a[a[:,:,3]<30]=0
        # Alpha fringe can contain very faint generated shadow outside the subject.
        labels,n=ndimage.label(a[:,:,3]>100);areas=np.bincount(labels.ravel());major=areas[1:].argmax()+1
        keep=ndimage.binary_dilation(labels==major,iterations=3);a[~keep]=0
        im=Image.fromarray(a);im=im.crop(im.getbbox());im.thumbnail(tuple(v-12 for v in sizes[r['id']]),Image.Resampling.LANCZOS)
        canvas=Image.new('RGBA',sizes[r['id']]);canvas.alpha_composite(im,((canvas.width-im.width)//2,(canvas.height-im.height)//2));a=np.array(canvas);a[a[:,:,3]==0,:3]=0;im=Image.fromarray(a)
        name=r['id']+'.png';im.save(OUT/name,optimize=True)
    else:
        im=im.convert('RGB').resize(sizes[r['id']],Image.Resampling.LANCZOS);name=r['id']+('.webp' if r['id']=='airborne-coast' else '.png');im.save(OUT/name,**({'quality':83,'method':6} if name.endswith('.webp') else {'optimize':True}))
    p=OUT/name
    if r['id']=='app-icon-proposal':
        proposal=ART/'proposals/r8-app-icon.png';proposal.parent.mkdir(parents=True,exist_ok=True);p.replace(proposal);p=proposal
    row={'path':p.relative_to(ROOT).as_posix(),'bytes':p.stat().st_size,'size':im.size,'sha256':sha(p),'transparent':r['transparent_background']}
    if r['transparent_background']:
        a=np.array(im);v=a[:,:,3]>128;rgb=a[:,:,:3][v]/255.;lum=rgb@np.array([.2126,.7152,.0722]);sat=(rgb.max(1)-rgb.min(1))/np.maximum(rgb.max(1),.001)
        row.update(alpha_corners=all(a[y,x,3]==0 for y,x in [(0,0),(0,-1),(-1,0),(-1,-1)]),occupancy=float(v.mean()),mean_luminance=float(lum.mean()),near_black=float((lum<.1).mean()),mean_saturation=float(sat.mean()),low_saturation=float((sat<.2).mean()))
        assert row['alpha_corners'] and .03<row['occupancy']<.96,row
        if r['id']=='coach-safe-window':assert .3<=row['mean_luminance']<=.75 and row['near_black']<.35 and row['mean_saturation']>=.32 and row['low_saturation']<.2,row
    outputs.append(row)
for size in [192,512]:
    p=OUT/f'app-icon-{size}.png';Image.open(ART/'proposals/r8-app-icon.png').resize((size,size),Image.Resampling.LANCZOS).save(p,optimize=True);outputs.append({'path':p.relative_to(ROOT).as_posix(),'bytes':p.stat().st_size,'size':[size,size],'sha256':sha(p),'transparent':False})
platform=ROOT/'public/art/r5/platform.webp';sources.append({'path':platform.relative_to(ROOT).as_posix(),'sha256':sha(platform),'role':'Retained R5 AI artwork, deterministic environment detail crop'})
for name,box,size in [('platform-floor',(100,605,1430,700),(1024,96)),('rail-strip',(0,835,1536,1024),(768,96))]:
    p=OUT/(name+'.webp');im=Image.open(platform).crop(box).resize(size,Image.Resampling.LANCZOS);im.save(p,quality=83,method=6);outputs.append({'path':p.relative_to(ROOT).as_posix(),'bytes':p.stat().st_size,'size':size,'sha256':sha(p),'derived_from':'public/art/r5/platform.webp','crop':box,'transparent':False})
thumb=Image.new('RGB',(8*80,160),'white')
for i,r in enumerate(spec['records']):
    p=next(x for x in outputs if Path(x['path']).stem==(r['id'] if r['id']!='app-icon-proposal' else 'r8-app-icon'));im=Image.open(ROOT/p['path']).convert('RGBA');im.thumbnail((64,64),Image.Resampling.LANCZOS)
    for y,color in [(0,'white'),(80,'#80d6fa')]:
        tile=Image.new('RGBA',(80,80),color);tile.alpha_composite(im,((80-im.width)//2,(80-im.height)//2));thumb.paste(tile.convert('RGB'),(i*80,y))
thumb.save(ART/'thumbnail-64-r8.png')
manifest={'status':'VERIFIED','tool':spec['tool'],'model_slug':None,'model_note':spec['model_note'],'generation_calls':len(spec['records']),'sources':sources,'outputs':outputs,'new_runtime_bytes':sum(x['bytes'] for x in outputs if x['path'].startswith('public/')),'postprocess':'Original alpha preserved; mask and opaque master retained; threshold faint alpha, dominant component clean, transparent RGB zero, padded resize; RGB background WebP q83.','license_note':'AI-generated assets documented separately; existing licenses retained.','app_icon_status':'Proposal plus web runtime only; no native catalog replacement.'}
(ART/'asset-manifest-r8.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(manifest,ensure_ascii=False))
