// Deterministic export of the generated transparent atlas, no programmatic drawing.
import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';
await mkdir('public/art/content-r33',{recursive:true});
for(let i=0;i<3;i++){
 const part=await sharp('docs/content/r33/art/seated-atlas-source.png').extract({left:i*512,top:0,width:512,height:1024}).png().toBuffer();
 await sharp(part).trim().resize({height:400}).png().toFile(`public/art/content-r33/passenger-${i+1}-seated.png`);
}
await sharp('docs/content/r33/art/bay-panorama-source.png').webp({quality:90}).toFile('public/art/content-r33/bay-panorama.webp');
for(let i=0;i<3;i++){
 const part=await sharp('docs/content/r33/art/standing-atlas-source.png').extract({left:i*512,top:0,width:512,height:1024}).png().toBuffer();
 await sharp(part).trim().resize({height:400}).png().toFile(`public/art/content-r33/passenger-${i+1}-standing.png`);
}
