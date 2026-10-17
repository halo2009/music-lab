// Music Lab: responsive notation engraver for treble/bass, pitch spelling and piano input.
// SVG staves are generated from exact diatonic positions, not arbitrary pixels.
const letters=['C','D','E','F','G','A','B'];
const pcs=['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
const naturals={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
export const prettyNote=(midi)=>pcs[((midi%12)+12)%12]+(Math.floor(midi/12)-1);
function posOf(midi,clef){
 const oct=Math.floor(midi/12)-1,pc=((midi%12)+12)%12;
 const candidate=['C','D','E','F','G','A','B'].map(l=>({l,d:((pc-naturals[l]+18)%12)-6})).sort((a,b)=>Math.abs(a.d)-Math.abs(b.d))[0];
 // Choose standard #/b spellings to avoid E# and B# on chromatic questions.
 const label=pcs[pc];const letter=label[0];const index=oct*7+letters.indexOf(letter);
 const bottom=clef==='bass'?2*7+4:4*7+2;
 const y=108-(index-bottom)*6;
 const accidental=label.length>1?label.slice(1):'';
 return {y,accidental,name:label+oct};
}
function noteSVG(midi,x,clef,color){
 const p=posOf(midi,clef),y=p.y;
 let ledgers='';
 if(y>108)for(let ly=120;ly<=y+1;ly+=12)ledgers+=`<line x1="${x-15}" y1="${ly}" x2="${x+17}" y2="${ly}" stroke="var(--staff-stroke)" stroke-width="1.35"/>`;
 if(y<60)for(let ly=48;ly>=y-1;ly-=12)ledgers+=`<line x1="${x-15}" y1="${ly}" x2="${x+17}" y2="${ly}" stroke="var(--staff-stroke)" stroke-width="1.35"/>`;
 const accident=p.accidental?`<text x="${x-27}" y="${y+5}" fill="${color}" font-size="18" font-family="serif">${p.accidental==='b'?'♭':'♯'}</text>`:'';
 return `${ledgers}${accident}<ellipse cx="${x}" cy="${y}" rx="11" ry="7" transform="rotate(-17 ${x} ${y})" fill="${color}"/><line x1="${x+10}" y1="${y}" x2="${x+10}" y2="${y-35}" stroke="${color}" stroke-width="2.2"/>`;
}
export function staffSVG({clef='treble',notes=[],ghost=false,caption='',showLabels=false}={}){
 const active=notes.filter(x=>Number.isInteger(x)&&x>=24&&x<=107).slice(0,6);
 const lineYs=[60,72,84,96,108],lines=lineYs.map(y=>`<line x1="59" y1="${y}" x2="438" y2="${y}" stroke="var(--staff-stroke)" stroke-width="1.3"/>`).join('');
 const clefImage=clef==='bass'?`<image href="./assets/bass-clef.svg" x="12" y="49" width="42" height="70"/>`:`<image href="./assets/treble-clef.svg" x="9" y="28" width="48" height="110"/>`;
 const xPositions=active.map((n,i)=>active.length===1?224:132+i*62);
 const heads=active.map((n,i)=>noteSVG(n,xPositions[i],clef,'var(--staff-note)')).join('');
 const labels=showLabels?active.map((n,i)=>`<text x="${xPositions[i]}" y="146" text-anchor="middle" fill="var(--staff-caption)" font-size="12">${prettyNote(n)}</text>`).join(''):'';
 return `<div class="staff-graphic"><svg viewBox="0 0 460 164" role="img" aria-label="${clef==='bass'?'낮은음자리표':'높은음자리표'} 오선지${active.length?' 음표 '+active.map(prettyNote).join(' '):''}"><rect x="1" y="1" width="458" height="162" rx="11" fill="var(--staff-surface)"/><g>${lines}</g>${clefImage}<line x1="438" y1="60" x2="438" y2="108" stroke="var(--staff-stroke)"/>${heads}${labels}${!active.length&&ghost?'<text x="243" y="92" fill="var(--staff-caption)" text-anchor="middle" font-size="13">소리를 듣고 건반을 선택하세요</text>':''}</svg>${caption?`<div class="staff-caption">${caption}</div>`:''}</div>`;
}
const blackKeys=new Set([1,3,6,8,10]);
export function trainingKeyboard({first=48,count=36,selected=[],hint=[]}={}){
 const whites=[];const blacks=[];const active=new Set(selected),shown=new Set(hint);
 const final=first+count;
 let whiteIndex=0;
 for(let m=first;m<final;m++){
  const black=blackKeys.has(m%12);
  if(!black){
   const oct=Math.floor(m/12)-1;
   whites.push(`<button type="button" class="train-key white ${active.has(m)?'pressed':''} ${shown.has(m)?'solution':''}" data-action="train-key" data-midi="${m}" aria-label="${prettyNote(m)}" title="${prettyNote(m)}"><span>${m%12===0?'C'+oct:''}</span></button>`);
   whiteIndex++;
  }else{
   const at=whiteIndex*45-13;
   blacks.push(`<button type="button" class="train-key black ${active.has(m)?'pressed':''} ${shown.has(m)?'solution':''}" style="left:${at}px" data-action="train-key" data-midi="${m}" aria-label="${prettyNote(m)}" title="${prettyNote(m)}"></button>`);
  }
 }
 return `<div class="keyboard-scroll" role="group" aria-label="피아노 건반을 눌러 답하기"><div class="training-keyboard" style="width:${whiteIndex*45}px"><div class="white-key-row">${whites.join('')}</div>${blacks.join('')}</div></div>`;
}
