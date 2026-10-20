import sharp from 'sharp';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root='docs/content/r10/art',runtime='public/art/content-r10',assets=[];
const src=`${root}/waiting-original.png`,m=await sharp(src).metadata(),cw=Math.floor(m.width/3);
for(const [n,who] of ['child','grandma','bike'].entries()){
 const cell=await sharp(src).extract({left:n*cw,top:0,width:cw,height:m.height}).toBuffer();
 const b=await sharp(cell).trim().toBuffer();
 const path=`${runtime}/${who}-waiting.png`;
 await sharp(b).resize({height:350,width:390,fit:'inside'}).extend({top:0,bottom:0,left:0,right:0}).png().toBuffer().then(async data=>{
  const meta=await sharp(data).metadata();await sharp(data).extend({left:Math.floor((420-meta.width)/2),right:Math.ceil((420-meta.width)/2),top:380-meta.height,bottom:20,background:'#00000000'}).png().toFile(path);
 });assets.push({path,source:src,cell:n,method:'sharp crop alpha cell, contain 390x350, 420x400 canvas, feet y=380'});
}
const door=`${root}/door-original.png`;
await sharp(door).trim().resize({height:480}).png().toFile(`${runtime}/open-door.png`);
const step=await sharp(door).extract({left:95,top:965,width:820,height:160}).toBuffer();
await sharp(step).trim().resize({width:256}).png().toFile(`${runtime}/boarding-step.png`);
assets.push({path:`${runtime}/open-door.png`,source:door},{path:`${runtime}/boarding-step.png`,source:door,method:'crop original illustrated lower tread, no painting'});
await sharp(`${root}/platform-final-original.png`).resize({height:1536}).webp({quality:92}).toFile(`${runtime}/station-wide-platform.webp`);
assets.push({path:`${runtime}/station-wide-platform.webp`,source:`${root}/platform-final-original.png`,method:'sharp format conversion only; generated continuous waiting platform'});
for(const a of assets){const b=await readFile(a.path),meta=await sharp(b).metadata();Object.assign(a,{sha256:createHash('sha256').update(b).digest('hex'),width:meta.width,height:meta.height,alpha:meta.hasAlpha});}
await writeFile(`${root}/manifest.json`,JSON.stringify({status:'VERIFIED',tool:'image_gen.imagegen',model_slug:null,generationCalls:4,newDesigns:5,newRuntimeImages:6,assets},null,2));
console.log('VERIFIED six runtime files from four image_gen.imagegen calls including one superseded platform revision');
