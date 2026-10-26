// One canonical student record. Legacy keys remain compatibility snapshots only.
export const STUDENT_KEY = globalThis.__ISLAND_STORAGE_NAMESPACE__ || 'island-transport:student:v2';
const sections = Object.freeze({
  'island-transport:passport:v1':'passport', 'island-transport:rewards:v1':'rewards',
  'island-transport:safety:v1':'safety', 'island-transport:settings:v1':'settings',
  'island-drive:preferences':'carPreferences', 'island-drive:records':'carRecords',
  'island-flight-school-record':'flightRecords', 'island-transport:lobby-music:v1':'music',
});
const fresh = () => ({schemaVersion:2,revision:0,sections:{}});
const clone = value => JSON.parse(JSON.stringify(value));
let memory=fresh(), targetSeen, unsaved=false;
const listeners=new Set();
function target(){try{return globalThis.localStorage||null;}catch{return null;}}
function object(value){return value&&typeof value==='object'&&!Array.isArray(value);}
function parse(text){try{return typeof text==='string'&&text.length<=1048576?JSON.parse(text):null;}catch{return null;}}
export function readStudent(){
  const store=target();
  if(store!==targetSeen){memory=fresh();unsaved=false;targetSeen=store;}
  if(!unsaved&&store)try{
    const value=parse(store.getItem(STUDENT_KEY));
    if(value?.schemaVersion===2&&object(value.sections))memory={schemaVersion:2,revision:Number.isSafeInteger(value.revision)?value.revision:0,sections:value.sections};
    else memory=fresh();
    for(const [key,name] of Object.entries(sections)){if(Object.hasOwn(memory.sections,name))continue;const text=store.getItem(key),old=parse(text);if(object(old))memory.sections[name]=old;else if(name==='music'&&['on','off'].includes(text))memory.sections.music=text;}
  }catch{ /* Last valid session survives a denied read. */ }
  return clone(memory);
}
export function saveStudent(value){
  readStudent();
  if(value?.schemaVersion!==2||!object(value.sections))return false;
  memory={schemaVersion:2,revision:memory.revision+1,sections:clone(value.sections)};
  try {const store=target();if(!store)throw Error('No storage');store.setItem(STUDENT_KEY,JSON.stringify(memory));unsaved=false;}
  catch{unsaved=true;}
  for(const fn of listeners)fn(clone(memory));
  if(typeof window!=='undefined')window.dispatchEvent(new Event('studentchange'));
  return !unsaved;
}
export function updateStudentSection(name,value){const record=readStudent();record.sections[name]=clone(value);return saveStudent(record);}
export const studentSaved=()=>!unsaved&&!!target();
export const subscribeStudent=fn=>{listeners.add(fn);return()=>listeners.delete(fn);};
export function restoreStudentIfMissing(value){
  if(!target()?.getItem(STUDENT_KEY)&&value?.schemaVersion===2&&object(value.sections))saveStudent(value);
}
export const progressStorage = {
  getItem(key){const name=sections[key];if(!name)return null;const value=readStudent().sections[name];return name==='music'?(value||null):value?JSON.stringify(value):null;},
  setItem(key,text){const name=sections[key],value=name==='music'?text:parse(text);if(!name||!(object(value)||name==='music'&&['on','off'].includes(value)))throw Error('Invalid progress section');
    const saved=updateStudentSection(name,value);
    // Read-only migration inputs are never removed. Mirrors permit rollback to v1.
    if(saved)try{target()?.setItem(key,name==='music'?value:JSON.stringify(value));}catch{}
    if(!saved)throw Error('Student record could not be persisted');
  },
  removeItem(key){const name=sections[key];if(!name)return;const record=readStudent();delete record.sections[name];saveStudent(record);try{target()?.removeItem(key);}catch{};},
};
