import assert from 'node:assert/strict';
import {newStudioProject,normalizeStudioProject,addBar,removeBar,splitSlot,mergeSlot,setStudioChord,setStudioVoicing,studioEvents,studioVoicing,applyStudioPreset,buildStudioMidi,STUDIO_PRESETS} from './src/studio-engine.js';
import {makeHarmonyProblem,makeEarProblem,seededRng,uniqueGenerated} from './src/problem-engine.js';
import {parseChord} from './src/chord-library.js';
let p=newStudioProject('E','major',82);
assert.equal(p.bars.length,4);
p=setStudioChord(p,0,0,'F#m7');
assert.equal(p.bars[0].segments[0].symbol,'F#m7');
p=splitSlot(p,0,0);assert.deepEqual(p.bars[0].segments.map(x=>x.beats),[2,2]);
p=setStudioChord(p,0,1,'B7');
p=setStudioVoicing(p,0,1,2);assert.equal(p.bars[0].segments[1].voicing,2);
assert.equal(studioEvents(p).length,5);
assert.throws(()=>setStudioChord(p,0,0,'notacode'));
assert.throws(()=>normalizeStudioProject({...p,bars:[{segments:[{symbol:'F#m7',beats:5,voicing:0}]}]}));
p=mergeSlot(p,0,1);assert.equal(p.bars[0].segments[0].beats,4);
for(let i=0;i<30;i++)p=addBar(p);
assert.equal(p.bars.length,16);p=removeBar(p,15);assert.equal(p.bars.length,15);
for(const chord of ['F#m7','C/E','BbM7','C7(#9)','Am','G7sus4','Dm7b5']){
 const detail=parseChord(chord),mids=studioVoicing(chord,0),pcs=new Set(mids.map(x=>x%12));assert.ok(mids.length>=3);assert.ok(mids.every(Number.isInteger));assert.ok(mids.every(m=>m>=36&&m<=90));
 for(const n of detail.parts){if(chord!=='Dm7b5')assert.ok(pcs.has(n.pc),chord+' lost '+n.tag);}
 if(detail.bass)assert.equal(mids[0]%12,detail.bass==='E'?4:-1);
}
for(const preset of Object.keys(STUDIO_PRESETS)){let ps=applyStudioPreset(p,preset);assert.equal(ps.bars.length,4);assert.equal(studioEvents(ps).length,4)}
const midi=buildStudioMidi(p,[{step:0,midi:60},{step:3,midi:64},{step:25,midi:72}]);
assert.equal(String.fromCharCode(...midi.subarray(0,4)),'MThd');assert.equal(midi[9],1);assert.equal(midi[11],3);
assert.equal((new TextDecoder().decode(midi)).split('MTrk').length-1,3);
const rngA=seededRng(1234),rngB=seededRng(1234);assert.deepEqual(Array.from({length:12},()=>rngA()),Array.from({length:12},()=>rngB()));
for(let seed=1;seed<=200;seed++){
 for(const level of [1,2,3]){const q=makeHarmonyProblem({root:'Bb',mode:'minor',level,seed});assert.ok(q.answers.includes(q.correct),JSON.stringify(q));assert.ok(new Set(q.answers).size===q.answers.length);assert.ok(q.answers.length>=4);}
 for(const kind of ['staff','read','melody','direction','interval','quality']){const q=makeEarProblem({mode:kind,clef:'bass',level:'diatonic',seed});if(q.answers)assert.ok(q.answers.includes(q.correct));if(q.notes)assert.ok(q.notes.every(m=>m>=43&&m<=66));}
}
const unique=uniqueGenerated(()=>({i:2}),o=>String(o.i),['2'],3);assert.equal(unique.item.i,2);
console.log('PASS: studio splits/merges, 16 bars, slash chords, 3-track MIDI, 1,800 theory/ear questions, deterministic generator');
