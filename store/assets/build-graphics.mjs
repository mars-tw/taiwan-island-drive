/** Rebuild native/store artwork from original vector identity and Blender previews. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const sharp = require('sharp');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const RES = path.join(ROOT,'resources'), OUT = path.join(ROOT,'store/assets');
await fs.mkdir(RES,{recursive:true});await fs.mkdir(OUT,{recursive:true});
const backdrop = `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#214f56"/><stop offset="1" stop-color="#173b43"/></linearGradient></defs>
<rect width="1024" height="1024" fill="url(#bg)"/>
<g transform="scale(2)" opacity=".55"><path d="M83 323 180 191 234 267 307 166 433 323Z" fill="#507e77"/><path d="M191 405c84-110-36-124 57-224h64c-92 100 39 129-44 224Z" fill="#ebd7ae"/><path d="m287 197-11 21m-5 30 7 25m-4 34-11 24m-14 33-11 23" fill="none" stroke="#173b43" stroke-width="8" stroke-linecap="round"/></g>
<circle cx="786" cy="234" r="44" fill="#ebd7ae" opacity=".80"/>`;
const transport = `<g transform="translate(512 342) scale(1.6)">
<path d="M0-92c10 0 12 18 12 43l-2 26 78 20v17L9 3 7 53l31 11v14L0 67l-38 11V64l31-11L-9 3-88 14V-3l78-20-2-26c0-25 2-43 12-43Z" fill="#f7edda"/>
<path d="m-5-49 5-12 5 12v22H-5Z" fill="#173b43"/><path d="M-58 3H-15M15 3H58" stroke="#d6a258" stroke-width="4" stroke-linecap="round"/>
</g>
<g transform="translate(347 651) scale(1.35)">
<path d="M-55-54q0-25 25-25h60q25 0 25 25v91q0 24-24 24H-31q-24 0-24-24Z" fill="#f7edda"/>
<rect x="-39" y="-54" width="78" height="45" rx="11" fill="#234b53"/><path d="M0-49v35" stroke="#7ba298" stroke-width="5"/>
<path d="M-35 5h70" stroke="#507e77" stroke-width="7" stroke-linecap="round"/><circle cx="-32" cy="28" r="8" fill="#d6a258"/><circle cx="32" cy="28" r="8" fill="#d6a258"/>
<path d="M-36 54-57 84M36 54l21 30M-50 71h100M-61 85H61" fill="none" stroke="#f7edda" stroke-width="8" stroke-linecap="round"/>
</g>
<g transform="translate(694 674) scale(1.36)">
<rect x="-62" y="19" width="21" height="37" rx="9" fill="#102f36"/><rect x="41" y="19" width="21" height="37" rx="9" fill="#102f36"/>
<path d="m-51-14 15-36q4-9 15-9h42q11 0 15 9l15 36q16 6 16 24v20q0 10-12 10H-55q-12 0-12-10V10q0-18 16-24Z" fill="#f7edda"/>
<path d="m-36-14 10-30h52l10 30Z" fill="#234b53"/><rect x="-54" y="7" width="24" height="8" rx="4" fill="#d6a258"/><rect x="30" y="7" width="24" height="8" rx="4" fill="#d6a258"/><path d="M-17 25h34" stroke="#507e77" stroke-width="7" stroke-linecap="round"/>
</g>`;
const svg = (body,size=1024) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">${body}</svg>`;
const icon = svg(backdrop+transport), foreground=svg(transport), background=svg(backdrop);
await fs.writeFile(path.join(RES,'icon-source.svg'),icon);
await fs.writeFile(path.join(RES,'icon-foreground-source.svg'),foreground);
await fs.writeFile(path.join(RES,'icon-background-source.svg'),background);
await sharp(Buffer.from(icon)).removeAlpha().png().toFile(path.join(RES,'icon-only.png'));
await sharp(Buffer.from(foreground)).png().toFile(path.join(RES,'icon-foreground.png'));
await sharp(Buffer.from(background)).removeAlpha().png().toFile(path.join(RES,'icon-background.png'));
await sharp(Buffer.from(icon)).removeAlpha().png().toFile(path.join(OUT,'app-store-icon-1024.png'));
await sharp(Buffer.from(icon)).resize(512,512).ensureAlpha(1).png().toFile(path.join(OUT,'google-play-icon-512.png'));
for (const dark of [false,true]) {
  const bg=dark?'#102d34':'#edf4ec',fg=dark?'#f7edda':'#173b43';
  const body=`<rect width="2732" height="2732" fill="${bg}"/><svg x="1086" y="790" width="560" height="560" viewBox="0 0 1024 1024">${backdrop+transport}</svg><text x="1366" y="1530" text-anchor="middle" font-family="Microsoft JhengHei,Noto Sans TC,sans-serif" font-size="112" font-weight="700" fill="${fg}">島嶼交通學院</text><text x="1366" y="1650" text-anchor="middle" font-family="Microsoft JhengHei,Noto Sans TC,sans-serif" font-size="58" fill="${fg}">一起出發，慢慢學。</text>`;
  const source=`<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732" viewBox="0 0 2732 2732">${body}</svg>`;
  const name=dark?'splash-dark':'splash';
  await fs.writeFile(path.join(RES,name+'-source.svg'),source);
  await sharp(Buffer.from(source)).removeAlpha().png().toFile(path.join(RES,name+'.png'));
}
const models=[['car','汽車','#d7e6df'],['train','火車','#e8dfc9'],['flight','飛機','#dbe9ee']];
const previews=await Promise.all(models.map(async([id,label,color],i)=>{
  const image=await fs.readFile(path.join(ROOT,'public/previews',id+'.png'));
  const x=22+i*337;
  return `<g><rect x="${x}" y="178" width="308" height="292" rx="18" fill="${color}"/><clipPath id="clip${i}"><rect x="${x+8}" y="186" width="292" height="226" rx="12"/></clipPath><image x="${x+8}" y="186" width="292" height="226" preserveAspectRatio="xMidYMid slice" clip-path="url(#clip${i})" href="data:image/png;base64,${image.toString('base64')}"/><text x="${x+154}" y="450" text-anchor="middle" font-family="Microsoft JhengHei,Noto Sans TC,sans-serif" font-size="28" font-weight="700" fill="#173b43">${label}</text></g>`;
}));
const feature=`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500"><rect width="1024" height="500" fill="#edf4ec"/><path d="M720 0h304v146H882Z" fill="#dce9df"/><text x="28" y="83" font-family="Microsoft JhengHei,Noto Sans TC,sans-serif" font-size="55" font-weight="700" fill="#173b43">島嶼交通學院</text><text x="30" y="134" font-family="Microsoft JhengHei,Noto Sans TC,sans-serif" font-size="27" fill="#446d68">一起出發，慢慢學。</text>${previews.join('')}</svg>`;
await fs.writeFile(path.join(OUT,'feature-graphic-source.svg'),feature);
await sharp(Buffer.from(feature)).removeAlpha().png().toFile(path.join(OUT,'google-play-feature-1024x500.png'));
console.log('Native and store vector artwork generated. Screenshots are captured separately from actual gameplay.');
