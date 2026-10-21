// Preserve failure evidence without changing any regression action/assertion.
import {chromium as cpu} from './playwright-cpu-r34.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
export const chromium={async launch(options){
 const browser=await cpu.launch(options),close=browser.close.bind(browser);
 const newContext=browser.newContext.bind(browser);
 browser.newContext=async options=>{
  const context=await newContext(options),newPage=context.newPage.bind(context);
  context.newPage=async()=>{
   const page=await newPage(),evaluate=page.evaluate.bind(page);
   page.evaluate=async(fn,arg)=>{
    const result=await evaluate(fn,arg);
    // The historical driver runs hundreds of 3D renders in one JS task with
    // RAF temporarily suppressed. Let the software renderer present those
    // results before the original visibility assertion starts its timeout.
    // No progress, completion flag, renderer or assertion is modified.
    if(typeof fn==='function'&&fn.toString().includes('g.frame('))await evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    return result;
   };
   return page;
  };
  return context;
 };
 browser.close=async()=>{
  const pages=browser.contexts().flatMap(c=>c.pages());
  try{if(pages.length){const out=process.env.EVIDENCE_FOLDER||'docs/content/r34/merge';await mkdir(out,{recursive:true});
   for(let i=0;i<pages.length;i++){const p=pages[i];
    const state=await p.evaluate(()=>{const g=window.__islandDrive?.game;return {url:location.href,hidden:document.hidden,text:document.body.innerText,car:g?{phase:g.phase,physics:g.physics,input:g.input,journeyDistance:g.journeyDistance,contextLost:g.renderer.getContext().isContextLost()}:null};});
    await writeFile(`${out}/failure-${i}.json`,JSON.stringify(state,null,2));await p.screenshot({path:`${out}/failure-${i}.png`});
   }
  }}finally{await close();}
 };
 return browser;
}};
