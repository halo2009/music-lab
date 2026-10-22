// Music Lab 0.9.2 | Editable chord-grid composition engine (no external dependencies).
import {parseChord,describeChord} from './chord-library.js';
import {chordsOf,pitchClass} from './music.js';
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,Math.trunc(Number(x)||lo)));
export const STUDIO_MAX_BARS=16;
export const STUDIO_PRESETS={
 '팝 I–V–vi–IV':[0,4,5,3],
 '팝 I–vi–IV–V':[0,5,3,4],
 '재즈 ii–V–I–vi':[1,4,0,5],
 'R&B vi–IV–I–V':[5,3,0,4]
};
export function newStudioProject(root='C',mode='major',bpm=82){
 const changes=chordsOf(root,mode,true),indices=[0,4,5,3];
 return {title:'새 코드 진행',root,mode,bpm:clamp(bpm,40,220),bars:indices.map(i=>({segments:[{symbol:changes[i].name,beats:4,voicing:0}]}))};
}
export function normalizeStudioProject(data){
 if(!data||!Array.isArray(data.bars)||!data.bars.length||data.bars.length>STUDIO_MAX_BARS)throw Error('마디 수는 1~16개여야 합니다.');
 const root=typeof data.root==='string'&&data.root.length<5?data.root:'C';
 const mode=data.mode==='minor'?'minor':'major',bpm=clamp(data.bpm,40,220);
 const bars=data.bars.map((bar,b)=>{
  if(!Array.isArray(bar?.segments)||!bar.segments.length||bar.segments.length>4)throw Error(`${b+1}마디의 코드 수가 올바르지 않습니다.`);
  const segments=bar.segments.map(segment=>{
   const parsed=parseChord(segment.symbol);
   if(!parsed)throw Error(`${b+1}마디: 지원되지 않는 코드 ${String(segment.symbol).slice(0,35)}`);
   const beats=Number(segment.beats);if(!Number.isInteger(beats)||beats<1||beats>4)throw Error('코드 길이는 1~4박이어야 합니다.');
   return {symbol:parsed.name,beats,voicing:clamp(segment.voicing??0,0,3)};
  });
  if(segments.reduce((s,x)=>s+x.beats,0)!==4)throw Error(`${b+1}마디의 박자 합계는 4박이어야 합니다.`);
  return {segments};
 });
 const melody=Array.isArray(data.melody)?data.melody.slice(0,256).filter(x=>Number.isInteger(x?.step)&&x.step>=0&&x.step<bars.length*4&&Number.isInteger(x?.midi)&&x.midi>=48&&x.midi<=83).map(x=>({step:x.step,midi:x.midi})):[];
 return {title:String(data.title||'새 코드 진행').slice(0,70),root,mode,bpm,bars,melody};
}
export function cloneProject(data){return normalizeStudioProject(JSON.parse(JSON.stringify(data)));}
export function addBar(project){const p=cloneProject(project);if(p.bars.length>=STUDIO_MAX_BARS)return p;const last=p.bars.at(-1).segments[0];p.bars.push({segments:[{symbol:last.symbol,beats:4,voicing:last.voicing}]});return p;}
export function removeBar(project,index){const p=cloneProject(project);if(p.bars.length<=1)return p;const bar=clamp(index,0,p.bars.length-1);p.bars.splice(bar,1);p.melody=(p.melody||[]).flatMap(x=>x.step>=bar*4&&x.step<(bar+1)*4?[]:[{...x,step:x.step>=((bar+1)*4)?x.step-4:x.step}]);return normalizeStudioProject(p);}
export function duplicateBar(project,index){const p=cloneProject(project);if(p.bars.length>=STUDIO_MAX_BARS)return p;const bar=clamp(index,0,p.bars.length-1),copy=JSON.parse(JSON.stringify(p.bars[bar]));p.bars.splice(bar+1,0,copy);p.melody=[...(p.melody||[]).map(x=>({...x,step:x.step>=((bar+1)*4)?x.step+4:x.step})),...(p.melody||[]).filter(x=>x.step>=bar*4&&x.step<(bar+1)*4).map(x=>({...x,step:x.step+4}))];return normalizeStudioProject(p);}
export function splitSlot(project,bar,slot){const p=cloneProject(project),items=p.bars[bar]?.segments,seg=items?.[slot];if(!seg||seg.beats<2||items.length>=4)return p;const first=Math.floor(seg.beats/2),second=seg.beats-first;items.splice(slot,1,{...seg,beats:first},{...seg,beats:second});return p;}
export function mergeSlot(project,bar,slot){const p=cloneProject(project),items=p.bars[bar]?.segments;if(!items||items.length<=1||!items[slot])return p;const i=slot===0?0:slot-1;items[i].beats+=items[i+1].beats;items.splice(i+1,1);return p;}
export function setStudioChord(project,bar,slot,symbol){const p=cloneProject(project),parsed=parseChord(symbol);if(!parsed)throw Error('지원되지 않는 코드입니다. 예: F#m7, BbM7, C7(#9), C/E');if(!p.bars[bar]?.segments[slot])throw Error('코드 위치가 올바르지 않습니다.');p.bars[bar].segments[slot].symbol=parsed.name;return p;}
export function setStudioVoicing(project,bar,slot,voicing){const p=cloneProject(project);if(p.bars[bar]?.segments[slot])p.bars[bar].segments[slot].voicing=clamp(voicing,0,3);return p;}
export function applyStudioPreset(project,name){const p=cloneProject(project),degrees=STUDIO_PRESETS[name];if(!degrees)return p;const ch=chordsOf(p.root,p.mode,true);p.bars=degrees.map(i=>({segments:[{symbol:ch[i].name,beats:4,voicing:0}]}));return p;}
export function studioEvents(project){const p=normalizeStudioProject(project),out=[];p.bars.forEach((bar,b)=>{let inBar=0;bar.segments.forEach((seg,s)=>{out.push({...seg,bar:b,slot:s,start:b*4+inBar});inBar+=seg.beats;});});return out;}
// Deterministic voicing: 3-5 piano notes, inversion selected without changing harmonic quality.
export function studioVoicing(symbol,inv=0){
 const d=parseChord(symbol);if(!d)return [];
 const pcs=[...new Set(d.parts.map(x=>x.pc))];
 // Guitar slash chords are respected in bass; non-chord slash bass is added explicitly.
 const bassPc=d.bass?pitchClass(d.bass):pcs[clamp(inv,0,3)%pcs.length];
 const set=[bassPc,...pcs.filter(pc=>pc!==bassPc)];
 const pitches=[48+set[0]];
 for(const pc of set.slice(1)){
  let n=pc+12*Math.ceil((pitches.at(-1)+1-pc)/12);if(n<pitches.at(-1))n+=12;pitches.push(n);
 }
 // Keep midrange playable in Logic and sampled piano.
 const shift=pitches.at(-1)>84?-12:0;
 return pitches.map(n=>n+shift);
}
export function studioSuggestions(project){const p=normalizeStudioProject(project),ch=chordsOf(p.root,p.mode,true);return ch.map(c=>({name:c.name,roman:c.roman}));}
const vlq=n=>{let k=Math.max(0,Math.floor(n)),out=[k&127];while(k>>=7)out.unshift((k&127)|128);return out;};
const be=(n,len)=>Array.from({length:len},(_,i)=>(n>>>((len-i-1)*8))&255);
const bytes=s=>[...new TextEncoder().encode(s)];
function track(events,endTicks){events.sort((a,b)=>a.at-b.at||((a.bytes[0]&0xf0)===0x80?-1:1));let last=0,data=[];
 for(const ev of events){data.push(...vlq(ev.at-last),...ev.bytes);last=ev.at;}
 data.push(...vlq(Math.max(0,endTicks-last)),255,47,0);
 return [...bytes('MTrk'),...be(data.length,4),...data];
}
// Type-1 MIDI, separate piano chord & optional legacy 4-bar melody tracks.
export function buildStudioMidi(project,melody=[]){const p=normalizeStudioProject(project),ppq=480,beatEnd=p.bars.length*4,events=studioEvents(p);
 const tempo=Math.round(60_000_000/p.bpm),control=track([{at:0,bytes:[255,81,3,...be(tempo,3)]},{at:0,bytes:[255,88,4,4,2,24,8]}],beatEnd*ppq);
 const ch=[{at:0,bytes:[0xc0,0]}];for(const event of events){const st=event.start*ppq,end=(event.start+event.beats)*ppq-20;for(const midi of studioVoicing(event.symbol,event.voicing)){ch.push({at:st,bytes:[0x90,midi,75]},{at:end,bytes:[0x80,midi,0]});}}
 const mel=[{at:0,bytes:[0xc1,0]}];for(const x of melody){const at=Number(x.step)*ppq,m=Number(x.midi);if(!Number.isInteger(m)||m<24||m>108||!Number.isInteger(x.step)||x.step<0||x.step>=beatEnd)continue;mel.push({at,bytes:[0x91,m,88]},{at:Math.min(beatEnd*ppq,at+ppq-40),bytes:[0x81,m,0]});}
 const header=[...bytes('MThd'),...be(6,4),0,1,0,3,1,224];return new Uint8Array([...header,...control,...track(ch,beatEnd*ppq),...track(mel,beatEnd*ppq)]);
}
