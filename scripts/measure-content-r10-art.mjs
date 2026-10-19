import sharp from 'sharp';
import {readFile,writeFile} from 'node:fs/promises';
const root='docs/content/r10/art',manifest=JSON.parse(await readFile(`${root}/manifest.json`,'utf8')),rows=[];
for(const asset of manifest.assets){
 const {data,info}=await sharp(asset.path).ensureAlpha().raw().toBuffer({resolveWithObject:true});let pixels=0,lum=0,saturation=0,dark=0,low=0;
 for(let i=0;i<data.length;i+=info.channels){if(data[i+3]<128)continue;const rgb=[data[i],data[i+1],data[i+2]].map(n=>n/255),hi=Math.max(...rgb),lo=Math.min(...rgb),l=.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2],s=hi?(hi-lo)/hi:0;pixels++;lum+=l;saturation+=s;dark+=l<.12;low+=s<.2;}
 rows.push({path:asset.path,pixels,luminance:lum/pixels,saturation:saturation/pixels,nearBlack:dark/pixels,lowSaturation:low/pixels});
 await sharp(asset.path).resize({width:64,height:64,fit:'contain',background:'#00000000'}).png().toFile(`${root}/${asset.path.split('/').at(-1).split('.')[0]}-64.png`);
}
await writeFile(`${root}/palette-metrics.json`,JSON.stringify({status:'EXECUTED',method:'Opaque pixels, Rec709 weighted encoded RGB luminance, HSV saturation, nearBlack l<.12, lowSaturation s<.2; diagnostics, not an art score',rows},null,2));console.log(JSON.stringify(rows));
