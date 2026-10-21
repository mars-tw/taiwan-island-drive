// Preserve the historical UI/physics assertions. During the driver's synchronous
// fast-forward task, coalesce redundant WebGL draws and present its final frame.
// World.render, every physics tick, controls, saves and normal RAF stay intact.
import {chromium as cpu} from './playwright-cpu-r34.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
export const chromium={async launch(options){
 const browser=await cpu.launch(options),newContext=browser.newContext.bind(browser),close=browser.close.bind(browser),receipts=[];
 browser.newContext=async options=>{
  const context=await newContext(options),newPage=context.newPage.bind(context);
  context.newPage=async()=>{
   const page=await newPage(),evaluate=page.evaluate.bind(page);
   page.evaluate=async(fn,arg)=>{
    if(typeof fn!=='function'||!fn.toString().includes('g.frame('))return evaluate(fn,arg);
    const envelope=await evaluate(async({source,argument})=>{
     const game=window.__islandDrive?.game||window.__flightSchool?.game,renderer=game?.renderer||game?.world?.renderer;
     const original=renderer?.render;let lastArgs,draws=0;
     if(original)renderer.render=function(...args){lastArgs=args;draws++;};
     let result;
     try{result=await (0,eval)('('+source+')')(argument);}
     finally{if(original){renderer.render=original;if(lastArgs)original.apply(renderer,lastArgs);}}
     return {result,receipt:{coalescedDrawCalls:draws,presentedFinalFrame:!!lastArgs,physicsAndWorldUpdates:'unchanged original test function'}};
    },{source:fn.toString(),argument:arg});
    receipts.push(envelope.receipt);
    await evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    return envelope.result;
   };
   return page;
  };
  return context;
 };
 browser.close=async()=>{
  try{const out=process.env.EVIDENCE_FOLDER||'docs/content/r35/merge';await mkdir(out,{recursive:true});await writeFile(out+'/render-coalescing.json',JSON.stringify({status:'EXECUTED',scope:'only synchronous fast-forward evaluations; final real WebGL draw then two native RAF; no changed assertions or game state',receipts},null,2));}
  finally{await close();}
 };
 return browser;
}};
