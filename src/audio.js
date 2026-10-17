// Music Lab Alpha 0.3 — bundled acoustic piano samples and educational voice synthesis.
// Piano audio: derived from TimGM6mb.sf2 (GPL-2.0); see assets/piano/LICENSE.txt.
// All audio begins only after a user gesture, per Safari/iOS policy.
import {midiToFrequency} from './music.js';
let audioCtx, playToken=0;
const activeSources=new Set(), sampleBank=new Map(), inflight=new Map();
const sampleMidis=[...Array.from({length:21},(_,i)=>36+3*i),99,102];
let bootStarted=false,broken=0;
export function context(){
 if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();
 if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});
 return audioCtx;
}
function getDecodeContext(){return context()}
export function pianoStatus(){return {loaded:sampleBank.size,total:sampleMidis.length,loading:inflight.size,failed:broken,ready:sampleBank.size>=sampleMidis.length};}
const pianoUrl=(m)=>new URL(`../assets/piano/${m}.mp3`,import.meta.url).href;
async function fetchPiano(m){
 if(sampleBank.has(m))return sampleBank.get(m);
 if(inflight.has(m))return inflight.get(m);
 const task=fetch(pianoUrl(m)).then(r=>{if(!r.ok)throw Error(`piano sample HTTP ${r.status}`);return r.arrayBuffer()})
 .then(b=>getDecodeContext().decodeAudioData(b)).then(buf=>{sampleBank.set(m,buf);return buf})
 .catch(err=>{broken++;console.warn('[Music Lab] piano sample error',m,err);return null}).finally(()=>inflight.delete(m));
 inflight.set(m,task);return task;
}
export function loadPianoSamples(){
 if(bootStarted)return Promise.all([...inflight.values()]);bootStarted=true;
 // Prioritize the central keyboard and register, then decode the rest without excessive parallel network requests.
 const order=[60,57,63,72,69,75,48,45,51,84,81,87,36,39,42,54,66,78,90,93,96,99,102];
 const run=async()=>{for(let start=0;start<order.length;start+=5)await Promise.all(order.slice(start,start+5).map(fetchPiano));};
 return run();
}
function closeSample(mid){
 let nearest=null,dist=999;
 for(const m of sampleMidis){const delta=Math.abs(mid-m);if(delta<dist){nearest=m;dist=delta;}}
 return nearest;
}
function playBuffer(mid,buf,sourceMid,when,duration,volume){
 const ctx=context(),start=Math.max(ctx.currentTime+.012,when??ctx.currentTime+.015);
 const src=ctx.createBufferSource(),en=ctx.createGain();src.buffer=buf;
 src.playbackRate.value=2**((mid-sourceMid)/12);
 const v=Math.min(.65,Math.max(.005,volume??.22));
 en.gain.setValueAtTime(.00001,start);en.gain.linearRampToValueAtTime(v,start+.008);
 const tail=.24;en.gain.setValueAtTime(v,start+Math.max(.06,duration-.08));en.gain.exponentialRampToValueAtTime(.0001,start+duration+tail);
 src.connect(en);en.connect(ctx.destination);activeSources.add(src);src.onended=()=>activeSources.delete(src);
 src.start(start);src.stop(start+duration+tail+.03);
}
function synthFallback(mid,when,duration,volume){
 const ctx=context(),t=Math.max(ctx.currentTime+.01,when??ctx.currentTime+.012),hz=midiToFrequency(mid);
 const v=volume??.13;
 for(let h=1;h<=6;h++){
  const osc=ctx.createOscillator(),env=ctx.createGain();osc.type='sine';osc.frequency.value=hz*h*(1+.0002*h*h);
  env.gain.setValueAtTime(.00001,t);env.gain.linearRampToValueAtTime(v*.40/Math.pow(h,1.75),t+.005);
  env.gain.exponentialRampToValueAtTime(.0001,t+duration+.3/h);
  osc.connect(env);env.connect(ctx.destination);activeSources.add(osc);osc.onended=()=>activeSources.delete(osc);
  osc.start(t);osc.stop(t+duration+.4);
 }
}
export function note(midi,when,duration=.58,opts={}){
 const m=Number(midi);if(!Number.isInteger(m)||m<20||m>110)return;
 context();if(!bootStarted)loadPianoSamples();
 const k=closeSample(m),buf=sampleBank.get(k);
 if(buf){playBuffer(m,buf,k,when,duration,opts.volume);return;}
 // Play recorded audio as soon as it is decoded, even if this is the first touch.
 if(!inflight.has(k))fetchPiano(k);
 const timeOffset=(when??context().currentTime)-context().currentTime;
 const deadline=Date.now()+1600,token=playToken;
 const retry=()=>{
  if(token!==playToken)return;
  const loaded=sampleBank.get(k);
  if(loaded){playBuffer(m,loaded,k,context().currentTime+Math.max(.01,timeOffset),duration,opts.volume);return;}
  if(Date.now()<deadline&&inflight.has(k)){setTimeout(retry,45);return;}
  synthFallback(m,undefined,duration,opts.volume);
 };
 retry();
}
export function chord(midis,when,duration=.9){const ctx=context();for(const m of midis)note(m,when??ctx.currentTime+.012,duration,{volume:.16});}
export function arpeggio(midis,step=.25){const ctx=context(),at=ctx.currentTime+.05;midis.forEach((m,i)=>note(m,at+i*step,.58));}
export function playInterval(a,b){const ctx=context(),t=ctx.currentTime+.06;note(a,t,.5);note(b,t+.65,.7);}
export function playSequence(groups,bpm=85,onStep,melody=[]){
 const ctx=context(),start=ctx.currentTime+.08,beat=60/bpm,token=++playToken;
 melody.forEach(x=>{if(Number.isInteger(x.midi)&&x.step>=0&&x.step<=15)note(x.midi,start+x.step*beat,beat*.8,{volume:.21});});
 groups.forEach((g,i)=>{chord(g,start+i*beat*4,beat*3.6);if(onStep)setTimeout(()=>{if(token===playToken)onStep(i)},Math.max(0,(start-ctx.currentTime+i*beat*4)*1000));});
 const endTimer=setTimeout(()=>{if(token===playToken&&onStep)onStep(-1)},Math.max(0,(start-ctx.currentTime+groups.length*beat*4)*1000));
 return ()=>{stopAllScheduled();clearTimeout(endTimer)};
}
export function stopAllScheduled(){playToken++;for(const s of [...activeSources]){try{s.stop()}catch{}}activeSources.clear();}

// Education-only source–filter demonstration: these controls do not model actual patient anatomy.
export function getVoiceFormants({jaw=55,tongue=50,lips=30,f0=180,breath=25,register='m1'}={}){
 const J=jaw/100,T=tongue/100,L=lips/100;
 return {f0,breath,register,
  f1:Math.round(Math.max(220,Math.min(950,340+600*J-195*T))),
  f2:Math.round(Math.max(620,Math.min(3100,790+1700*T-670*L))),
  f3:Math.round(Math.max(1800,Math.min(3900,3100-450*L+90*J)))};
}
let voicePlaying=false;
export function demoFormant(jaw,tongue,lips,extras={}){
 const opts=getVoiceFormants({jaw,tongue,lips,...extras});const ctx=context(),start=ctx.currentTime+.03,duration=1.7;
 // Periodic glottal source with smooth closing phase; per-register spectral tilt is illustrative only.
 const rate=ctx.sampleRate,n=2048,wave=ctx.createBuffer(1,n,rate),data=wave.getChannelData(0);
 const softness=opts.register==='m2'?.65:.38;
 for(let i=0;i<n;i++){const ph=i/n;
  // Continuous finite-difference flow derivative to avoid naive sawtooth timbre.
  const flow=p=>p<.50?.5-.5*Math.cos(Math.PI*p/.50):p<.73?.5+.5*Math.cos(Math.PI*(p-.50)/.23):0;
  const previous=((i+n-1)%n)/n;
  data[i]=(flow(ph)-flow(previous))*(1-softness*.35);
 }
 let peak=0;for(let i=0;i<n;i++)peak=Math.max(peak,Math.abs(data[i]));
 if(peak>.0001)for(let i=0;i<n;i++)data[i]*=.82/peak;
 const src=ctx.createBufferSource(),gain=ctx.createGain(),sum=ctx.createGain();
 src.buffer=wave;src.loop=true;src.playbackRate.value=opts.f0*wave.duration;
 const voiceGain=ctx.createGain();voiceGain.gain.value=.09;
 const highCut=ctx.createBiquadFilter();highCut.type='lowpass';highCut.frequency.value=opts.register==='m2'?3500:5500;
 src.connect(highCut);
 const bands=[[opts.f1,85,.9],[opts.f2,130,.55],[opts.f3,200,.30]];
 bands.forEach(([freq,width,v])=>{const b=ctx.createBiquadFilter(),g=ctx.createGain();b.type='bandpass';b.frequency.value=freq;b.Q.value=freq/width;g.gain.value=v;highCut.connect(b);b.connect(g);g.connect(sum);});
 const noise=ctx.createBufferSource(),nb=ctx.createBuffer(1,Math.round(rate*.3),rate),v=nb.getChannelData(0);
 for(let i=0;i<v.length;i++)v[i]=Math.random()*2-1;
 noise.buffer=nb;noise.loop=true;const nfilter=ctx.createBiquadFilter();nfilter.type='bandpass';nfilter.frequency.value=2400;nfilter.Q.value=.43;
 const ng=ctx.createGain();ng.gain.value=.022*(opts.breath/100);noise.connect(nfilter);nfilter.connect(ng);ng.connect(sum);
 const lfo=ctx.createOscillator(),mod=ctx.createGain();lfo.frequency.value=5.2;mod.gain.value=opts.f0*.004;
 lfo.connect(mod);mod.connect(src.detune); // detune is in cents; deliberately very slight.
 sum.connect(voiceGain);voiceGain.connect(gain);gain.connect(ctx.destination);
 gain.gain.setValueAtTime(.00001,start);gain.gain.linearRampToValueAtTime(1,start+.085);
 gain.gain.setValueAtTime(1,start+duration-.24);gain.gain.linearRampToValueAtTime(.00001,start+duration);
 for(const s of [src,noise,lfo]){activeSources.add(s);s.onended=()=>activeSources.delete(s);s.start(start);s.stop(start+duration+.04);}
 return opts;
}
// Prefetch recorded notes without autoplay. The first click resumes the audio context on iOS.
if(typeof window!=='undefined')setTimeout(()=>{if(navigator.onLine)loadPianoSamples().catch(()=>{})},350);
