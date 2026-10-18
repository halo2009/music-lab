import assert from 'node:assert/strict';
import {startMetronome} from './src/metronome.js';
import {CHROMATIC_PATTERNS} from './src/chromatic.js';
import {describeChord,chordDiagramSVG,voicingsFor,validateGrip} from './src/chord-library.js';
assert.equal(CHROMATIC_PATTERNS.length,24);
const mock={currentTime:0,destination:{},startCalls:[],stopCalls:[],createGain(){return {gain:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){},cancelScheduledValues(){}},connect(){},disconnect(){}}},createOscillator(){const me=this;return {frequency:{value:0},type:'sine',connect(){},start(time){me.startCalls.push(time)},stop(time){me.stopCalls.push(time)}}}};
const stop=startMetronome({context:mock,bpm:60});assert.ok(mock.startCalls.length>=1);assert.equal(mock.startCalls.length,mock.stopCalls.length);stop();stop();
for(const quality of ['','m','7','maj7','m7','sus4','m7b5','9']){
 const chord=describeChord('F#',quality),v=voicingsFor(chord,{rootString:'all',maxResults:12});assert.ok(v.length,`missing ${quality}`);
 for(const grip of v){assert.ok(validateGrip(grip,chord));const svg=chordDiagramSVG(grip,chord);assert.match(svg,/<svg/);assert.match(svg,/viewBox="0 0 280/);assert.match(svg,/6<\/text>/);}
}
console.log('PASS: metronome click scheduling, 24 patterns, large chord diagrams, validated chord roots');
// Check browser-facing navigation and save paths without network or a real DOM.
const memory=new Map(),handlers=new Map(),app={innerHTML:''};
globalThis.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)};
globalThis.document={documentElement:{setAttribute(){}},querySelector:s=>s==='#app'?app:null,addEventListener:(t,cb)=>handlers.set(t,cb)};
globalThis.window={addEventListener(){},scrollTo(){},AudioContext:class{}};
Object.defineProperty(globalThis,'navigator',{configurable:true,value:{}});
globalThis.fetch=async()=>{throw Error('sample network disabled for test')};
globalThis.setInterval=()=>0;
const prevWarn=console.warn;console.warn=()=>{};
await import('./src/app.js');
const action=(id,rest={})=>handlers.get('click')({target:{closest(){return {dataset:{action:id,...rest},disabled:false}}}});
action('nav-guitar');assert.match(app.innerHTML,/class="panel lib09-search"/);
assert.match(app.innerHTML,/코드 찾기/);
action('guitar-view',{view:'chromatic'});assert.match(app.innerHTML,/value="60"/);
assert.doesNotMatch(app.innerHTML,/chromatic-board/);
action('chromatic-preset',{pattern:'1243'});
for(let i=0;i<8;i++)action('chromatic-bpm',{delta:'5'});
assert.match(app.innerHTML,/value="100"/);
action('chromatic-save');const log=JSON.parse(memory.get('musiclab-chromatic-history'));
assert.deepEqual([log[0].pattern,log[0].bpm,log[0].range],['1243',100,'1–12–1']);
action('chromatic-bpm',{delta:'-5'});action('chromatic-save');
assert.match(app.innerHTML,/100<small>BPM/); // best remains 100 after 95 BPM practice
assert.equal(JSON.parse(memory.get('musiclab-chromatic-history')).length,2);
console.warn=prevWarn;
console.log('PASS: rendered navigation, chromatic simplified, BPM stepping and best-per-pattern saving');
