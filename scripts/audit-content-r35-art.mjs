import sharp from 'sharp';
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('docs/content/r35/art/64px',{recursive:true});
const rows=[];
for(const name of ['push-hand','passenger-1-balancing','passenger-2-balancing','passenger-3-balancing']){
 const path='public/art/content-r35/'+name+'.png',thumb='docs/content/r35/art/64px/'+name+'.png';
 await sharp(path).resize(64,64,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png().toFile(thumb);
 const {data}=await sharp(path).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let total=0,luminance=0,saturation=0,nearBlack=0,lowSaturation=0;
 for(let i=0;i<data.length;i+=4){
  if(data[i+3]<128)continue;
  const [r,g,b]=[data[i]/255,data[i+1]/255,data[i+2]/255],max=Math.max(r,g,b),min=Math.min(r,g,b),sat=max?(max-min)/max:0,lum=.2126*r+.7152*g+.0722*b;
  total++;luminance+=lum;saturation+=sat;if(lum<.12)nearBlack++;if(sat<.32)lowSaturation++;
 }
 rows.push({path,thumb,pixels:total,luminance:luminance/total,saturation:saturation/total,nearBlack:nearBlack/total,lowSaturation:lowSaturation/total});
}
const pass=rows.every(r=>r.luminance>=.30&&r.luminance<=.75&&r.nearBlack<.35&&r.saturation>=.32&&r.lowSaturation<.20);
await writeFile('docs/content/r35/art/64px-metrics.json',JSON.stringify({status:pass?'VERIFIED':'BLOCKED',method:'opaque alpha>=128 pixels; sRGB weighted luma; HSV saturation; near-black<.12; low saturation<.32',thresholds:{luminance:[.30,.75],nearBlackMax:.35,saturationMin:.32,lowSaturationMax:.20},rows},null,2));
if(!pass)throw Error('art brightness/saturation gate failed');
console.log('VERIFIED 4 generated assets: brightness, saturation and 64px exports');
