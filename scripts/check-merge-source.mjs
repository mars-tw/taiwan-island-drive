import assert from 'node:assert/strict';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {join,resolve,relative} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'..'),folder=join(root,'docs/evidence/merge');
const matches=[];let scanned=0,bytes=0;
const pattern=/sk-proj-[A-Za-z0-9_-]{20}|sk-[a-z0-9]{40}/;
async function scan(dir){for(const e of await readdir(dir,{withFileTypes:true})){
 if(['.git','node_modules','.secrets'].includes(e.name)||e.isSymbolicLink())continue;
 const p=join(dir,e.name);if(e.isDirectory())await scan(p);else if(e.isFile()){
  const b=await readFile(p);scanned++;bytes+=b.length;
  const text=b[0]===0xff&&b[1]===0xfe?b.toString('utf16le'):b.toString('utf8');if(pattern.test(text))matches.push(relative(root,p).replaceAll('\\','/'));
 }
}}
await scan(root);await writeFile(join(folder,'secret-scan.json'),JSON.stringify({status:matches.length?'BLOCKED':'VERIFIED',scannedFiles:scanned,scannedBytes:bytes,excludedDirectories:['.git','node_modules','.secrets'],symlinksSkipped:true,credentialDirectoryAccessed:false,matches},null,2)+'\n');assert.deepEqual(matches,[],'Secret scan matched; values intentionally never printed');
const version=JSON.parse(await readFile(join(root,'package.json'),'utf8')).version;
const current=['package.json','package-lock.json','src/games/car/config.js','car/index.html','index.html','public/sw.js','android/app/build.gradle','ios/App/App.xcodeproj/project.pbxproj'];
for(const p of current)assert.ok(!(await readFile(join(root,p),'utf8')).includes('2.6.0'),p);
const listing=await readFile(join(root,'docs/store/LISTING.zh-TW.md'),'utf8'),field=label=>listing.match(new RegExp(`^${label}：(.+)$`,'m'))[1];
const counts={name:[...field('名稱')].length,subtitle:[...field('副標題')].length,keywordsUtf8Bytes:Buffer.byteLength(field('關鍵字')),googleShort:[...field('Google 簡短說明')].length};
assert.ok(counts.name<=30);assert.ok(counts.subtitle<=30);assert.ok(counts.keywordsUtf8Bytes<=100);assert.ok(counts.googleShort<=80);
assert.equal(execFileSync('git',['branch','--show-current'],{cwd:root,encoding:'utf8'}).trim(),'r1-fun-polish');
assert.equal((await readFile(join(root,'LICENSE'),'utf8')).replaceAll('\r\n','\n'),execFileSync('git',['show','HEAD:LICENSE'],{cwd:root,encoding:'utf8'}).replaceAll('\r\n','\n'),'Keep existing MIT license');
await writeFile(join(folder,'source-checks.json'),JSON.stringify({status:'VERIFIED',version,branch:'r1-fun-polish',metadataCounts:counts,oldRuntimeVersionOccurrences:0,existingMitLicenseUnchanged:true,secretMatches:0,historyException:'Before evidence, existing reports and shared-assets.json retain their original snapshot versions.'},null,2)+'\n');
console.log(JSON.stringify({status:'VERIFIED',scannedFiles:scanned,secretMatches:0,counts,version}));
