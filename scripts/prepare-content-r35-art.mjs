// Extract only generated sprites; no procedural character or scene drawing.
import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';
await mkdir('public/art/content-r35',{recursive:true});
await sharp('docs/content/r35/art/push-hand-source.png').trim().resize({width:256}).png().toFile('public/art/content-r35/push-hand.png');
const source='docs/content/r35/art/balancing-atlas-v2-source.png';
// Actual atlas spacing: first fingertips extend 12px past the nominal third.
// The adjacent raised hand is higher; the 524px boundary preserves silhouettes.
for(const [i,left,right] of [[0,0,524],[1,524,1024],[2,1024,1536]]){
 const b=await sharp(source).extract({left,top:0,width:right-left,height:1024}).toBuffer();
 await sharp(b).trim().resize({height:400}).png().toFile(`public/art/content-r35/passenger-${i+1}-balancing.png`);
}
await sharp('docs/content/r35/art/girl-color-source.png').trim().resize({height:400}).png().toFile('public/art/content-r35/passenger-2-balancing.png');
