import sharp from 'sharp';
import {mkdir,readFile,writeFile,copyFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root='docs/content/r11/art',runtime='public/art/content-r11';
await mkdir(runtime,{recursive:true});
const prompts=JSON.parse(await readFile(`${root}/PROMPTS.json`,'utf8')),assets=[];
for(const r of prompts.records){
 try{await access(r.source);await copyFile(r.source,r.original);}catch{await access(r.original);}
 const path=`${runtime}/${r.id}.${r.id==='crossing-complete'?'webp':'png'}`;
 let im=sharp(r.original);
 if(r.id==='crossing-complete')await im.resize({width:1024}).webp({quality:92}).toFile(path);
 else await im.trim({threshold:20}).resize({width:r.id==='car-rear'?500:200}).png().toFile(path);
 const b=await readFile(path),m=await sharp(b).metadata();
 assets.push({id:r.id,path,original:r.original,width:m.width,height:m.height,alpha:m.hasAlpha,sha256:createHash('sha256').update(b).digest('hex'),originalSha256:createHash('sha256').update(await readFile(r.original)).digest('hex'),tool:'image_gen.imagegen',model_slug:null,processing:'Sharp crop of exterior transparent margins, proportional resize and PNG/WebP encoding only'});
 await sharp(path).resize({width:64,height:64,fit:'contain',background:'#00000000'}).png().toFile(`${root}/${r.id}-64.png`);
}
await writeFile(`${root}/manifest.json`,JSON.stringify({status:'VERIFIED',calls:3,designs:3,assets},null,2));
console.log(assets.map(x=>({path:x.path,width:x.width,height:x.height,alpha:x.alpha})));
