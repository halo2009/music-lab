const originalInterval=globalThis.setInterval;globalThis.setInterval=(...args)=>{const t=originalInterval(...args);t.unref();return t};
import assert from 'node:assert/strict';
const memory=new Map(), handlers=new Map(), app={innerHTML:''};
function param(){return {value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}}}
function node(){return {gain:param(),frequency:param(),Q:{value:0},playbackRate:{value:1},connect(){},start(){},stop(){}}}
class AudioContext{constructor(){this.sampleRate=44100;this.currentTime=0;this.destination=node();this.state='running'}createBuffer(_c,n,sr){return {duration:n/sr,getChannelData:()=>new Float32Array(n)}}createOscillator(){return node()}createBufferSource(){return node()}createGain(){return node()}createBiquadFilter(){return node()}}
globalThis.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)};
globalThis.document={documentElement:{setAttribute(){}},querySelector:s=>s==='#app'?app:null,addEventListener:(name,cb)=>handlers.set(name,cb)};
globalThis.window={addEventListener(){},scrollTo(){},AudioContext};
Object.defineProperty(globalThis,'navigator',{configurable:true,value:{onLine:false}});
globalThis.fetch=async()=>{throw Error('network disabled in test')};
const prev=console.warn;console.warn=()=>{};
await import('./src/app.js');
const action=(id,rest={})=>handlers.get('click')({target:{closest(){return {dataset:{action:id,...rest},disabled:false}}}});
const change=(id,value)=>handlers.get('change')({target:{id,value}});
function firstOption(){const x=/data-action="quiz-answer" data-answer="([^"]*)"/.exec(app.innerHTML);assert.ok(x);return x[1].replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&quot;','"').replaceAll('&#39;',"'")}
try{
 action('nav-quiz');assert.match(app.innerHTML,/BETA 3.0 RC/);assert.match(app.innerHTML,/문제 연구실/);assert.match(app.innerHTML,/화성학/);assert.match(app.innerHTML,/기타 악보/);
 action('quiz-category',{category:'rhythm'});change('q96-level','5');change('q96-count','5');action('quiz-start');assert.match(app.innerHTML,/문제 1/);assert.match(app.innerHTML,/5단계/);assert.match(app.innerHTML,/6\/8박자/);
 for(let i=0;i<5;i++){
  action('quiz-answer',{answer:firstOption()});
  assert.match(app.innerHTML,/정답을 확인해 보세요|정답이에요/);
  action('quiz-next');
 }
 assert.match(app.innerHTML,/SESSION COMPLETE/);
 assert.equal(JSON.parse(memory.get('musiclab-quiz096-history')).length,5);
 action('quiz-reset');action('quiz-mode',{mode:'exam'});action('quiz-start');assert.match(app.innerHTML,/실전 · 마지막에 채점/);
 for(let i=0;i<5;i++){
  action('quiz-answer',{answer:firstOption()});
  if(i<4){assert.doesNotMatch(app.innerHTML,/정답을 확인해 보세요/);action('quiz-next');}
 }
 assert.match(app.innerHTML,/SESSION COMPLETE/);assert.equal(JSON.parse(memory.get('musiclab-quiz096-history')).length,10);
 action('quiz-reset');action('quiz-mode',{mode:'review'});action('quiz-start');assert.match(app.innerHTML,/취약 개념 복습/);
 action('nav-guitar');assert.match(app.innerHTML,/코드 찾기/);action('guitar-view',{view:'chromatic'});assert.match(app.innerHTML,/60/);
 action('chromatic-preset',{pattern:'1432'});change('chromatic-bpm','95');assert.deepEqual(JSON.parse(memory.get('musiclab-chromatic-settings')),{pattern:'1432',bpm:95});
 action('nav-journal');assert.match(app.innerHTML,/분야별 문제 성취도/);assert.match(app.innerHTML,/리듬/);
 action('nav-ear');action('ear-mode',{mode:'interval'});action('ear-new');action('ear-answer',{answer:'test'});assert.equal(JSON.parse(memory.get('musiclab-training-history')).length,1);
 action('nav-theory');assert.match(app.innerHTML,/피아노에서 확인/);
 console.log('PASS Alpha 0.9.6 UI: 6 categories, learning/exam/review, history, existing guitar & theory');
}finally{console.warn=prev}
