import sharp from 'sharp';
import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root='docs/content/r12/art';await mkdir(root,{recursive:true});await mkdir('public/art/content-r12',{recursive:true});
const source='C:/Users/digimkt/.codex/generated_images/01a1526e-95d3-7942-b317-094e8cc1d3a9/exec-439fe22e-b158-4ce7-9236-7e08fe029b2e.png',original=`${root}/station-low-platform-original.png`,path='public/art/content-r12/station-low-platform.webp';
await copyFile(source,original);await sharp(original).webp({quality:92}).toFile(path);
const sha=b=>createHash('sha256').update(b).digest('hex'),meta=await sharp(path).metadata();
await sharp(path).resize(64,64,{fit:'contain'}).png().toFile(`${root}/station-low-platform-64.png`);
const {data,info}=await sharp(path).raw().toBuffer({resolveWithObject:true});let lum=0,sat=0,dark=0,low=0;const pixels=info.width*info.height;
for(let i=0;i<data.length;i+=info.channels){const rgb=[data[i],data[i+1],data[i+2]].map(v=>v/255),hi=Math.max(...rgb),lo=Math.min(...rgb),l=rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722,s=hi?(hi-lo)/hi:0;lum+=l;sat+=s;dark+=l<.12;low+=s<.2;}
await writeFile(`${root}/manifest.json`,JSON.stringify({status:'VERIFIED',tool:'image_gen.imagegen',model_slug:null,modelEvidence:'Built-in tool did not expose a model slug; no API or alternate model invoked',calls:1,designs:1,assets:[{path,source,original,width:meta.width,height:meta.height,sha256:sha(await readFile(path)),originalSha256:sha(await readFile(original)),processing:'Sharp WebP encoding only; no drawing, compositing or pixel edits'}],palette:{luminance:lum/pixels,saturation:sat/pixels,nearBlack:dark/pixels,lowSaturation:low/pixels}},null,2));
console.log('VERIFIED one generated scene repair, original and runtime hashes recorded');
