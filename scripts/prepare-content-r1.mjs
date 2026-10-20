import sharp from 'sharp';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const source='docs/content/r1/art/sprite-master.png';
await mkdir('docs/content/r1/art',{recursive:true});await mkdir('public/art/content-r1',{recursive:true});
const meta=await sharp(source).metadata(),names=['cake','flag','child-0','child-1','bike-0','bike-1','grandma-0','grandma-1'],outputs=[];
for(let i=0;i<8;i++){let left=Math.round((i%4)*meta.width/4),top=Math.round(Math.floor(i/4)*meta.height/2),right=Math.round((i%4+1)*meta.width/4),bottom=Math.round((Math.floor(i/4)+1)*meta.height/2);if(i===0)right=475;if(i===1){left=525;top=20;right=865;bottom=420;}if(i===4)right=475;if(i===5)left=490;const path=`public/art/content-r1/${names[i]}.png`;await sharp(source).extract({left,top,width:right-left,height:bottom-top}).resize(384,384,{fit:'contain',background:'#00000000'}).png().toFile(path);const data=await readFile(path);outputs.push({path,width:384,height:384,sha256:createHash('sha256').update(data).digest('hex'),crop:{left,top,width:right-left,height:bottom-top}});}
await writeFile('docs/content/r1/art/manifest.json',JSON.stringify({status:'EXECUTED',tool:'image_gen.imagegen',model_slug:null,generation_calls:1,designs:5,pose_frames:6,outputs,source:'docs/content/r1/art/sprite-master.png',source_sha256:createHash('sha256').update(await readFile(source)).digest('hex'),processing:'sharp: grid crop and size normalization only, alpha retained; no procedural replacement art'},null,2));
const crossingSource='docs/content/r1/art/crossing-master.png';
await sharp(crossingSource).webp({quality:88}).toFile('public/art/content-r1/crossing.webp');
const m=JSON.parse(await readFile('docs/content/r1/art/manifest.json','utf8'));m.generation_calls=2;m.designs=6;m.outputs.push({path:'public/art/content-r1/crossing.webp',width:1536,height:1024,sha256:createHash('sha256').update(await readFile('public/art/content-r1/crossing.webp')).digest('hex'),source:'docs/content/r1/art/crossing-master.png',source_sha256:createHash('sha256').update(await readFile(crossingSource)).digest('hex')});await writeFile('docs/content/r1/art/manifest.json',JSON.stringify(m,null,2));
const turnaround='docs/content/r1/art/character-turnarounds.png';
m.generation_calls=3;m.runtime_generation_calls=2;m.reference_boards=[{path:'docs/content/r1/art/character-turnarounds.png',tool:'image_gen.imagegen',sha256:createHash('sha256').update(await readFile(turnaround)).digest('hex')}];
await writeFile('docs/content/r1/art/manifest.json',JSON.stringify(m,null,2));
const thumbs=[];for(let i=0;i<8;i++){const input=await sharp(`public/art/content-r1/${names[i]}.png`).resize(64,64).toBuffer();thumbs.push({input,left:i*64,top:0},{input,left:i*64,top:64});}
const white=await sharp({create:{width:512,height:64,channels:4,background:'#ffffff'}}).png().toBuffer(),blue=await sharp({create:{width:512,height:64,channels:4,background:'#1479b8'}}).png().toBuffer();
await sharp({create:{width:512,height:128,channels:4,background:'#ffffff'}}).composite([{input:white,left:0,top:0},{input:blue,left:0,top:64},...thumbs]).png().toFile('docs/content/r1/art/thumbnail-64.png');
