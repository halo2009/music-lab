import assert from 'node:assert/strict';
import {newStudioProject,setStudioChord,splitSlot,addBar} from './src/studio-engine.js';
import {BACKING_STYLES,normalizeBacking,buildBackingPattern,startBackingTrack} from './src/backing-track.js';
let p=newStudioProject('E','major',95);
p=setStudioChord(p,0,0,'F#m7');p=setStudioChord(p,1,0,'B7');p=setStudioChord(p,2,0,'EM7');p=setStudioChord(p,3,0,'C#m7');
assert.equal(Object.keys(BACKING_STYLES).length,5);
for(const style of Object.keys(BACKING_STYLES)){
 const pat=buildBackingPattern(p,{style,loop:false,countIn:true,startBar:1,endBar:4});
 assert.equal(pat.beats,16);assert.equal(pat.bpm,95);
 assert.ok(pat.events.some(x=>x.kind==='kick'||x.kind==='ride'));assert.ok(pat.events.some(x=>x.kind==='bass'));
 assert.ok(pat.events.some(x=>x.kind==='piano'));
 assert.ok(pat.events.every(x=>x.beat>=0&&x.beat<16));
 assert.ok(pat.events.filter(x=>x.kind==='piano').every(x=>x.notes.every(n=>Number.isInteger(n)&&n>=24&&n<=108)));
}
const short=buildBackingPattern(p,{style:'rnb',startBar:2,endBar:3,mix:{drums:100,bass:0,piano:60}});
assert.equal(short.beats,8);assert.ok(short.events.every(x=>x.beat>=4&&x.beat<12));
assert.deepEqual(normalizeBacking({style:'bad',startBar:-999,endBar:99,mix:{drums:150,bass:-20,piano:51}},4),
 {style:'pop',loop:true,countIn:true,startBar:1,endBar:4,mix:{drums:100,bass:0,piano:51}});
// Multiple chords per bar must appear at their correct beat, not only at bar boundaries.
let p2=splitSlot(p,0,0);p2=setStudioChord(p2,0,1,'G#7');
let events=buildBackingPattern(p2,{countIn:false,loop:false}).events;
assert.ok(events.find(x=>x.kind==='piano'&&x.beat===2),'mid-bar chord transition is scheduled');
for(let n=4;n<=16;n++){let project=p;while(project.bars.length<n)project=addBar(project);const pat=buildBackingPattern(project,{startBar:1,endBar:n});assert.ok(pat.events.every(x=>x.beat<4*n));}
function param(){return {value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}}}
function node(){return {gain:param(),frequency:param(),connect(){},disconnect(){},start(){},stop(){},onended:null}}
let created=0,ended=0;
const ctx={currentTime:0,sampleRate:44100,destination:node(),createGain:node,createOscillator:()=>{created++;return node()},createBiquadFilter:node,createBufferSource:node,createBuffer:(c,n)=>({getChannelData:()=>new Float32Array(n)})};
let sampled=0;const player=startBackingTrack({context:ctx,project:p,settings:{style:'rock',countIn:false,loop:true,startBar:1,endBar:4},playPiano:()=>{sampled++},onEnd:()=>{ended++}});
assert.ok(created>0);assert.ok(sampled>0);player.setMix({drums:35,bass:0,piano:0});player.stop();player.stop();assert.equal(ended,1);
console.log('PASS 0.9.4: five accompaniment styles, loop regions, chord transitions, mix bounds, audio scheduling & cleanup');
