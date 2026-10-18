// Music Lab Alpha 0.7 • Guitar chord explorer & true-scale fretboard
// Standard tuning E2 A2 D3 G3 B3 E4; positions are [string 6, ..., string 1].
import {pitchClass,PC_NAMES,INTERVALS} from './music.js';
const PC=n=>(n%12+12)%12;
const OPEN_LOW=[40,45,50,55,59,64];
const OPEN_HIGH=[64,59,55,50,45,40];
const LETTERS='CDEFGAB', NAT={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const Q=(label,parts,essential,category)=>({label,parts:parts.split(' '),essential:essential.split(' '),category});
export const CHORD_TYPES={
 '':Q('메이저','1 3 5','1 3 5','기본'),
 'm':Q('마이너','1 b3 5','1 b3 5','기본'),
 'aug':Q('어그먼트','1 3 #5','1 3 #5','기본'),
 'dim':Q('디미니시드','1 b3 b5','1 b3 b5','기본'),
 'sus2':Q('서스펜디드 2','1 2 5','1 2 5','Sus / Add'),
 'sus4':Q('서스펜디드 4','1 4 5','1 4 5','Sus / Add'),
 '5':Q('파워 코드','1 5','1 5','기본'),
 '6':Q('식스','1 3 5 6','1 3 6','6th'),
 'm6':Q('마이너 식스','1 b3 5 6','1 b3 6','6th'),
 '6/9':Q('식스 나인','1 3 5 6 9','1 3 6 9','6th'),
 'm6/9':Q('마이너 식스 나인','1 b3 5 6 9','1 b3 6 9','6th'),
 'add9':Q('애드 나인','1 3 5 9','1 3 5 9','Sus / Add'),
 'madd9':Q('마이너 애드 나인','1 b3 5 9','1 b3 5 9','Sus / Add'),
 'add11':Q('애드 일레븐','1 3 5 11','1 3 5 11','Sus / Add'),
 '7':Q('도미넌트 7','1 3 5 b7','1 3 b7','7th'),
 'maj7':Q('메이저 7','1 3 5 7','1 3 7','7th'),
 'm7':Q('마이너 7','1 b3 5 b7','1 b3 b7','7th'),
 'mMaj7':Q('마이너 메이저 7','1 b3 5 7','1 b3 7','7th'),
 'm7b5':Q('하프 디미니시드','1 b3 b5 b7','1 b3 b5 b7','7th'),
 'dim7':Q('디미니시드 7','1 b3 b5 bb7','1 b3 b5 bb7','7th'),
 'aug7':Q('어그먼티드 7','1 3 #5 b7','1 3 #5 b7','7th'),
 'maj7#5':Q('메이저 7 샵5','1 3 #5 7','1 3 #5 7','7th'),
 '7sus4':Q('세븐 서스4','1 4 5 b7','1 4 b7','Sus / Add'),
 '7sus2':Q('세븐 서스2','1 2 5 b7','1 2 b7','Sus / Add'),
 '9':Q('도미넌트 9','1 3 5 b7 9','1 3 b7 9','9 / 11 / 13'),
 'maj9':Q('메이저 9','1 3 5 7 9','1 3 7 9','9 / 11 / 13'),
 'm9':Q('마이너 9','1 b3 5 b7 9','1 b3 b7 9','9 / 11 / 13'),
 '11':Q('도미넌트 11','1 3 5 b7 9 11','1 b7 9 11','9 / 11 / 13'),
 'm11':Q('마이너 11','1 b3 5 b7 9 11','1 b3 b7 11','9 / 11 / 13'),
 '13':Q('도미넌트 13','1 3 5 b7 9 13','1 3 b7 13','9 / 11 / 13'),
 'maj13':Q('메이저 13','1 3 5 7 9 13','1 3 7 13','9 / 11 / 13'),
 'm13':Q('마이너 13','1 b3 5 b7 9 11 13','1 b3 b7 13','9 / 11 / 13'),
 '7b5':Q('세븐 플랫5','1 3 b5 b7','1 3 b5 b7','Altered'),
 '7#5':Q('세븐 샵5','1 3 #5 b7','1 3 #5 b7','Altered'),
 '7b9':Q('세븐 플랫9','1 3 5 b7 b9','1 3 b7 b9','Altered'),
 '7#9':Q('세븐 샵9','1 3 5 b7 #9','1 3 b7 #9','Altered'),
 '7#11':Q('세븐 샵11','1 3 5 b7 9 #11','1 3 b7 #11','Altered'),
 '7b13':Q('세븐 플랫13','1 3 5 b7 b13','1 3 b7 b13','Altered'),
 '7b9#11':Q('세븐 플랫9 샵11','1 3 b7 b9 #11','1 3 b7 b9 #11','Altered'),
 '7b9b13':Q('세븐 플랫9 플랫13','1 3 b7 b9 b13','1 3 b7 b9 b13','Altered'),
};
export const ROOT_CHOICES=['C','C#','Db','D','D#','Eb','E','F','F#','Gb','G','G#','Ab','A','A#','Bb','B'];
export const QUALITY_GROUPS=['기본','7th','Sus / Add','6th','9 / 11 / 13','Altered'];
const SEMI={'1':0,'b2':1,'2':2,'#2':3,'b3':3,'3':4,'4':5,'11':5,'#11':6,'b5':6,'#4':6,'5':7,'#5':8,'b6':8,'6':9,'bb7':9,'b7':10,'7':11,'b9':13,'9':14,'#9':15,'b11':16,'b13':20,'13':21};
function spell(root,tag){
 const degree=Number(tag.replace(/^[b#]+/,'')),step=(degree-1)%7;
 const letter=LETTERS[(LETTERS.indexOf(root[0])+step)%7];
 const pc=PC(pitchClass(root)+SEMI[tag]),delta=PC(pc-NAT[letter]+6)-6;
 return letter+(delta===-2?'bb':delta===2?'##':delta===-1?'b':delta===1?'#':'');
}
export function describeChord(root='C',quality='m7',bass=''){
 const q=CHORD_TYPES[quality]||CHORD_TYPES.m7;
 const parts=q.parts.map(tag=>({tag,pc:PC(pitchClass(root)+SEMI[tag]),name:spell(root,tag)}));
 const format={maj7:'M7',maj9:'M9',maj13:'M13',mMaj7:'mM7',m7b5:'m7♭5','maj7#5':'M7(#5)', '7b9#11':'7(b9,#11)','7b9b13':'7(b9,b13)'};
 const printed=format[quality]||(quality.startsWith('7')&&/[#b]/.test(quality.slice(1))?'7('+quality.slice(1)+')':quality);
 return {root,quality,bass,name:root+printed+(bass?'/'+bass:''),q,parts,required:new Set(q.essential.map(tag=>PC(pitchClass(root)+SEMI[tag])))};
}
const ALIAS={M:'',maj:'',major:'',min:'m',minor:'m',M7:'maj7',Maj7:'maj7','△7':'maj7','Δ7':'maj7',M9:'maj9','△9':'maj9',M13:'maj13','△13':'maj13','ø7':'m7b5','ø':'m7b5','m7(b5)':'m7b5','m7♭5':'m7b5','°7':'dim7','7sus':'7sus4','7(#5)':'7#5','7(b5)':'7b5','7(b9)':'7b9','7(#9)':'7#9','7(#11)':'7#11','7(b13)':'7b13','7(b9,#11)':'7b9#11','7(b9,b13)':'7b9b13','7sus2':'7sus2','m7♭5':'m7b5','mM7':'mMaj7','m(maj7)':'mMaj7',add2:'add9'};
export function parseChord(text){
 const cleaned=String(text??'').replace(/\s/g,'').replaceAll('♭','b').replaceAll('♯','#');
 const match=cleaned.match(/^([A-Ga-g][#b]?)([^/]*(?:\/[69])?)(?:\/([A-Ga-g][#b]?))?$/);
 if(!match)return null;
 const root=match[1][0].toUpperCase()+match[1].slice(1),name=match[2]||'',bass=match[3]?match[3][0].toUpperCase()+match[3].slice(1):'';
 const quality=Object.prototype.hasOwnProperty.call(ALIAS,name)?ALIAS[name]:name;
 if(!Object.hasOwn(CHORD_TYPES,quality))return null;
 return describeChord(root,quality,bass);
}
const pitchSet=grip=>new Set(grip.frets.map((f,i)=>f===null?null:PC(OPEN_LOW[i]+f)).filter(x=>x!==null));
const scoreGrip=g=>{
 const positions=g.frets.filter(f=>f!==null&&f>0),span=positions.length?Math.max(...positions)-Math.min(...positions):0;
 const count=g.frets.filter(f=>f!==null).length;
 const gaps=g.frets.slice(g.base+1).filter(f=>f===null).length;
 const open=g.frets.filter(f=>f===0).length;
 return span*9+gaps*6+Math.max(0,count-4)*2+(g.rootFret*.75)-open*3+(g.missing.length*4);
};
// Familiar E/A/D movable shapes are prioritized over speculative search results.
// Finger numbers are shown only for these curated grip templates (1=index through 4=pinky).
const REFERENCE_SHAPES={
 R6:{
  '':{offsets:[0,2,2,1,0,0],fingers:[1,3,4,2,1,1]},
  'm':{offsets:[0,2,2,0,0,0],fingers:[1,3,4,1,1,1]},
  '7':{offsets:[0,2,0,1,0,0],fingers:[1,3,1,2,1,1]},
  'maj7':{offsets:[0,2,1,1,0,0],fingers:[1,4,2,3,1,1]},
  'm7':{offsets:[0,2,0,0,0,0],fingers:[1,3,1,1,1,1]},
 },
 R5:{
  '':{offsets:[null,0,2,2,2,0],fingers:[null,1,3,3,3,1]},
  'm':{offsets:[null,0,2,2,1,0],fingers:[null,1,3,4,2,1]},
  '7':{offsets:[null,0,2,0,2,0],fingers:[null,1,3,1,4,1]},
  'maj7':{offsets:[null,0,2,1,2,0],fingers:[null,1,3,2,4,1]},
  'm7':{offsets:[null,0,2,0,1,0],fingers:[null,1,3,1,2,1]},
 },
 R4:{
  '':{offsets:[null,null,0,2,3,2],fingers:[null,null,1,2,4,3]},
  'm':{offsets:[null,null,0,2,3,1],fingers:[null,null,1,3,4,2]},
  '7':{offsets:[null,null,0,2,1,2],fingers:[null,null,1,3,2,4]},
  'maj7':{offsets:[null,null,0,2,2,2],fingers:[null,null,1,3,3,3]},
  'm7':{offsets:[null,null,0,2,1,1],fingers:[null,null,1,3,2,2]},
 },
};
export function standardGrip(chord,rootString='R6',maxFret=18){
 const d=typeof chord==='string'?parseChord(chord):chord;
 if(!d||d.bass||!REFERENCE_SHAPES[rootString]?.[d.quality])return null;
 const base={R6:0,R5:1,R4:2}[rootString];const model=REFERENCE_SHAPES[rootString][d.quality];
 for(let fret=0;fret<=maxFret;fret++){
  if(PC(OPEN_LOW[base]+fret)!==pitchClass(d.root))continue;
  const frets=model.offsets.map(n=>n===null?null:fret+n);
  if(Math.max(...frets.filter(x=>x!==null))>22)continue;
  const grip={frets,base,rootString,rootFret:fret,missing:[],fingers:fret===0?model.fingers.map((v,i)=>frets[i]===0?0:v):[...model.fingers],barre:fret>0?{fret,from:6-base,to:1}:null,verifiedDiagram:true,score:-20+fret*.3};
  if(validateGrip(grip,d))return grip;
 }
 return null;
}
export function voicingsFor(chord,{rootString='all',maxResults=15,maxFret=18}={}){
 const d=typeof chord==='string'?parseChord(chord):chord;if(!d)return [];
 const bassRoot=PC(pitchClass(d.bass||d.root)),target=new Set([...d.parts.map(p=>p.pc),bassRoot]);
 const bases=rootString==='all'?[0,1,2]:rootString==='R6'?[0]:rootString==='R5'?[1]:[2];
 const results=[];
 for(const base of bases){
  const bassOpen=OPEN_LOW[base];
  for(let rootFret=0;rootFret<=maxFret;rootFret++){
   if(PC(bassOpen+rootFret)!==bassRoot)continue;
   const minF=Math.max(0,rootFret-2),upper=Math.min(21,Math.max(4,rootFret+4));
   const possibilities=OPEN_LOW.map((open,i)=>{
    if(i<base)return [null];
    if(i===base)return [rootFret];
    const frets=[null];for(let f=minF;f<=upper;f++)if(target.has(PC(open+f)))frets.push(f);
    return frets;
   });
   function rec(i,frets){
    if(i===6){
     const played=frets.filter(f=>f!==null),count=played.length;if(count<3||count>5)return;
     const touched=frets.filter(f=>f!==null&&f>0);if(touched.length&&Math.max(...touched)-Math.min(...touched)>4)return;
     // Bass string specified; avoid disconnected grips by penalizing gaps.
     const pcs=pitchSet({frets});if([...d.required].some(p=>!pcs.has(p)))return;
     const omitted=d.parts.filter(p=>!pcs.has(p.pc)).map(p=>p.tag);
     const g={frets:[...frets],rootString:'R'+(6-base),rootFret,base,missing:omitted};
     g.score=scoreGrip(g);
     results.push(g);return;
    }
    for(const f of possibilities[i]){frets.push(f);rec(i+1,frets);frets.pop();}
   }
   rec(0,[]);
  }
 }
 const standard=(rootString==='all'?['R6','R5','R4']:[rootString]).map(x=>standardGrip(d,x,maxFret)).filter(Boolean);
 const dedup=new Map();for(const g of [...standard,...results]){const id=g.frets.join(',');const x=dedup.get(id);if(!x||g.score<x.score)dedup.set(id,g);}
 const ranked=[...dedup.values()].sort((a,b)=>a.score-b.score||a.rootFret-b.rootFret);
 if(rootString!=='all')return ranked.slice(0,maxResults);
 // A comparison library should show different bass-string roots, not twelve small variations of one grip.
 const diverse=[];const seen=new Set();
 for(const r of ['R6','R5','R4'])for(const item of ranked.filter(x=>x.rootString===r).slice(0,2)){
  const key=item.frets.join('/');if(!seen.has(key)){diverse.push(item);seen.add(key);}
 }
 for(const item of ranked){if(diverse.length>=maxResults)break;const key=item.frets.join('/');if(!seen.has(key)&&diverse.filter(x=>x.rootString===item.rootString).length<Math.ceil(maxResults/3)+1){diverse.push(item);seen.add(key);}}
 return diverse.slice(0,maxResults);
}
export function gripMidis(grip){return grip.frets.flatMap((f,i)=>f===null?[]:[OPEN_LOW[i]+f]);}
export function validateGrip(grip,chord){const d=typeof chord==='string'?parseChord(chord):chord;if(!grip||!d)return false;const s=pitchSet(grip);return [...d.required].every(p=>s.has(p))&&grip.frets.every((f,i)=>f===null||(Number.isInteger(f)&&f>=0&&f<=22))&&gripMidis(grip)[0]%12===pitchClass(d.bass||d.root);}
export function chordDiagramSVG(grip,chord){
 if(!grip)return '';
 const x0=48,dx=36,step=36,y0=66;
 const used=grip.frets.filter(x=>x!==null&&x>0);
 const first=used.length?Math.max(1,Math.min(...used)):1;
 const rows=Math.max(4,used.length?Math.max(...used)-first+1:4);
 const bottom=y0+rows*step,height=bottom+58;
 let svg=`<rect width="280" height="${height}" rx="15" fill="var(--card2)"/>`;
 for(let i=0;i<6;i++){
  const x=x0+i*dx;
  svg+=`<line x1="${x}" y1="${y0}" x2="${x}" y2="${bottom}" stroke="${i<3?'#af9a82':'#d5d4d2'}" stroke-width="${2.9-i*.3}"/>`;
  svg+=`<text x="${x}" y="21" text-anchor="middle" fill="var(--muted)" font-size="12" font-weight="800">${6-i}</text>`;
 }
 for(let i=0;i<=rows;i++){
  const y=y0+i*step;
  svg+=`<line x1="${x0}" x2="${x0+5*dx}" y1="${y}" y2="${y}" stroke="#aab7be" stroke-width="${i===0&&first===1?5:2}"/>`;
 }
 svg+=`<text x="18" y="${y0+23}" fill="var(--muted)" font-size="13" font-weight="800">${first}fr</text>`;
 for(let i=0;i<6;i++){
  const x=x0+i*dx,f=grip.frets[i];
  if(f===null){svg+=`<text x="${x}" y="47" text-anchor="middle" font-size="22" font-weight="700" fill="var(--muted)">×</text>`;continue;}
  if(f===0){svg+=`<circle cx="${x}" cy="40" r="8" fill="none" stroke="var(--staff-note)" stroke-width="2.5"/>`;continue;}
  const y=y0+(f-first+.5)*step,mid=OPEN_LOW[i]+f,root=PC(mid)===pitchClass(chord.root);
  const label=chord.parts.find(p=>p.pc===PC(mid))?.tag||'B';
  const finger=grip.verifiedDiagram&&grip.fingers?.[i]>0?String(grip.fingers[i]):label;
  svg+=`<circle cx="${x}" cy="${y}" r="16" fill="${root?'#72dbc7':'#e1eaf1'}" stroke="#162934" stroke-width="2"/><text x="${x}" y="${y+5}" font-size="${String(finger).length>2?10:13}" text-anchor="middle" fill="#102633" font-weight="800">${esc(finger)}</text>`;
 }
 svg+=`<text x="140" y="${bottom+30}" fill="var(--muted)" text-anchor="middle" font-size="12">${grip.verifiedDiagram?'숫자 = 손가락 번호':'숫자 = 코드톤 · b = 플랫'}</text>`;
 return `<svg class="lib-diagram" viewBox="0 0 280 ${height}" role="img" aria-label="${esc(chord.name)} 기타 코드 운지, ${esc(grip.rootString)} ${grip.rootFret}프렛">${svg}</svg>`;
}
export function realisticFretboard({root='C',intervals=INTERVALS.major,show='scale',chord=null,grip=null,maxFret=22}={}){
 // Exact 12-TET fret spacing based on Fender's 25.5" scale, uniformly projected.
 const x0=77,L=1600,height=287,y0=39,yStep=39,raw=f=>x0+L*(1-Math.pow(2,-f/12));
 const pcRoot=pitchClass(root),scalePcs=new Set(intervals.map(i=>PC(pcRoot+i))),chordPcs=new Set(chord?.parts.map(x=>x.pc)||[]);
 const xs=Array.from({length:maxFret+2},(_,f)=>raw(f)),fullWidth=xs[maxFret]+40;
 let svg=`<defs><linearGradient id="wood07" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#533b2c"/><stop offset=".32" stop-color="#2d201d"/><stop offset=".7" stop-color="#4a3025"/><stop offset="1" stop-color="#261d18"/></linearGradient><linearGradient id="metal07" x1="0" x2="1"><stop stop-color="#6c7780"/><stop offset=".5" stop-color="#f3f5f2"/><stop offset="1" stop-color="#7b8891"/></linearGradient></defs>`;
 svg+=`<rect x="${x0}" y="22" width="${fullWidth-x0}" height="245" rx="11" fill="url(#wood07)" stroke="#5d473b" stroke-width="4"/>`;
 for(let i=0;i<19;i++){const y=30+i*12;svg+=`<path d="M${x0} ${y} Q${fullWidth*.56} ${y+2*(i%3)} ${fullWidth} ${y+((i*7)%8-4)}" stroke="${i%3?'#805d49':'#a57b5a'}" stroke-opacity="${i%3?.16:.11}" fill="none" stroke-width="${i%3?1:2}"/>`;}
 for(let f=0;f<=maxFret;f++){
  const x=xs[f];svg+=`<line x1="${x}" x2="${x}" y1="22" y2="267" stroke="${f===0?'#f4e7d3':'url(#metal07)'}" stroke-width="${f===0?10:3.2}"/>`;
  if(f>0){const mid=(xs[f-1]+xs[f])/2;if([3,5,7,9,12,15,17,19,21].includes(f)){
   const rr=f===12?5:4.2;
   if(f===12)svg+=`<circle cx="${mid}" cy="${y0+yStep*1.4}" r="${rr}" fill="#d8c9a7" opacity=".7"/><circle cx="${mid}" cy="${y0+yStep*3.6}" r="${rr}" fill="#d8c9a7" opacity=".7"/>`;
   else svg+=`<circle cx="${mid}" cy="${y0+yStep*2.5}" r="${rr}" fill="#d8c9a7" opacity=".65"/>`;
  }}
 }
 for(let i=0;i<6;i++){const y=y0+i*yStep;svg+=`<path d="M${x0} ${y}H${fullWidth}" stroke="${i>2?'#b7bbc0':'#d5c3a9'}" stroke-width="${1.1+i*.36}" opacity=".88"/><text x="${x0-24}" y="${y+5}" text-anchor="middle" fill="var(--text)" font-size="12" font-weight="700">${['e','B','G','D','A','E'][i]}</text>`;}
 const selectedPcs=new Set(show==='all'?Array.from({length:12},(_,i)=>i):show==='chord'?chordPcs:scalePcs);
 for(let i=0;i<6;i++)for(let f=0;f<=maxFret;f++){
  const midi=OPEN_HIGH[i]+f,p=PC(midi);if(!selectedPcs.has(p))continue;
  const x=f===0?x0-1:(xs[f-1]+xs[f])/2, y=y0+i*yStep;
  const isRoot=p===pitchClass(chord?.root||root),inGrip=grip&&grip.frets[5-i]===f;
  const r=inGrip?14:11;let label=PC_NAMES[p];
  if(chord){label=chord.parts.find(n=>n.pc===p)?.tag||label;}
  svg+=`<g data-action="play-midi" data-midi="${midi}" role="button" aria-label="${i+1}번 줄 ${f}프렛 ${esc(label)}" tabindex="0" style="cursor:pointer"><circle cx="${x}" cy="${y}" r="${r+3}" fill="transparent"/><circle cx="${x}" cy="${y}" r="${r}" fill="${isRoot?'#66dec5':inGrip?'#ffc87c':'#dce6ed'}" stroke="${inGrip?'#ffc87c':'#192530'}" stroke-width="${inGrip?3:1.6}"/><text x="${x}" y="${y+4}" text-anchor="middle" fill="#102329" font-size="${label.length>2?9:11}" font-weight="800">${esc(label)}</text></g>`;
 }
 const scaleText=show==='chord'?chord?.name:`${root} scale`;
 return `<div class="real-fret-scroll" aria-label="실제 프렛 간격 비율을 반영한 22프렛 기타 지판"><svg class="real-fret" viewBox="0 0 ${fullWidth} ${height}" style="min-width:${Math.ceil(fullWidth)}px" role="img" aria-label="6현 기타 지판, ${esc(scaleText)}">${svg}<g fill="var(--muted)" font-size="13" text-anchor="middle">${[0,1,3,5,7,9,12,15,17,19,21,22].map(f=>`<text x="${f===0?x0:(xs[f-1]+xs[f])/2}" y="285">${f}</text>`).join('')}</g></svg></div>`;
}
