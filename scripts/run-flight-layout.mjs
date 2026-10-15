// Runs the existing strict 28-case layout assertions without opening a window.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:5109/';
const folder=process.env.EVIDENCE_FOLDER||'docs/evidence/r2-mobile';
const browser=await chromium.launch({headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']});
try{
 const context=await browser.newContext({hasTouch:true});const page=await context.newPage();
 await mkdir('output/playwright',{recursive:true});
 const source=(await readFile('scripts/flight-layout-check.js','utf8')).replaceAll('http://localhost:5190/flight/',base+'flight/');
 const run=new Function(`return (${source});`)();
 const result=await run(page);
 await mkdir(folder,{recursive:true});await writeFile(`${folder}/flight-layout.json`,JSON.stringify(result,null,2));console.log(`${result.status} ${result.cases} cases, ${result.sizes} sizes`);
}finally{await browser.close();}
