import assert from 'node:assert/strict';
import {describeChord,parseChord,voicingsFor,validateGrip,gripMidis,CHORD_TYPES,realisticFretboard,chordDiagramSVG} from './src/chord-library.js';
assert.equal(Object.keys(CHORD_TYPES).length,40);
let n=0;
for(const root of ['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'])for(const quality of Object.keys(CHORD_TYPES)){
 const d=describeChord(root,quality);
 const shapes=voicingsFor(d,{maxResults:15});
 assert(shapes.length>0,`missing ${d.name}`);
 for(const grip of shapes){
  assert(validateGrip(grip,d),`incorrect chord fingering ${d.name}: ${grip.frets}`);
  assert(gripMidis(grip).length>=3,'not enough sounded strings');
  const fret=grip.frets.filter(f=>f>0);assert(Math.max(...fret)-Math.min(...fret)<=4,'excessive fret span');
  const svg=chordDiagramSVG(grip,d);assert(svg.includes('<svg')&&svg.includes('lib-diagram'));
  n++;
 }
}
for(const [query,expected] of [['F#m7',['F#','A','C#','E']],['BbM7',['Bb','D','F','A']],['C7(#9)',['C','E','G','Bb','D#']],['C/E',['C','E','G']],['Gdim7',['G','Bb','Db','Fb']]]){
 const found=parseChord(query);assert(found,`parse ${query}`);
 assert.deepEqual(found.parts.map(p=>p.name),expected);
 assert(voicingsFor(found).length>0);
}
assert.equal(parseChord('C7(b9,#11)').quality,'7b9#11');
assert.equal(parseChord('CM7').quality,'maj7');
assert.equal(parseChord('C△7').quality,'maj7');
assert.equal(parseChord('Cm7b5').quality,'m7b5');
assert.equal(parseChord('Cblah'),null);
const board=realisticFretboard({root:'C',show:'scale'});
assert(board.includes('22</text>')&&board.includes('real-fret-scroll'));
console.log(`PASS: 40 chord qualities, 480 root/quality combinations, ${n} valid fingerings, spellings, search aliases, physical fretboard.`);
