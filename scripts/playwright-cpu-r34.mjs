// Keep physical GPU capacity available to the H3 production line. Existing
// regression assertions are unchanged; only the headless renderer is selected.
import {pathToFileURL} from 'node:url';
const path=process.env.R34_PLAYWRIGHT_PATH||'C:/Users/digimkt/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const installed=await import(pathToFileURL(path).href);
export const chromium={async launch(options={}){
 const args=(options.args||[]).filter(a=>!/^--(?:enable-gpu|use-angle|ignore-gpu-blocklist)(?:=|$)/.test(a));
 const browser=await installed.chromium.launch({...options,headless:true,args:[...new Set([...args,'--mute-audio']),'--disable-gpu','--use-angle=swiftshader']});
 const newContext=browser.newContext.bind(browser);
 browser.newContext=async options=>{
  const context=await newContext(options);
  await context.addInitScript(()=>{
   // Inspect requests without speaking or starting a media element. Browser
   // --mute-audio also covers WebAudio output throughout the test process.
   window.__silentTestAudio={suppressed:true,speechRequests:0,mediaRequests:0};
   speechSynthesis.speak=()=>{window.__silentTestAudio.speechRequests++;};
   HTMLMediaElement.prototype.play=function(){this.muted=true;window.__silentTestAudio.mediaRequests++;return Promise.resolve();};
  });
  return context;
 };
 return browser;
}};
