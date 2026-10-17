// Web Audio shared engine. Audio starts only from a user gesture (mobile compatible).
import {midiToFrequency} from './music.js';
let audioCtx;
let playToken=0;
const activeOscillators=new Set();
export function context(){
 if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
 if(audioCtx.state==='suspended') audioCtx.resume();
 return audioCtx;
}
export function note(midi,when,duration=.5,opts={}){
 const ctx=context(); const now=when??ctx.currentTime+.015;
 const osc=ctx.createOscillator(),gain=ctx.createGain();
 osc.type=opts.wave||'triangle';osc.frequency.value=midiToFrequency(midi);
 gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(opts.volume||.12,now+.025);
 gain.gain.setTargetAtTime(.0001,now+Math.max(.07,duration-.1),.075);
 osc.connect(gain);gain.connect(ctx.destination);activeOscillators.add(osc);osc.onended=()=>activeOscillators.delete(osc);osc.start(now);osc.stop(now+duration+.25);
}
export function chord(midis,when,duration=.9){const ctx=context();midis.forEach((m)=>note(m,when??ctx.currentTime+.015,duration,{volume:.065}));}
export function arpeggio(midis,step=.23){const ctx=context();const at=ctx.currentTime+.04;midis.forEach((m,i)=>note(m,at+i*step,.55));}
export function playInterval(a,b){const ctx=context();const t=ctx.currentTime+.04;note(a,t,.48);note(b,t+.67,.65)}
export function playSequence(groups,bpm=85,onStep){
 const ctx=context(),start=ctx.currentTime+.08,beat=60/bpm,token=++playToken;
 groups.forEach((g,i)=>{
  chord(g,start+i*beat*4,beat*3.6);
  if(onStep) setTimeout(()=>{if(token===playToken)onStep(i)},Math.max(0,(start-ctx.currentTime+i*beat*4)*1000));
 });
 const endTimer=setTimeout(()=>{if(token===playToken&&onStep)onStep(-1)},(start-ctx.currentTime+groups.length*beat*4)*1000);
 return ()=>{stopAllScheduled();clearTimeout(endTimer)};
}
export function demoFormant(jaw,tongue,lips){
 // Illustrative vowel-like filtering; not a physical vocal tract model.
 const ctx=context(); const t=ctx.currentTime+.02,duration=.83;
 const source=ctx.createOscillator();source.type='sawtooth';source.frequency.value=170;
 const f1=330+jaw*5.6-tongue*.8;
 const f2=850+tongue*10-lips*5;
 const gain=ctx.createGain();gain.gain.value=.10;
 const filters=[[f1,110,.75],[f2,180,.48]];
 const merger=ctx.createGain();merger.gain.value=.65;
 filters.forEach(([freq,width,mix])=>{
  const bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=freq;bp.Q.value=freq/width;
  const amp=ctx.createGain();amp.gain.value=mix;source.connect(bp);bp.connect(amp);amp.connect(merger);
 });
 merger.connect(gain);gain.connect(ctx.destination);
 gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.095,t+.07);
 gain.gain.setTargetAtTime(.0001,t+duration-.17,.08);
 source.start(t);source.stop(t+duration+.18);
 return {f1:Math.round(f1),f2:Math.round(f2)};
}
export function stopAllScheduled(){playToken++;for(const osc of activeOscillators){try{osc.stop()}catch{}}activeOscillators.clear();}
