import sharp from 'sharp';
import {mkdir,copyFile,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const source=process.argv[2],first=process.argv[3];if(!source||!first)throw Error('Both generated sheets required');
const root='docs/content/r27/art';await mkdir(root,{recursive:true});await mkdir('public/art/content-r27',{recursive:true});
await copyFile(source,`${root}/bike-walk-original.png`);await copyFile(first,`${root}/bike-walk-first-attempt.png`);
const meta=await sharp(source).metadata(),half=Math.floor(meta.width/2),assets=[];
for(let i=0;i<2;i++){
 const path=`public/art/content-r27/bike-walk-${i}.webp`;
 const crop=await sharp(source).extract({left:i*half,top:0,width:half,height:meta.height}).png().toBuffer();
 await sharp(crop).trim().resize(384,384,{fit:'contain',background:'#00000000'}).webp({lossless:true}).toFile(path);
 const buffer=await readFile(path);assets.push({path,sha256:createHash('sha256').update(buffer).digest('hex')});
 await sharp(buffer).resize(64,64).png().toFile(`${root}/bike-walk-${i}-64.png`);
}
await writeFile(`${root}/manifest.json`,JSON.stringify({status:'VERIFIED',tool:'image_gen.imagegen',model_slug:null,generationCalls:2,newRuntimeImages:2,source:`${root}/bike-walk-original.png`,sourceSha256:createHash('sha256').update(await readFile(source)).digest('hex'),method:'First sheet repeated gait; second call corrected the right frame. Boy and both legs visibly beside bicycle, empty saddle. Sharp only splits, trims alpha and scales; no program drawing or local GPU.',assets},null,2));
