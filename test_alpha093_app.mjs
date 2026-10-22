import assert from 'node:assert/strict';
const memory=new Map(),events=new Map(),app={innerHTML:''},fields=new Map();
globalThis.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)};
globalThis.document={documentElement:{setAttribute(){}},querySelector:s=>s==='#app'?app:fields.get(s)||null,addEventListener:(k,fn)=>events.set(k,fn)};
globalThis.window={addEventListener(){},scrollTo(){},AudioContext:class{}};
Object.defineProperty(globalThis,'navigator',{configurable:true,value:{}});
globalThis.fetch=async()=>{throw Error('test offline')};globalThis.setInterval=()=>0;globalThis.confirm=()=>true;
const warn=console.warn;console.warn=()=>{};
try{
 await import('./src/app.js');
 const click=(action,d={})=>events.get('click')({target:{closest(){return {dataset:{action,...d},disabled:false}}}});
 const change=(id,value,checked)=>events.get('change')({target:{id,value,checked}});
 assert.match(app.innerHTML,/ALPHA 0\.9\.[34]/);
 click('nav-compose');assert.match(app.innerHTML,/16마디 편집/);
 for(let i=0;i<5;i++)click('studio-add-bar');assert.match(app.innerHTML,/BAR 09/);
 click('studio-roll-next');assert.match(app.innerHTML,/5–8마디/);
 click('studio-roll-next');assert.match(app.innerHTML,/9–9마디/);
 click('studio-duplicate-bar');assert.match(app.innerHTML,/BAR 10/);
 let model=JSON.parse(memory.get('musiclab-studio-active'));assert.equal(model.bars.length,10);
 click('studio-remove-bar');model=JSON.parse(memory.get('musiclab-studio-active'));assert.equal(model.bars.length,9);
 change('studio-loop',undefined,true);assert.match(app.innerHTML,/id="studio-loop" checked/);
 click('studio-roll-clear-page');assert.match(app.innerHTML,/9–9마디/);
 click('studio-new');assert.match(app.innerHTML,/BAR 04/);
 assert.match(app.innerHTML,/ALPHA 0\.9\.[34]/);
 click('nav-guitar');assert.match(app.innerHTML,/기타 연습실/);
 click('nav-theory');assert.match(app.innerHTML,/화성학/);
 console.log('PASS 0.9.3 app: 4-bar windows, duplicate/remove, loop state, new project, existing menus');
}finally{console.warn=warn}
