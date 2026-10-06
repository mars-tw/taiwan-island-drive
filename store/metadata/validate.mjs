import {readFile,writeFile,readdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const project=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const json=async path=>JSON.parse((await readFile(resolve(project,path),'utf8')).replace(/^\uFEFF/,''));
const limits=await json('store/metadata/limits.json'),app=await json('store/metadata/app.json'),checks=[];
function add(id,ok,detail){checks.push({id,passed:!!ok,...detail});}
for(const locale of ['zh-TW','en-US']){
 const data=await json(`store/metadata/${locale}.json`);add(`${locale}.locale`,data.locale===locale,{value:data.locale});
 for(const [platform,fields] of Object.entries(limits)){
  if(!['apple','google'].includes(platform))continue;
  for(const [rule,max] of Object.entries(fields)){
   const name=rule.replace(/Characters$|Utf8Bytes$/,''),value=data[platform]?.[name],bytes=rule.endsWith('Utf8Bytes'),count=typeof value==='string'?(bytes?Buffer.byteLength(value,'utf8'):[...value].length):Infinity;
   add(`${locale}.${platform}.${name}`,count>0&&count<=max,{count,max,unit:bytes?'UTF-8 bytes':'Unicode characters'});
  }
 }
 const words=data.apple.keywords.split(',');add(`${locale}.keywords.nonduplicate`,new Set(words).size===words.length&&words.every(w=>w===w.trim()&&[...w].length>2),{keywords:words});
}
add('proposed.bundleId',/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*){2,}$/.test(app.bundleId),{value:app.bundleId,platformReserved:false});
add('release.version',/^\d+\.\d+\.\d+$/.test(app.marketingVersion)&&Number.isInteger(app.buildNumber)&&app.buildNumber>0,{marketingVersion:app.marketingVersion,build:app.buildNumber});
for(const page of ['privacy','support']){const text=await readFile(resolve(project,`public/${page}.html`),'utf8');add(`${page}.productIdentified`,text.includes('島嶼交通學院')&&text.includes('2026'),{path:`public/${page}.html`});add(`${page}.noRemoteEmbeddedResources`,!/<(?:script|link|img)[^>]+(?:src|href)=["']https?:\/\//i.test(text),{path:`public/${page}.html`});}
for(const file of await readdir(resolve(project,'store/review'))){if(file.endsWith('.json'))await json('store/review/'+file);}
const readiness=await json('store/review/submission-readiness.json');
const unresolvedOwnerFields=['publicSupportEmail','sellerLegalName','copyrightOwner'].filter(field=>!app[field]);for(const field of ['firstName','lastName','email','phone'])if(!app.appReviewContact[field])unresolvedOwnerFields.push('appReviewContact.'+field);
const openBlockers=readiness.blockers.filter(b=>b.status!=='resolved');
const evidence=readiness.verifiedReleaseEvidence||{};const releaseEvidenceComplete=['androidSignedRelease','iosSignedArchive','nativePrivacyNetworkAudit','offlineDeviceTest','parentGateDeviceTest'].every(key=>evidence[key]===true);
const submissionReady=checks.every(c=>c.passed)&&unresolvedOwnerFields.length===0&&openBlockers.length===0&&releaseEvidenceComplete;
const report={generatedAt:new Date().toISOString(),lookupDate:limits.lookupDate,metadataValid:checks.every(c=>c.passed),submissionReady,checks,unresolvedOwnerFields,openBlockers,releaseEvidenceComplete,note:'Text/schema validation is not store submission, platform approval, signed-build verification, or a legal certification.'};
await writeFile(resolve(project,'store/review/metadata-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({metadataValid:report.metadataValid,checks:checks.length,failed:checks.filter(c=>!c.passed),submissionReady:report.submissionReady,unresolvedOwnerFields},null,2));
if(!report.metadataValid)process.exitCode=1;else if(process.argv.includes('--require-submission-ready')&&!report.submissionReady)process.exitCode=2;
