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
 jazz:{label:'재즈',desc:'스윙 느낌의 라이드와 워킹 베이스'},
 'neo-soul':{label:'Neo Soul',desc:'느슨한 하이햇과 엇박 피아노'},
 funk:{label:'Funk',desc:'짧은 베이스와 16분음표 싱코페이션'},
 blues:{label:'Blues',desc:'셔플 하이햇과 부기 베이스'},
 bossa:{label:'Bossa Nova',desc:'엇박 반주와 루트·5음 베이스'}
};
export const BACKING_PARTS=['drums','bass','piano','guitar'];
export const DEFAULT_BACKING={style:'pop',loop:true,countIn:true,startBar:1,endBar:4,mix:{drums:65,bass:60,piano:70}};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number.isFinite(Number(n))?Math.round(Number(n)):a));
export function normalizeBacking(settings={},bars=4){
 const source=settings&&typeof settings==='object'?settings:{};
 const max=clamp(bars,1,16),startBar=clamp(source.startBar??1,1,max),endBar=clamp(source.endBar??max,startBar,max);
 const mix=source.mix||{};
 const muted=BACKING_PARTS.filter(part=>Array.isArray(source.muted)&&source.muted.includes(part));
 const solo=BACKING_PARTS.includes(source.solo)?source.solo:null;
 return {style:Object.hasOwn(BACKING_STYLES,source.style)?source.style:'pop',loop:source.loop!==false,countIn:source.countIn!==false,startBar,endBar,...(muted.length?{muted}:{}),...(solo?{solo}:{}),
   mix:{drums:clamp(mix.drums??65,0,100),bass:clamp(mix.bass??60,0,100),piano:clamp(mix.piano??70,0,100),guitar:clamp(mix.guitar??55,0,100)}};
}
function chordBass(symbol){const d=parseChord(symbol);if(!d)return {root:40,third:44,fifth:47,seventh:50};const pcs=d.parts.map(p=>p.pc),bassPc=pitchClass(d.bass||d.root);
 const m=36+bassPc;const at=i=>m+(((pcs[i]??bassPc)-bassPc+12)%12);
 return {root:m,third:at(1),fifth:at(2),seventh:at(3)};
}
const hit=(out,beat,kind,velocity=1)=>out.push({beat:Number(beat.toFixed(5)),kind,velocity});
export function buildBackingPattern(project,settings={}){
 const p=normalizeStudioProject(project),cfg=normalizeBacking(settings,p.bars.length),events=studioEvents(p),start=(cfg.startBar-1)*4,end=cfg.endBar*4;
 const out=[];
 let lastChord, previous=[];
 for(let b=start;b<end;b++){
  const bar=Math.floor(b/4),q=b%4;
  const ev=events.find(x=>x.start<=b&&b<x.start+x.beats);if(!ev)continue;
  const bass=chordBass(ev.symbol);
  const rootNotes=[bass.root,bass.third,bass.fifth,bass.seventh];
  const addBass=(offset,midi,velocity=.8,length=.8)=>out.push({beat:b+offset,kind:'bass',midi,velocity,length});
  if(lastChord!==ev){
   const basic=studioVoicing(ev.symbol,ev.voicing);
   previous=chooseVoicing(basic,previous);
   lastChord=ev;
  }
  const addPiano=(offset,velocity=.7,length=1)=>out.push({beat:b+offset,kind:'piano',notes:previous,velocity,length:Math.min(length,ev.start+ev.beats-(b+offset))});
  const guitarOffset=['funk','bossa','neo-soul','rnb'].includes(cfg.style)?.5:0;
  if(ev.start===b||q===2||cfg.style==='funk'){
   const guitar=previous.filter(n=>n>=48).slice(-4);
   out.push({beat:b+guitarOffset,kind:'guitar',notes:guitar,velocity:q%2===0?.68:.49,length:Math.min(.45,ev.start+ev.beats-b-guitarOffset)});
  }
  if(q===3&&(bar+1)%4===0){
   hit(out,b+.5,'snare',.40);hit(out,b+.75,'snare',.32);
  }
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
  }else if(cfg.style==='neo-soul'||cfg.style==='funk'){
   const funk=cfg.style==='funk';
   if(q===0||q===2)hit(out,b,'kick',.82);
   if(q===1||q===3)hit(out,b+(funk?0:.04),'snare',.76);
   for(const offset of funk?[0,.25,.5,.75]:[0,.53,.78])hit(out,b+offset,'hat',offset===0?.42:.22);
   if(q===0||q===2)addBass(0,bass.root,.8,funk?.22:.6);
   if(q===1||q===3)addBass(.75,q===1?bass.fifth:bass.root,.56,.18);
   if(ev.start!==b&&(q===1||q===3))addPiano(funk?.25:.52,.52,funk?.22:.42);
  }else if(cfg.style==='blues'){
   hit(out,b,'hat',.48);hit(out,b+2/3,'hat',.33);
   if(q%2===0)hit(out,b,'kick',.78);
   else hit(out,b,'snare',.76);
   const boogie=[bass.root,bass.fifth,bass.root+9,bass.root+10];
   addBass(0,boogie[q],.74,.8);
   if(q===2&&ev.start!==b)addPiano(0,.48,.66);
  }else if(cfg.style==='bossa'){
   if(q%2===0){hit(out,b,'kick',.72);addBass(0,q===0?bass.root:bass.fifth,.72,1.35);}
   if(q===1||q===3)hit(out,b+.5,'snare',.36);
   hit(out,b,'hat',.32);hit(out,b+.5,'hat',.22);
   if(ev.start!==b)addPiano(q===2?0:.5,.51,.44);
  }else if(cfg.style==='jazz'){
   hit(out,b,'ride',.42);if(q===1||q===3)hit(out,b+2/3,'ride',.30);
   if(q===1||q===3)hit(out,b,'hat',.28);
   if(q===2)hit(out,b,'snare',.18);
   addBass(0,rootNotes[q%4],.72,.9);
  }
 }
 return {settings:cfg,bpm:p.bpm,beats:end-start,events:out.filter(e=>e.beat>=start&&e.beat<end&&(e.length??1)>0).sort((a,b)=>a.beat-b.beat),startBeat:start};
}
function chooseVoicing(notes, previous) {
 if (!previous.length||!notes.length) return notes;
 const midpoint=values=>values.reduce((sum,n)=>sum+n,0)/values.length;
 return [-12,0,12].map(shift=>notes.map(n=>n+shift))
   .filter(candidate=>candidate[0]>=42&&candidate.at(-1)<=90)
   .reduce((best,candidate)=>Math.abs(midpoint(candidate)-midpoint(previous))<
     Math.abs(midpoint(best)-midpoint(previous))?candidate:best,notes);
}
export const partOf = event => BACKING_PARTS.includes(event.kind)?event.kind:'drums';
export function partVolume(settings,part){
 return settings.muted?.includes(part)||(settings.solo&&settings.solo!==part)?0:settings.mix[part]/100;
}
function makeNoise(ctx){const buf=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.5),ctx.sampleRate),data=buf.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1);return buf;}
export function createBackingVoice(context, sec, cfg, playPiano) {
 const master=context.createGain();
 master.gain.value=.7;
 master.connect(context.destination);
 const channels=Object.fromEntries(BACKING_PARTS.map(part=>{
  const gain=context.createGain();gain.connect(master);return [part,gain];
 }));
 const {drums,bass,piano,guitar}=channels;
 const nodes=new Set(),noise=makeNoise(context);
 function mixApply(settings){
  for(const part of BACKING_PARTS)channels[part].gain.value=partVolume(settings,part);
 }
 mixApply(cfg);
 function retain(src,when,duration){nodes.add(src);src.onended=()=>nodes.delete(src);src.start(when);src.stop(when+duration);}
 function env(g,t,peak,end){g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,peak),t+.009);g.gain.exponentialRampToValueAtTime(.0001,t+end);}
 function noiseHit(when,vol,filterFreq=.0,length=.08){const src=context.createBufferSource(),filter=context.createBiquadFilter(),g=context.createGain();src.buffer=noise;filter.type='highpass';filter.frequency.value=filterFreq||3000;env(g,when,vol,length);src.connect(filter);filter.connect(g);g.connect(drums);retain(src,when,length+.015);}
 function kick(t,vel){const osc=context.createOscillator(),g=context.createGain();osc.type='sine';osc.frequency.setValueAtTime(145,t);osc.frequency.exponentialRampToValueAtTime(46,t+.18);env(g,t,.48*vel,.27);osc.connect(g);g.connect(drums);retain(osc,t,.29);}
 function snare(t,vel){noiseHit(t,.16*vel,1150,.16);const osc=context.createOscillator(),g=context.createGain();osc.type='triangle';osc.frequency.value=165;env(g,t,.073*vel,.09);osc.connect(g);g.connect(drums);retain(osc,t,.11);}
 function bassNote(t,midi,velocity,length){const freq=440*2**((midi-69)/12),dur=Math.max(.07,length*sec*.88),osc=context.createOscillator(),g=context.createGain(),lp=context.createBiquadFilter();osc.type='triangle';osc.frequency.value=freq;lp.type='lowpass';lp.frequency.value=410;env(g,t,.15*velocity,dur);osc.connect(lp);lp.connect(g);g.connect(bass);retain(osc,t,dur+.02);}
 function tick(t,accent){const osc=context.createOscillator(),g=context.createGain();osc.type='sine';osc.frequency.value=accent?1040:760;env(g,t,accent?.16:.10,.055);osc.connect(g);g.connect(master);retain(osc,t,.07);}
 function pitched(when,midi,velocity,length,channel,isGuitar){
  const oscillator=context.createOscillator(),gain=context.createGain();
  oscillator.type=isGuitar?'triangle':'sine';
  oscillator.frequency.value=440*2**((midi-69)/12);
  const duration=Math.max(.04,length*sec*.95);
  env(gain,when,velocity*(isGuitar?.05:.075),duration);
  oscillator.connect(gain);gain.connect(channel);retain(oscillator,when,duration+.015);
 }
 function scheduleEvent(e,t){
  if(e.kind==='kick')kick(t,e.velocity);
  else if(e.kind==='snare')snare(t,e.velocity);
  else if(e.kind==='bass')bassNote(t,e.midi,e.velocity,e.length);
  else if(e.kind==='piano'&&playPiano)e.notes.forEach(m=>playPiano(m,t,sec*e.length*.93,{volume:.12*e.velocity,destination:piano}));
  else if(e.notes)e.notes.forEach((m,i)=>pitched(t+(e.kind==='guitar'?i*.009:0),m,e.velocity,e.length,e.kind==='guitar'?guitar:piano,e.kind==='guitar'));
  else noiseHit(t,(e.kind==='ride'?.064:.08)*e.velocity,e.kind==='ride'?4300:6100,e.kind==='ride'?.22:.065);
 }
 function stop(){
  for(const node of nodes){try{node.stop()}catch{}}
  nodes.clear();try{master.disconnect()}catch{}
 }
 return {scheduleEvent,tick,stop,mixApply};
}

export function startBackingTrack({context,project,settings,playPiano,onBar=()=>{},onEnd=()=>{}}={}){
 if(!context||typeof context.createGain!=='function')throw Error('Web Audio를 사용할 수 없어요.');
 const pattern=buildBackingPattern(project,settings),cfg=pattern.settings;
 const sec=60/pattern.bpm,base=context.currentTime+.12,countIn=cfg.countIn?4:0;
 const voice=createBackingVoice(context,sec,cfg,playPiano);
 const {scheduleEvent,tick}=voice;
 const timers=new Set();
 let stopped=false,nextCycle=0,nextIndex=0;
 // Schedule audio with the AudioContext clock; avoid setInterval timing drift.
 const loopSecs=pattern.beats*sec;const playStart=base+countIn*sec;
 const events=pattern.events;
 let countStep=0;
 function schedule(){
  if(stopped)return;
  const now=context.currentTime;
  const ahead=now+.22;
  if(cfg.loop&&now>playStart+(nextCycle+1)*loopSecs){
   nextCycle=Math.floor((now-playStart)/loopSecs);
   nextIndex=0;
  }
  while(countStep<countIn&&base+countStep*sec<ahead){const t=base+countStep*sec;if(t>=now-.05)tick(t,countStep===0);countStep++;}
  let steps=0;
  while(steps<256){
   if(!cfg.loop&&nextCycle>0)break;
   if(nextIndex>=events.length){nextIndex=0;nextCycle++;if(!cfg.loop)break;}
   const ev=events[nextIndex];if(!ev)break;
   const t=playStart+nextCycle*loopSecs+humanizedBeat(ev,nextIndex,pattern.startBeat)*sec;
   if(t>=ahead)break;
   if(t>=now-.05)scheduleEvent(ev,t);
   nextIndex++;steps++;
  }
 }
 // Position callbacks are for visual feedback only, not for audio timing.
 let barStep=0;
 function status(){if(stopped)return;const now=context.currentTime;
  const elapsed=Math.floor((now+.02-playStart)/(4*sec));
  if(elapsed>=barStep&&(cfg.loop||elapsed<pattern.beats/4)){
   const bar=cfg.startBar+elapsed%(pattern.beats/4);
   const t=playStart+elapsed*4*sec;
   const id=setTimeout(()=>{timers.delete(id);if(!stopped)onBar(bar);},Math.max(0,(t-now)*1000));
   timers.add(id);barStep=elapsed+1;
  }
  if(!cfg.loop&&now>=playStart+loopSecs+.18)stop(true);
 }
 function stop(natural=false){if(stopped)return;stopped=true;clearInterval(timer);clearInterval(statusTimer);for(const id of timers)clearTimeout(id);timers.clear();voice.stop();onEnd(natural);}
 const timer=setInterval(schedule,25),statusTimer=setInterval(status,80);schedule();status();
 return {stop,setMix:mix=>voice.mixApply(normalizeBacking({...cfg,mix},cfg.endBar)),setSettings:voice.mixApply,pattern};
}

export function humanizedBeat(event,index,start){
 const jitter=((index*37)%11-5)/400;
 return Math.max(0,event.beat-start+jitter);
}
