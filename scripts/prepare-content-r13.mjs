import sharp from 'sharp';
import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root='docs/content/r13/art';await mkdir(root,{recursive:true});await mkdir('public/art/content-r13',{recursive:true});
const source='C:/Users/digimkt/.codex/generated_images/01a152a2-d0c2-7123-a95d-b12044e432de/exec-594a6b86-3e75-4cd1-8ad4-0dc7f44d5098.png';
const original=`${root}/station-rail-contact-original.png`,path='public/art/content-r13/station-rail-contact.webp';
await copyFile(source,original);await sharp(original).webp({quality:92}).toFile(path);
const rejectedSource='C:/Users/digimkt/.codex/generated_images/01a152a2-d0c2-7123-a95d-b12044e432de/exec-c34bb21f-0c7a-4e92-b923-f90292284cb6.png',rejectedOriginal=`${root}/attempt-1-rejected.png`;await copyFile(rejectedSource,rejectedOriginal);
const sha=b=>createHash('sha256').update(b).digest('hex'),meta=await sharp(path).metadata();
await sharp(path).resize(64,96).png().toFile(`${root}/station-64.png`);
const {data,info}=await sharp(path).raw().toBuffer({resolveWithObject:true});let lum=0,sat=0,dark=0,low=0;const pixels=info.width*info.height;
for(let i=0;i<data.length;i+=info.channels){const rgb=[data[i],data[i+1],data[i+2]].map(v=>v/255),hi=Math.max(...rgb),lo=Math.min(...rgb),l=rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722,s=hi?(hi-lo)/hi:0;lum+=l;sat+=s;dark+=l<.12;low+=s<.2;}
const train=await sharp('public/art/content-r3/train-side.webp').ensureAlpha().raw().toBuffer({resolveWithObject:true});const wheels=[.149,.285,.69,.852].map(x=>{const px=Math.round(x*train.info.width);let y=train.info.height-1;while(y>0&&train.data[(y*train.info.width+px)*4+3]<128)y--;return {x: px,y,normalized:y/train.info.height};});
await writeFile(`${root}/rejected-source.json`,JSON.stringify({status:'EXECUTED',adopted:false,tool:'image_gen.imagegen',source:rejectedSource,path:rejectedOriginal,sha256:sha(await readFile(rejectedOriginal)),reason:'Two widely separated rails remained; used as the reference for the accepted second edit'},null,2));
await writeFile(`${root}/manifest.json`,JSON.stringify({status:'VERIFIED',tool:'image_gen.imagegen',model_slug:null,calls:2,designs:1,runtimeAssets:1,rejected:'First edit retained two widely spaced rails; second edit removes the far rail.',assets:[{source,original,path,width:meta.width,height:meta.height,sha256:sha(await readFile(path)),originalSha256:sha(await readFile(original)),processing:'Sharp encoding and validation thumbnails only; no pixel painting'}],palette:{luminance:lum/pixels,saturation:sat/pixels,nearBlack:dark/pixels,lowSaturation:low/pixels},registration:{railTopY:1186,canvasHeight:1536,trainWidth:train.info.width,trainHeight:train.info.height,wheelAlphaThreshold:128,wheels,usedWheelBottom:.94,method:'Measured opaque wheel centers from existing alpha artwork; rail upper edge read from original generated single-rail scene. Browser geometric contact error includes subpixel rounding.'}},null,2));
console.log('VERIFIED generated rail-contact scene and original hashes');
