import assert from 'node:assert/strict';
import {SIGHT_KEYS,placesForNote,generateGuitarSight,staffY,chooseChord,chordPitchClassesValid,chordPitches,CHORD_QUALITIES,sightStaffSVG,sightTabSVG} from './src/guitar-lab.js';
const roots=['C','D','E','F','G','A','Bb','B','Eb','F#','Ab'];
let shapeCount=0,exerciseCount=0;
for(const quality of CHORD_QUALITIES)for(const rootString of ['R5','R6'])for(const root of roots){
 const shape=chooseChord({root,quality,rootString});
 assert(chordPitchClassesValid(shape),`wrong chord: ${shape.name} ${rootString}`);
 assert(shape.positions.every(f=>f===null||(Number.isInteger(f)&&f>=0&&f<=15)));
 assert(chordPitches(shape).length>=3);shapeCount++;
}
assert.equal(staffY(64,'C-major'),140-7*6,'sounding E4 notated E5 at y 98');
assert.equal(staffY(52,'C-major'),140,'sounding E3 notated E4 at bottom of treble staff');
for(const key of SIGHT_KEYS)for(const level of [1,2,3])for(const position of [0,5,9])for(let iteration=0;iteration<15;iteration++){
 const ex=generateGuitarSight({keyId:key.id,level,position,bars:level===3?4:2,rng:Math.random});
 assert.equal(ex.bars,level===3?4:2);
 assert(ex.events.length>=4);
 for(let bar=0;bar<ex.bars;bar++){
  const beats=ex.events.filter(e=>e.bar===bar).reduce((acc,e)=>acc+e.duration,0);
  assert(Math.abs(beats-4)<.0001,`bar ${bar} is ${beats} beats`);
 }
 for(const e of ex.events){assert(e.midi>=40&&e.midi<=83);assert(placesForNote(e.midi,{position}).length>0);assert.equal(e.place.midi,e.midi)}
 assert(sightStaffSVG(ex).includes('treble-clef.svg'));
 assert(sightTabSVG(ex).includes('<svg'));
 exerciseCount++;
}
console.log(`PASS: ${shapeCount} movable chord grip checks + ${exerciseCount} sight-reading score checks + concert pitch/notation octave mapping.`);
