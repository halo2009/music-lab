import assert from 'node:assert/strict';
import {cagedShapes,triadShapes,arpeggioNotes,dropVoicings,TRIAD_STRING_SETS,DROP_STRING_SETS,fretWindowSVG,gripDescription} from './src/guitar-theory.js';
import {describeChord,validateGrip,gripMidis,chordDiagramSVG,ROOT_CHOICES} from './src/chord-library.js';
const majors=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
let caged=0,triads=0,drops=0,arps=0;
for(const root of majors){
 const shapes=cagedShapes(root);assert.equal(shapes.length,5,root+' should have five shapes');
 for(const g of shapes){assert.ok(validateGrip(g,describeChord(root,'')));assert.match(chordDiagramSVG(g,describeChord(root,'')),/viewBox/);caged++}
 for(const quality of ['','m'])for(const set of TRIAD_STRING_SETS){
  const grips=triadShapes(root,quality,set.id);
  for(const g of grips){assert.ok(validateGrip(g,describeChord(root,quality)));assert.equal(gripMidis(g).length,3);assert.ok(new Set(gripMidis(g).map(n=>n%12)).size===3);assert.ok(g.inversion>=0&&g.inversion<=2);triads++}
 }
 for(const quality of ['maj7','m7','7','m7b5'])for(const type of [2,3])for(const set of DROP_STRING_SETS[type]){
  const grips=dropVoicings(root,quality,type,set.id);
  for(const g of grips){assert.ok(validateGrip(g,describeChord(root,quality)));assert.equal(gripMidis(g).length,4);assert.match(gripDescription(g),/현/);drops++}
 }
 for(const quality of ['','m','7','maj7','m7','m7b5'])for(const low of [0,1,5,9,12]){
  const notes=arpeggioNotes(root,quality,low,low+4);const d=describeChord(root,quality);
  for(const n of notes){assert.ok(n.fret>=low&&n.fret<=low+4);assert.ok(d.parts.some(p=>p.pc===n.midi%12));assert.ok(n.midi>=40);arps++}
  assert.match(fretWindowSVG({root,quality,startFret:low,endFret:low+4}),/theory-fretboard/);
 }
}
assert.ok(triads>50,`triads ${triads}`);
assert.ok(drops>30,`drops ${drops}`);
console.log(`PASS music engine: ${caged} CAGED / ${triads} triads / ${drops} Drop 2·3 / ${arps} arpeggio frets`);
const memory=new Map(), handlers=new Map(),app={innerHTML:''};
globalThis.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)};
globalThis.document={documentElement:{setAttribute(){}},querySelector:s=>s==='#app'?app:null,addEventListener:(t,cb)=>handlers.set(t,cb)};
globalThis.window={addEventListener(){},scrollTo(){},AudioContext:class{}};
Object.defineProperty(globalThis,'navigator',{configurable:true,value:{}});
globalThis.fetch=async()=>{throw Error('sample network disabled for test')};
globalThis.setInterval=()=>0;
const prevWarn=console.warn;console.warn=()=>{};
try{
 await import('./src/app.js');
 const action=(id,rest={})=>handlers.get('click')({target:{closest(){return {dataset:{action:id,...rest},disabled:false}}}});
 const change=(id,value)=>handlers.get('change')({target:{id,value}});
 action('nav-guitar');assert.match(app.innerHTML,/ALPHA 0\.9\.1/);assert.match(app.innerHTML,/이 운지 저장/);
 action('lib-grip-favorite');assert.equal(JSON.parse(memory.get('musiclab-grip-favorites')).length,1);
 assert.match(app.innerHTML,/저장한 운지/);
 action('lib-grip-load',{index:'0'});assert.match(app.innerHTML,/F#m7/);
 action('guitar-view',{view:'theory'});assert.match(app.innerHTML,/CAGED/);assert.match(app.innerHTML,/C Form/);
 action('theory-shape',{index:'1'});assert.match(app.innerHTML,/A폼/);
 action('theory-save');assert.equal(JSON.parse(memory.get('musiclab-guitar-theory-history')).length,1);
 action('theory-mode',{mode:'triad'});assert.match(app.innerHTML,/트라이어드/);
 change('theory-triad-quality','m');assert.match(app.innerHTML,/minor/);
 change('theory-triad-set','234');assert.match(app.innerHTML,/2·3·4번 현/);
 action('theory-mode',{mode:'arp'});assert.match(app.innerHTML,/아르페지오/);
 action('theory-mode',{mode:'drop'});assert.match(app.innerHTML,/Drop 2/);
 change('theory-drop-type','3');assert.match(app.innerHTML,/Drop 3/);
 action('nav-journal');assert.match(app.innerHTML,/기타 자동 기록/);assert.match(app.innerHTML,/지판 학습 횟수/);
 action('nav-guitar');action('guitar-view',{view:'chromatic'});assert.match(app.innerHTML,/크로매틱/);
 console.log('PASS UI actions: 0.9.1 navigation, CAGED, triads, arp, drop, grip favorite and practice log');
}finally{console.warn=prevWarn}
