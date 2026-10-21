// Music Lab Alpha 0.9.1 — deterministic CAGED, triad and drop-voicing engines.
// Every grip uses [6th ... 1st string] and true standard-tuning MIDI pitches.
import {describeChord,validateGrip,gripMidis} from './chord-library.js';
import {pitchClass,PC_NAMES} from './music.js';
const PC=n=>(n%12+12)%12;
const OPEN=[40,45,50,55,59,64];
const MAJOR_SHAPES=[
 {name:'C',origin:'C',frets:[null,3,2,0,1,0],rootString:'R5'},
 {name:'A',origin:'A',frets:[null,0,2,2,2,0],rootString:'R5'},
 {name:'G',origin:'G',frets:[3,2,0,0,0,3],rootString:'R6'},
 {name:'E',origin:'E',frets:[0,2,2,1,0,0],rootString:'R6'},
 {name:'D',origin:'D',frets:[null,null,0,2,3,2],rootString:'R4'}
];
const fretSpan=frets=>{const v=frets.filter(f=>f!==null&&f>0);return v.length?Math.max(...v)-Math.min(...v):0};
const bassIndex=frets=>frets.findIndex(f=>f!==null);
const makeGrip=(frets,d,category,label,extra={})=>{
 const base=bassIndex(frets);if(base<0)return null;
 const mids=frets.map((f,i)=>f===null?null:OPEN[i]+f).filter(x=>x!==null);
 const result={frets,base,rootFret:frets[base],rootString:`R${6-base}`,missing:d.parts.filter(p=>!mids.some(m=>PC(m)===p.pc)).map(p=>p.tag),category,label,...extra};
 if(!validateGrip(result,d))return null;
 return result;
};
export function cagedShapes(root='C'){
 const d=describeChord(root,'');const out=[];
 for(const shape of MAJOR_SHAPES){const offset=PC(pitchClass(root)-pitchClass(shape.origin));
  const frets=shape.frets.map(f=>f===null?null:f+offset);
  const g=makeGrip(frets,d,'CAGED',shape.name+'폼',{shape:shape.name,shift:offset});
  if(g)out.push(g);
 }
 return out;
}
const TRIAD_SETS=[{id:'123',label:'1·2·3번 현',indices:[3,4,5]}, {id:'234',label:'2·3·4번 현',indices:[2,3,4]}, {id:'345',label:'3·4·5번 현',indices:[1,2,3]}, {id:'456',label:'4·5·6번 현',indices:[0,1,2]}];
export const TRIAD_STRING_SETS=TRIAD_SETS;
export function triadShapes(root='C',quality='',setId='123'){
 const type=quality==='m'?'m':'';const d=describeChord(root,type);const set=TRIAD_SETS.find(s=>s.id===setId)||TRIAD_SETS[0];
 const notes=d.parts.slice(0,3),allowed=new Set(notes.map(n=>n.pc)),results=[];
 for(let f1=0;f1<=17;f1++)for(let f2=0;f2<=17;f2++){
  if(Math.abs(f1-f2)>4)continue;
  for(let f3=0;f3<=17;f3++){
   const fretted=[f1,f2,f3],positives=fretted.filter(x=>x>0);
   if(positives.length&&Math.max(...positives)-Math.min(...positives)>4)continue;
   const pcs=fretted.map((f,i)=>PC(OPEN[set.indices[i]]+f));
   if(new Set(pcs).size!==3||pcs.some(pc=>!allowed.has(pc)))continue;
   const frets=Array(6).fill(null);set.indices.forEach((index,i)=>frets[index]=fretted[i]);
   const inversion=notes.findIndex(n=>n.pc===pcs[0]);
   const names=['기본형','1전위','2전위'];
   const g=makeGrip(frets,d,'triad',names[inversion],{inversion,setId});if(!g)continue;
   const span=fretSpan(frets),avg=fretted.reduce((a,b)=>a+b,0)/3;
   g.score=span*15+avg+fretted.filter(f=>f===0).length*-3;
   results.push(g);
  }
 }
 const byInversion=[0,1,2].map(n=>results.filter(x=>x.inversion===n).sort((a,b)=>a.score-b.score).slice(0,4));
 return byInversion.flat();
}
export function arpeggioNotes(root='C',quality='maj7',startFret=1,endFret=5){
 const d=describeChord(root,quality);const low=Math.max(0,Math.min(17,Number(startFret)||0)),high=Math.min(22,Math.max(low,Number(endFret)||0));
 const tones=new Map(d.parts.map(p=>[p.pc,p]));const notes=[];
 for(let string=6;string>=1;string--)for(let fret=low;fret<=high;fret++){
  const midi=OPEN[6-string]+fret,part=tones.get(PC(midi));
  if(part)notes.push({string,fret,midi,tag:part.tag,note:part.name});
 }
 return notes.sort((a,b)=>a.midi-b.midi||b.string-a.string);
}
export const DROP_STRING_SETS={
 2:[{id:'6543',label:'6·5·4·3번 현',indices:[0,1,2,3]},{id:'5432',label:'5·4·3·2번 현',indices:[1,2,3,4]},{id:'4321',label:'4·3·2·1번 현',indices:[2,3,4,5]}],
 3:[{id:'6432',label:'6·4·3·2번 현',indices:[0,2,3,4]},{id:'5321',label:'5·3·2·1번 현',indices:[1,3,4,5]}]
};
export const DROP_QUALITIES=['maj7','m7','7','m7b5'];
// Invert a close-position 7th chord, drop 2nd- or 3rd-highest voice an octave,
// then retain only the exact voicings playable on the selected four guitar strings.
export function dropVoicings(root='C',quality='maj7',type=2,setId='4321'){
 if(!DROP_QUALITIES.includes(quality)||![2,3].includes(Number(type)))return [];
 const group=(DROP_STRING_SETS[Number(type)]||[]).find(s=>s.id===setId);
 if(!group)return [];
 const d=describeChord(root,quality),degrees=d.parts.map(x=>x.pc),rootPC=pitchClass(root);
 const relative=degrees.map(pc=>PC(pc-rootPC));
 const results=[];
 for(let inversion=0;inversion<4;inversion++){
  const close=relative.slice(inversion).concat(relative.slice(0,inversion).map(x=>x+12));
  // Close-position intervals are strictly increasing; handling the wrap explicitly.
  for(let i=1;i<close.length;i++)while(close[i]<=close[i-1])close[i]+=12;
  const lowered=[...close];lowered[type===2?2:1]-=12;lowered.sort((a,b)=>a-b);
  for(let trans=-24;trans<=48;trans+=12){
   const mids=lowered.map(x=>48+rootPC+x+trans);
   const fretted=mids.map((m,i)=>m-OPEN[group.indices[i]]);
   if(fretted.some(f=>f<0||f>20)||fretSpan(fretted)>5)continue;
   const frets=Array(6).fill(null);group.indices.forEach((i,n)=>frets[i]=fretted[n]);
   const inversionBass=d.parts.findIndex(p=>p.pc===PC(mids[0]));
   const label=['기본형','1전위','2전위','3전위'][inversionBass];
   const g=makeGrip(frets,d,'drop'+type,label,{inversion:inversionBass,setId,dropType:type});
   if(!g)continue;
   g.score=fretSpan(frets)*9+fretted.reduce((a,b)=>a+b,0)/4;
   results.push(g);
  }
 }
 const unique=new Map(results.map(g=>[g.frets.join('/'),g]));
 return [...unique.values()].sort((a,b)=>a.inversion-b.inversion||a.score-b.score);
}
export function fretWindowSVG({root='C',quality='maj7',startFret=1,endFret=5,grip=null,labels='degree'}={}){
 const d=describeChord(root,quality);const low=Math.max(0,Math.min(17,startFret)),high=Math.max(low+1,Math.min(22,endFret));
 const x0=56,xEnd=620,y0=33,ys=37,height=273;
 const distances=Array.from({length:high-low+2},(_,i)=>1-Math.pow(2,-(low+i)/12));
 const left=distances[0],right=distances[distances.length-1];const scale=x=>(x-left)/(right-left)*(xEnd-x0)+x0;
 const edges=distances.map(scale);const pcs=new Map(d.parts.map(p=>[p.pc,p]));
 let s=`<rect x="55" y="13" width="568" height="220" rx="11" fill="#423128" stroke="#7e6250" stroke-width="3"/>`;
 for(let f=0;f<edges.length;f++)s+=`<path d="M${edges[f]} 13V233" stroke="#ccd1d3" stroke-width="${f===0&&low===0?7:2.6}"/>`;
 for(let row=0;row<6;row++){
  const y=y0+ys*row;s+=`<line x1="56" y1="${y}" x2="620" y2="${y}" stroke="${row<3?'#e0d0bc':'#d5d7d9'}" stroke-width="${1+row*.3}"/>`;
  s+=`<text x="28" y="${y+4}" font-size="12" fill="var(--text)" text-anchor="middle">${['e','B','G','D','A','E'][row]}</text>`;
  for(let fret=low;fret<=high;fret++){
   const midi=OPEN[5-row]+fret,p=pcs.get(PC(midi));
   if(!p)continue;
   if(grip&&grip.frets[5-row]!==fret)continue;
   const x=(edges[fret-low]+edges[fret-low+1])/2,rootNote=p.tag==='1';
   const tag=labels==='note'?p.name:p.tag;
   s+=`<g data-action="play-midi" data-midi="${midi}" role="button" tabindex="0" aria-label="${6-row}번 현 ${fret}프렛 ${tag}" style="cursor:pointer"><circle cx="${x}" cy="${y}" r="18" fill="${rootNote?'#70dfc8':'#e2edf0'}" stroke="#192f37" stroke-width="2"/><text x="${x}" y="${y+4.5}" font-size="${tag.length>=3?10:12}" fill="#173039" text-anchor="middle" font-weight="800">${tag}</text></g>`;
  }
 }
 for(let fret=low;fret<=high;fret++)s+=`<text x="${(edges[fret-low]+edges[fret-low+1])/2}" y="258" font-size="13" fill="var(--muted)" text-anchor="middle">${fret}</text>`;
 return `<div class="theory-fret-scroll"><svg class="theory-fretboard" viewBox="0 0 640 ${height}" role="img" aria-label="${root} ${quality} ${low}~${high}프렛 기타 코드톤">${s}</svg></div>`;
}
export function gripDescription(grip){
 if(!grip)return '이 조건에서 표시할 수 있는 운지가 없습니다.';
 return grip.frets.map((f,i)=>`${6-i}현 ${f===null?'뮤트':f===0?'개방':f+'프렛'}`).join(' · ');
}
