// Music Lab Alpha 0.9.4 — browser-only accompaniment engine.
// All sounds are generated from the existing piano samples and Web Audio nodes.
// No new sound files, backend, or microphone permissions are required.
import {studioEvents,studioVoicing,normalizeStudioProject} from './studio-engine.js';
import {parseChord} from './chord-library.js';
import {pitchClass} from './music.js';

export const BACKING_STYLES={
 pop:{label:'팝',desc:'정박 킥·스네어와 8분 하이햇'},
 rock:{label:'록',desc:'분명한 백비트와 직선적인 베이스'},
 ballad:{label:'발라드',desc:'느리고 부드러운 드럼과 여유 있는 베이스'},
 rnb:{label:'R&B',desc:'싱코페이션과 촘촘한 하이햇'},
 jazz:{label:'재즈',desc:'스윙 느낌의 라이드와 워킹 베이스'}
};
export const DEFAULT_BACKING={style:'pop',loop:true,countIn:true,startBar:1,endBar:4,mix:{drums:65,bass:60,piano:70}};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number.isFinite(Number(n))?Math.round(Number(n)):a));
export function normalizeBacking(settings={},bars=4){
 const source=settings&&typeof settings==='object'?settings:{};
 const max=clamp(bars,1,16),startBar=clamp(source.startBar??1,1,max),endBar=clamp(source.endBar??max,startBar,max);
 const mix=source.mix||{};
 return {style:Object.hasOwn(BACKING_STYLES,source.style)?source.style:'pop',loop:source.loop!==false,countIn:source.countIn!==false,startBar,endBar,
   mix:{drums:clamp(mix.drums??65,0,100),bass:clamp(mix.bass??60,0,100),piano:clamp(mix.piano??70,0,100)}};
}
function chordBass(symbol){const d=parseChord(symbol);if(!d)return {root:40,third:44,fifth:47,seventh:50};const pcs=d.parts.map(p=>p.pc),bassPc=pitchClass(d.bass||d.root);
 const m=36+bassPc;const at=i=>m+(((pcs[i]??bassPc)-bassPc+12)%12);
 return {root:m,third:at(1),fifth:at(2),seventh:at(3)};
}
const hit=(out,beat,kind,velocity=1)=>out.push({beat:Number(beat.toFixed(5)),kind,velocity});
export function buildBackingPattern(project,settings={}){
 const p=normalizeStudioProject(project),cfg=normalizeBacking(settings,p.bars.length),events=studioEvents(p),start=(cfg.startBar-1)*4,end=cfg.endBar*4;
 const out=[];
 for(let b=start;b<end;b++){
  const bar=Math.floor(b/4),q=b%4;
  const ev=events.find(x=>x.start<=b&&b<x.start+x.beats);if(!ev)continue;
  const bass=chordBass(ev.symbol);
  const rootNotes=[bass.root,bass.third,bass.fifth,bass.seventh];
  const addBass=(offset,midi,velocity=.8,length=.8)=>out.push({beat:b+offset,kind:'bass',midi,velocity,length});
  const addPiano=(offset,velocity=.7,length=1)=>out.push({beat:b+offset,kind:'piano',notes:studioVoicing(ev.symbol,ev.voicing),velocity,length:Math.min(length,ev.start+ev.beats-(b+offset))});
  // Play a new chord when a segment begins. Repeat the chord in a style-appropriate rhythm.
  if(ev.start===b)addPiano(0,.9,Math.min(ev.beats*0.94,3.5));
  if(cfg.style==='pop'&&q===2&&ev.start!==b)addPiano(0,.42,.85);
  if(cfg.style==='rock'&&q===2&&ev.start!==b)addPiano(0,.48,1.4);
  if(cfg.style==='rnb'&&q===3&&ev.start!==b)addPiano(.5,.38,.4);
  if(cfg.style==='jazz'&&q===2&&ev.start!==b)addPiano(0,.36,1.2);
  if(cfg.style==='ballad'&&q===2&&ev.start!==b)addPiano(0,.33,1.7);
  if(cfg.style==='pop'){
   if(q===0||q===2)hit(out,b,'kick',q===0?1:.78);
   if(q===1||q===3)hit(out,b,'snare',.85);
   hit(out,b,'hat',.47);hit(out,b+.5,'hat',.37);
   if(q===0||q===2)addBass(0,q===0?bass.root:bass.fifth,.85,.82);
  }else if(cfg.style==='rock'){
   if(q===0||q===2)hit(out,b,'kick',1);
   if(q===1||q===3)hit(out,b,'snare',1);
   hit(out,b,'hat',.54);hit(out,b+.5,'hat',.45);
   addBass(0,q%2===0?bass.root:bass.fifth,.86,.76);
  }else if(cfg.style==='ballad'){
   if(q===0||q===2)hit(out,b,'kick',.72);
   if(q===3)hit(out,b,'snare',.62);
   hit(out,b,'hat',.24);
   if(q===0)addBass(0,bass.root,.72,1.7);
   if(q===2)addBass(0,bass.fifth,.48,1.65);
  }else if(cfg.style==='rnb'){
   if(q===0||q===2)hit(out,b,'kick',q===0?1:.75);
   if(q===1||q===3)hit(out,b,'snare',.85);
   for(let k=0;k<4;k++)hit(out,b+k*.25,'hat',k%2===0?.36:.2);
   if(q===1)hit(out,b+.75,'kick',.48);
   if(q===0)addBass(0,bass.root,.8,.75);
   if(q===1)addBass(.5,bass.third,.63,.43);
   if(q===2)addBass(.5,bass.fifth,.78,.45);
   if(q===3)addBass(.5,bass.root,.53,.43);
  }else if(cfg.style==='jazz'){
   hit(out,b,'ride',.42);if(q===1||q===3)hit(out,b+2/3,'ride',.30);
   if(q===1||q===3)hit(out,b,'hat',.28);
   if(q===2)hit(out,b,'snare',.18);
   addBass(0,rootNotes[q%4],.72,.9);
  }
 }
 return {settings:cfg,bpm:p.bpm,beats:end-start,events:out.filter(e=>e.beat>=start&&e.beat<end&&e.length!==0).sort((a,b)=>a.beat-b.beat),startBeat:start};
}
function makeNoise(ctx){const buf=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.5),ctx.sampleRate),data=buf.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1);return buf;}
export function startBackingTrack({context,project,settings,playPiano,onBar=()=>{},onEnd=()=>{}}={}){
 if(!context||typeof context.createGain!=='function')throw Error('Web Audio를 사용할 수 없어요.');
 if(typeof playPiano!=='function')throw Error('피아노 재생 함수가 필요합니다.');
 const pattern=buildBackingPattern(project,settings),cfg=pattern.settings;
 const sec=60/pattern.bpm,base=context.currentTime+.12,countIn=cfg.countIn?4:0;
 const master=context.createGain(),drums=context.createGain(),bass=context.createGain();
 master.gain.value=.8;master.connect(context.destination);drums.connect(master);bass.connect(master);
 const nodes=new Set(),timers=new Set(),noise=makeNoise(context);
 let stopped=false,nextCycle=0,nextIndex=0;
 function mixApply(m){const v=normalizeBacking({...cfg,mix:m},cfg.endBar).mix;drums.gain.value=v.drums/100;bass.gain.value=v.bass/100;cfg.mix=v;}
 mixApply(cfg.mix);
 function retain(src,when,duration){nodes.add(src);src.onended=()=>nodes.delete(src);src.start(when);src.stop(when+duration);}
 function env(g,t,peak,end){g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,peak),t+.009);g.gain.exponentialRampToValueAtTime(.0001,t+end);}
 function noiseHit(when,vol,filterFreq=.0,length=.08){const src=context.createBufferSource(),filter=context.createBiquadFilter(),g=context.createGain();src.buffer=noise;filter.type='highpass';filter.frequency.value=filterFreq||3000;env(g,when,vol,length);src.connect(filter);filter.connect(g);g.connect(drums);retain(src,when,length+.015);}
 function kick(t,vel){const osc=context.createOscillator(),g=context.createGain();osc.type='sine';osc.frequency.setValueAtTime(145,t);osc.frequency.exponentialRampToValueAtTime(46,t+.18);env(g,t,.48*vel,.27);osc.connect(g);g.connect(drums);retain(osc,t,.29);}
 function snare(t,vel){noiseHit(t,.16*vel,1150,.16);const osc=context.createOscillator(),g=context.createGain();osc.type='triangle';osc.frequency.value=165;env(g,t,.073*vel,.09);osc.connect(g);g.connect(drums);retain(osc,t,.11);}
 function bassNote(t,midi,velocity,length){const freq=440*2**((midi-69)/12),dur=Math.max(.07,length*sec*.88),osc=context.createOscillator(),g=context.createGain(),lp=context.createBiquadFilter();osc.type='triangle';osc.frequency.value=freq;lp.type='lowpass';lp.frequency.value=410;env(g,t,.15*velocity,dur);osc.connect(lp);lp.connect(g);g.connect(bass);retain(osc,t,dur+.02);}
 function tick(t,accent){const osc=context.createOscillator(),g=context.createGain();osc.type='sine';osc.frequency.value=accent?1040:760;env(g,t,accent?.16:.10,.055);osc.connect(g);g.connect(master);retain(osc,t,.07);}
 function scheduleEvent(e,t){if(e.kind==='kick')kick(t,e.velocity);else if(e.kind==='snare')snare(t,e.velocity);else if(e.kind==='hat'||e.kind==='ride')noiseHit(t,(e.kind==='ride'?.064:.08)*e.velocity,e.kind==='ride'?4300:6100,e.kind==='ride'?.22:.065);else if(e.kind==='bass')bassNote(t,e.midi,e.velocity,e.length);else if(e.kind==='piano'&&cfg.mix.piano>0){e.notes.forEach(m=>playPiano(m,t,sec*e.length*.93,{volume:cfg.mix.piano/100*.12*e.velocity}));}}
 // Schedule audio with the AudioContext clock; avoid setInterval timing drift.
 const loopSecs=pattern.beats*sec;const playStart=base+countIn*sec;
 const events=pattern.events;
 let countStep=0;
 function schedule(){
  if(stopped)return;
  const ahead=context.currentTime+.22;
  while(countStep<countIn&&base+countStep*sec<ahead){tick(base+countStep*sec,countStep===0);countStep++;}
  let steps=0;
  while(steps<256){
   if(!cfg.loop&&nextCycle>0)break;
   if(nextIndex>=events.length){nextIndex=0;nextCycle++;if(!cfg.loop)break;}
   const ev=events[nextIndex];if(!ev)break;
   const t=playStart+nextCycle*loopSecs+(ev.beat-pattern.startBeat)*sec;
   if(t>=ahead)break;
   scheduleEvent(ev,t);nextIndex++;steps++;
  }
 }
 // Position callbacks are for visual feedback only, not for audio timing.
 let barStep=0;
 function status(){if(stopped)return;const now=context.currentTime;
  while(base+(countIn+barStep*4)*sec<=now+.02){if(!cfg.loop&&barStep*4>=pattern.beats)break;const bar=cfg.startBar+(barStep%(pattern.beats/4));const t=base+(countIn+barStep*4)*sec;const id=setTimeout(()=>{timers.delete(id);if(!stopped)onBar(bar);},Math.max(0,(t-now)*1000));timers.add(id);barStep++;if(barStep>512)break;}
  if(!cfg.loop&&now>=playStart+loopSecs+.18)stop(true);
 }
 function stop(natural=false){if(stopped)return;stopped=true;clearInterval(timer);clearInterval(statusTimer);for(const id of timers)clearTimeout(id);timers.clear();for(const src of nodes){try{src.stop()}catch{}}nodes.clear();try{master.disconnect()}catch{};onEnd(natural);}
 const timer=setInterval(schedule,25),statusTimer=setInterval(status,80);schedule();status();
 return {stop,setMix:mixApply,pattern};
}
