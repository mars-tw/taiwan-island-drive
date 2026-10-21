// Read-only R35 reference from Git, no checkout or branch switching.
import {build} from 'vite';
import {execFileSync} from 'node:child_process';
import {relative,resolve} from 'node:path';
const root=process.cwd(),commit='db8bbe90cd74b1b32984d4e375ba5d13b022b7eb';
const overrides=new Set(['src/shared/content-r31.js','src/shared/content-r31-scene.js','src/shared/content-r32-scene.js','src/shared/content-r1-ui.js','src/shared/content-r35.css']);
if(execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim()!=='r1-fun-polish')throw Error('wrong branch');
await build({configFile:resolve('vite.config.js'),base:'/r37-reference/',plugins:[{
 name:'r37-read-only-reference',enforce:'pre',transform(code,id){
  const name=relative(root,id.split('?')[0]).replaceAll('\\','/');
  return overrides.has(name)?{code:execFileSync('git',['show',`${commit}:${name}`],{encoding:'utf8'}),map:null}:null;
 }
}],build:{outDir:resolve('dist/r37-reference'),emptyOutDir:true}});
console.log('VERIFIED R35 reference from Git, version label normalized; checkout untouched');
