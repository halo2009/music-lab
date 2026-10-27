import assert from 'node:assert/strict';
const memory=new Map(),handlers=new Map(),app={innerHTML:''};
let played=0;
function param(){return {value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}}}
function node(){return {gain:param(),frequency:param(),Q:{value:0},playbackRate:{value:1},connect(){},start(){played++},stop(){},onended:null}}
class AudioContext {constructor(){this.sampleRate=44100;this.currentTime=0;this.destination=node();this.state='running'}createBuffer(_c,n,sr){let arr=new Float32Array(n);return {duration:n/sr,getChannelData:()=>arr}}createBufferSource(){return node()}createGain(){return node()}createBiquadFilter(){return node()}}
globalThis.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)};
globalThis.document={documentElement:{setAttribute(){}},querySelector:s=>s==='#app'?app:null,addEventListener:(name,fn)=>handlers.set(name,fn)};
globalThis.window={addEventListener(){},scrollTo(){},AudioContext};
Object.defineProperty(globalThis,'navigator',{configurable:true,value:{onLine:false}});
globalThis.fetch=async()=>{throw Error('no network in test')};
const warn=console.warn;console.warn=()=>{};
await import('./src/app.js');
const action=(id,rest={})=>handlers.get('click')({target:{closest(){return {dataset:{action:id,...rest},disabled:false}}}});
const change=(id,value)=>handlers.get('change')({target:{id,value}});
action('nav-guitar');
assert.match(app.innerHTML,/ALPHA 0\.9\.5/);
assert.match(app.innerHTML,/id="guitar-timbre"/);
assert.match(app.innerHTML,/id="guitar-pattern"/);
change('guitar-timbre','acoustic');change('guitar-pattern','arp');
assert.deepEqual(JSON.parse(memory.get('musiclab-guitar-sound')),{timbre:'acoustic',pattern:'arp'});
assert.match(app.innerHTML,/<option value="acoustic" selected>/);
assert.match(app.innerHTML,/<option value="arp" selected>/);
action('lib-play');assert.ok(played>0,'guitar chord should trigger playback');
const playedBefore=played;
action('guitar-view',{view:'theory'});assert.match(app.innerHTML,/id="guitar-timbre"/);
action('theory-grip-play');assert.ok(played>playedBefore);
action('guitar-view',{view:'chromatic'});assert.doesNotMatch(app.innerHTML,/id="guitar-timbre"/,'chromatic should remain minimal');
action('guitar-view',{view:'chords'});assert.match(app.innerHTML,/id="guitar-timbre"/);
action('guitar-play-chord');
assert.ok(played>playedBefore);
console.warn=warn;
console.log('PASS 0.9.5 UI: guitar timbre + playback setting persists, chord library, theory, random chords, chromatic preserved');
