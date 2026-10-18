// Music Lab Alpha 0.6 — Guitar literacy and movable chord library.
// The treble-8 clef sounds one octave BELOW the displayed pitch.
import {scaleOf,pitchClass,midiToFrequency,PC_NAMES} from './music.js';
export const STRINGS=[64,59,55,50,45,40]; // high e (1st) down to low E (6th)
const STR_LABEL=['e','B','G','D','A','E'];
const pc=n=>((n%12)+12)%12;
const mod=(a,b)=>((a%b)+b)%b;
export const SIGHT_KEYS=[{id:'C-major',label:'C Major',root:'C',mode:'major',sig:[]},{id:'G-major',label:'G Major',root:'G',mode:'major',sig:['F#']},{id:'D-major',label:'D Major',root:'D',mode:'major',sig:['F#','C#']},{id:'F-major',label:'F Major',root:'F',mode:'major',sig:['Bb']},{id:'A-minor',label:'A minor',root:'A',mode:'minor',sig:[]}];
export const keyById=(id)=>SIGHT_KEYS.find(k=>k.id===id)||SIGHT_KEYS[0];
export function placesForNote(midi,{position=0,maxFret=12}={}){
 const lo=position===0?0:position,hi=position===0?4:Math.min(12,position+4);
 return STRINGS.map((open,i)=>({string:i+1,fret:midi-open,midi})).filter(p=>p.fret>=lo&&p.fret<=hi&&p.fret<=maxFret);
}
const poolFor=(key,level,position)=>{
 const tones=new Set(scaleOf(key.root,key.mode).notes.map(pitchClass));
 const lo=position===0?0:position,hi=position===0?4:Math.min(12,position+4);
 const midis=new Set();
 STRINGS.forEach((open,s)=>{if(level===1&&s>3)return;
  for(let f=lo;f<=hi;f++){
   const m=open+f;
   if(m<48||m>82||!tones.has(pc(m)))continue;
   if(level===1 && (m<55||m>71))continue;
   midis.add(m);
  }
 });
 return [...midis].sort((a,b)=>a-b);
};
const choose=(arr,rng)=>arr[Math.min(arr.length-1,Math.floor(rng()*arr.length))];
export function generateGuitarSight({keyId='C-major',level=1,position=0,bars=2,rng=Math.random}={}){
 level=Math.max(1,Math.min(3,Number(level)||1));position=[0,5,9].includes(Number(position))?Number(position):0;
 bars=Math.max(1,Math.min(4,Number(bars)||2));
 const key=keyById(keyId);let pool=poolFor(key,level,position);if(!pool.length)pool=poolFor(key,3,position);
 const middle=pool[Math.floor(pool.length/2)];
 let last=middle;
 const events=[];
 for(let bar=0;bar<bars;bar++){
  const rhythm=level===1?[1,1,1,1]:level===2?choose([[1,.5,.5,1,1],[1,1,2],[2,1,1]],rng):choose([[.5,.5,1,1,1],[1,.5,.5,.5,.5,1],[1,1,2],[.5,.5,.5,.5,.5,.5,.5,.5]],rng);
  let beat=0;
  for(const duration of rhythm){
   let candidates=pool.filter(m=>Math.abs(m-last)<=(level===1?4:level===2?7:12));
   if(!candidates.length)candidates=pool;
   // Keep a reasonable melodic direction while permitting position changes.
   const midi=choose(candidates,rng);
   const options=placesForNote(midi,{position});
   const place=options.sort((a,b)=>Math.abs(a.fret-(position||2))-Math.abs(b.fret-(position||2))||a.string-b.string)[0];
   events.push({midi,bar,beat,duration,place:{...place}});last=midi;beat+=duration;
  }
 }
 return {keyId:key.id,key:key.label,level,position,bars,events};
}
const LET='CDEFGAB';
const NAT={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
function spelledFor(m,key){
 const natural=scaleOf(key.root,key.mode).notes;
 const best=natural.find(n=>pc(pitchClass(n))===pc(m));
 return best||PC_NAMES[pc(m)];
}
export function staffY(soundingMidi,keyId='C-major'){
 const key=keyById(keyId),w=soundingMidi+12;const oct=Math.floor(w/12)-1,name=spelledFor(soundingMidi,key);
 const diatonicIndex=oct*7+LET.indexOf(name[0]);
 return 140-(diatonicIndex-(4*7+2))*6; // written E4 = staff bottom line.
}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const staffLine=y=>`<line x1="8" x2="${440}" y1="${y}" y2="${y}" stroke="var(--staff-stroke,#8896a7)" stroke-width="1.3"/>`;
export function sightStaffSVG(exercise,{active=-1,reveal=false}={}){
 if(!exercise)return '';
 const key=keyById(exercise.keyId),width=460*exercise.bars;
 let svg='';
 for(let bar=0;bar<exercise.bars;bar++){
  const base=bar*460;
  svg+=`<rect x="${base+1}" y="54" width="458" height="160" rx="11" fill="var(--staff-surface,#182030)"/>`;
  svg+=`<g transform="translate(${base+4},0)">${[92,104,116,128,140].map(staffLine).join('')}</g>`;
  const first=bar===0;
  if(first){svg+=`<image href="./assets/treble-clef.svg" x="${base+9}" y="75" width="47" height="91"/><text x="${base+31}" y="165" text-anchor="middle" font-size="15" font-weight="800" fill="var(--staff-note,#e0eef3)">8</text>`;
   const keySigY={'F#':92,'C#':110,'Bb':116};key.sig.forEach((a,i)=>{svg+=`<text x="${base+62+i*15}" y="${keySigY[a]+7}" fill="var(--staff-note,#e0eef3)" font-size="22" font-family="serif">${a.includes('#')?'♯':'♭'}</text>`});
   const ix=base+70+key.sig.length*15;svg+=`<text x="${ix}" y="118" fill="var(--staff-note,#e0eef3)" font-size="20" font-weight="700">4</text><text x="${ix}" y="139" fill="var(--staff-note,#e0eef3)" font-size="20" font-weight="700">4</text>`;
  }else svg+=`<text x="${base+18}" y="77" fill="var(--staff-caption,#99a9bb)" font-size="12">${bar+1}마디</text>`;
  const margin=first?112:51;
  const span=first?320:375;
  exercise.events.forEach((e,index)=>{
   if(e.bar!==bar)return;
   const x=base+margin+(e.beat+.5*e.duration)*span/4,y=staffY(e.midi,exercise.keyId);
   let ledger='';if(y>=152)for(let ly=152;ly<=y+1;ly+=12)ledger+=`<line x1="${x-15}" x2="${x+16}" y1="${ly}" y2="${ly}" stroke="var(--staff-stroke,#8896a7)" stroke-width="1.25"/>`;
   if(y<=80)for(let ly=80;ly>=y-1;ly-=12)ledger+=`<line x1="${x-15}" x2="${x+16}" y1="${ly}" y2="${ly}" stroke="var(--staff-stroke,#8896a7)" stroke-width="1.25"/>`;
   const color=index===active?'var(--accent,#6bd9c9)':'var(--staff-note,#e6edf1)';
   svg+=ledger;
   svg+=`<ellipse cx="${x}" cy="${y}" rx="10.3" ry="6.8" transform="rotate(-17 ${x} ${y})" fill="${e.duration===2?'none':color}" stroke="${color}" stroke-width="2.1"/>`;
   // Stem and flag for isolated eighth note (rhythm grouped by beat visually via flags).
   svg+=`<line x1="${x+9.5}" y1="${y}" x2="${x+9.5}" y2="${y-36}" stroke="${color}" stroke-width="2.2"/>`;
   if(e.duration===.5)svg+=`<path d="M${x+9.5},${y-36} Q${x+32},${y-27} ${x+21},${y-12}" stroke="${color}" stroke-width="2.2" fill="none"/>`;
   if(reveal)svg+=`<text x="${x}" y="194" text-anchor="middle" fill="${color}" font-size="12">${esc(midiName(e.midi))}</text>`;
  });
  svg+=`<line x1="${base+440}" x2="${base+440}" y1="92" y2="140" stroke="var(--staff-stroke,#8896a7)" stroke-width="2"/>`;
 }
 return `<div class="sight-score-scroll"><svg class="sight-svg" style="min-width:${width}px" viewBox="0 0 ${width} 225" role="img" aria-label="기타 높은음자리표 옥타브 내림 표기 악보, ${exercise.bars}마디">${svg}</svg></div>`;
}
export function midiName(m){return PC_NAMES[pc(m)]+(Math.floor(m/12)-1)}
export function sightTabSVG(exercise,{active=-1}={}){
 if(!exercise)return '';
 const width=460*exercise.bars;let body='';
 for(let bar=0;bar<exercise.bars;bar++){
  const base=bar*460,margin=bar===0?112:51,span=bar===0?320:375;
  for(let i=0;i<6;i++)body+=`<line x1="${base+14}" x2="${base+441}" y1="${33+i*25}" y2="${33+i*25}" stroke="var(--staff-stroke,#778699)" stroke-width="1.25"/>`;
  exercise.events.forEach((e,index)=>{if(e.bar!==bar)return;const x=base+margin+(e.beat+e.duration*.5)*span/4,y=33+(e.place.string-1)*25;
   body+=`<rect x="${x-12}" y="${y-10}" width="24" height="19" rx="3" fill="var(--staff-surface,#182030)"/><text x="${x}" y="${y+5}" text-anchor="middle" fill="${index===active?'var(--accent,#6bd9c9)':'var(--staff-note,#e6edf1)'}" font-size="14" font-weight="700">${e.place.fret}</text>`;
  });
  body+=`<line x1="${base+441}" y1="33" x2="${base+441}" y2="158" stroke="var(--staff-stroke,#778699)"/>`;
 }
 return `<div class="sight-score-scroll"><svg class="sight-svg" style="min-width:${width}px" viewBox="0 0 ${width} 183" role="img" aria-label="권장 기타 타브악보">${body}</svg></div>`;
}
export function fretInput({position=0,selected=-1}={}){
 const lo=position===0?0:position,hi=position===0?4:Math.min(12,position+4);
 let html=`<div class="guitar-answer-scroll"><div class="guitar-answer-board" style="--answer-cols:${hi-lo+2}"><div class="guitar-answer-head"><span>현</span>${Array.from({length:hi-lo+1},(_,i)=>`<span>${i+lo===0?'개방':i+lo}</span>`).join('')}</div>`;
 STRINGS.forEach((open,i)=>{html+=`<div class="guitar-answer-row"><b>${STR_LABEL[i]}${i===0?' (1)':''}${i===5?' (6)':''}</b>`;
 for(let fret=lo;fret<=hi;fret++){const m=open+fret;html+=`<button type="button" class="guitar-answer-fret ${selected===m?'selected':''}" data-action="guitar-sight-answer" data-midi="${m}" aria-label="${i+1}번 줄 ${fret}프렛 ${midiName(m)}" title="${midiName(m)}">${midiName(m)}</button>`;}
 html+='</div>';});return html+'</div></div>';
}
// Choose R6 (6th-string root) and R5 (5th-string root) movable grips.
// Arranged from low E string to high e string; null = muted.
const SHAPES={
 'M':{R6:[0,null,2,1,0,null],R5:[null,0,2,2,2,null]},
 'm':{R6:[0,null,2,0,0,null],R5:[null,0,2,2,1,null]},
 '7':{R6:[0,null,0,1,0,null],R5:[null,0,2,0,2,null]},
 'M7':{R6:[0,null,1,1,0,null],R5:[null,0,2,1,2,null]},
 'm7':{R6:[0,null,0,0,0,null],R5:[null,0,2,0,1,null]},
 'm7b5':{R6:[0,null,0,0,-1,null],R5:[null,0,1,0,1,null]},
 'dim7':{R6:[0,null,-1,0,-1,null],R5:[null,0,1,-1,1,null]},
 'sus4':{R6:[0,null,2,2,0,null],R5:[null,0,2,2,3,null]},
 '7sus4':{R6:[0,null,0,2,0,null],R5:[null,0,2,0,3,null]},
 '6':{R6:[0,2,2,1,2,null],R5:[null,0,2,-1,2,null]},
 'm6':{R6:[0,2,2,0,2,null],R5:[null,0,2,-1,1,null]},
 'mM7':{R6:[0,null,1,0,0,null],R5:[null,0,2,1,1,null]},
};
export const CHORD_QUALITIES=Object.keys(SHAPES);
const intervalsByQuality={M:[0,4,7],m:[0,3,7],7:[0,4,7,10],M7:[0,4,7,11],m7:[0,3,7,10],m7b5:[0,3,6,10],dim7:[0,3,6,9],sus4:[0,5,7],'7sus4':[0,5,7,10],6:[0,4,7,9],m6:[0,3,7,9],mM7:[0,3,7,11]};
export function chooseChord({root='C',quality='m7',rootString='R6',rng=Math.random}={}){
 quality=SHAPES[quality]?quality:'m7';rootString=rootString==='R5'?'R5':'R6';
 const open=rootString==='R6'?40:45;
 const pcs=pc(pitchClass(root));const candidates=Array.from({length:12},(_,i)=>i+1).filter(f=>pc(open+f)===pcs&&f>=2&&f<=9);
 // On some roots a movable chord requires a fret outside 2–9; allow 1–11.
 const extended=Array.from({length:12},(_,i)=>i+1).filter(f=>pc(open+f)===pcs);
 const fret=choose(candidates.length?candidates:extended,rng);
 const positions=SHAPES[quality][rootString].map(v=>v===null?null:fret+v);
 return {root,rootString,quality,name:root+(quality==='M'?'':quality),fret,positions};
}
export function chordPitches(grip){return grip.positions.map((f,i)=>f===null?null:[40,45,50,55,59,64][i]+f).filter(m=>m!==null);}
export function chordPitchClassesValid(grip){const expected=new Set(intervalsByQuality[grip.quality].map(i=>pc(pitchClass(grip.root)+i)));
 const actual=new Set(chordPitches(grip).map(pc));return actual.size===expected.size&&[...expected].every(x=>actual.has(x));}
export function chordDiagram(grip){const p=grip.positions;const played=p.filter(x=>x!==null);const lowest=Math.max(1,Math.min(...played));const start=lowest>4?lowest:1;const end=start+4;let s='';
 for(let i=0;i<6;i++){const x=48+i*48;s+=`<line x1="${x}" y1="47" x2="${x}" y2="221" stroke="var(--staff-stroke,#94a9b7)" stroke-width="2"/>`;
  const fret=p[i];if(fret===null){s+=`<text x="${x}" y="37" text-anchor="middle" fill="var(--muted,#9cabb5)" font-size="14">×</text>`}else if(fret===0){s+=`<circle cx="${x}" cy="30" r="6" stroke="var(--staff-note,#e6edf1)" fill="none" stroke-width="2"/>`}else if(fret<start||fret>end){s+=`<text x="${x}" y="37" text-anchor="middle" fill="var(--accent,#6bd9c9)" font-size="12">${fret}</text>`}else{s+=`<circle cx="${x}" cy="${47+(fret-start+.5)*35}" r="11" fill="var(--accent,#6bd9c9)"/><text x="${x}" y="${52+(fret-start+.5)*35}" text-anchor="middle" font-size="11" fill="var(--bg,#121922)" font-weight="800">${fret}</text>`;}
 }
 for(let f=0;f<=5;f++)s+=`<line x1="48" x2="288" y1="${47+35*f}" y2="${47+35*f}" stroke="var(--staff-stroke,#94a9b7)" stroke-width="${f===0&&start===1?4:1.3}"/>`;
 return `<svg class="guitar-chord-diagram" viewBox="0 0 342 265" role="img" aria-label="${esc(grip.name)} ${grip.rootString} 기타 코드폼"><text x="21" y="80" font-size="12" fill="var(--muted,#a0acb9)">${start}fr</text>${s}<text x="171" y="254" text-anchor="middle" fill="var(--staff-caption,#a0afbd)" font-size="12">낮은 E · A · D · G · B · 높은 e</text></svg>`;
}
export function randomMovableChord({rootString='R6',quality='all',rng=Math.random}={}){
 const q=quality==='all'?choose(CHORD_QUALITIES,rng):quality;
 const root=choose(['C','D','E','F','G','A','Bb','B','Eb','F#','Ab'],rng);
 return chooseChord({root,quality:q,rootString,rng});
}
