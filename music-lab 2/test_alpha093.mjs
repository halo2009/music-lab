import assert from 'node:assert/strict';
import {newStudioProject,normalizeStudioProject,duplicateBar,removeBar,addBar,buildStudioMidi} from './src/studio-engine.js';
import {pianoRollSVG} from './src/midi.js';
let p=newStudioProject('E','major',82);
for(let i=0;i<12;i++)p=addBar(p);
assert.equal(p.bars.length,16);
p.melody=[{step:0,midi:60},{step:15,midi:62},{step:16,midi:64},{step:47,midi:67},{step:63,midi:72}];
p=normalizeStudioProject(p);
assert.deepEqual(p.melody.map(x=>x.step),[0,15,16,47,63]);
let paginated=pianoRollSVG(Array.from({length:4},()=>[60,64,67]),p.melody,12);
assert.ok(paginated.includes('BAR 13'));assert.ok(paginated.includes('BAR 16'));
assert.ok(paginated.includes('fill="var(--accent-strong)"'));
assert.ok(pianoRollSVG([[],[],[],[]],p.melody,4).includes('fill="var(--accent-strong)"')); // step 16 present
const MIDI=buildStudioMidi(p,p.melody);
assert.equal(new TextDecoder().decode(MIDI).split('MTrk').length-1,3);
assert.ok(MIDI.length>200);
let dup=duplicateBar(p,4);assert.equal(dup.bars.length,16); // capped
p=removeBar(p,6);assert.equal(p.bars.length,15);
assert.ok(p.melody.some(x=>x.step===59&&x.midi===72),'later melody notes shift with bar removal');
const q=addBar(newStudioProject());q.melody=[{step:0,midi:60},{step:4,midi:62},{step:12,midi:70},{step:16,midi:80}];
let d=duplicateBar(q,1);assert.equal(d.bars.length,6);assert.deepEqual(d.melody.map(x=>x.step).sort((a,b)=>a-b),[0,4,8,16,20]);
d=removeBar(d,2);assert.deepEqual(d.melody.map(x=>x.step).sort((a,b)=>a-b),[0,4,12,16]);
assert.throws(()=>normalizeStudioProject({...p,melody:[{step:0,midi:60}],bars:[]}));
console.log('PASS 0.9.3: melody pages, 16 bars, MIDI 3 tracks, insert/remove bars preserve positions');
