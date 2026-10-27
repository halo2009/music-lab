// Music Lab Alpha 0.9.5 — self-contained plucked-string guitar playback.
// No sample downloads, recording, microphones, or third-party copyrighted audio.
// Two lightweight Karplus–Strong timbres; these are modeled tones, NOT recordings.
import {context,note as pianoNote} from './audio.js';

export const GUITAR_TIMBRES={
  clean:{label:'클린 일렉 · 모델링',description:'선명한 플럭 톤 (실제 녹음 아님)'},
  acoustic:{label:'어쿠스틱 · 모델링',description:'부드러운 바디 울림 (실제 녹음 아님)'},
  piano:{label:'피아노 · 기존 샘플',description:'기존 피아노 샘플 그대로 재생'}
};
export const GUITAR_PATTERNS={
  down:{label:'↓ 다운 스트럼'},
  up:{label:'↑ 업 스트럼'},
  arp:{label:'아르페지오'},
  together:{label:'동시 연주'}
};
export function normalizeGuitarSound(config={}){
 const t=config?.timbre,p=config?.pattern;
 return {timbre:Object.hasOwn(GUITAR_TIMBRES,t)?t:'clean',pattern:Object.hasOwn(GUITAR_PATTERNS,p)?p:'down'};
}
// The order of input MIDI notes is always string 6 (lowest) to string 1 (highest).
export function guitarEvents(midis,pattern='down'){
 const valid=(Array.isArray(midis)?midis:[]).filter(n=>Number.isInteger(n)&&n>=36&&n<=96).slice(0,6);
 const notes=pattern==='up'?[...valid].reverse():valid;
 const gap=pattern==='arp'?.165:pattern==='together'?0:.037;
 return notes.map((midi,i)=>({midi,offset:i*gap}));
}
const cache=new Map(),active=new Set();
const MAX_CACHE=28;
function synthString(ctx,midi,timbre){
 const key=`${ctx.sampleRate}:${timbre}:${midi}`;
 if(cache.has(key))return cache.get(key);
 const rate=ctx.sampleRate,hz=440*2**((midi-69)/12);
 const delay=Math.max(28,Math.round(rate/hz)),seconds=timbre==='acoustic'?2.6:2.45;
 const length=Math.round(rate*seconds);
 const buffer=ctx.createBuffer(1,length,rate),dst=buffer.getChannelData(0);
 const line=new Float32Array(delay),pick=timbre==='clean'?.18:.29;
 const notch=Math.max(1,Math.round(delay*pick));
 let seed=((midi*2654435761)^(timbre==='clean'?0x7f4a7c15:0x9e3779b9))>>>0;
 function rand(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return ((seed>>>0)/4294967295)*2-1;}
 for(let i=0;i<delay;i++)line[i]=rand();
 // A pickup/plectrum position suppresses some upper harmonics.
 for(let i=delay-1;i>=0;i--)line[i]=(line[i]-line[(i+delay-notch)%delay])*.5;
 let max=1e-6;
 for(let i=0;i<delay;i++)max=Math.max(max,Math.abs(line[i]));
 for(let i=0;i<delay;i++)line[i]/=max;
 // Slow damping of lows, faster damping of highs, with initial pick transient.
 const feedback=timbre==='clean'?.9976:.9967;
 const bright=timbre==='clean'?.70:.47;
 let head=0,lowpass=0;
 for(let i=0;i<length;i++){
  const x=line[head],next=line[(head+1)%delay];
  const average=.5*(x+next);
  lowpass=bright*average+(1-bright)*lowpass;
  line[head]=Math.max(-1,Math.min(1,lowpass*feedback));
  head=(head+1)%delay;
  const transient=i<rate*.017?(rand()*.07*(1-i/(rate*.017))):0;
  dst[i]=Math.max(-1,Math.min(1,x*.8+transient));
 }
 // Integer delay is pitch-corrected at playback by a slight rate adjustment.
 const rateAdjust=hz*delay/rate;
 const result={buffer,rateAdjust};
 if(cache.size>=MAX_CACHE)cache.delete(cache.keys().next().value);
 cache.set(key,result);return result;
}
export function stopGuitarSound(){for(const source of [...active]){try{source.stop()}catch{}}active.clear();}
export function guitarNote(midi,{timbre='clean',when,duration=1.6,volume=.22}={}){
 if(!Number.isInteger(midi)||midi<36||midi>96)return false;
 const ctx=context();
 if(timbre==='piano'){
  pianoNote(midi,when,Math.max(.1,duration),{volume:.14});return true;
 }
 const tone=timbre==='acoustic'?'acoustic':'clean',item=synthString(ctx,midi,tone);
 const t=Math.max(ctx.currentTime+.008,Number.isFinite(when)?when:ctx.currentTime+.018);
 const src=ctx.createBufferSource(),amp=ctx.createGain(),low=ctx.createBiquadFilter(),hi=ctx.createBiquadFilter();
 src.buffer=item.buffer;src.playbackRate.value=item.rateAdjust;
 hi.type='highpass';hi.frequency.value=tone==='clean'?78:60;
 low.type='lowpass';low.frequency.value=tone==='clean'?4200:6400;low.Q.value=.28;
 const decay=Math.min(duration,tone==='clean'?2.15:2.3);
 const vol=Math.min(.32,Math.max(.01,Number(volume)||.22));
 amp.gain.setValueAtTime(.0001,t);
 amp.gain.linearRampToValueAtTime(vol,t+.007);
 amp.gain.exponentialRampToValueAtTime(.0001,t+Math.max(.15,decay));
 src.connect(hi);hi.connect(low);low.connect(amp);amp.connect(ctx.destination);
 active.add(src);src.onended=()=>active.delete(src);
 src.start(t);src.stop(t+Math.max(.16,decay)+.025);
 return true;
}
export function guitarChord(midis,{timbre='clean',pattern='down',when,duration=1.65}={}){
 const ctx=context(),start=Number.isFinite(when)?when:ctx.currentTime+.025;
 const events=guitarEvents(midis,pattern);
 for(const e of events)guitarNote(e.midi,{timbre,when:start+e.offset,duration,volume:Math.min(.28,.43/Math.sqrt(Math.max(1,events.length)))});
 return events.length;
}
