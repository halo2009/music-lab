import assert from 'node:assert/strict';
import {CHROMATIC_PATTERNS,CHROMATIC_ROUTES,CHROMATIC_OPEN_MIDI,buildChromatic,chromaticBoardSVG} from './src/chromatic.js';
import {PROGRESSION_PRESETS,planProgression,parseProgression,gripDistance} from './src/chord-progression.js';
import {standardGrip,describeChord,validateGrip,voicingsFor} from './src/chord-library.js';
assert.equal(new Set(CHROMATIC_PATTERNS).size,24);
for(const p of CHROMATIC_PATTERNS)for(const [route,{strings}] of Object.entries(CHROMATIC_ROUTES))for(const pos of [1,5,12,19]){
 const s=buildChromatic({pattern:p,firstFret:pos,route,rounds:2});
 assert.equal(s.length,strings.length*4*2);
 for(const x of s){assert.ok(x.fret>=1&&x.fret<=22);assert.equal(x.midi,CHROMATIC_OPEN_MIDI[x.string]+x.fret);assert.equal(x.fret,pos+x.finger-1);}
}
assert.match(chromaticBoardSVG({firstFret:5,active:buildChromatic()[0]}),/svg/);
for(const root of ['C','Db','E','F#','Ab','B'])for(const quality of ['','m','7','maj7','m7'])for(const r of ['R6','R5','R4']){
 const c=describeChord(root,quality),g=standardGrip(c,r);
 assert.ok(g,`no standard grip ${root}${quality} ${r}`);
 assert.equal(validateGrip(g,c),true);
 assert.ok(g.fingers.every((f,i)=>f===null||f===0||f>=1&&f<=4));
 const options=voicingsFor(c,{rootString:r,maxResults:4});assert.ok(options.length>0);
}
for(const preset of PROGRESSION_PRESETS){
 const notes=parseProgression(preset.text);assert.ok(notes.length<=8);
 const result=planProgression(preset.text);
 assert.equal(result.length,notes.length);
 for(const item of result)assert.ok(validateGrip(item.grip,item.chord));
 for(let i=1;i<result.length;i++)assert.ok(Number.isFinite(gripDistance(result[i-1].grip,result[i].grip)));
}
for(const bad of ['', 'A B C D E F G A B', 'H#m7 Bm'])assert.throws(()=>parseProgression(bad));
console.log('PASS: 24 chromatic patterns × 3 directions × 4 positions, valid frets, 90 standard fingerings, four progression presets, valid voicings');
