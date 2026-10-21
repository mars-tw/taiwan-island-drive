// Keep physical GPU capacity available to the H3 production line. Existing
// regression assertions are unchanged; only the headless renderer is selected.
import {pathToFileURL} from 'node:url';
const path=process.env.R34_PLAYWRIGHT_PATH||'C:/Users/digimkt/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const installed=await import(pathToFileURL(path).href);
export const chromium={launch(options={}){
 const args=(options.args||[]).filter(a=>!/^--(?:enable-gpu|use-angle|ignore-gpu-blocklist)(?:=|$)/.test(a));
 return installed.chromium.launch({...options,headless:true,args:[...args,'--disable-gpu','--use-angle=swiftshader']});
}};
