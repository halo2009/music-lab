// Music Lab Alpha 0.8 — practical progression planner.
import {parseChord,voicingsFor,gripMidis,validateGrip} from './chord-library.js';
export const PROGRESSION_PRESETS=[
 {id:'pop',label:'Pop · I–V–vi–IV',text:'C G Am F'},
 {id:'jazz',label:'Jazz · ii–V–I–VI',text:'Dm7 G7 CM7 A7'},
 {id:'rnb',label:'R&B · 9th 보이싱',text:'F#m9 B13 EM9 C#m7'},
 {id:'blues',label:'Blues · Dominant 7th',text:'E7 A7 B7 E7'},
];
export function parseProgression(input){
 const tokens=String(input||'').replace(/[→,|]+/g,' ').trim().split(/\s+/).filter(Boolean);
 if(!tokens.length||tokens.length>8)throw new Error('코드를 1~8개 입력하세요. 예: F#m7 B7 EM7 C#m7');
 const parsed=tokens.map(x=>parseChord(x));
 if(parsed.some(x=>!x))throw new Error('지원하지 않는 코드가 있어요. 공백으로 구분해 입력해 주세요.');
 return parsed;
}
export function gripDistance(a,b){
 if(!a||!b)return 0;
 const center=g=>{const used=g.frets.filter(x=>x!==null&&x>0);return used.length?used.reduce((x,y)=>x+y,0)/used.length:g.rootFret;};
 // Prefer closely placed hands and common sounding voices; do not claim biomechanical certainty.
 const horizontal=Math.abs(center(a)-center(b));
 const ma=gripMidis(a),mb=gripMidis(b);
 const cross=Math.abs((ma[0]||40)-(mb[0]||40))/4;
 return horizontal*3+cross+(a.rootString===b.rootString?0:1.8);
}
export function planProgression(input, {rootString='all',maxChoices=7}={}){
 const chords=Array.isArray(input)?input:parseProgression(input);
 if(!Array.isArray(chords)||!chords.length||chords.length>8)throw new Error('1~8개의 코드를 지정해 주세요.');
 const choices=chords.map(c=>voicingsFor(c,{rootString,maxResults:Math.max(1,Math.min(18,maxChoices))}).filter(g=>validateGrip(g,c)));
 if(choices.some(x=>!x.length))throw new Error('일부 코드에서 해당 루트 현의 운지를 찾지 못했어요. 전체 줄을 선택해 주세요.');
 const scores=choices.map(arr=>arr.map(()=>Infinity)),parents=choices.map(arr=>arr.map(()=>-1));
 scores[0]=choices[0].map(g=>g.score/9);
 for(let i=1;i<choices.length;i++)for(let j=0;j<choices[i].length;j++)for(let k=0;k<choices[i-1].length;k++){
  const score=scores[i-1][k]+gripDistance(choices[i-1][k],choices[i][j])+choices[i][j].score/12;
  if(score<scores[i][j]){scores[i][j]=score;parents[i][j]=k;}
 }
 let j=scores.at(-1).indexOf(Math.min(...scores.at(-1)));const path=[];
 for(let i=chords.length-1;i>=0;i--){path.unshift({chord:chords[i],grip:choices[i][j]});j=parents[i][j];}
 return path;
}
