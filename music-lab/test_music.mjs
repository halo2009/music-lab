import assert from 'node:assert/strict';
import {ROOTS,INTERVALS,spellScale,pitchClass,chordsOf,chordMidi,midiToFrequency,frequencyToNote} from './src/music.js';
const mod=x=>(x+120)%12;
for(const key of ROOTS){
 for(const mode of ['major','minor']){
  const sc=spellScale(key,mode);
  assert.equal(sc.length,7);
  sc.forEach((name,i)=>assert.equal(mod(pitchClass(name)-pitchClass(key)),INTERVALS[mode][i],`${key} ${mode} ${i}: ${name}`));
  const chords=chordsOf(key,mode,true);
  assert.equal(chords.length,7);
  chords.forEach((c,i)=>{
   assert.equal(c.notes.length,4);
   const voices=chordMidi(key,mode,i,true);
   assert(voices.every((m,j)=>j===0||m>voices[j-1]),`voicing not rising: ${key} ${mode} ${i}`);
  });
 }
}
assert.deepEqual(spellScale('Bb','major'),['Bb','C','D','Eb','F','G','A']);
assert.deepEqual(spellScale('F#','major'),['F#','G#','A#','B','C#','D#','E#']);
assert.deepEqual(spellScale('C','minor'),['C','D','Eb','F','G','Ab','Bb']);
assert.equal(midiToFrequency(69),440);
assert.equal(frequencyToNote(440).note,'A4');
console.log('PASS: 24 key+mode combos, seven diatonic chords, key spelling, basic pitch conversion');
