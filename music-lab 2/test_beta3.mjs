import assert from 'node:assert/strict';
import {readFile,access,readdir} from 'node:fs/promises';
import vm from 'node:vm';
import {buildStudioMidi,newStudioProject,normalizeStudioProject} from './src/studio-engine.js';
import {importMelodyMidi} from './src/midi-import.js';
import {buildPracticePlan} from './src/practice-plan.js';
import {gradeRhythm,rhythmExercise} from './src/rhythm-training.js';
import {makeEarProblem} from './src/problem-engine.js';
import {ROOTS} from './src/music.js';
import {STRINGS,SIGHT_KEYS,generateGuitarSight} from './src/guitar-lab.js';
import {CHORD_TYPES,voicingsFor,parseChord,validateGrip} from './src/chord-library.js';

const melody=[{midi:60,step:1,duration:2},{midi:63,step:4,duration:.5},{midi:65,step:7,duration:.25}];
const midi=buildStudioMidi(newStudioProject(),melody);
assert.deepEqual(importMelodyMidi(midi),melody);
const repeated=[{midi:60,step:1,duration:3},{midi:60,step:2,duration:1}];
assert.deepEqual(importMelodyMidi(buildStudioMidi(newStudioProject(),repeated)),[
 {midi:60,step:1,duration:1},{midi:60,step:2,duration:1},
]);
assert.throws(()=>importMelodyMidi(midi.slice(0,-12)),/트랙/);
const old={...newStudioProject(),melody:[{midi:69,step:2}]};
assert.deepEqual(normalizeStudioProject(old).melody,old.melody);
const plan=buildPracticePlan({quiz:[{category:'harmony',correct:false}],minutes:30});
assert.equal(plan.routine[0].category,'harmony');
assert.equal(plan.routine.reduce((sum,item)=>sum+item.minutes,0),30);
for(let seed=1;seed<=1000;seed++){
 const q=makeEarProblem({mode:'progression',seed:Math.imul(seed,2654435761)>>>0});
 assert(q.answers.includes(q.correct));
 assert.equal(q.groups.length,4);
 for(let level=1;level<=3;level++){
  const exercise=rhythmExercise(level,seed);
  const taps=exercise.beats.map(b=>700+b*60000/exercise.bpm);
  assert(gradeRhythm(exercise,taps).correct);
  taps[1]+=300;
  assert(!gradeRhythm(exercise,taps).correct);
 }
}
let grips=0,notes=0;
for(const root of ROOTS)for(const quality of Object.keys(CHORD_TYPES)){
 const chord=parseChord(root+quality);
 assert(chord);
 for(const grip of voicingsFor(chord,{maxResults:7,maxFret:12})){
  assert(validateGrip(grip,chord));
  assert(grip.frets.every(fret=>fret===null||fret<=12));
  grips++;
 }
}
for(const key of SIGHT_KEYS)for(let level=1;level<=3;level++)for(const position of [0,5,9]){
 const exercise=generateGuitarSight({keyId:key.id,level,position,bars:4,rng:()=>.4});
 for(const item of exercise.events){
  assert.equal(STRINGS[item.place.string-1]+item.place.fret,item.midi);
  notes++;
 }
}
const base=new URL('./',import.meta.url), scope='https://example.test/music-lab/';
const handlers={}, assets=[],deleted=[],cache=new Map();
const mockCache={
 async addAll(paths){
  for(const path of paths){
   assets.push(path);
   await access(new URL(path,base));
   cache.set(new URL(path,scope).href,path);
  }
 },
 async match(request){return cache.get(request.url??request.href);},
};
const source=await readFile(new URL('./sw.js',base),'utf8');
vm.runInNewContext(source,{
 URL,Response,fetch:async()=>{throw Error('offline');},
 caches:{open:async()=>mockCache,keys:async()=>['music-lab-old','another-app'],delete:async name=>deleted.push(name)},
 self:{registration:{scope},clients:{claim(){}},addEventListener:(name,callback)=>handlers[name]=callback},
});
let result;
handlers.install({waitUntil:promise=>{result=promise;}});await result;
handlers.activate({waitUntil:promise=>{result=promise;}});await result;
assert.deepEqual(deleted,['music-lab-old']);
const request=(pathname,mode='cors')=>{
 let response;
 handlers.fetch({request:{url:'https://example.test'+pathname,method:'GET',mode},respondWith:value=>{response=value;}});
 return response;
};
assert.equal(await request('/music-lab/','navigate'),'./index.html');
assert.equal(await request('/music-lab/src/app.js?v=beta3-rc3'),'./src/app.js?v=beta3-rc3');
assert.equal(request('/other/','navigate'),undefined);
const html=await readFile(new URL('index.html',base),'utf8');
for(const [,path] of html.matchAll(/(?:href|src)="(\.\/[^"]+)"/g))assert(assets.includes(path),path);
for(const filename of await readdir(new URL('src/',base)))if(filename.endsWith('.js'))assert(assets.includes('./src/'+filename),filename);
console.log({grips,notes,earProgressions:1000,tapGrades:6000,offlineAssets:assets.length});

const {parseYoutubeBacking}=await import('./src/youtube-backing.js');
const id='TbtHKC1fUEA';
assert.deepEqual(parseYoutubeBacking('https://youtu.be/'+id+'?t=1m15s'),{id,start:75});
assert.deepEqual(parseYoutubeBacking('https://www.youtube.com/watch?v='+id+'&t=45'),{id,start:45});
assert.equal(parseYoutubeBacking('https://www.youtube.com.evil.test/watch?v='+id),null);
