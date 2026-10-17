// Music Lab Alpha 0.2 shared Web Audio piano engine.
// FluidR3_GM acoustic grand piano recordings CC BY 3.0 © respective creators.
// Source: https://gleitz.github.io/midi-js-soundfonts/ .
// Network failure: use an offline acoustic-piano-inspired harmonic fallback.
import {midiToFrequency} from './music.js';
let audioCtx;
let playToken=0;
const activeOscillators=new Set();
const samples=new Map();
let soundfont=null;
let fontPromise=null;
export function context(){
 if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();
 if(audioCtx.state==='suspended')audioCtx.resume();
 return audioCtx;
}
export function pianoStatus(){return samples.size?'sampled':fontPromise?'loading':'synth';}
const noteName=m=>{const names=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];return names[((m%12)+12)%12]+(Math.floor(m/12)-1)};
export function loadPianoSamples(){
 if(fontPromise)return fontPromise;
 const url='https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/acoustic_grand_piano-mp3.js';
 fontPromise=fetch(url,{mode:'cors'}).then(r=>{if(!r.ok)throw Error('soundfont '+r.status);return r.text()}).then(src=>{
  const st=src.indexOf('{'),en=src.lastIndexOf('}');if(st<0||en<st)throw Error('Invalid soundfont');
  const obj=JSON.parse(src.slice(st,en+1));if(!obj.C4)throw Error('No piano notes');
  soundfont=obj;return true;
 }).catch(()=>false);
 return fontPromise;
}
async function decodeSample(mid){
 const key=noteName(mid),raw=soundfont?.[key];if(!raw)return;
 try{const binary=atob(raw.slice(raw.indexOf(',')+1));const bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  const buf=await context().decodeAudioData(bytes.buffer);samples.set(mid,buf);
 }catch{}
}
function nearestSource(midi){
 // Select a recorded sample close in pitch, avoiding excessive time/pitch shifts.
 const candidate=[];for(let k=midi-4;k<=midi+4;k++)if(samples.has(k))candidate.push(k);
 candidate.sort((a,b)=>Math.abs(a-midi)-Math.abs(b-midi));return candidate[0];
}
function maybeDecode(midi){
 if(!soundfont){loadPianoSamples();return;}
 if(samples.has(midi))return;
 if(!decodeSample.pending)decodeSample.pending=new Set();
 const k=Math.min(96,Math.max(36,midi));
 if(decodeSample.pending.has(k))return;
 decodeSample.pending.add(k);
 decodeSample(k).finally(()=>decodeSample.pending.delete(k));
}
function sampledNote(midi,when,duration,volume){
 const sourceIndex=nearestSource(midi);if(sourceIndex===undefined)return false;
 const ctx=context(),src=ctx.createBufferSource(),env=ctx.createGain();
 src.buffer=samples.get(sourceIndex);src.playbackRate.value=Math.pow(2,(midi-sourceIndex)/12);
 const start=Math.max(ctx.currentTime+.007,when??ctx.currentTime+.012);
 const vol=Math.min(.6,Math.max(.015,volume??.19));
 env.gain.setValueAtTime(.00001,start);env.gain.exponentialRampToValueAtTime(vol,start+.008);
 env.gain.setTargetAtTime(.0001,start+Math.max(.08,duration-.09),.10);
 src.connect(env);env.connect(ctx.destination);
 activeOscillators.add(src);src.onended=()=>activeOscillators.delete(src);
 src.start(start);src.stop(start+duration+.65);return true;
}
function synthesizedPiano(midi,when,duration,volume){
 const ctx=context(),t=Math.max(ctx.currentTime+.007,when??ctx.currentTime+.012),hz=midiToFrequency(midi);
 const v=volume??.13;const mix=ctx.createGain();mix.gain.value=1;mix.connect(ctx.destination);
 // Stiff string inharmonic partials, fast hammer onset, longer bass resonance.
 for(let h=1;h<=5;h++){
  const osc=ctx.createOscillator(),env=ctx.createGain();
  const stiffness=1+.00024*h*h;
  osc.type='sine';osc.frequency.value=hz*h*stiffness;
  const weight=[0,.63,.20,.09,.040,.021][h];
  const gain=Math.max(.0003,v*weight);
  env.gain.setValueAtTime(.00001,t);
  env.gain.exponentialRampToValueAtTime(gain,t+.0035);
  const tau=Math.max(.04,Math.min(.9,(midi<50?.8:.42)/(h*.42)));
  env.gain.setTargetAtTime(.00001,t+.032+Math.min(duration*.25,.11),tau);
  osc.connect(env);env.connect(mix);activeOscillators.add(osc);
  osc.onended=()=>activeOscillators.delete(osc);osc.start(t);osc.stop(t+duration+.85);
 }
}
export function note(midi,when,duration=.52,opts={}){
 const m=Number(midi);if(!Number.isFinite(m)||m<20||m>110)return;
 context();maybeDecode(m);
 if(!sampledNote(m,when,duration,opts.volume))synthesizedPiano(m,when,duration,opts.volume);
}
export function chord(midis,when,duration=.9){const ctx=context();midis.forEach(m=>note(m,when??ctx.currentTime+.012,duration,{volume:.095}));}
export function arpeggio(midis,step=.23){const ctx=context(),at=ctx.currentTime+.05;midis.forEach((m,i)=>note(m,at+i*step,.5));}
export function playInterval(a,b){const ctx=context(),t=ctx.currentTime+.06;note(a,t,.42);note(b,t+.56,.63);}
export function playSequence(groups,bpm=85,onStep,melody=[]){
 const ctx=context(),start=ctx.currentTime+.08,beat=60/bpm,token=++playToken;
 melody.forEach(x=>{if(Number.isInteger(x.midi)&&x.step>=0&&x.step<=15)note(x.midi,start+x.step*beat,beat*.78,{volume:.16});});
 groups.forEach((group,i)=>{
  chord(group,start+i*beat*4,beat*3.5);
  if(onStep)setTimeout(()=>{if(token===playToken)onStep(i)},Math.max(0,(start-ctx.currentTime+i*beat*4)*1000));
 });
 const endTimer=setTimeout(()=>{if(token===playToken&&onStep)onStep(-1)},Math.max(0,(start-ctx.currentTime+groups.length*beat*4)*1000));
 return ()=>{stopAllScheduled();clearTimeout(endTimer)};
}
export function demoFormant(jaw,tongue,lips){
 const ctx=context(),t=ctx.currentTime+.02,duration=.83;
 const source=ctx.createOscillator();source.type='sawtooth';source.frequency.value=170;
 const f1=330+jaw*5.6-tongue*.8,f2=850+tongue*10-lips*5;
 const gain=ctx.createGain();gain.gain.value=.10,merger=ctx.createGain();merger.gain.value=.65;
 [[f1,110,.75],[f2,180,.48]].forEach(([freq,width,mix])=>{
  const bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=freq;bp.Q.value=freq/width;
  const amp=ctx.createGain();amp.gain.value=mix;source.connect(bp);bp.connect(amp);amp.connect(merger);
 });
 merger.connect(gain);gain.connect(ctx.destination);
 gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.095,t+.07);gain.gain.setTargetAtTime(.0001,t+duration-.17,.08);
 source.start(t);source.stop(t+duration+.18);return {f1:Math.round(f1),f2:Math.round(f2)};
}
export function stopAllScheduled(){playToken++;for(const osc of activeOscillators){try{osc.stop()}catch{}}activeOscillators.clear();}
// Prefetch data without starting sound; mobile audio still starts on user interaction.
if(typeof window!=='undefined')setTimeout(()=>{if(navigator.onLine)loadPianoSamples()},1200);
