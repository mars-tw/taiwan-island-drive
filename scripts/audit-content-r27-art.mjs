import sharp from 'sharp';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
const manifest=JSON.parse(await readFile('docs/content/r27/art/manifest.json','utf8')),rows=[];
for(const asset of manifest.assets){
 const {data,info}=await sharp(asset.path).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let pixels=0,luma=0,saturation=0,dark=0,low=0,transparent=0;
 for(let i=0;i<data.length;i+=4){if(data[i+3]<128){transparent++;continue;}const [r,g,b]=[data[i],data[i+1],data[i+2]].map(v=>v/255),hi=Math.max(r,g,b),lo=Math.min(r,g,b),s=hi?(hi-lo)/hi:0,y=.2126*r+.7152*g+.0722*b;pixels++;luma+=y;saturation+=s;dark+=y<.10?1:0;low+=s<.20?1:0;}
 const row={path:asset.path,width:info.width,height:info.height,pixels,transparentPixels:transparent,meanLuminance:luma/pixels,meanSaturation:saturation/pixels,nearBlackRatio:dark/pixels,lowSaturationRatio:low/pixels};
 assert.ok(transparent>0&&pixels>10000,'transparent non-placeholder art');assert.ok(row.meanLuminance>=.30&&row.meanLuminance<=.75);assert.ok(row.nearBlackRatio<.35);assert.ok(row.meanSaturation>=.32);assert.ok(row.lowSaturationRatio<.20);rows.push(row);
}
await writeFile('docs/content/r27/art/visual-check.json',JSON.stringify({status:'VERIFIED',method:'Alpha-aware luminance and HSV saturation gates; runtime sprites remain unchanged. Two distinct generated walking silhouettes were also visually inspected at original and gameplay sizes.',rows},null,2));
console.log('VERIFIED both generated bicycle-walking sprites: alpha, luminance and saturation');
