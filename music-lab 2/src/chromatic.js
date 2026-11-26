// Music Lab Alpha 0.8 — self-contained chromatic guitar practice engine.
// Fretting-hand patterns use 1=index 2=middle 3=ring 4=pinky.
export const CHROMATIC_PATTERNS = [
 '1234','1243','1324','1342','1423','1432',
 '2134','2143','2314','2341','2413','2431',
 '3124','3142','3214','3241','3412','3421',
 '4123','4132','4213','4231','4312','4321'
];
export const CHROMATIC_ROUTES = {
 down:{label:'6번 현 → 1번 현',strings:[6,5,4,3,2,1]},
 up:{label:'1번 현 → 6번 현',strings:[1,2,3,4,5,6]},
 return:{label:'6번 현 → 1번 현 → 6번 현',strings:[6,5,4,3,2,1,2,3,4,5,6]},
};
export const CHROMATIC_OPEN_MIDI = {6:40,5:45,4:50,3:55,2:59,1:64};
export function buildChromatic({pattern='1234',firstFret=5,route='down',rounds=1}={}){
 if(!CHROMATIC_PATTERNS.includes(pattern))throw new Error('올바르지 않은 손가락 순서입니다.');
 if(!Number.isInteger(firstFret)||firstFret<1||firstFret>19)throw new Error('시작 프렛은 1~19 중 하나여야 합니다.');
 if(!Object.hasOwn(CHROMATIC_ROUTES,route))throw new Error('올바르지 않은 현 이동 방향입니다.');
 if(!Number.isInteger(rounds)||rounds<1||rounds>4)throw new Error('반복 횟수는 1~4회입니다.');
 const items=[];
 for(let r=0;r<rounds;r++)for(const string of CHROMATIC_ROUTES[route].strings){
  for(const raw of pattern){const finger=Number(raw),fret=firstFret+finger-1;
   items.push({string,finger,fret,midi:CHROMATIC_OPEN_MIDI[string]+fret,round:r+1,step:items.length});
  }
 }
 return items;
}
const HTML_ESCAPE={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
const esc=x=>String(x).replace(/[&<>"']/g,c=>HTML_ESCAPE[c]);
export function chromaticBoardSVG({firstFret=5,active=null,pattern='1234'}={}){
 const width=610,height=275,x0=88,xStep=111,y0=43,yStep=35;
 let out=`<rect x="50" y="18" width="545" height="212" rx="14" fill="#3b2a22" stroke="#89664c" stroke-width="2"/>`;
 for(let i=0;i<10;i++)out+=`<path d="M52 ${28+i*21} Q320 ${26+i*21} 592 ${30+i*21}" fill="none" stroke="#b18b69" stroke-opacity=".14" stroke-width="2"/>`;
 for(let f=0;f<=4;f++){
  const x=x0+f*xStep;out+=`<line x1="${x}" y1="19" x2="${x}" y2="228" stroke="#b3b5b6" stroke-width="${f===0?5:3}"/>`;
  if(f<4)out+=`<text x="${x+xStep/2}" y="257" text-anchor="middle" font-size="15" font-weight="750" fill="var(--text)">${firstFret+f}fr</text>`;
 }
 for(let s=1;s<=6;s++){
  const y=y0+(s-1)*yStep;out+=`<line x1="57" y1="${y}" x2="590" y2="${y}" stroke="${s>3?'#cabba4':'#dfded8'}" stroke-width="${1.2+(s-1)*.43}"/>`;
  out+=`<text x="25" y="${y+5}" font-size="14" font-weight="800" fill="var(--text)" text-anchor="middle">${['e','B','G','D','A','E'][s-1]}</text>`;
  for(let finger=1;finger<=4;finger++){
   const cx=x0+(finger-.5)*xStep,highlight=active?.string===s&&active?.finger===finger;
   if(highlight)out+=`<circle cx="${cx}" cy="${y}" r="22" fill="none" stroke="#85eed7" stroke-width="3" opacity=".9"/>`;
   out+=`<circle cx="${cx}" cy="${y}" r="${highlight?17:12}" fill="${highlight?'#8df0da':'#e1e7e8'}" stroke="#253342" stroke-width="2"/>`;
   out+=`<text x="${cx}" y="${y+5}" font-size="${highlight?15:12}" font-weight="800" text-anchor="middle" fill="#10242b">${finger}</text>`;
  }
 }
 const label=active?`${active.string}번 현, ${active.fret}프렛, ${active.finger}번 손가락`:'준비';
 return `<svg class="chromatic-board" viewBox="0 0 ${width} ${height}" role="img" aria-label="크로매틱 기타 지판 · ${esc(label)}">${out}</svg>`;
}
