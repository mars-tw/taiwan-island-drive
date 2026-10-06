import { spawnSync } from 'node:child_process';
import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import { resolve, join, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';
const root = resolve(import.meta.dirname, '..');
const out = join(root, 'dist-native');
function run(script, args=[]) {
 const result=spawnSync(process.execPath,[join(root,script),...args],{cwd:root,stdio:'inherit'});
 if(result.status!==0)process.exit(result.status||1);
}
run('scripts/verify-vehicle-surfaces.mjs',['--no-write']);
run('node_modules/vite/bin/vite.js',['build','--mode','native']);
for(const path of ['downloads','textures','sw.js','precache.json']) {
 const target=resolve(out,path);
 if(!target.startsWith(out+sep))throw new Error('Unsafe native output path');
 await rm(target,{recursive:true,force:true});
}
const manifest=[];
async function collect(dir){
 for(const entry of await readdir(dir,{withFileTypes:true})){
  if(entry.isSymbolicLink())throw new Error('Native bundles cannot include symlinks');
  const full=join(dir,entry.name);
  if(entry.isDirectory())await collect(full);
  else {const bytes=await readFile(full);manifest.push({path:relative(out,full).replaceAll('\\','/'),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}
 }
}
await collect(out);
for(const required of ['index.html','car/index.html','train/index.html','flight/index.html','models/aircraft.glb','models/train.glb','models/coupe.glb'])if(!manifest.some(e=>e.path===required))throw new Error('Missing native game asset: '+required);
const report={schemaVersion:1,applicationId:JSON.parse(await readFile(join(root,'capacitor.config.json'),'utf8')).appId,sourceVersion:JSON.parse(await readFile(join(root,'package.json'),'utf8')).version,files:manifest.sort((a,b)=>a.path.localeCompare(b.path)),fileCount:manifest.length,totalBytes:manifest.reduce((n,f)=>n+f.bytes,0),remoteServer:false,rawSourceDownloadIncluded:false,imagesEmbeddedInModels:true};
await mkdir(join(root,'output/native'),{recursive:true});
await writeFile(join(root,'output/native/bundle-manifest.json'),JSON.stringify(report,null,2)+'\n');
await writeFile(join(out,'native-bundle.json'),JSON.stringify({sourceVersion:report.sourceVersion,fileCount:report.fileCount,totalBytes:report.totalBytes},null,2)+'\n');
console.log(JSON.stringify({native:'BUILT',files:report.fileCount,bytes:report.totalBytes,appId:report.applicationId}));
