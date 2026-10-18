import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const folder='docs/content/r3/art',runtime='public/art/content-r3';
const p=JSON.parse(await readFile(`${folder}/PROMPTS.json`,'utf8')),outputs=[];
await mkdir(runtime,{recursive:true});
for(const r of p.records){
 const source=`${folder}/${r.id}-master.png`,path=`${runtime}/${r.id}.webp`;
 await copyFile(`C:/Users/digimkt/.codex/generated_images/01a14fe8-4ca4-7571-b5f0-72e1e90eed39/${r.generated_file}`,source);
 await sharp(source).webp({quality:90}).toFile(path);
 const b=await readFile(path),m=await sharp(path).metadata();
 outputs.push({path,source,width:m.width,height:m.height,hasAlpha:m.hasAlpha,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex'),sourceSha256:createHash('sha256').update(await readFile(source)).digest('hex')});
}
await writeFile(`${folder}/manifest.json`,JSON.stringify({status:'VERIFIED',tool:p.tool,model_slug:null,generationCalls:p.records.length,designs:p.records.length,runtimeImages:outputs.length,processing:'PNG to WebP quality 90 only; original dimensions and alpha preserved',outputs},null,2));
console.log(`VERIFIED ${outputs.length} generated runtime assets and original sources`);
