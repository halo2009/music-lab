import assert from 'node:assert/strict';
import {GUITAR_TIMBRES,GUITAR_PATTERNS,normalizeGuitarSound,guitarEvents,guitarChord,guitarNote,stopGuitarSound} from './src/guitar-sound.js';
import {describeChord,voicingsFor,gripMidis} from './src/chord-library.js';
assert.equal(Object.keys(GUITAR_TIMBRES).length,3);
assert.equal(Object.keys(GUITAR_PATTERNS).length,4);
assert.deepEqual(normalizeGuitarSound({timbre:'bad',pattern:'bad'}),{timbre:'clean',pattern:'down'});
assert.deepEqual(normalizeGuitarSound({timbre:'piano',pattern:'up'}),{timbre:'piano',pattern:'up'});
const midis=[40,45,50,55,59,64];
for (const name of ['down','up','arp','together']){
 const e=guitarEvents(midis,name);assert.equal(e.length,6);
 assert.ok(e.every((v,i)=>i===0||v.offset>=e[i-1].offset));
}
assert.deepEqual(guitarEvents(midis,'down').map(x=>x.midi),midis);
assert.deepEqual(guitarEvents(midis,'up').map(x=>x.midi),[...midis].reverse());
assert.ok(guitarEvents(midis,'arp').at(-1).offset>.8);
assert.ok(guitarEvents(midis,'together').every(x=>x.offset===0));
assert.deepEqual(guitarEvents([null,'40',NaN,20,40,97,64]).map(x=>x.midi),[40,64]);
const d=describeChord('F#','m7');const grip=voicingsFor(d,{maxResults:8})[0];
assert.ok(grip);const chordNotes=gripMidis(grip);
assert.ok(chordNotes.length>=3&&chordNotes.every(n=>Number.isInteger(n)));
// WebAudio mock: playback, damping, source cleanup, pickup variations, and note bounds.
let buffers=[],scheduled=[],stopped=0;
function param(){return {value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}};}
function node(){return {gain:param(),frequency:param(),Q:{value:0},playbackRate:{value:1},type:'',connect(){},stop(){stopped++},start(t){scheduled.push(t)},onended:null};}
class AudioContext {
 constructor(){this.sampleRate=44100;this.currentTime=1;this.state='running';this.destination=node();}
 createBuffer(channels,length,rate){const arr=new Float32Array(length);buffers.push(arr);return {duration:length/rate,getChannelData:()=>arr};}
 createBufferSource(){return node()}
 createGain(){return node()}
 createBiquadFilter(){return node()}
}
globalThis.window={AudioContext};Object.defineProperty(globalThis,'navigator',{configurable:true,value:{onLine:false}});
assert.equal(guitarChord(chordNotes,{timbre:'clean',pattern:'down'}),chordNotes.length);
assert.ok(scheduled.length===chordNotes.length);
const made=buffers.length;assert.ok(made>=3);
for(const arr of buffers){
 assert.ok(arr.length>44100, 'sound must sustain beyond one second');
 assert.ok(arr.every(Number.isFinite), 'no NaN or infinite audio samples');
 assert.ok(arr.some(v=>Math.abs(v)>.01),'not silent');
}
stopGuitarSound();assert.ok(stopped>=chordNotes.length);
assert.equal(guitarNote(130,{timbre:'clean'}),false);
assert.equal(guitarNote(57,{timbre:'acoustic'}),true);assert.equal(buffers.length,made+1);
assert.equal(guitarNote(57,{timbre:'acoustic'}),true);assert.equal(buffers.length,made+1, 'cache reuses audio buffer');
stopGuitarSound();
console.log('PASS 0.9.5: guitar presets, down/up/arp strum scheduling, modeled audio, reuse, clipping & cleanup');
