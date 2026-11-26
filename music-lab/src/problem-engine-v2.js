// Alpha 0.9.6 — deterministic, rule-checked questions, generated on device.
// A seed and generator version reproduce any question; no individual question assets.
import {ROOTS,PC_NAMES,INTERVAL_QUIZ,scaleOf,chordsOf,pitchClass} from './music.js';
import {CHORD_TYPES,describeChord} from './chord-library.js';
import {seededRng,shuffle,choice} from './problem-engine.js';
export const GENERATOR_VERSION=2;
export const QUIZ_CATEGORIES=[
 {id:'harmony',label:'화성학',description:'조성과 다이아토닉 기능'},
 {id:'chord',label:'기타 코드',description:'구성음과 코드 성질'},
 {id:'fretboard',label:'기타 지판',description:'현·프렛 음 찾기'},
 {id:'sight',label:'기타 악보',description:'높은음자리표 8↓ 초견'},
 {id:'ear',label:'청각훈련',description:'소리로 음정·화음 구별'},
 {id:'rhythm',label:'리듬',description:'음표·쉼표·박자 계산'}
];
export const QUIZ_CATEGORY_IDS=QUIZ_CATEGORIES.map(x=>x.id);
const OPEN=[40,45,50,55,59,64]; // 6번 현부터 1번 현
const mod=n=>(n%12+12)%12;
const nameOf=m=>PC_NAMES[mod(m)]+(Math.floor(m/12)-1);
const pick=(rng,arr)=>choice(rng,arr);
const checkedOptions=(rng,correct,incorrect)=>{
 const options=shuffle(rng,[correct,...new Set(incorrect.filter(x=>x!==correct))].slice(0,4));
 if(options.length!==4||new Set(options).size!==4||!options.includes(correct))throw Error('선택지 검증 실패');
 return options;
};
const intName=i=>({0:'루트',1:'♭2',2:'2',3:'♭3',4:'3',5:'4',6:'♭5',7:'5',8:'♭6',9:'6',10:'♭7',11:'7'})[i];
function harmony(rng,level){
 const root=pick(rng,ROOTS),mode=level>=3&&rng()<.38?'minor':'major';
 const ch=chordsOf(root,mode,true),degree=Math.floor(rng()*7),item=ch[degree];
 const roman7=mode==='major'?['Imaj7','ii7','iii7','IVmaj7','V7','vi7','viiø7']:['i7','iiø7','IIImaj7','iv7','v7','VImaj7','VII7'];
 const kind=level===1?'roman':pick(rng,['roman','degree','chordtones']);
 if(kind==='chordtones'){
  const correct=item.notes.join(' · ');
  const others=ch.filter((_,i)=>i!==degree).map(c=>c.notes.join(' · '));
  return {kind,prompt:`${item.name}의 구성음을 고르세요.`,options:checkedOptions(rng,correct,shuffle(rng,others)),answer:correct,explanation:`${root} ${mode==='major'?'Major':'Natural minor'}에서 ${item.name}의 구성음은 ${correct}입니다.`,signature:`harm|${root}|${mode}|tone|${degree}`};
 }
 if(kind==='degree'){
  const correct=item.name,others=ch.filter((_,i)=>i!==degree).map(c=>c.name);
  return {kind,prompt:`${root} ${mode==='major'?'Major':'Natural minor'}의 ${degree+1}도 7화음은?`,options:checkedOptions(rng,correct,shuffle(rng,others)),answer:correct,explanation:`음계의 ${degree+1}번째 음을 루트로 3도씩 쌓으면 ${correct}입니다.`,signature:`harm|${root}|${mode}|deg|${degree}`};
 }
 const correct=roman7[degree],others=roman7.filter((_,i)=>i!==degree);
 return {kind,prompt:`${root} ${mode==='major'?'Major':'Natural minor'}에서 ${item.name}의 7화음 로마숫자 표기는?`,options:checkedOptions(rng,correct,shuffle(rng,others)),answer:correct,explanation:`${item.name}은 ${degree+1}도 7화음으로 ${correct}에 해당합니다.`,signature:`harm|${root}|${mode}|roman|${degree}`};
}
const QUALITY_POOLS=[['','m','7','m7','maj7'],['','m','7','m7','maj7','sus2','sus4','m7b5','dim7'],['','m','7','m7','maj7','sus2','sus4','m7b5','dim7','m9','maj9','7b9','7#9','mMaj7']];
function chordQ(rng,level){
 const root=pick(rng,ROOTS),pool=QUALITY_POOLS[Math.min(level-1,2)];
 const quality=pick(rng,pool),kind=level===1?'formula':pick(rng,['formula','notes']);
 const chord=describeChord(root,quality,'');
 if(kind==='notes'){
  const correct=chord.parts.map(p=>p.name).join(' · ');
  const others=shuffle(rng,pool.filter(q=>q!==quality).map(q=>describeChord(root,q,'').parts.map(p=>p.name).join(' · ')));
  return {kind,prompt:`${chord.name}의 구성음을 고르세요.`,options:checkedOptions(rng,correct,others),answer:correct,explanation:`${chord.name} = ${chord.parts.map(p=>p.tag+'('+p.name+')').join(' · ')}`,signature:`chord|${root}|${quality}|notes`};
 }
 const correct=CHORD_TYPES[quality].parts.join(' · ');
 const others=shuffle(rng,pool.filter(q=>q!==quality).map(q=>CHORD_TYPES[q].parts.join(' · ')));
 return {kind,prompt:`${chord.name}의 코드 공식은?`,options:checkedOptions(rng,correct,others),answer:correct,explanation:`${chord.name}의 구성음은 ${chord.parts.map(p=>p.name).join(' · ')}이며 공식은 ${correct}입니다.`,signature:`chord|${root}|${quality}|formula`};
}
function fretboard(rng,level){
 const string=1+Math.floor(rng()*6),fret=Math.floor(rng()*(level===1?5:level===2?13:23));
 const midi=OPEN[6-string]+fret,correct=nameOf(midi);
 const pool=[midi-3,midi-2,midi-1,midi+1,midi+2,midi+3,midi+5].map(nameOf);
 return {kind:'note',prompt:`표준 튜닝에서 ${string}번 줄 ${fret===0?'개방현':`${fret}프렛`}의 실제 소리(음이름·옥타브)는?`,options:checkedOptions(rng,correct,shuffle(rng,pool)),answer:correct,explanation:`${string}번 줄 개방현은 ${nameOf(OPEN[6-string])}이고, ${fret}프렛은 ${fret}반음 높습니다.`,signature:`fret|${string}|${fret}`};
}
function sight(rng,level){
 const string=1+Math.floor(rng()*6),fret=Math.floor(rng()*(level===1?5:level===2?10:16));
 const midi=OPEN[6-string]+fret;
 // Guitar is transposing by an octave; displayed treble staff sounds one octave below notation.
 const correct=`${string}번 줄 ${fret}프렛`;
 const distractors=[];
 for(let s=1;s<=6;s++)for(let f=0;f<=(level===1?5:level===2?10:15);f++){
  if(OPEN[6-s]+f!==midi)distractors.push({name:`${s}번 줄 ${f}프렛`,distance:Math.abs(f-fret)+Math.abs(s-string)*.12});
 }
 const nearby=shuffle(rng,distractors.filter(x=>x.distance<5));
 const pool=nearby.length>=3?nearby:distractors;
 return {kind:'staff',prompt:'악보의 음을 실제 기타에서 연주할 수 있는 위치는?',options:checkedOptions(rng,correct,shuffle(rng,pool).map(x=>x.name)),answer:correct,explanation:`기타는 실제 소리보다 한 옥타브 높게 기보합니다. 실제 음 ${nameOf(midi)}를 낼 수 있는 위치 중 하나는 ${correct}입니다.`,staffMidi:midi+12,signature:`sight|${string}|${fret}`};
}
function ear(rng,level){
 const a=55+Math.floor(rng()*14);
 if(level===1){const delta=pick(rng,[-5,-4,-3,-2,-1,1,2,3,4,5]);const correct=delta>0?'높아진다':'낮아진다';
  return {kind:'direction',prompt:'두 번째 음은 첫 번째 음보다?',options:['높아진다','낮아진다','같다','두 음이 동시에 울린다'],answer:correct,explanation:`첫 음 ${nameOf(a)}, 두 번째 음 ${nameOf(a+delta)}로 ${Math.abs(delta)}반음 ${delta>0?'상승':'하강'}했습니다.`,playback:[a,a+delta],signature:`ear|dir|${a}|${delta}`};}
 if(level===2){const pickIntervals=INTERVAL_QUIZ.filter(x=>x.s<=8),interval=pick(rng,pickIntervals);const correct=interval.n;
  return {kind:'interval',prompt:'차례로 재생되는 두 음 사이의 음정은?',options:checkedOptions(rng,correct,shuffle(rng,pickIntervals.filter(x=>x.s!==interval.s).map(x=>x.n))),answer:correct,explanation:`두 음의 간격은 ${interval.s}반음이며 ${correct}입니다.`,playback:[a,a+interval.s],signature:`ear|interval|${a}|${interval.s}`};}
 const quality=pick(rng,[['장3화음',[0,4,7]],['단3화음',[0,3,7]],['감3화음',[0,3,6]],['증3화음',[0,4,8]]]);
 return {kind:'triad',prompt:'동시에 재생되는 화음의 종류는?',options:shuffle(rng,['장3화음','단3화음','감3화음','증3화음']),answer:quality[0],explanation:`구성 간격은 ${quality[1].map(intName).join(' · ')}로 ${quality[0]}입니다.`,playback:quality[1].map(x=>a+x),simultaneous:true,signature:`ear|triad|${a}|${quality[0]}`};
}
const DURATIONS=[{s:'2분음표',n:8},{s:'4분음표',n:4},{s:'8분음표',n:2},{s:'16분음표',n:1},{s:'4분쉼표',n:4},{s:'8분쉼표',n:2},{s:'점4분음표',n:6}]; // units = sixteenth notes
const beatText=x=>Number.isInteger(x)?String(x):x.toFixed(2).replace(/0+$/,'').replace(/\.$/,'');
function rhythm(rng,level){
 const pool=DURATIONS.filter(x=>level>=3||level===2&&x.n>=2&&x.s!=='점4분음표'||level===1&&['2분음표','4분음표','8분음표','4분쉼표'].includes(x.s));
 const picked=Array.from({length:level===1?2:3},()=>pick(rng,pool));
 const beats=picked.reduce((s,x)=>s+x.n,0)/4,correct=`${beatText(beats)}박`;
 const nearby=[beats-1,beats-.5,beats-.25,beats+.25,beats+.5,beats+1,beats+1.5].filter(x=>x>0).map(x=>`${beatText(x)}박`);
 return {kind:'beats',prompt:`4분음표=1박일 때, ${picked.map(x=>x.s).join(' + ')}의 총 길이는?`,options:checkedOptions(rng,correct,shuffle(rng,nearby)),answer:correct,explanation:`각 음표·쉼표의 길이를 더하면 ${picked.map(x=>beatText(x.n/4)).join(' + ')} = ${beatText(beats)}박입니다.`,signature:`rhythm|${picked.map(x=>x.s).join('|')}`};
}
const GENERATORS={harmony,chord:chordQ,fretboard,sight,ear,rhythm};
export function generateQuestion({category='harmony',level=1,seed=1}={}){
 if(!Object.hasOwn(GENERATORS,category))throw Error('지원하지 않는 문제 유형입니다.');
 const l=Math.max(1,Math.min(3,Math.trunc(Number(level)||1)));
 const rng=seededRng(seed),raw=GENERATORS[category](rng,l);
 if(!raw||!Array.isArray(raw.options)||raw.options.length!==4||new Set(raw.options).size!==4||!raw.options.includes(raw.answer))throw Error('문제 생성 검증 실패');
 if(raw.playback&&raw.playback.some(x=>!Number.isInteger(x)||x<36||x>100))throw Error('음높이 검증 실패');
 return {...raw,seed,level:l,category,version:GENERATOR_VERSION,id:`v${GENERATOR_VERSION}:${category}:${l}:${seed}`,signature:raw.signature||`${category}|${seed}`};
}
export function freshQuestion({category='harmony',level=1,recent=[],random=Math.random}={}){
 const seen=new Set(recent.slice(-90));let candidate;
 for(let attempt=0;attempt<60;attempt++){
  const seed=(random()*4294967296)>>>0;
  candidate=generateQuestion({category,level,seed:seed||1});
  if(!seen.has(candidate.signature))return candidate;
 }
 return candidate; // finite category pool: repeats permitted after bounded retries
}
export function makeSession({category='harmony',level=1,count=10,mode='learn',recent=[],weak=[]}={}){
 const validCategory=QUIZ_CATEGORY_IDS.includes(category)?category:'harmony';
 const selectedMode=['learn','exam','review'].includes(mode)?mode:'learn';
 const n=[5,10,20].includes(Number(count))?Number(count):10;
 const questions=[],seen=[...recent];
 for(let i=0;i<n;i++){
  const categoryForItem=selectedMode==='review'&&weak.length?weak[i%weak.length]:validCategory;
  const next=freshQuestion({category:QUIZ_CATEGORY_IDS.includes(categoryForItem)?categoryForItem:validCategory,level,recent:seen});
  questions.push(next);seen.push(next.signature);
 }
 return {questions,mode:selectedMode,category:validCategory,level,count:n,index:0,answers:[],status:'active'};
}
export function scoreSession(session){
 const correct=session.answers.filter(x=>x.correct).length,total=session.questions.length;
 return {correct,total,percentage:Math.round(100*correct/total),weak:[...new Set(session.answers.filter(a=>!a.correct).map(a=>a.category))]};
}
