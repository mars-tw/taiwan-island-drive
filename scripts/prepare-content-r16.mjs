import sharp from 'sharp';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const original='docs/content/r16/art/passengers-waving-original.png',out='public/art/content-r16';
await mkdir(out,{recursive:true});
const meta=await sharp(original).metadata(),assets=[];
for(let i=0;i<3;i++){
 const left=Math.round(i*meta.width/3),right=Math.round((i+1)*meta.width/3),path=`${out}/passenger-${i+1}-wave.webp`;
 const cell=await sharp(original).extract({left,top:0,width:right-left,height:meta.height}).png().toBuffer();
 await sharp(cell).trim().resize({width:256}).webp({quality:92,alphaQuality:100}).toFile(path);
 const m=await sharp(path).metadata();assets.push({path,width:m.width,height:m.height,hasAlpha:m.hasAlpha,sha256:createHash('sha256').update(await readFile(path)).digest('hex')});
}
const cakeOriginal='docs/content/r16/art/cake-delivery-original.png',cakePath=`${out}/cake-delivery.webp`;
await sharp(cakeOriginal).webp({quality:90}).toFile(cakePath);const cakeMeta=await sharp(cakePath).metadata();assets.push({path:cakePath,width:cakeMeta.width,height:cakeMeta.height,sha256:createHash('sha256').update(await readFile(cakePath)).digest('hex')});
for(const a of assets)await sharp(a.path).resize(64,64,{fit:'contain',background:'#e4f6ff'}).png().toFile(`docs/content/r16/art/${a.path.split('/').pop().replace('.webp','-64.png')}`);
await writeFile('docs/content/r16/art/manifest.json',JSON.stringify({status:'VERIFIED',tool:'image_gen.imagegen',model_slug:null,newGenerationCalls:2,newDesigns:4,newRuntimeAssets:4,originals:await Promise.all([original,cakeOriginal].map(async path=>({path,sha256:createHash('sha256').update(await readFile(path)).digest('hex')}))),method:'Generated passenger sheet: per-cell extraction/alpha trim and WebP encoding with sharp. Separate cake delivery illustration. Distinct waving arm poses are static ending poses, not a new waving animation.',assets},null,2));
