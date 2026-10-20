import {mkdir,copyFile,readFile,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
import {createHash} from 'node:crypto';
const out='docs/content/r6/art',runtime='public/art/content-r6';
await mkdir(out,{recursive:true});await mkdir(runtime,{recursive:true});
const original=`${out}/grandma-sheet-original.png`;
await copyFile('C:/Users/digimkt/.codex/generated_images/01a1505b-fcd6-7142-a6dc-f1e49d89b5d5/exec-d89d3ed6-0a30-439b-b7a7-e75513f328dc.png',original);
const m=await sharp(original).metadata(),assets=[];
// The source sheet's transparent gutter lies at 54.5% of its 1774px width.
const split=Math.round(m.width*.545);
for(let i=0;i<2;i++){
 const path=`${runtime}/grandma-${i}.png`,left=i?split:0,width=i?m.width-split:split;
 const cell=await sharp(original).extract({left,top:0,width,height:m.height}).png().toBuffer();
 await sharp(cell).trim().resize({width:350,height:350,fit:'contain',background:'#00000000'}).png().toFile(path);
 const b=await readFile(path),meta=await sharp(path).metadata();
 if(!meta.hasAlpha)throw Error('Missing alpha');
 assets.push({path,width:meta.width,height:meta.height,hasAlpha:meta.hasAlpha,sha256:createHash('sha256').update(b).digest('hex')});
}
await writeFile(`${out}/manifest.json`,JSON.stringify({status:'VERIFIED',tool:'image_gen.imagegen',model_slug:null,generationCalls:1,newDesigns:1,newAnimationPoses:2,newRuntimeImages:2,original,sourceSha256:createHash('sha256').update(await readFile(original)).digest('hex'),processing:'Deterministic crop at transparent cell gutter, trim transparent margins, proportional fit to 350x350; alpha preserved; no repainting',assets},null,2));
console.log(JSON.stringify({sourceSize:[m.width,m.height],split,assets}));
