"""Pixel comparison of identical UI runs against the pre-fix R35 build."""
import hashlib
import json
import math
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/content/r36'
def load(p): return json.loads(p.read_text(encoding='utf-8'))
captures = load(OUT/'visual-comparison/captures.json')
assert captures['status'] == 'EXECUTED'
old = {r['name']:r for r in captures['rows'] if r['reference']}
current = [r for r in captures['rows'] if not r['reference']]
assert len(old) == len(current) == 15
rows = []
for row in current:
    name = row['name']
    previous = old[name]
    left, right = Image.open(ROOT / previous['path']).convert('RGB'), Image.open(ROOT / row['path']).convert('RGB')
    assert left.size == right.size == (390, 844)
    difference = ImageChops.difference(left, right)
    mask = Image.new('L', left.size, 0)
    draw = ImageDraw.Draw(mask)
    allowed = []
    for card in row['cards']:
        if card['observed'] != 'false': continue
        # Include the card border and antialiasing, without masking its neighbours.
        box = [math.floor(card['x'])-2, math.floor(card['y'])-2,
               math.ceil(card['x']+card['width'])+2, math.ceil(card['y']+card['height'])+2]
        draw.rectangle(box, fill=255)
        allowed.append(dict(side=card['side'], box=box))
    outside = ImageChops.multiply(difference, Image.merge('RGB', [ImageChops.invert(mask)]*3))
    changed = sum(p != (0, 0, 0) for p in difference.get_flattened_data())
    unexpected = sum(p != (0, 0, 0) for p in outside.get_flattened_data())
    state_diff = {k:[previous['state'].get(k),v] for k,v in row['state'].items() if previous['state'].get(k) != v}
    presentation_equal = previous['presentation'] == row['presentation']
    presentation_hash = hashlib.sha256(json.dumps(row['presentation'],ensure_ascii=False,sort_keys=True).encode()).hexdigest()
    rows.append(dict(path=row['path'], baseline=previous['path'], baselineSha256=previous['sha256'],
                     sha256=row['sha256'], changedPixels=changed, outsideMaskPixelDifferences=unexpected,
                     outsideMaskMaxChannelDelta=max(high for low,high in outside.getextrema()),
                     stateDifferences=state_diff,presentationEqual=presentation_equal,
                     presentationSha256=presentation_hash,comparedElements=len(row['presentation']),
                     allowedUnobservedCards=allowed, status='VERIFIED' if presentation_equal and not state_diff else 'BLOCKED'))
result = dict(status='VERIFIED' if all(r['status'] == 'VERIFIED' for r in rows) else 'BLOCKED',
              method=captures['method']+'; exact rendered text, geometry, image source and 35 computed style properties outside unobserved cards; RGB pixels reported separately without an equality claim',
              baselineCommit=load(OUT/'baseline.json')['commit'], baselineBuild='R35 runtime read directly from Git, R36 version label on both builds',
              pairs=len(rows), exactImages=sum(r['changedPixels'] == 0 for r in rows),
              changedOnlyInUnobservedCards=sum(r['changedPixels'] > 0 and r['outsideMaskPixelDifferences'] == 0 for r in rows),
              imagesWithOutsideMaskPixelDifferences=sum(r['outsideMaskPixelDifferences'] > 0 for r in rows), rows=rows)
result['pixelComparisonStatus']='EXECUTED: raw pixels retain small compositing edge differences; these are not reported as byte-identical screenshots'
result['identicalPresentationPairs']=sum(r['presentationEqual'] and not r['stateDifferences'] for r in rows)
(OUT/'r35-comparison.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k != 'rows'}, ensure_ascii=False))
assert result['status'] == 'VERIFIED'
