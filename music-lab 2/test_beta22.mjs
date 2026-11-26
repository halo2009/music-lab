import assert from 'node:assert/strict';
import {ROOTS} from './src/music.js';
import {analyzeStudioChord,generateStudioForm,newStudioProject} from './src/studio-engine.js';
import {BACKING_PARTS,BACKING_STYLES,buildBackingPattern,normalizeBacking,partOf,partVolume} from './src/backing-track.js';
import {buildBackingMidi,encodeWav} from './src/backing-export.js';

const initial=newStudioProject();
let checked=0;
for(const style of Object.keys(BACKING_STYLES))for(const root of ROOTS)for(const mode of ['major','minor'])for(const bars of [1,4,12,16])for(const variant of [0,1]){
 const project=generateStudioForm(initial,{style,root,mode,bars,variant,form:'contrast',bpm:93});
 assert.equal(project.bars.length,bars);
 const pattern=buildBackingPattern(project,{style});
 assert.equal(pattern.bpm,93);
 assert.deepEqual(new Set(pattern.events.map(partOf)),new Set(BACKING_PARTS));
 assert(pattern.events.every(event=>event.beat>=0&&event.beat<bars*4));
 checked++;
}
const settings=normalizeBacking({solo:'guitar',muted:['bass'],startBar:2,endBar:3});
assert.deepEqual(BACKING_PARTS.map(part=>partVolume(settings,part)),[0,0,0,.55]);
const midi=buildBackingMidi(initial,settings);
const view=new DataView(midi.buffer);
assert.equal(view.getUint16(10),5);
const decoder=new TextDecoder();
assert.equal(decoder.decode(midi.slice(0,4)),'MThd');
let offset=14;
for(let i=0;i<5;i++){
 assert.equal(decoder.decode(midi.slice(offset,offset+4)),'MTrk');
 offset+=8+view.getUint32(offset+4);
}
assert.equal(offset,midi.length);
const wav=encodeWav({numberOfChannels:1,length:3,sampleRate:44100,getChannelData:()=>[-1,0,1]});
const wavView=new DataView(wav);
assert.equal(decoder.decode(wav.slice(0,4)),'RIFF');
assert.equal(wavView.getUint32(40,true),6);
assert.equal(wavView.getInt16(44,true),-32768);
assert.equal(wavView.getInt16(48,true),32767);
assert.match(analyzeStudioChord(initial,'D7','G'),/^V7\/V/);
assert.match(analyzeStudioChord(initial,'Db7','C'),/^subV7\/I/);
console.log(checked,'arrangements, MIDI tracks, WAV PCM, mixer and analysis verified');

const eMajor=generateStudioForm(initial,{style:'jazz',root:'E',mode:'major',bars:5,form:'contrast',variant:0});
assert.equal(eMajor.bars[0].segments[0].symbol,'F#m7');
assert.equal(eMajor.bars[3].segments[0].symbol,'EM7');
assert.doesNotThrow(()=>analyzeStudioChord(initial,'Db7','invalid chord'));
