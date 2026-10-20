import assert from 'node:assert/strict';
import sharp from 'sharp';
import {writeFile} from 'node:fs/promises';
const files=['public/art/content-r33/bay-panorama.webp',...[1,2,3].flatMap(n=>['seated','standing'].map(p=>`public/art/content-r33/passenger-${n}-${p}.png`))],rows=[];
for(const path of files){
 const {data,info}=await sharp(path).ensureAlpha().raw().toBuffer({resolveWithObject:true});let pixels=0,brightness=0,saturation=0,nearBlack=0,lowSaturation=0;
 for(let i=0;i<data.length;i+=4){if(data[i+3]<128)continue;const [r,g,b]=[data[i],data[i+1],data[i+2]].map(v=>v/255),max=Math.max(r,g,b),min=Math.min(r,g,b),l=.2126*r+.7152*g+.0722*b,s=max?(max-min)/max:0;pixels++;brightness+=l;saturation+=s;nearBlack+=l<.12;lowSaturation+=s<.2;}
 const row={path,width:info.width,height:info.height,pixels,brightness:brightness/pixels,saturation:saturation/pixels,nearBlack:nearBlack/pixels,lowSaturation:lowSaturation/pixels};
 row.pass=row.brightness>=.30&&row.brightness<=.75&&row.saturation>=.32&&row.nearBlack<.35&&row.lowSaturation<.20;rows.push(row);
}
await writeFile('docs/content/r33/art/color-audit.json',JSON.stringify({status:rows.every(r=>r.pass)?'VERIFIED':'BLOCKED',method:'opaque alpha>=128 pixels; Rec709 weighted encoded RGB brightness; HSV saturation, near-black <.12 and low-saturation <.2, matching R10 diagnostics; not an art score',rows},null,2));
assert.ok(rows.every(r=>r.pass),'new art color gates');console.log('VERIFIED seven art color gates');
