import sharp from 'sharp';
import {copyFile,mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const source='C:/Users/digimkt/.codex/generated_images/01a15919-a974-7651-b9ab-69db4c3d2651';
const assets=[['crossing-harbor','exec-b73b4668-e4c6-45a3-adac-0f2bf9e691f8.png'],['crossing-banyan','exec-ab3ab548-3d3f-44d3-a90b-2b81226ea1d8.png'],['crossing-lighthouse','exec-0671c405-71c8-4b3b-8f34-4e4199483730.png'],['station-banyan','exec-1c8242ca-49ce-4699-aeae-e78286bb580e.png'],['station-lighthouse','exec-82264378-dde1-411f-90cd-79cbf6e6be23.png']];
await mkdir('public/art/content-r24',{recursive:true});await mkdir('docs/content/r24/art',{recursive:true});
const rows=[];
for(const [id,file] of assets){
 const original=`docs/content/r24/art/${id}-original.png`,runtime=`public/art/content-r24/${id}.webp`;
 await copyFile(`${source}/${file}`,original);await sharp(original).webp({quality:92}).toFile(runtime);
 await sharp(original).resize(64,96).png().toFile(`docs/content/r24/art/${id}-64.png`);
 const b=await readFile(runtime),meta=await sharp(b).metadata(),{channels}=await sharp(b).stats();
 rows.push({id,original,originalSha256:createHash('sha256').update(await readFile(original)).digest('hex'),runtime,width:meta.width,height:meta.height,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex'),meanRGB:channels.slice(0,3).map(c=>c.mean)});
}
await writeFile('docs/content/r24/art/manifest.json',JSON.stringify({status:'VERIFIED',tool:'image_gen.imagegen',model_slug:null,generationCalls:6,newRuntimeImages:5,rejected:'Lighthouse first draft contained painted cars; the sixth call removed them. Rejected draft not used.',processing:'Sharp encoding and inspection thumbnail only; no procedural painting',assets:rows},null,2));
