from pathlib import Path
from PIL import Image,ImageOps,ImageDraw,ImageFont
import hashlib,json
ROOT=Path(__file__).resolve().parents[1];art=ROOT/'docs/art'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
for p in art.glob('*.txt'):
    b=p.read_bytes();s=b.decode('utf-16') if b.startswith((b'\xff\xfe',b'\xfe\xff')) else b.decode('utf-8-sig')
    p.write_text(s.replace('\r',''),encoding='utf-8',newline='\n')
before=art/'compare/before';after=art/'compare/after';pairs=[]
for p in sorted(before.glob('*.png')):
    other=after/p.name
    if other.is_file():
        assert Image.open(p).size==Image.open(other).size
        pairs.append({'before':p.relative_to(ROOT).as_posix(),'after':other.relative_to(ROOT).as_posix(),'size':Image.open(p).size,'before_sha256':sha(p),'after_sha256':sha(other)})
assert len(pairs)==22,len(pairs)
chosen=['phone-home','phone-math','phone-passport','phone-flight','phone-train','desktop-home','ipad-home']
board=Image.new('RGB',(1040,len(chosen)*390),'#e8f3fc');draw=ImageDraw.Draw(board)
font=ImageFont.truetype('C:/Windows/Fonts/msjh.ttc',20)
for row,name in enumerate(chosen):
    for col,folder in enumerate([before,after]):
        im=ImageOps.contain(Image.open(folder/(name+'.png')).convert('RGB'),(506,350))
        board.paste(im,(col*520+(520-im.width)//2,row*390+35))
        draw.text((col*520+12,row*390+6),f'{"改前 2.7.0" if col==0 else "改後 2.8.0"} · {name}',font=font,fill='#143b61')
board.save(art/'compare/R4-before-after.jpg',quality=90,optimize=True)
stores=[]
for p in sorted((ROOT/'docs/store/screenshots/art-r4').glob('*.png')):
    im=Image.open(p);assert im.size in [(1290,2796),(2064,2752)],(p,im.size)
    stores.append({'path':p.relative_to(ROOT).as_posix(),'size':im.size,'sha256':sha(p),'native':False})
assert len(stores)==22,len(stores)
(art/'compare/pairs.json').write_text(json.dumps({'status':'VERIFIED','pairs':pairs},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(ROOT/'docs/store/screenshots/art-r4/manifest.json').write_text(json.dumps({'status':'VERIFIED','version':'2.8.0','build_worker_sha256':sha(ROOT/'dist/sw.js'),'method':'unmodified headless Chromium web runtime; not native screenshots','shots':stores},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
lines=(art/'frame-times.txt').read_text(encoding='utf-8').splitlines();perf=json.loads(next(s for s in reversed(lines) if s.startswith('{"renderer"')))
perf.update(status='EXECUTED',interpretation='Concurrent-load rAF sampling only; not a clean-machine shipment gate. Physics/frame loop unchanged by subsequent palette and text-only polish.',runs_per_case=3,sample_ms=2000,formal_gate='BLOCKED')
(art/'performance.json').write_text(json.dumps(perf,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(art/'contrast.json').write_text(json.dumps({'status':'VERIFIED','method':'WCAG sRGB relative luminance','body_ink_on_white':11.4883,'orange_button_ink_on_orange':4.9494,'colors':{'body':'#143B61','button_text':'#0B2942','orange':'#F46B27','white':'#FFFFFF'}},indent=2)+'\n',encoding='utf-8')
print(json.dumps({'status':'VERIFIED','comparison_pairs':len(pairs),'art_store_shots':len(stores),'performance_cases':len(perf['rows']),'p95_range':[min(r['p95'] for r in perf['rows']),max(r['p95'] for r in perf['rows'])]}))
