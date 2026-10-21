// Music Lab 0.9.2 — rule-based, compact auto-generated music questions.
import {chordsOf,pitchClass,INTERVAL_QUIZ} from './music.js';
export function seededRng(seed){let a=(Number(seed)||1)>>>0;return ()=>{a^=a<<13;a^=a>>>17;a^=a<<5;return (a>>>0)/4294967296;};}
export function nextSeed(){const c=globalThis.crypto;if(c?.getRandomValues)return c.getRandomValues(new Uint32Array(1))[0];return Math.floor(Math.random()*4294967296);}
export const choice=(rng,arr)=>arr[Math.floor(rng()*arr.length)];
export function shuffle(rng,arr){const out=[...arr];for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
export function uniqueGenerated(create,signature,recent=[],tries=18){const forbidden=new Set(recent.slice(-40));let item,signatureText='';for(let i=0;i<tries;i++){item=create();signatureText=signature(item);if(!forbidden.has(signatureText))break;}return {item,signature:signatureText};}
export function makeHarmonyProblem({root='C',mode='major',level=1,seed=1}={}){
 const rng=seededRng(seed),chords=chordsOf(root,mode,true),pick=()=>Math.floor(rng()*7),grade=Math.max(1,Math.min(3,level));
 const index=pick(),target=chords[index],kind=grade===1?'roman':choice(rng,grade===2?['roman','tones']:['roman','tones','next']);
 if(kind==='roman'){
  const options=chords.map(c=>c.roman),pickIdx=[index];while(pickIdx.length<4){const n=pick();if(!pickIdx.includes(n))pickIdx.push(n);} const answers=shuffle(rng,pickIdx.map(i=>options[i]));
  return {kind,seed,question:`${root} ${mode==='minor'?'Natural minor':'Major'}에서 ${target.name}의 다이아토닉 기능은?`,correct:target.roman,answers,explanation:`${target.name}은(는) ${index+1}도 화음으로 ${target.roman}에 해당합니다.`,signature:`${root}|${mode}|roman|${index}`};
 }
 if(kind==='tones'){
  const answer=target.notes.join(' · '),options=new Set([answer]);for(let i=0;i<30&&options.size<4;i++){const c=chords[pick()];options.add(c.notes.join(' · '));}
  return {kind,seed,question:`${target.name}의 구성음은?`,correct:answer,answers:shuffle(rng,[...options]),explanation:`${target.name}: ${answer}`,signature:`${root}|${mode}|tones|${index}`};
 }
 const next=chords[(index+1)%7],options=[...new Set([next.name,...Array.from({length:6},()=>chords[pick()].name)])];while(options.length<4){const x=chords[pick()].name;if(!options.includes(x))options.push(x);}
 // Question concerns ascending diatonic step, not functional prediction.
 return {kind,seed,question:`${root} 음계에서 ${target.name} 다음 도수의 7화음은?`,correct:next.name,answers:shuffle(rng,options.slice(0,4)),explanation:`${target.roman}에서 다음 도수는 ${next.roman}이며 코드는 ${next.name}입니다.`,signature:`${root}|${mode}|next|${index}`};
}
export function makeEarProblem({mode='interval',clef='treble',level='chromatic',seed=1}={}){
 const rng=seededRng(seed),pick=a=>choice(rng,a);
 if(['staff','read','melody'].includes(mode)){
  const low=clef==='bass'?43:60,high=clef==='bass'?66:84,pool=Array.from({length:high-low+1},(_,i)=>i+low).filter(m=>level==='chromatic'||![1,3,6,8,10].includes(m%12));
  const base=pick(pool);
  if(mode==='melody'){const subset=pool.filter(m=>Math.abs(m-base)<=7);const notes=[base,pick(subset),pick(subset)];return {kind:mode,notes,prompt:'세 음을 듣고 차례대로 건반을 눌러보세요.',signature:`${mode}|${clef}|${level}|${notes.join('.')}`,seed};}
  return {kind:mode,notes:[base],prompt:mode==='staff'?'소리를 듣고 피아노에서 같은 음을 찾아보세요.':'오선지를 보고 해당하는 건반을 선택하세요.',signature:`${mode}|${clef}|${level}|${base}`,seed};
 }
 if(mode==='direction'){const a=58+Math.floor(rng()*15),delta=pick([-7,-5,-4,-3,-2,-1,1,2,3,4,5,7]);return {kind:mode,a,b:a+delta,correct:delta>0?'높아짐':'낮아짐',answers:['높아짐','낮아짐'],prompt:'두 번째 음은 첫 번째 음보다?',signature:`direction|${a}|${delta}`,seed};}
 if(mode==='interval'){const target=pick(INTERVAL_QUIZ),others=shuffle(rng,INTERVAL_QUIZ.filter(x=>x.n!==target.n)).slice(0,3).map(x=>x.n),a=54+Math.floor(rng()*15);return {kind:mode,a,b:a+target.s,correct:target.n,answers:shuffle(rng,[target.n,...others]),prompt:'두 음 사이의 음정은?',signature:`interval|${a}|${target.s}`,seed};}
 const a=55+Math.floor(rng()*12),major=rng()>.5;return {kind:'quality',midis:[a,a+(major?4:3),a+7],correct:major?'장3화음':'단3화음',answers:['장3화음','단3화음'],prompt:'들리는 3화음의 종류는?',signature:`quality|${a}|${major}`,seed};
}
