/** Record real asset bytes/dimensions and honest browser-capture provenance. */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url), sharp=require('sharp');
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const requirements=JSON.parse(await fs.readFile(path.join(ROOT,'store/assets/official-requirements.json'),'utf8'));
let captureVerification=null;
try{captureVerification=JSON.parse(await fs.readFile(path.join(ROOT,'store/assets/capture-verification.json'),'utf8'));}catch{}
const profiles={
  'apple-iphone-medium':{device:'iPhone Dynamic Island medium size; browser layout profile',width:1206,height:2622,viewport:{width:402,height:874},dpr:3,platform:'iOS'},
  'apple-ipad-13':{device:'iPad 13-inch size; browser layout profile',width:2064,height:2752,viewport:{width:1032,height:1376},dpr:2,platform:'iPadOS'},
  'google-play-phone':{device:'Android 9:16 phone size; browser layout profile',width:1080,height:1920,viewport:{width:360,height:640},dpr:3,platform:'Android'},
};
const graphics=[
  ['resources/icon-only.png','capacitor-icon',1024,1024,false],
  ['resources/icon-foreground.png','android-adaptive-foreground',1024,1024,true],
  ['resources/icon-background.png','android-adaptive-background',1024,1024,false],
  ['resources/splash.png','capacitor-splash-light',2732,2732,false],
  ['resources/splash-dark.png','capacitor-splash-dark',2732,2732,false],
  ['store/assets/app-store-icon-1024.png','apple-store-icon-source',1024,1024,false],
  ['store/assets/google-play-icon-512.png','google-play-store-icon',512,512,true],
  ['store/assets/google-play-feature-1024x500.png','google-play-feature-graphic',1024,500,false],
];
const artifacts=[];
const foreground=await sharp(path.join(ROOT,'resources/icon-foreground.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
let xmin=foreground.info.width,ymin=foreground.info.height,xmax=-1,ymax=-1;
for(let y=0;y<foreground.info.height;y++)for(let x=0;x<foreground.info.width;x++)if(foreground.data[(y*foreground.info.width+x)*4+3]>0){xmin=Math.min(xmin,x);xmax=Math.max(xmax,x);ymin=Math.min(ymin,y);ymax=Math.max(ymax,y);}
const adaptiveForegroundBounds=[xmin,ymin,xmax,ymax];
if(xmin<174||ymin<174||xmax>850||ymax>850)throw new Error('Adaptive foreground content exceeds centre 66% safety area');
async function inspect(file,role,width,height,alphaExpected,extra={}){
  const bytes=await fs.readFile(path.join(ROOT,file)),meta=await sharp(bytes).metadata();
  if(meta.width!==width||meta.height!==height||meta.hasAlpha!==alphaExpected)throw new Error(`${file}: size/alpha mismatch`);
  if(bytes.length>10*1024*1024)throw new Error(`${file}: exceeds 10 MiB`);
  if(role==='google-play-store-icon'&&bytes.length>1048576)throw new Error('Play icon exceeds 1024 KB');
  const text=bytes.toString('latin1');if(/[A-Za-z]:[\\/]+Users[\\/]+|\/Users\/|\/home\//i.test(text))throw new Error(`${file}: private path metadata`);
  artifacts.push({file,role,width:meta.width,height:meta.height,format:meta.format,pngColorType:bytes[25],channels:meta.channels,hasAlpha:meta.hasAlpha,bytes:bytes.length,sha256:sha(bytes),method:'code-native SVG rasterization',device:null,simulated:false,privatePathMatchCount:0,...extra});
}
for(const [file,role,w,h,alpha]of graphics)await inspect(file,role,w,h,alpha,{gameplay:false,reviewedWithViewImage:true});
let screenshotCount=0;
for(const [dir,profile]of Object.entries(profiles)){
  const folder=path.join(ROOT,'store/screenshots',dir);let files=[];
  try{files=(await fs.readdir(folder)).filter(f=>f.endsWith('.png')).sort();}catch{}
  for(const name of files){
    const file=`store/screenshots/${dir}/${name}`;
    await inspect(file,'store-screenshot',profile.width,profile.height,false,{method:'Actual dist-native UI/WebGL rendered in Chrome; viewport+touch emulation; lossless PNG alpha removal',device:profile.device,simulated:true,nativeDeviceCaptured:false,nativeSimulatorCaptured:false,viewport:profile.viewport,deviceScaleFactor:profile.dpr,platformTarget:profile.platform,sourceBundle:'dist-native',sourceVersion:captureVerification?.sourceVersion ?? null,captureOrigin:'http://127.0.0.1:5192',gameplay:!name.includes('home'),reviewedWithViewImage:true});
    screenshotCount++;
  }
}
const provenance=[];
for(const file of ['public/icon.svg','public/previews/car.png','public/previews/train.png','public/previews/flight.png'])provenance.push({file,sha256:sha(await fs.readFile(path.join(ROOT,file)))});
const report={schemaVersion:1,brand:'島嶼交通學院',date:requirements.checkedDate,timezone:'Asia/Taipei',status:screenshotCount===12?'PREPARED_FOR_REVIEW':'GRAPHICS_PREPARED_SCREENSHOTS_PENDING',submissionStatus:'not_submitted',accountsCreatedAtPreparation:false,nativeScreenshotVerificationPending:true,captureVerification:'store/assets/capture-verification.json',adaptiveForegroundBounds,adaptiveForegroundWithinCentre66Percent:true,officialRequirements:'store/assets/official-requirements.json',requirementsSources:requirements.sources,originalIdentityAndPreviewSources:provenance,newAiRasterGeneration:false,featureGraphicContainsBlenderRenders:true,featureGraphicIsGameplayScreenshot:false,screenshotCount,artifacts};
await fs.writeFile(path.join(ROOT,'store/assets/manifest.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,screenshotCount,artifactCount:artifacts.length,maxBytes:Math.max(...artifacts.map(a=>a.bytes))}));
