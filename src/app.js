import {ROOTS,PC_NAMES,INTERVALS,FORMATS,INTERVAL_QUIZ,GUITAR_OPEN,scaleOf,chordsOf,chordMidi,pitchClass,noteToMidi,midiToFrequency} from './music.js';
import {note,chord,arpeggio,playInterval,playSequence,stopAllScheduled,demoFormant,pianoStatus,getVoiceFormants,loadPianoSamples} from './audio.js';
import {startMicrophone} from './mic.js';
import {staffSVG,trainingKeyboard,prettyNote} from './staff.js';
import {buildMidi,downloadMidi,pianoRollSVG} from './midi.js';
import {drawLarynx,animateLarynx} from './larynx3d.js';
import {VOICE_LESSONS,VOICE_QUIZ,VOWEL_PRESETS} from './vocal-content.js';
import {getAcousticMetrics,pitchSpread,describeAcoustics} from './voice-metrics.js';
import {toggleRecord,recordingSlot,clipUrl,clearClips,stopRecording,clipDownloadName} from './recorder.js';
const $=sel=>document.querySelector(sel);
const safe=(s)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const persisted=read('musiclab-settings',{});
const state={tab:'home',root:persisted.root||'C',mode:persisted.mode||'major',theme:persisted.theme||'dark',seventh:true,guitarScale:'major',guitarDisplay:'scale',selectedChord:0,earMode:'staff',clef:'treble',staffLevel:'chromatic',melodyInputs:[],earSession:{completed:0,correct:0},earHistory:read('musiclab-training-history',[]),question:null,feedback:null,reg:'m1',part:'folds',vocalView:'science',vocalLesson:'fold',vowelPreset:'a',voiceQuizIndex:0,voiceQuizChoice:null,voiceQuizScore:0,voiceTarget:read('musiclab-voice-target',60),voiceNotes:read('musiclab-voice-notes',''),larynxFocus:'all',larynxYaw:20,larynxPitch:43,larynxZoom:100,larynxAnimating:false,glottalOpen:30,jaw:55,tongue:50,lips:30,vocalF0:180,vocalBreath:24,compDegrees:[0,5,3,4],melodyNotes:read('musiclab-melody',[]),bpm:82,playing:-1,entries:read('musiclab-entries',[]),stats:read('musiclab-ear',{total:0,correct:0}),micActive:false,micError:''};
const saveSettings=()=>localStorage.setItem('musiclab-settings',JSON.stringify({root:state.root,mode:state.mode,theme:state.theme}));
const saveEntries=()=>localStorage.setItem('musiclab-entries',JSON.stringify(state.entries));
let micStop=null,seqStop=null,larynxStop=null;
const icon=(n,size=20)=>{const p={home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',theory:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M9 8h6M9 12h8"/>',guitar:'<path d="m13 6 5-5 5 5-5 5"/><path d="m4 20 9-9m-5-2 7 7M2 22l5-1-4-4-1 5Z"/>',ear:'<path d="M6 10a6 6 0 1 1 12 0c0 5-6 5-6 10M12 22h.01"/><path d="M9 10a3 3 0 0 1 6 0"/>',vocal:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5m-4 0h8"/>',compose:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',journal:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12l3 3 5-6"/>',play:'<path d="m8 5 11 7-11 7z"/>',pause:'<path d="M9 5v14M15 5v14"/>',chevron:'<path d="m9 18 6-6-6-6"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2m10-10h-2M4 12H2m17.07 7.07-1.41-1.41M6.34 6.34 4.93 4.93m14.14 0-1.41 1.41M6.34 17.66l-1.41 1.41"/>',moon:'<path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13z"/>',spark:'<path d="m12 3 1.8 6.2L20 11l-6.2 1.8L12 19l-1.8-6.2L4 11l6.2-1.8z"/>',download:'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',mic:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5"/>',stop:'<rect x="5" y="5" width="14" height="14" rx="2"/>',music:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',check:'<path d="m4 12 5 5L20 6"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',info:'<circle cx="12" cy="12" r="10"/><path d="M12 10v7m0-10v.1"/>',headphones:'<path d="M3 14v-3a9 9 0 0 1 18 0v3M3 14h4v7H5a2 2 0 0 1-2-2zm18 0h-4v7h2a2 2 0 0 0 2-2z"/>',layers:'<path d="m12 2 9 5-9 5-9-5zM3 12l9 5 9-5M3 17l9 5 9-5"/>',refresh:'<path d="M20 7v5h-5M4 17v-5h5M5 9a8 8 0 0 1 14-2l1 2M4 15l1 2a8 8 0 0 0 14-2"/>'}[n]||'<circle cx="12" cy="12" r="9"/>';return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`};
const NAV=[['home','대시보드','home'],['theory','화성학 연구실','theory'],['guitar','기타 지판','guitar'],['ear','청음 트레이너','ear'],['vocal','보컬 과학','vocal'],['compose','코드 스튜디오','compose'],['journal','연습 기록','journal']];
const title=()=>NAV.find(n=>n[0]===state.tab)?.[1]||'Music Lab';
const rootOptions=()=>ROOTS.map(r=>`<option ${r===state.root?'selected':''} value="${r}">${r}</option>`).join('');
const modeOptions=()=>`<option value="major" ${state.mode==='major'?'selected':''}>Major</option><option value="minor" ${state.mode==='minor'?'selected':''}>Natural minor</option>`;
const cap=(heading,sub='')=>`<div class="section-head"><div><h2>${heading}</h2>${sub?`<p>${sub}</p>`:''}</div></div>`;
const btn=(action,label,cls='btn primary',more='')=>`<button class="${cls}" data-action="${action}" ${more}>${label}</button>`;
const pageHeader=(eyebrow,name,description)=>`<div class="page-heading"><div class="eyebrow">${eyebrow}</div><h1>${name}</h1><p>${description}</p></div>`;
const infoBox=(text)=>`<div class="info-box">${icon('info',17)}<span>${text}</span></div>`;
function piano(notes=[],oct=4){
 const active=new Set(notes.map(n=>pitchClass(n)));const whites=[0,2,4,5,7,9,11];
 const white=whites.map((pc,i)=>`<button aria-label="${PC_NAMES[pc]}${oct} 연주" class="white-key ${active.has(pc)?'active':''}" data-action="play-midi" data-midi="${12*(oct+1)+pc}"><span>${PC_NAMES[pc]}</span></button>`).join('');
 const blackPcs=[1,3,6,8,10],positions=[14.285,28.571,57.143,71.429,85.714];
 const blacks=blackPcs.map((pc,i)=>`<button aria-label="${PC_NAMES[pc]}${oct} 연주" class="black-key ${active.has(pc)?'active':''}" style="left:${positions[i]}%" data-action="play-midi" data-midi="${12*(oct+1)+pc}"></button>`).join('');
 return `<div class="piano" role="group" aria-label="터치 가능한 한 옥타브 피아노">${white}${blacks}</div>`;
}
function recentMinutes(){const date=new Date().toLocaleDateString('sv-SE');return state.entries.filter(e=>e.date===date).reduce((s,e)=>s+Number(e.minutes||0),0)}
function allMinutes(){return state.entries.reduce((s,e)=>s+Number(e.minutes||0),0)}
function home(){
 const scales=scaleOf(state.root,state.mode),ch=chordsOf(state.root,state.mode,true);
 const pct=state.stats.total?Math.round(100*state.stats.correct/state.stats.total):0;
 return `${pageHeader('YOUR MUSIC WORKSPACE','연습과 이론을, 하나의 흐름으로.','오늘 배운 이론을 바로 듣고, 기타로 확인하고, 나만의 음악으로 만들어보세요.')}
 <section class="hero"><div class="hero-inner"><div class="hero-tag">${icon('spark',15)} MUSIC LAB / ALPHA 0.4</div><h2>Understand the sound.<br><em>Make it yours.</em></h2><p>하나의 조성을 선택하면 화성학, 지판, 코드 스튜디오가 함께 바뀝니다.</p><div class="hero-actions">${btn('nav-theory',`${icon('theory',17)} 이론 시작하기`)}${btn('nav-vocal',`${icon('mic',17)} 보컬 과학 보기`,'btn ghost')}</div></div><div class="hero-orbit" aria-hidden="true"><div class="orbit-circle one"></div><div class="orbit-circle two"></div><div class="orbit-core">${icon('music',48)}</div><span class="orbit-note n1">♩</span><span class="orbit-note n2">♪</span><span class="orbit-note n3">♫</span></div></section>
 <div class="stat-grid"><div class="stat"><div class="stat-label">${icon('clock',16)} 오늘의 연습</div><div class="stat-number">${recentMinutes()}<small>분</small></div><span>기록한 연습 시간</span></div><div class="stat"><div class="stat-label">${icon('target',16)} 청음 정답률</div><div class="stat-number">${state.stats.total?pct+'%':'—'}</div><span>${state.stats.total}문제 중 ${state.stats.correct}문제 정답</span></div><div class="stat"><div class="stat-label">${icon('layers',16)} 현재 조성</div><div class="stat-number key-stat">${safe(state.root)} <small>${state.mode==='major'?'Major':'minor'}</small></div><span>모든 학습 페이지에 연동</span></div></div>
 ${cap('학습 도구','지금 필요한 도구를 선택하세요.')}
 <div class="tool-grid">${[['theory','화성학 연구실','스케일 · 다이아토닉 · 코드톤','theory'],['guitar','기타 지판','0–15프렛 · 코드톤 · 스케일','guitar'],['ear','청음 트레이너','오선지 · 피아노 · 음정 · 선율','headphones'],['vocal','보컬 과학','해부학 · 발성 비교 · 피치','vocal'],['compose','코드 스튜디오','4마디 진행 · 건반 재생','compose'],['journal','연습 기록','레슨 노트 · 학습 데이터','journal']].map(([id,t,d,ico])=>`<button class="tool-card" data-action="nav-${id}"><span class="tool-icon">${icon(ico,23)}</span><strong>${t}</strong><span>${d}</span><span class="card-arrow">${icon('chevron',19)}</span></button>`).join('')}</div>
 <div class="two-col"><div class="panel"><div class="panel-head"><div><span class="mini-label">KEY EXPLORER</span><h3>${safe(state.root)} ${state.mode==='major'?'Major':'Natural minor'} scale</h3></div><span class="pill">${scales.notes.length} notes</span></div><div class="note-pills">${scales.notes.map((n,i)=>`<button data-action="play-midi" data-midi="${noteToMidi(n,4)}" class="note-pill ${i===0?'root':''}">${safe(n)}</button>`).join('')}</div><div class="small-muted">음을 누르면 직접 소리를 들을 수 있어요.</div></div><div class="panel"><div class="panel-head"><div><span class="mini-label">DIATONIC CHORDS</span><h3>현재 조성의 7화음</h3></div></div><div class="mini-chords">${ch.map(x=>`<span><small>${x.roman}</small>${safe(x.name)}</span>`).join('')}</div></div></div>`;
}
function theory(){const s=scaleOf(state.root,state.mode),ch=chordsOf(state.root,state.mode,state.seventh),sel=ch[state.selectedChord]||ch[0];
 return `${pageHeader('HARMONY ENGINE','화성학 연구실','조성, 음계, 다이아토닉 코드와 구성음을 하나의 화면에서 확인합니다.')}
 <div class="two-col top-align"><div class="panel"><div class="panel-head"><div><span class="mini-label">01 / SCALE CONSTRUCTION</span><h3>${safe(state.root)} ${state.mode==='major'?'Major':'Natural minor'}</h3></div>${btn('play-scale',`${icon('play',16)} 음계 듣기`,'btn small')}</div><div class="scale-steps">${s.notes.map((n,i)=>`<button class="scale-step" data-action="play-midi" data-midi="${noteToMidi(n,4)}"><span>${i+1}</span><strong>${safe(n)}</strong><small>${s.intervals[i]}st</small></button>`).join('')}</div><div class="subhead">피아노에서 확인</div>${piano(s.notes)}<p class="footnote">화성학 표기는 조성에 따라 #과 b를 구분합니다. 화면의 한 옥타브 건반은 이명동음을 같은 소리로 재생합니다.</p></div>
 <div class="panel"><div class="panel-head"><div><span class="mini-label">02 / CHORD ANALYSIS</span><h3>다이아토닉 코드</h3></div><label class="switch-wrap"><input id="seventh-check" type="checkbox" ${state.seventh?'checked':''}><span>7th</span></label></div><div class="chord-grid">${ch.map((c,i)=>`<button class="chord-tile ${state.selectedChord===i?'selected':''}" data-action="select-chord" data-index="${i}"><small>${c.roman}</small><b>${safe(c.name)}</b></button>`).join('')}</div><div class="chord-inspector"><div><span class="mini-label">SELECTED CHORD</span><div class="selected-name">${safe(sel.name)}</div><p>구성음: ${sel.notes.map(safe).join(' · ')}</p></div>${btn('play-chord',`${icon('play',16)} 듣기`,'btn small')}</div><div class="note-pills">${sel.notes.map((n,i)=>`<span class="note-pill ${i===0?'root':''}">${safe(n)}</span>`).join('')}</div></div></div>
 ${infoBox('메이저/내추럴 마이너 다이아토닉만 계산한 초기 버전입니다. 하모닉·멜로딕 마이너, 세컨더리 도미넌트, 모달 인터체인지는 확장 예정입니다.')}`;
}
function guitar(){const ints=INTERVALS[state.guitarScale]||INTERVALS.major,tonic=pitchClass(state.root);const active=new Set(ints.map(i=>(tonic+i)%12));const selChord=chordsOf(state.root,state.mode,true)[state.selectedChord];
 const chordPcs=new Set(selChord.notes.map(pitchClass));const labels={};scaleOf(state.root,state.guitarScale).notes.forEach(n=>labels[pitchClass(n)]=n);const labelOf=pc=>pc===tonic?state.root:(labels[pc]||PC_NAMES[pc]);const dots=GUITAR_OPEN.map((open,si)=>Array.from({length:16},(_,f)=>{
 const pc=(open+f)%12;const on=state.guitarDisplay==='all'||(state.guitarDisplay==='chord'?chordPcs.has(pc):active.has(pc));const root=pc===tonic;
 const name=labelOf(pc);return `<button class="fret-note ${on?'lit':''} ${on&&root?'tonic':''} ${f===0?'open':''}" title="${name} · ${si+1}현 ${f}프렛" aria-label="${si+1}현 ${f}프렛 ${name}" data-action="play-midi" data-midi="${open+f}" style="grid-column:${f+1}">${on?name:'·'}</button>`;
 }).join('')).join('');
 return `${pageHeader('GUITAR FRETBOARD','기타 지판','선택한 조성과 스케일의 모든 음을 지판 위에서 직접 보고 들어보세요.')}
 <div class="panel"><div class="control-row"><label>스케일<select id="guitar-scale">${Object.keys(FORMATS).map(k=>`<option value="${k}" ${state.guitarScale===k?'selected':''}>${FORMATS[k]}</option>`).join('')}</select></label><label>표시 기준<select id="guitar-display"><option value="scale" ${state.guitarDisplay==='scale'?'selected':''}>스케일 음</option><option value="chord" ${state.guitarDisplay==='chord'?'selected':''}>선택 코드</option><option value="all" ${state.guitarDisplay==='all'?'selected':''}>전체 음</option></select></label><div class="legend"><span class="legend-dot tonic"></span> 루트 <span class="legend-dot"></span> 구성음</div></div>
 <div class="fret-scroll"><div class="fret-wrapper"><div class="fret-header"><div>현 \ 프렛</div>${Array.from({length:16},(_,i)=>`<span>${i===0?'Open':i}</span>`).join('')}</div><div class="fretboard">${GUITAR_OPEN.map((open,i)=>`<div class="string-row"><span class="string-label">${['E','B','G','D','A','E'][i]}</span>${Array.from({length:16},(_,f)=>{const pc=(open+f)%12;const activeScale=(state.guitarDisplay==='all'||(state.guitarDisplay==='chord'?chordPcs.has(pc):active.has(pc)));return `<button class="fret-note ${activeScale?'lit':''} ${activeScale&&pc===tonic?'tonic':''} ${f===0?'open':''}" title="${labelOf(pc)} · ${i+1}현 ${f}프렛" aria-label="${i+1}현 ${f}프렛 ${labelOf(pc)}" data-action="play-midi" data-midi="${open+f}">${activeScale?labelOf(pc):'·'}</button>`}).join('')}</div>`).join('')}</div><div class="fret-markers"><span></span>${Array.from({length:16},(_,i)=>`<span>${[3,5,7,9,12,15].includes(i)?'●':''}</span>`).join('')}</div></div></div>
 <div class="fret-footer"><div><b>${safe(state.root)} ${FORMATS[state.guitarScale]}</b><p>음 간격: ${ints.join(' · ')} 반음</p></div>${btn('play-guitar-scale',`${icon('play',16)} 스케일 듣기`,'btn secondary')}</div></div>
 <div class="panel compact"><div class="panel-head"><div><span class="mini-label">CHORD TONES</span><h3>코드톤 집중 연습</h3></div></div><div class="chip-row">${chordsOf(state.root,state.mode,true).map((c,i)=>`<button class="chip ${state.selectedChord===i?'on':''}" data-action="guitar-chord" data-index="${i}">${safe(c.name)}</button>`).join('')}</div><p class="footnote">코드를 누른 다음 ‘선택 코드’로 바꾸면 해당 구성음만 표시됩니다. 루트 강조는 현재 조성의 으뜸음 기준입니다.</p></div>`;
}
const pick=a=>a[Math.floor(Math.random()*a.length)];
function newQuestion(){
 state.feedback=null;state.melodyInputs=[];
 if(['staff','read','melody'].includes(state.earMode)){
  const clef=state.clef,low=clef==='bass'?43:60,high=clef==='bass'?66:84;
  const pool=Array.from({length:high-low+1},(_,i)=>i+low).filter(m=>state.staffLevel==='chromatic'||![1,3,6,8,10].includes(m%12));
  const seed=pool[Math.floor(Math.random()*pool.length)];
  if(state.earMode==='melody'){
   const range=pool.filter(m=>Math.abs(m-seed)<8);
   const melody=[seed];for(let i=1;i<3;i++)melody.push(range[Math.floor(Math.random()*range.length)]);
   state.question={kind:'melody',notes:melody,prompt:'세 음을 듣고 차례대로 건반을 눌러보세요.'};
  }else state.question={kind:state.earMode,notes:[seed],prompt:state.earMode==='staff'?'소리를 듣고 피아노에서 같은 음을 찾아보세요.':'오선지를 보고 해당하는 건반을 선택하세요.'};
  return;
 }

 if(state.earMode==='direction'){
  const base=58+Math.floor(Math.random()*15),delta=pick([-7,-5,-4,-3,-2,-1,1,2,3,4,5,7]);
  state.question={kind:'direction',a:base,b:base+delta,correct:delta>0?'높아짐':'낮아짐',answers:['높아짐','낮아짐'],prompt:'두 번째 음은 첫 번째 음보다?'};
 }else if(state.earMode==='interval'){
  const target=pick(INTERVAL_QUIZ.filter(q=>q.s<=12));
  const wrong=INTERVAL_QUIZ.filter(q=>q.n!==target.n).sort(()=>Math.random()-.5).slice(0,3).map(q=>q.n);
  const answers=[target.n,...wrong].sort(()=>Math.random()-.5);
  const base=54+Math.floor(Math.random()*15);
  state.question={kind:'interval',a:base,b:base+target.s,correct:target.n,answers,prompt:'두 음 사이의 음정은?'};
 }else{
  const root=55+Math.floor(Math.random()*12),major=Math.random()>.5;
  state.question={kind:'quality',midis:[root,root+(major?4:3),root+7],correct:major?'장3화음':'단3화음',answers:['장3화음','단3화음'],prompt:'들리는 3화음의 종류는?'};
 }
}
function totalPractice(){return state.earHistory.length;}
function recentTraining(){
 const today=new Date(),dates=new Set(state.earHistory.map(x=>x.date));let streak=0;
 for(let i=0;i<366;i++){const d=new Date(today.getFullYear(),today.getMonth(),today.getDate()-i);
 const iso=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
 if(dates.has(iso))streak++;else if(i>0||dates.size)break;}
 return streak;
}
function storeTraining(isCorrect,kind){
 const day=new Date().toLocaleDateString('sv-SE');
 state.earHistory.push({date:day,kind,correct:!!isCorrect});
 state.earHistory=state.earHistory.slice(-3000);
 localStorage.setItem('musiclab-training-history',JSON.stringify(state.earHistory));
 state.stats.total++;if(isCorrect)state.stats.correct++;
 localStorage.setItem('musiclab-ear',JSON.stringify(state.stats));
 state.earSession.completed++;if(isCorrect)state.earSession.correct++;
}
function playQuestion(){
 const q=state.question;if(!q)return;
 if(q.kind==='staff')note(q.notes[0],undefined,.95);
 else if(q.kind==='read')note(q.notes[0],undefined,.48);
 else if(q.kind==='melody')arpeggio(q.notes,.56);
 else if(q.kind==='quality')chord(q.midis);
 else playInterval(q.a,q.b);
}
function trainingStats(){
 const week=Array.from({length:7},(_,i)=>{
  const date=new Date();date.setDate(date.getDate()-6+i);
  const iso=date.toLocaleDateString('sv-SE');const attempts=state.earHistory.filter(x=>x.date===iso);
  return {day:['일','월','화','수','목','금','토'][date.getDay()],correct:attempts.filter(x=>x.correct).length,total:attempts.length};
 });
 const entries=totalPractice(),correct=state.earHistory.filter(x=>x.correct).length,rate=entries?Math.round(correct/entries*100):0;
 const max=Math.max(1,...week.map(x=>x.total));
 return `<div class="panel train-analytics"><div class="panel-head"><div><span class="mini-label">TRAINING ANALYTICS</span><h3>학습 통계</h3></div><span class="pill">최근 7일</span></div><div class="train-stats"><div><strong>${entries}</strong><span>전체 문제</span></div><div><strong>${rate}%</strong><span>정답률</span></div><div><strong>${recentTraining()}일</strong><span>연속 학습</span></div></div><div class="train-chart" aria-label="최근 7일 학습 문제 수">${week.map(x=>`<div><span>${x.total||''}</span><i style="height:${Math.max(4,x.total/max*96)}px"></i><small>${x.day}</small></div>`).join('')}</div><p class="footnote">기기별 브라우저에 저장된 실제 풀이 기록입니다. 순위나 등급은 표시하지 않습니다.</p></div>`;
}
function earLab(){
 const q=state.question,solved=!!state.feedback,session=state.earSession;
 const modes=[['staff','소리 → 건반'],['read','악보 → 건반'],['melody','3음 선율'],['direction','높낮이'],['interval','음정'],['quality','장·단화음']];
 const training=['staff','read','melody'].includes(state.earMode);
 const midis=q?.notes||[];
 const displayed=q&&(solved||state.earMode==='read')?midis:[];
 const allCorrect=solved&&state.feedback?.isCorrect;
 const sessionFinished=session.completed>=10&&solved;
 const bass=state.clef==='bass';
 const origin=bass?36:60;
 const keyboard=trainingKeyboard({first:origin,count:36,selected:state.melodyInputs,hint:solved?midis:[]});
 const resultNote=solved?`<div class="train-answer ${allCorrect?'correct':'incorrect'}" role="status">${allCorrect?'정답입니다!':'다음에 한 번 더 연습해 보세요.'}<span>정답: ${midis.map(prettyNote).join(' → ')}</span></div>`:'';
 const instructions=state.earMode==='staff'?'문제 음을 듣고 같은 높이의 건반을 터치하세요.':state.earMode==='read'?'오선지의 음표를 읽고 건반을 선택하세요.':'3개의 음을 듣고 순서대로 건반을 선택하세요.';
 return `${pageHeader('GOLDEN EAR INSPIRED / ORIGINAL TRAINER','청각·악보 훈련','악보 읽기와 청음, 피아노 건반을 함께 익히는 실전 훈련입니다.')}
 <div class="mode-tabs">${modes.map(([k,l])=>`<button class="mode-tab ${state.earMode===k?'selected':''}" data-action="ear-mode" data-mode="${k}">${l}</button>`).join('')}</div>
 ${training?`<div class="train-layout"><section class="panel train-primary"><div class="train-progress"><span>문제 ${Math.min(10,session.completed+(solved?0:1))} / 10</span><strong>${session.correct}개 정답</strong></div><div class="train-progress-bar"><div style="width:${session.completed*10}%"></div></div>
 <div class="train-selector"><label>음자리표<select id="staff-clef"><option value="treble" ${!bass?'selected':''}>높은음자리표</option><option value="bass" ${bass?'selected':''}>낮은음자리표</option></select></label><label>음계 범위<select id="staff-level"><option value="diatonic" ${state.staffLevel==='diatonic'?'selected':''}>흰 건반 7음계</option><option value="chromatic" ${state.staffLevel==='chromatic'?'selected':''}>반음 포함 12음계</option></select></label></div>
 <div class="clef-selector"><div class="clef-info"><img src="./assets/${bass?'bass':'treble'}-clef.svg" alt="${bass?'낮은음자리표':'높은음자리표'}"/><div><strong>${bass?'낮은음자리표':'높은음자리표'}</strong><span>${state.earMode==='melody'?'선율 따라 하기':state.earMode==='read'?'악보 읽기':'음 듣고 찾기'}</span></div></div><span class="pill">${state.staffLevel==='chromatic'?'12음계':'7음계'}</span></div>
 ${staffSVG({clef:state.clef,notes:displayed,ghost:state.earMode!=='read',showLabels:solved})}
 <div class="train-instruction">${q?q.prompt:instructions}${state.earMode==='melody'&&q&&!solved?`<small>입력 ${state.melodyInputs.length} / 3</small>`:''}</div>
 ${keyboard}${resultNote}
 <div class="train-actions">${btn('ear-reference','기준음 C4 듣기','btn secondary')}${btn('ear-play','문제 다시 듣기','btn secondary',q?'':'disabled')}${btn('ear-new',sessionFinished?'새로운 10문제 시작':q?'다음 문제':'첫 문제 시작','btn primary')}</div>
 ${sessionFinished?`<div class="session-done">10문제 완료 · ${session.correct}/10 정답. 다시 시작하면 새로운 문제가 나옵니다.</div>`:''}
 <p class="footnote">악보·건반은 자체 제작 벡터 그래픽입니다. 실제 피아노 샘플을 우선 재생하며, 네트워크가 없으면 피아노형 합성음으로 대체됩니다.</p></section>
 ${trainingStats()}</div>`:
 `<div class="two-col top-align"><div class="panel ear-panel"><div class="ear-decoration">♪</div><span class="mini-label">LISTEN & ANSWER</span><h2>${q?safe(q.prompt):'소리를 듣고 문제를 풀어보세요.'}</h2><div class="big-play-wrap">${btn('ear-play',icon('play',26),'round-play',q?'':'disabled')}<span>문제 듣기</span></div><div class="answer-grid">${q?q.answers.map(a=>`<button class="answer ${solved?(a===q.correct?'correct':state.feedback.chosen===a?'incorrect':''):''}" data-action="ear-answer" data-answer="${safe(a)}" ${solved?'disabled':''}>${safe(a)}</button>`).join(''):'<div class="no-quiz">첫 문제 시작을 눌러 주세요.</div>'}</div>${solved?`<div class="feedback ${state.feedback.isCorrect?'good':'bad'}">${state.feedback.isCorrect?'정답!':'오답'} — 정답: ${safe(q.correct)}</div>`:''}${btn('ear-new',q?'다음 문제':'첫 문제 시작','btn primary full')}</div>${trainingStats()}</div>`}
 ${infoBox('골든이어에서 학습 방식의 아이디어를 얻었지만 화면·악보·엔진을 새로 구현한 독립적인 학습 기능입니다. 실제 앱의 코드나 이미지는 사용하지 않았습니다.')}`;
}
function ear(){return earLab();}
function oldEar(){const q=state.question,pct=state.stats.total?Math.round(state.stats.correct/state.stats.total*100):0;
 return `${pageHeader('EAR TRAINING','청음 트레이너','음의 높낮이부터 음정과 화음까지 듣고 판단하는 능력을 훈련하세요.')}
 <div class="mode-tabs">${[['direction','높낮이 구분'],['interval','음정 맞히기'],['quality','장·단 3화음']].map(([k,l])=>`<button class="mode-tab ${state.earMode===k?'selected':''}" data-action="ear-mode" data-mode="${k}">${l}</button>`).join('')}</div>
 <div class="two-col top-align"><div class="panel ear-panel"><div class="ear-decoration">♪</div><span class="mini-label">LISTEN & ANSWER</span><h2>${q?safe(q.prompt):'소리를 듣고 문제를 풀어보세요.'}</h2><div class="big-play-wrap">${btn('ear-play',`${icon('play',26)}`,'round-play',q?'':'disabled aria-disabled="true"')}<span>문제 음원 재생</span></div>
 <div class="answer-grid">${q?q.answers.map(a=>`<button class="answer ${state.feedback?(a===q.correct?'correct':state.feedback.chosen===a?'incorrect':''):''}" data-action="ear-answer" data-answer="${safe(a)}" ${state.feedback?'disabled':''}>${safe(a)}</button>`).join(''):'<div class="no-quiz">새 문제 버튼을 눌러 시작하세요.</div>'}</div>
 ${state.feedback?`<div class="feedback ${state.feedback.isCorrect?'good':'bad'}">${state.feedback.isCorrect?'정답이에요!':'다시 확인해 보세요.'} <b>정답: ${safe(q.correct)}</b></div>`:''}
 ${btn('ear-new',`${icon('refresh',17)} ${q?'다음 문제':'새 문제 시작'}`,'btn primary full')}
 </div><div class="stack"><div class="panel"><span class="mini-label">YOUR ACCURACY</span><div class="big-percent">${state.stats.total?pct+'%':'—'}</div><div class="progress-track"><div style="width:${pct}%"></div></div><p class="small-muted">누적 ${state.stats.total}문제 · 정답 ${state.stats.correct}개</p></div><div class="panel"><span class="mini-label">HOW TO PRACTICE</span><h3>권장 학습 순서</h3><div class="learning-list"><span><b>01</b> 높낮이부터 안정적으로 구별</span><span><b>02</b> 완전·장·단 음정 소리 익히기</span><span><b>03</b> 장·단 3화음의 느낌 구별</span></div></div></div></div>
 ${infoBox('청음 문제는 브라우저에서 신시사이저로 생성합니다. 헤드폰을 사용하면 음을 더 안정적으로 구별할 수 있어요.')}`;
}
const PARTS={folds:['성대 · Vocal folds','성대 조직의 주기적 진동이 기본 주파수와 배음을 가진 소리를 만들어냅니다. 공기만 마찰해서 소리가 나는 방식이 아닙니다.'],larynx:['후두 · Larynx','후두에는 성대와 연골, 발성 조절에 관여하는 근육이 있습니다. 성대 길이와 긴장 등의 변화에 관여합니다.'],tongue:['혀 · Tongue','혀의 위치와 형태는 구강과 인두의 공간을 바꿔 모음과 음색에 영향을 줍니다.'],palate:['연구개 · Soft palate','연구개의 움직임은 비강과 구강 사이의 통로를 조절하며, 특히 비음에서 중요한 역할을 합니다.'],pharynx:['인두 · Pharynx','인두는 성도의 일부입니다. 그 형태는 성도 공명 특성에 영향을 줄 수 있습니다.'],lungs:['호흡 · Respiratory system','호기 기류와 성문하 압력은 성대 진동을 구동하는 중요한 요소입니다. 과도한 힘으로 압력을 만들 필요는 없습니다.']};
const REG={m1:{title:'진성 · Modal / M1',tag:'후두 진동 기전 M1',desc:'일상적인 말소리 및 다양한 가창에서 흔히 활용되는 기전입니다. M2에 비해 진동에 참여하는 조직과 성대 접촉 패턴이 다르게 관찰됩니다. 성량이나 음색 하나로 M1 여부를 판정할 수는 없습니다.',feeling:'가슴이 울리거나 소리가 단단하다고 느끼는 사람이 있지만, 감각은 개인차가 있습니다.',source:'Roubeau, Henrich & Castellengo (2009)'},m2:{title:'가성 · Falsetto / M2',tag:'후두 진동 기전 M2',desc:'M1과 다른 성대 진동 기전으로, 진동하는 조직의 양과 접촉 양상이 달라집니다. 가성이 반드시 숨이 많이 새는 소리인 것은 아닙니다.',feeling:'소리가 가볍고 부드럽다고 느낄 수 있지만, 이것만으로 M2를 확인할 수는 없습니다.',source:'Roubeau, Henrich & Castellengo (2009)'},head:{title:'두성 · Head voice',tag:'교육 용어 · 단일 기전 아님',desc:'두성의 정의는 교육 방식과 음악 장르마다 다릅니다. M1의 고음이나 M2와 관련된 음색을 뜻하는 경우도 있어 두성이라는 명칭을 특정 성대 모양과 1:1로 연결할 수 없습니다.',feeling:'머리나 얼굴 앞쪽에서 울림을 느끼는 경우가 있습니다. 실제 소리가 머리 내부에서 만들어진다는 뜻은 아닙니다.',source:'Roubeau et al. (2009) — 레지스터 용어 구분'},mix:{title:'믹스보이스 · Mixed voice',tag:'가창 조절 개념',desc:'성대 진동 기전과 성도 공명, 음량, 음색의 조절을 결합해 음역 사이를 자연스럽게 연결하는 접근입니다. 고정된 하나의 성문 모양이나 근육 조합으로 정의하지 않습니다.',feeling:'음역을 바꿀 때 음색과 감각의 급격한 차이가 줄어든다고 느낄 수 있습니다.',source:'음성 연구 및 가창 교육의 여러 정의'}};
function anatomySvg(){const active=state.part;const color=id=>active===id?'#a5eadb':'#707b91';
 return `<svg class="anatomy" viewBox="0 0 450 340" role="img" aria-label="인체의 성도와 후두를 단순화한 측면 구조 개념도">
 <defs><linearGradient id="headBg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#34445a"/><stop offset="1" stop-color="#182535"/></linearGradient></defs>
 <rect width="450" height="340" rx="18" fill="url(#headBg)"/>
 <g opacity=".18" fill="none" stroke="#bdd8e3" stroke-width="1"><path d="M15 50h420M15 120h420M15 190h420M15 260h420"/><path d="M75 15v310M150 15v310M225 15v310M300 15v310M375 15v310"/></g>
 <!-- Schematic head silhouette, facing right -->
 <path d="M86 280Q108 247 104 204Q87 161 100 108Q120 46 197 38Q282 30 305 96Q311 118 309 129L346 150L303 159Q320 173 300 181L287 198Q287 220 258 222L250 286L172 314Z" fill="#768b98" fill-opacity=".30" stroke="#bbd2d9" stroke-width="2.4"/>
 <path d="M193 86Q256 77 294 116Q286 124 267 131L219 130Q196 114 193 86Z" fill="#77b5ca" fill-opacity=".24" stroke="${color('palate')}" stroke-width="3" data-action="anatomy-part" data-part="palate"/>
 <path d="M188 137Q243 127 300 145L299 155Q263 152 218 164L195 167Z" fill="#eda99a" fill-opacity=".32" stroke="#c5a29d" stroke-width="2"/>
 <path d="M196 173Q226 157 262 166Q270 183 239 192Q213 194 196 173Z" fill="#e68fa1" fill-opacity=".7" stroke="${color('tongue')}" stroke-width="3" data-action="anatomy-part" data-part="tongue"/>
 <path d="M169 119Q165 151 178 196Q199 219 187 283" fill="none" stroke="${color('pharynx')}" stroke-width="24" stroke-opacity=".40" data-action="anatomy-part" data-part="pharynx"/>
 <path d="M182 216Q163 227 171 251L188 272L208 254Q206 233 194 220Z" fill="#dfa38c" fill-opacity=".5" stroke="${color('larynx')}" stroke-width="3" data-action="anatomy-part" data-part="larynx"/>
 <path d="M181 248l15 0" stroke="${color('folds')}" stroke-width="7" stroke-linecap="round" data-action="anatomy-part" data-part="folds"/>
 <path d="M187 268l0 58" fill="none" stroke="#8fc0bc" stroke-width="19" stroke-opacity=".5" data-action="anatomy-part" data-part="lungs"/>
 <g font-size="11" font-weight="600" fill="#eaf5f4"><line x1="285" y1="111" x2="367" y2="67" stroke="${color('palate')}"/><text x="370" y="64" data-action="anatomy-part" data-part="palate">연구개</text><line x1="257" y1="174" x2="353" y2="201" stroke="${color('tongue')}"/><text x="356" y="204" data-action="anatomy-part" data-part="tongue">혀</text><line x1="170" y1="174" x2="48" y2="155" stroke="${color('pharynx')}"/><text x="17" y="149" data-action="anatomy-part" data-part="pharynx">인두</text><line x1="167" y1="233" x2="59" y2="223" stroke="${color('larynx')}"/><text x="17" y="218" data-action="anatomy-part" data-part="larynx">후두</text><line x1="190" y1="247" x2="295" y2="270" stroke="${color('folds')}"/><text x="300" y="275" data-action="anatomy-part" data-part="folds">성대</text><line x1="186" y1="303" x2="278" y2="314" stroke="${color('lungs')}"/><text x="285" y="320" data-action="anatomy-part" data-part="lungs">기도</text></g>
 </svg>`;
}
function resonanceSvg(){const j=state.jaw,t=state.tongue,l=state.lips;return `<svg class="resonance-graphic" viewBox="0 0 430 230" role="img" aria-label="혀, 턱, 입술 변수에 반응하는 교육용 성도 단면 개념도"><rect x="1" y="1" width="428" height="228" rx="14" fill="var(--res-bg)"/><path d="M80 25Q165 4 265 35Q305 47 330 88L340 105L311 113L290 122" fill="none" stroke="#a8bdc7" stroke-width="12" stroke-linecap="round"/><path d="M80 197Q160 221 255 190Q290 ${208+j*.23} 314 ${138+j*.42}" fill="none" stroke="#b7a5aa" stroke-width="15" stroke-linecap="round"/><path d="M95 110Q145 ${95-t*.55} 195 ${133-t*.55}Q250 ${151-t*.32} 284 ${147-t*.14}" stroke="#e9a6a6" stroke-width="28" stroke-linecap="round" fill="none"/><path d="M82 44Q60 96 90 169" fill="none" stroke="#85cdbd" stroke-width="19" stroke-linecap="round"/><path d="M330 ${101-l*.07}l${-l*.30} 0M330 ${135+l*.09}l${-l*.30} 0" stroke="#e3a6a9" stroke-width="11" stroke-linecap="round"/><g fill="var(--muted)" font-size="12"><text x="28" y="17">인두 방향</text><text x="336" y="120">입술 방향</text></g></svg>`}
function voiceSpectrumSVG(){
 const f=getVoiceFormants({jaw:state.jaw,tongue:state.tongue,lips:state.lips,f0:state.vocalF0,breath:state.vocalBreath,register:state.reg});
 const W=500,H=135,min=100,max=4000;
 const x=freq=>34+(freq-min)/(max-min)*(W-52);
 const strength=freq=>[[f.f1,120,.7],[f.f2,180,.6],[f.f3,260,.35]].reduce((p,[center,bw,a])=>p+a*Math.exp(-.5*((freq-center)/bw)**2),.06);
 const line=Array.from({length:130},(_,i)=>{const freq=min+(max-min)*i/129;return `${i?'L':'M'}${x(freq).toFixed(1)} ${(H-20-strength(freq)*85).toFixed(1)}`;}).join(' ');
 return `<svg class="voice-spectrum" viewBox="0 0 ${W} ${H}" aria-label="교육용 F1 F2 F3 공명 분포 예시" role="img"><rect x="0" y="0" width="${W}" height="${H}" rx="12" fill="var(--res-bg)"/><path d="M34 15V115H482" stroke="var(--muted)" stroke-width="1" fill="none"/><path d="${line}" stroke="var(--accent)" stroke-width="3" fill="none"/>${[[f.f1,'F1'],[f.f2,'F2'],[f.f3,'F3']].map(([v,n])=>`<path d="M${x(v)} 20V116" stroke="#95c8d2" stroke-dasharray="4 4" stroke-width="1"/><text x="${x(v)}" y="15" fill="var(--muted)" text-anchor="middle" font-size="11">${n}</text>`).join('')}<text x="34" y="130" font-size="10" fill="var(--muted)">100 Hz</text><text x="480" y="130" text-anchor="end" font-size="10" fill="var(--muted)">4000 Hz</text></svg>`;
}
function voiceStats(){const f=getVoiceFormants({jaw:state.jaw,tongue:state.tongue,lips:state.lips,f0:state.vocalF0,breath:state.vocalBreath,register:state.reg});return `<span>F1 <strong>${f.f1} Hz</strong></span><span>F2 <strong>${f.f2} Hz</strong></span><span>F3 <strong>${f.f3} Hz</strong></span>`;}
function vocalViewNav(){const views=[['science','보컬 과학','해부학과 발성 원리'],['listen','음색 실험실','소리 듣기와 공명'],['practice','목소리 분석·연습','마이크와 녹음']];return `<div class="voice-tabs" role="group" aria-label="보컬 연구실 모드">${views.map(([k,t,d])=>`<button data-action="vocal-view" data-view="${k}" class="voice-tab ${state.vocalView===k?'on':''}" aria-pressed="${state.vocalView===k}"><strong>${t}</strong><span>${d}</span></button>`).join('')}</div>`;}
function lessonPanel(){const lesson=VOICE_LESSONS.find(x=>x.id===state.vocalLesson)||VOICE_LESSONS[0];return `<section class="panel voice-lesson"><div class="panel-head"><div><span class="mini-label">EVIDENCE LIBRARY / 08 TOPICS</span><h3>논문·연구 기반 발성 원리</h3></div></div><div class="lesson-layout"><div class="lesson-topics">${VOICE_LESSONS.map(x=>`<button class="lesson-topic ${x.id===lesson.id?'selected':''}" data-action="voice-lesson" data-id="${x.id}"><small>${x.category}</small><strong>${x.title}</strong></button>`).join('')}</div><article class="lesson-article"><span class="pill accent">${lesson.category}</span><h3>${lesson.title}</h3><p>${lesson.summary}</p><div class="lesson-points">${lesson.points.map((p,i)=>`<div><span>${String(i+1).padStart(2,'0')}</span><p>${p}</p></div>`).join('')}</div><a href="${lesson.url}" target="_blank" rel="noopener noreferrer" class="research-link">근거 확인 · ${lesson.source} ↗</a></article></div></section>`;}
function vocalScience(){const reg=REG[state.reg];return `<div class="voice-section-marker"><span class="pill accent">01 / ANATOMY &amp; MECHANISMS</span><span>측정된 사실과 교육적 비유를 구분합니다.</span></div>
<div class="two-col top-align"><section class="panel"><div class="panel-head"><div><span class="mini-label">INTERACTIVE ANATOMY</span><h3>발성 기관 단면 탐색</h3></div><span class="pill">교육용 그림</span></div>${anatomySvg()}<div class="chip-row">${Object.entries(PARTS).map(([k,v])=>`<button class="chip ${state.part===k?'on':''}" data-action="anatomy-part" data-part="${k}">${v[0].split(' · ')[0]}</button>`).join('')}</div><div class="anatomy-info"><strong>${PARTS[state.part][0]}</strong><p>${PARTS[state.part][1]}</p></div><p class="footnote">인체 비율을 정확히 재현한 의료 영상이 아니라 위치 관계를 설명하는 단면 개념도입니다.</p></section>
<section class="panel"><div class="panel-head"><div><span class="mini-label">ROTATABLE LARYNX</span><h3>성대·후두 입체 관찰</h3></div><span class="pill">3D 개념 모델</span></div><canvas id="larynx-canvas" role="img" aria-label="교육용 후두 3D 입체 구조: 회전, 기울기, 확대, 성문 개폐 관찰"></canvas><label class="voice-target-select">구조 강조<select id="larynx-focus">${[['all','전체 구조'],['folds','진성대'],['falseFold','전정주름'],['cartilage','연골'],['ary','피열연골']].map(([k,t])=>`<option value="${k}" ${state.larynxFocus===k?'selected':''}>${t}</option>`).join('')}</select></label><div class="voice-view-controls">${btn('larynx-animate',state.larynxAnimating?'⏸ 느린 움직임 정지':'▶ 성대 움직임 재생','btn secondary small')}${btn('larynx-reset','시야 초기화','btn ghost dark small')}</div><div class="sliders">${[['larynxYaw','좌우 회전','°',-115,115],['larynxPitch','위아래 시야','°',10,80],['larynxZoom','확대','%',72,130],['glottalOpen','성문 열림','%',0,100]].map(([k,t,u,mi,ma])=>`<label class="slider-label"><span>${t}</span><b id="v-${k}">${state[k]}${u}</b><input type="range" min="${mi}" max="${ma}" value="${state[k]}" data-slider="${k}"></label>`).join('')}</div><p class="footnote">느린 애니메이션은 음향적 진동 속도와 무관하며 실제 후두 내시경 영상이 아닙니다. 개인의 성대 접촉 상태를 표시하지 않습니다.</p></section></div>
<section class="panel"><div class="panel-head"><div><span class="mini-label">LARYNGEAL MECHANISMS</span><h3>진성·가성·두성·믹스의 차이</h3></div></div><div class="register-grid">${[['m1','진성 / M1'],['m2','가성 / M2'],['head','두성'],['mix','믹스']].map(([k,label])=>`<button class="register-option ${state.reg===k?'selected':''}" data-action="register" data-register="${k}">${label}</button>`).join('')}</div><div class="voice-reg-comparison"><div><span class="pill accent">${reg.tag}</span><h3>${reg.title}</h3><p>${reg.desc}</p><div class="sensation"><b>사람이 느낄 수 있는 감각</b><p>${reg.feeling}</p></div><p class="footnote">용어와 기전의 구분 근거: Roubeau et al., 2009. “두성”과 “믹스”는 단일한 생리학적 구조가 아닙니다.</p></div><div class="voice-register-figure"><div class="folds-schematic ${state.reg}"><svg viewBox="0 0 250 124" role="img" aria-label="성대 구조 차이를 설명하기 위한 개념도"><path d="M21 21Q104 38 124 112Q148 38 229 21L229 117L21 117Z" fill="#d38f92" opacity=".78"/><path d="M${state.reg==='m2'?114:121} 49Q124 72 ${state.reg==='m2'?114:121} 106L${state.reg==='m2'?136:127} 106Q126 70 ${state.reg==='m2'?136:127} 49" fill="#303c4f" opacity=".95"/></svg></div><small>고정된 실제 성문 형태를 뜻하지 않습니다</small></div></div></section>
${lessonPanel()}
<section class="panel"><div class="panel-head"><div><span class="mini-label">CHECK YOUR KNOWLEDGE</span><h3>발성 과학 이해도 퀴즈</h3></div><span class="pill">${(state.voiceQuizIndex%VOICE_QUIZ.length)+1} / ${VOICE_QUIZ.length} · 정답 ${state.voiceQuizScore}</span></div>${(()=>{const q=VOICE_QUIZ[state.voiceQuizIndex%VOICE_QUIZ.length];return `<p class="voice-quiz-question">${q.q}</p><div class="voice-quiz-answers">${q.answers.map((t,i)=>`<button ${state.voiceQuizChoice!==null?'disabled':''} class="answer ${state.voiceQuizChoice!==null?(i===q.correct?'correct':i===state.voiceQuizChoice?'incorrect':''):''}" data-action="voice-quiz-answer" data-index="${i}">${t}</button>`).join('')}</div>${state.voiceQuizChoice!==null?`<div class="voice-quiz-explain" role="status">${state.voiceQuizChoice===q.correct?'정답!':'다시 확인해 보세요.'} ${q.why}</div>${btn('voice-quiz-next','다음 개념 →','btn secondary small')}`:''}`})()}</section>
${infoBox('마이크만으로 후두 진동 기전·성대 접촉률·음성 건강을 판정할 수 없습니다. 몸의 감각이나 “소리가 앞으로 간다” 같은 표현도 해부학적 사실과 별도로 다룹니다.')}`;}
function vocalListen(){return `<div class="voice-section-marker"><span class="pill accent">02 / SOURCE &amp; FILTER LAB</span><span>변수를 바꾸어 소리의 변화 자체를 들어보세요.</span></div><div class="two-col top-align"><section class="panel"><div class="panel-head"><div><span class="mini-label">VOCAL TRACT CONTROLS</span><h3>성도 공명 실험실</h3></div>${btn('formant-play',`${icon('play',16)} 합성음 듣기`,'btn primary small')}</div><p class="small-muted">모음 프리셋을 선택하거나 슬라이더를 움직이면 그림·공명 필터의 값·음색이 함께 바뀝니다.</p><div class="voice-preset-row">${Object.entries(VOWEL_PRESETS).map(([key,p])=>`<button class="chip ${state.vowelPreset===key?'on':''}" data-action="voice-vowel" data-vowel="${key}">${p.label.split(' · ')[0]}</button>`).join('')}</div>${resonanceSvg()}<div class="sliders">${[['jaw','턱 열림',0,100],['tongue','혀 위치 (교육용)',0,100],['lips','입술 모음',0,100],['vocalF0','기본 주파수 F0',90,550],['vocalBreath','기식 소음 혼합',0,100]].map(([k,title,mi,ma])=>`<label class="slider-label"><span>${title}</span><b id="v-${k}">${state[k]}${k==='vocalF0'?' Hz':'%'}</b><input type="range" min="${mi}" max="${ma}" step="${k==='vocalF0'?5:1}" value="${state[k]}" data-slider="${k}"></label>`).join('')}</div><div id="formant-values" class="formant-values">${voiceStats()}</div><div id="formant-spectrum">${voiceSpectrumSVG()}</div><p class="footnote">슬라이더 수치와 F1·F2·F3는 반응형 교육 모델 계산값입니다. 실제 사람의 특정 모음·인두 길이·성대 상태를 측정한 값이 아닙니다.</p></section>
<section class="panel"><div class="panel-head"><div><span class="mini-label">HOW SOUND IS FORMED</span><h3>소리가 만들어지는 4단계</h3></div></div><div class="voice-process"><div><span>01</span><b>호기 흐름</b><p>폐에서 나온 기류가 성문하 압력 차를 만듭니다.</p></div><div><span>02</span><b>성대 진동</b><p>주기적인 성대 진동이 F0와 배음을 포함하는 음원을 만듭니다.</p></div><div><span>03</span><b>성도 공명</b><p>혀·입술·턱·인두 공간이 여러 주파수 성분을 다르게 강조합니다.</p></div><div><span>04</span><b>들리는 음색</b><p>강화된 배음, 기식 성분, 발음이 합쳐져 우리가 듣는 소리가 됩니다.</p></div></div><div class="voice-audio-pair">${btn('voice-ex-m1','▶ M1 경향 합성 예시','btn secondary')}${btn('voice-ex-m2','▶ M2 경향 합성 예시','btn secondary')}</div><p class="footnote">두 버튼은 발성 기전의 정확한 음향 서명을 재현하는 자료가 아니며 단순화한 합성음 비교입니다. “자연스러운 진짜 보컬” 음원을 가장하지 않습니다.</p><div class="vocal-guidance"><b>왜 소리가 전자음처럼 들릴 수 있나요?</b><p>사람마다 성대의 주기성·불규칙성·성도·발음·감정이 달라요. 현재 합성 엔진은 연구 내용을 이해하기 위한 음향 데모로, 실제 사람의 발성과 완전히 같지는 않습니다. 아래 연습실에서 직접 녹음한 목소리로 비교하는 것이 더 정확해요.</p></div></section></div>
<section class="panel"><span class="mini-label">LISTENING CHECK</span><h3>음색을 판단할 때 확인할 질문</h3><div class="voice-check-grid"><article><b>기본 주파수가 바뀌었나?</b><p>F0를 바꾸면 음높이가 달라져요. 같은 F0라도 음색은 다를 수 있어요.</p></article><article><b>모음이 바뀌었나?</b><p>입·혀·턱 형태가 바뀌면 공명 에너지의 분포가 달라져요.</p></article><article><b>숨이 더 섞인 것처럼 들리나?</b><p>기식성은 여러 원인과 음향 지표가 관련돼 있어요. 느낌만으로 성대 접촉을 단정하지 마세요.</p></article></div></section>`;}
function vocalPractice(){const tgt=Number.isInteger(state.voiceTarget)?state.voiceTarget:60;return `<div class="voice-section-marker"><span class="pill accent">03 / LISTEN &amp; COMPARE</span><span>마이크는 기기 안에서 분석하고, 녹음은 서버로 전송하지 않습니다.</span></div><div class="two-col top-align"><section class="panel mic-panel"><div class="panel-head"><div><span class="mini-label">LIVE AUDIO FEATURES</span><h3>내 목소리 실시간 관찰</h3></div><span class="dot-status ${state.micActive?'active':''}" id="mic-status">${state.micActive?'측정 중':'대기 중'}</span></div><div class="voice-measures"><div><span>감지된 음높이</span><strong id="pitch-note">—</strong><small id="pitch-freq">마이크 대기</small></div><div><span>목표음과 차이</span><strong id="pitch-cents">—</strong><small>cents · 감지되는 경우</small></div><div><span>입력 레벨</span><strong id="voice-level">—</strong><small>dBFS · 보정되지 않음</small></div><div><span>주파수 중심</span><strong id="voice-centroid">—</strong><small>Hz · 에너지 분포</small></div></div><div class="pitch-graph"><svg viewBox="0 0 420 108" preserveAspectRatio="none"><path d="M0 54H420M0 27H420M0 81H420" stroke="var(--line)" stroke-dasharray="4 5"/><polyline id="pitch-line" points="" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="voice-live-panel"><span class="mini-label">SPECTRUM · 90–5000 Hz</span><svg id="mic-spectrum" viewBox="0 0 420 92" role="img" aria-label="마이크 주파수 스펙트럼"><rect width="420" height="92" rx="9" fill="var(--res-bg)"/><g id="mic-bands"></g></svg></div><div class="voice-acoustic-text" id="voice-interpretation" aria-live="polite">마이크를 켜면 음향적 특성을 설명합니다. 발성 기전은 판정하지 않습니다.</div>${btn(state.micActive?'mic-stop':'mic-start',`${icon(state.micActive?'stop':'mic',17)} ${state.micActive?'마이크 중지':'마이크 켜기'}`,'btn '+(state.micActive?'secondary':'primary')+' full')}<div id="mic-error" class="error-text"></div><p class="footnote">음높이 추정·스펙트럼은 환경 소음 및 마이크 설정에 영향을 받습니다. “두성·믹스” 자동 판정이나 치료·진단 기능은 제공하지 않습니다.</p></section>
<section class="panel"><div class="panel-head"><div><span class="mini-label">REFERENCE PIANO</span><h3>기준음을 듣고 비교</h3></div></div><p class="small-muted">편안한 음역의 목표음을 선택해 피아노 소리를 들어본 뒤, 자신의 소리와 비교해 보세요. 불편할 정도로 높은 음을 낼 필요는 없습니다.</p><label class="voice-target-select">기준음<select id="voice-target">${Array.from({length:25},(_,i)=>48+i).map(m=>`<option value="${m}" ${m===tgt?'selected':''}>${['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'][m%12]}${Math.floor(m/12)-1} · ${Math.round(midiToFrequency(m))}Hz</option>`).join('')}</select></label>${btn('voice-target-play',`${icon('play',17)} 기준음 연주`,'btn primary full')}<div class="vocal-guidance"><strong>측정 가능한 것</strong><p>주파수·음높이 변화·상대적인 주파수 에너지 분포</p><strong>이것만으로는 알 수 없는 것</strong><p>CT·TA의 실제 수축 정도, 성문 접촉률, 진성·가성의 확정적인 구분, 목소리의 건강 상태</p></div><p class="footnote">입력 레벨은 dBFS이며 실제 음압(dB SPL)이 아닙니다. 마이크 장치와 거리에 따라 수치가 변할 수 있어요.</p></section></div>
<section class="panel"><div class="panel-head"><div><span class="mini-label">TAKE A / TAKE B</span><h3>녹음해서 직접 듣고 판단하기</h3></div></div><p class="small-muted">같은 문장·멜로디를 편안한 목소리로 두 번 녹음한 다음, 타이밍·음높이·발음·음색을 비교해 봐. 녹음 데이터는 현재 탭의 메모리에만 존재해.</p><div class="record-takes">${['A','B'].map(slot=>`<div class="record-take"><strong>Take ${slot}</strong>${btn('record-toggle',recordingSlot()===slot?'■ 녹음 정지':'● 녹음 시작',recordingSlot()===slot?'btn secondary':'btn primary',`data-slot="${slot}"`)}${clipUrl(slot)?`<audio controls preload="metadata" src="${clipUrl(slot)}" aria-label="Take ${slot} 재생"></audio><a class="btn secondary record-download" href="${clipUrl(slot)}" download="${clipDownloadName(slot)}">Take ${slot} 파일 저장</a>`:'<span class="small-muted">아직 녹음 없음</span>'}</div>`).join('')}</div><div class="error-text" id="record-error"></div><p class="footnote">브라우저에 따라 다운로드 파일의 실제 형식이 webm이나 mp4일 수 있습니다. 저장하지 않은 녹음은 새로고침하면 사라집니다. A/B 재생 결과만으로 발성 기전은 판정할 수 없습니다.</p></section>
<section class="panel"><div class="panel-head"><div><span class="mini-label">LESSON REVIEW</span><h3>내가 들은 차이 기록</h3></div></div><label class="voice-note-label" for="voice-observation">선생님 피드백, 발음 변화, 내 감각, 소리에서 확인된 특징을 구분해서 기록해 보세요.</label><textarea id="voice-observation" rows="5" maxlength="1800" placeholder="예: Take A는 음정 진입이 빨랐고, Take B는 발음이 선명하게 들렸어. 이건 내 청각적 판단이며 성대의 실제 움직임을 직접 측정한 건 아냐.">${safe(state.voiceNotes)}</textarea><div class="voice-note-actions">${btn('voice-note-save','관찰 메모 저장','btn primary small')}<span id="voice-note-status" role="status">이 기기의 브라우저에만 저장</span></div></section>
${infoBox('녹음이나 분석 중 통증·어지러움·목소리 이상이 느껴지면 즉시 멈추세요. 강하게 밀어붙이거나 오래 소리를 유지해야 하는 훈련은 필요하지 않습니다.')}`;}
function vocal(){return `${pageHeader('VOICE SCIENCE / ALPHA 0.4','보컬 연구실','해부학·음향학·자기 목소리 관찰을 한 흐름으로 연결하는 학습 공간입니다.')}${vocalViewNav()}${state.vocalView==='science'?vocalScience():state.vocalView==='listen'?vocalListen():vocalPractice()}`;}
function compose(){const chords=chordsOf(state.root,state.mode,true);
 return `${pageHeader('COMPOSITION STUDIO','코드 스튜디오','조성에 맞는 코드를 배치하고 4마디 진행을 직접 들어보세요.')}
 <div class="panel"><div class="panel-head"><div><span class="mini-label">PROGRESSION BUILDER</span><h3>${safe(state.root)} ${state.mode==='major'?'Major':'Natural minor'} · 4 bars</h3></div><span class="pill">4/4 · 7th chords</span></div>
 <div class="progression-grid">${state.compDegrees.map((degree,i)=>`<div class="progression-slot ${state.playing===i?'playing':''}"><span class="mini-label">BAR ${String(i+1).padStart(2,'0')}</span><strong>${safe(chords[degree].name)}</strong><small>${chords[degree].roman}</small><select aria-label="${i+1}마디 코드 선택" data-comp-slot="${i}">${chords.map((c,d)=>`<option value="${d}" ${d===degree?'selected':''}>${safe(c.roman)} · ${safe(c.name)}</option>`).join('')}</select></div>`).join('')}</div>
 <div class="studio-controls"><label class="bpm-control">TEMPO <input type="number" id="bpm" value="${state.bpm}" min="40" max="220" step="1"> BPM</label><div class="studio-actions">${btn('comp-play',`${icon('play',17)} 진행 재생`,'btn primary')}${btn('comp-stop',`${icon('stop',17)} 정지`,'btn secondary')}${btn('comp-random',`${icon('refresh',17)} 랜덤`,'btn ghost dark')}</div></div>
 ${piano(chords[state.compDegrees[0]].notes)}<p class="footnote">앱에 포함된 실제 피아노 샘플로 코드를 재생합니다. 음원이 아직 준비되지 않았을 때만 합성음으로 대체됩니다. 멜로디 MIDI 저장은 아래 피아노 롤에서 사용할 수 있습니다.</p></div>
 <div class="panel"><div class="panel-head"><div><span class="mini-label">MELODY PIANO ROLL</span><h3>4마디 멜로디 입력</h3></div><div class="studio-actions">${btn('midi-download','MIDI 저장','btn secondary')}${btn('roll-clear','멜로디 지우기','btn ghost dark')}</div></div><p class="small-muted">격자를 눌러 멜로디를 한 박자씩 입력하고, 코드와 함께 연주하거나 MIDI로 내보낼 수 있어요. 옥타브 C3~B5.</p>${pianoRollSVG(state.compDegrees.map(d=>chordMidi(state.root,state.mode,d,true)),state.melodyNotes)}<div class="small-muted">현재 입력: ${state.melodyNotes.length}음 · MIDI는 Logic Pro와 GarageBand에서 열 수 있습니다.</div></div>
 <div class="two-col"><div class="panel"><span class="mini-label">QUICK START</span><h3>진행 프리셋</h3><div class="preset-list">${[['1–5–6–4',[0,4,5,3]],['1–6–4–5',[0,5,3,4]],['2–5–1–6',[1,4,0,5]]].map(([label,val],i)=>`<button class="preset" data-action="comp-preset" data-id="${i}"><span>${label}</span>${icon('chevron',18)}</button>`).join('')}</div></div><div class="panel"><span class="mini-label">HARMONIC CONTEXT</span><h3>진행의 기능 분석</h3><div class="vertical-chords">${state.compDegrees.map((d,i)=>`<div><span>${String(i+1).padStart(2,'0')}</span><b>${safe(chords[d].name)}</b><small>${chords[d].roman}</small></div>`).join('')}</div></div></div>`;
}
function journal(){const sorted=[...state.entries].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,12),today=new Date().toLocaleDateString('sv-SE');
 return `${pageHeader('PRACTICE JOURNAL','연습 기록','레슨에서 배운 내용과 연습 목표를 남기고 기록을 계속 쌓아보세요.')}
 <div class="stat-grid"><div class="stat"><div class="stat-label">${icon('clock',16)} 전체 연습 시간</div><div class="stat-number">${allMinutes()}<small>분</small></div></div><div class="stat"><div class="stat-label">${icon('journal',16)} 기록 수</div><div class="stat-number">${state.entries.length}<small>개</small></div></div><div class="stat"><div class="stat-label">${icon('target',16)} 오늘의 기록</div><div class="stat-number">${recentMinutes()}<small>분</small></div></div></div>
 <div class="two-col top-align"><div class="panel"><span class="mini-label">NEW ENTRY</span><h3>연습 내용 기록</h3><form id="entry-form" class="entry-form"><label>날짜<input type="date" name="date" value="${today}" required></label><div class="form-pair"><label>연습 분야<select name="category"><option>보컬</option><option>기타</option><option>청음</option><option>화성학</option><option>작곡</option><option>기타 연습</option></select></label><label>시간 (분)<input type="number" name="minutes" min="1" max="600" value="30" required></label></div><label>레슨 노트 · 연습 메모<textarea name="memo" rows="4" maxlength="1500" placeholder="오늘의 목표, 느낀 점, 다음 레슨 때 확인할 내용..."></textarea></label><button type="submit" class="btn primary full">${icon('check',17)} 기록 저장</button></form></div>
 <div class="panel"><div class="panel-head"><div><span class="mini-label">HISTORY</span><h3>최근 연습</h3></div></div><div class="entry-list">${sorted.length?sorted.map(e=>`<div class="entry"><div><span class="pill">${safe(e.category)}</span><small>${safe(e.date)} · ${Number(e.minutes)}분</small></div><p>${safe(e.memo)||'메모 없음'}</p><button class="text-btn" data-action="delete-entry" data-id="${e.id}">삭제</button></div>`).join(''):'<div class="empty-state">아직 저장된 기록이 없습니다.<br>첫 번째 연습을 기록해 보세요.</div>'}</div></div></div>
 <div class="panel"><div class="panel-head"><div><span class="mini-label">DATA MANAGEMENT</span><h3>기록 백업</h3></div></div><div class="backup-controls">${btn('export',`${icon('download',17)} JSON 내보내기`,'btn secondary')}<label class="btn secondary file-btn">JSON 가져오기<input type="file" id="import-file" accept=".json,application/json" hidden></label></div><p class="footnote">데이터는 현재 브라우저의 로컬 저장소에만 남습니다. 다른 기기로 옮길 때는 JSON을 내보낸 뒤 가져오세요. 새 파일을 가져오면 기존 기록과 청음 통계가 교체됩니다.</p></div>`;
}
function modelOptions(){return {yaw:state.larynxYaw,pitch:state.larynxPitch,zoom:state.larynxZoom/100,openness:state.glottalOpen,focus:state.larynxFocus};}
function updateLarynx(){if(larynxStop){larynxStop();larynxStop=null;}const canvas=$('#larynx-canvas');if(!canvas)return;
 if(state.larynxAnimating)larynxStop=animateLarynx(canvas,modelOptions);else drawLarynx(canvas,modelOptions());}
function updatePianoIndicator(){const el=$('#piano-indicator');if(!el)return;const p=pianoStatus();el.textContent=p.ready?'● 실제 피아노 음원 준비됨':`피아노 샘플 ${p.loaded}/${p.total} 로딩 중${p.failed?' · 일부 오류':''}`;}
function render(){
 if(larynxStop){larynxStop();larynxStop=null;}
 document.documentElement.setAttribute('data-theme',state.theme);
 const content={home,theory,guitar,ear,vocal,compose,journal}[state.tab]();
 $('#app').innerHTML=`<div class="shell"><aside class="sidebar"><div class="brand"><div class="brand-icon">${icon('music',25)}</div><div><strong>Music Lab</strong><small>Explore your sound.</small></div></div><div class="sidebar-label">WORKSPACE</div><nav class="side-nav" aria-label="기능 메뉴">${NAV.map(([id,t,ico])=>`<button class="nav-link ${state.tab===id?'selected':''}" data-action="nav-${id}">${icon(ico,19)}<span>${t}</span>${state.tab===id?'<i></i>':''}</button>`).join('')}</nav><div class="sidebar-bottom"><div class="research-badge"><span>${icon('spark',20)}</span><strong>Keep exploring.</strong><small>Sound is a science<br>and an art.</small></div><div class="sidebar-version">ALPHA 0.4 · 2026</div></div></aside>
 <div class="main-shell"><header class="topbar"><div class="breadcrumb"><span>WORKSPACE</span>${icon('chevron',15)}<strong>${title()}</strong></div><div class="top-controls"><span class="piano-indicator" id="piano-indicator" aria-live="polite">피아노 준비 중</span><label class="top-field">KEY<select id="global-key" aria-label="조성 으뜸음 선택">${rootOptions()}</select></label><label class="top-field">SCALE<select id="global-mode" aria-label="장조 단조 선택">${modeOptions()}</select></label><button class="theme-toggle" data-action="toggle-theme" aria-label="테마 전환">${icon(state.theme==='dark'?'sun':'moon',19)}</button></div></header><main class="content">${content}<footer class="footer">MUSIC LAB / Built for musicians <span>교육용 학습 앱 · 발성 의료 진단 도구가 아닙니다.</span></footer></main></div></div>
 <nav class="bottom-nav" aria-label="모바일 메뉴">${[['home','홈','home'],['theory','이론','theory'],['guitar','기타','guitar'],['ear','청음','ear'],['vocal','보컬','vocal'],['compose','작곡','compose'],['journal','기록','journal']].map(([id,t,ico])=>`<button class="${state.tab===id?'selected':''}" data-action="nav-${id}">${icon(ico,19)}<span>${t}</span></button>`).join('')}</nav>`;
 if(state.tab==='vocal')requestAnimationFrame(()=>updateLarynx());
 updatePianoIndicator();
}
function navTo(id){if(recordingSlot())stopRecording();if(larynxStop){larynxStop();larynxStop=null;}state.larynxAnimating=false;if(!NAV.some(n=>n[0]===id))return;if(micStop){micStop();micStop=null;state.micActive=false;}if(seqStop){seqStop();seqStop=null}state.playing=-1;state.tab=id;state.micError='';render();window.scrollTo({top:0,behavior:'instant'});}
function playScale(){const sc=scaleOf(state.root,state.mode);arpeggio([...sc.notes.map(n=>noteToMidi(n,4)),noteToMidi(sc.notes[0],5)],.19)}
function handleAction(target,e){const a=target.dataset.action;
 if(a?.startsWith('nav-')){navTo(a.slice(4));return}
 if(a==='toggle-theme'){state.theme=state.theme==='dark'?'light':'dark';saveSettings();render()}
 else if(a==='play-midi'){note(Number(target.dataset.midi),undefined,.55)}
 else if(a==='play-scale')playScale();
 else if(a==='play-guitar-scale'){const ints=INTERVALS[state.guitarScale]||INTERVALS.major;arpeggio([...ints.map(i=>60+pitchClass(state.root)+i),72+pitchClass(state.root)],.19)}
 else if(a==='select-chord'||a==='guitar-chord'){state.selectedChord=Number(target.dataset.index);if(a==='guitar-chord')state.guitarDisplay='chord';render()}
 else if(a==='play-chord')chord(chordMidi(state.root,state.mode,state.selectedChord,state.seventh));
 else if(a==='ear-mode'){state.earMode=target.dataset.mode;state.question=null;state.feedback=null;state.melodyInputs=[];state.earSession={completed:0,correct:0};render()}
 else if(a==='ear-reference'){note(60,undefined,1.0)}
 else if(a==='train-key'){
  const midi=Number(target.dataset.midi),q=state.question;
  if(!Number.isInteger(midi))return;
  note(midi,undefined,.43);
  if(!q||state.feedback||!['staff','read','melody'].includes(q.kind))return;
  if(q.kind==='melody'){
   state.melodyInputs.push(midi);
   if(state.melodyInputs.length>=q.notes.length){
    const pass=q.notes.every((m,i)=>m===state.melodyInputs[i]);
    state.feedback={chosen:state.melodyInputs.join(','),isCorrect:pass};storeTraining(pass,'melody');
   }
  }else{
   const pass=midi===q.notes[0];state.feedback={chosen:String(midi),isCorrect:pass};storeTraining(pass,q.kind);
  }
  render();
 }
 else if(a==='ear-new'){
  if(state.earSession.completed>=10){state.earSession={completed:0,correct:0};}
  newQuestion();render();if(state.earMode!=='read')playQuestion();
 }
 else if(a==='ear-play'){playQuestion();}
 else if(a==='ear-answer'){
  const q=state.question;if(!q||state.feedback)return;
  const selected=target.dataset.answer,isCorrect=selected===q.correct;
  state.feedback={chosen:selected,isCorrect};state.stats.total++;if(isCorrect)state.stats.correct++;
  localStorage.setItem('musiclab-ear',JSON.stringify(state.stats));render();
 }
 else if(a==='vocal-view'){
  const view=target.dataset.view;if(!['science','listen','practice'].includes(view))return;
  if(micStop){micStop();micStop=null;state.micActive=false;}
  if(recordingSlot())stopRecording();state.larynxAnimating=false;state.vocalView=view;render();
 }
 else if(a==='voice-lesson'){state.vocalLesson=target.dataset.id;render()}
 else if(a==='voice-vowel'){
  const key=target.dataset.vowel,p=VOWEL_PRESETS[key];if(!p)return;
  state.vowelPreset=key;state.jaw=p.jaw;state.tongue=p.tongue;state.lips=p.lips;render();
 }
 else if(a==='larynx-reset'){state.larynxYaw=20;state.larynxPitch=43;state.larynxZoom=100;state.glottalOpen=30;state.larynxAnimating=false;render()}
 else if(a==='voice-ex-m1'||a==='voice-ex-m2'){demoFormant(state.jaw,state.tongue,state.lips,{f0:state.vocalF0,breath:a==='voice-ex-m1'?9:27,register:a==='voice-ex-m1'?'m1':'m2'})}
 else if(a==='voice-quiz-answer'){
  if(state.voiceQuizChoice!==null)return;const pick=Number(target.dataset.index);
  if(!Number.isInteger(pick)||pick<0||pick>=3)return;
  state.voiceQuizChoice=pick;if(pick===VOICE_QUIZ[state.voiceQuizIndex%VOICE_QUIZ.length].correct)state.voiceQuizScore++;
  render();
 }
 else if(a==='voice-quiz-next'){state.voiceQuizChoice=null;state.voiceQuizIndex++;if(state.voiceQuizIndex%VOICE_QUIZ.length===0)state.voiceQuizScore=0;render()}
 else if(a==='voice-target-play'){note(state.voiceTarget,undefined,.95)}
 else if(a==='voice-note-save'){state.voiceNotes=($('#voice-observation')?.value||'').slice(0,1800);localStorage.setItem('musiclab-voice-notes',JSON.stringify(state.voiceNotes));const status=$('#voice-note-status');if(status)status.textContent='✓ 이 기기에 저장됨'}
 else if(a==='anatomy-part'){state.part=target.dataset.part;render()}
 else if(a==='register'){state.reg=target.dataset.register;render()}
 else if(a==='larynx-animate'){state.larynxAnimating=!state.larynxAnimating;render()}
 else if(a==='formant-play'){demoFormant(state.jaw,state.tongue,state.lips,{f0:state.vocalF0,breath:state.vocalBreath,register:state.reg})}
 else if(a==='record-toggle'){
  if(micStop){micStop();micStop=null;state.micActive=false;}
  toggleRecord(target.dataset.slot,()=>render()).catch(err=>{const node=$('#record-error');if(node)node.textContent=err.message||'녹음 시작에 실패했습니다.'});
 }
 else if(a==='mic-start')enableMic();
 else if(a==='mic-stop'){if(micStop)micStop();micStop=null;state.micActive=false;state.micError='';render()}
 else if(a==='comp-play'){
  if(seqStop)seqStop();const degrees=state.compDegrees.map(d=>chordMidi(state.root,state.mode,d,true));
  state.playing=0;render();seqStop=playSequence(degrees,state.bpm,i=>{
   state.playing=i;
   document.querySelectorAll('.progression-slot').forEach((el,j)=>el.classList.toggle('playing',i===j));
   if(i===-1)seqStop=null;
  },state.melodyNotes);
 }
 else if(a==='midi-download'){downloadMidi(buildMidi(state.root,state.mode,state.compDegrees,state.bpm,state.melodyNotes))}
 else if(a==='roll-clear'){state.melodyNotes=[];localStorage.setItem('musiclab-melody','[]');render()}
 else if(a==='roll-click'){
  const svg=target.closest('svg');if(!svg)return;const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const p=pt.matrixTransform(svg.getScreenCTM().inverse());
  const step=Math.floor((p.x-53)/32),midi=83-Math.floor((p.y-18)/10);if(step<0||step>15||midi<48||midi>83)return;
  const j=state.melodyNotes.findIndex(x=>x.step===step&&x.midi===midi);
  if(j>=0)state.melodyNotes.splice(j,1);else{state.melodyNotes=state.melodyNotes.filter(x=>x.step!==step);state.melodyNotes.push({step,midi})}
  localStorage.setItem('musiclab-melody',JSON.stringify(state.melodyNotes));note(midi);render();
 }
 else if(a==='comp-stop'){if(seqStop)seqStop();seqStop=null;stopAllScheduled();state.playing=-1;render()}
 else if(a==='comp-random'){state.compDegrees=Array.from({length:4},()=>Math.floor(Math.random()*7));render()}
 else if(a==='comp-preset'){state.compDegrees=[[0,4,5,3],[0,5,3,4],[1,4,0,5]][Number(target.dataset.id)].slice();render()}
 else if(a==='delete-entry'){state.entries=state.entries.filter(e=>String(e.id)!==target.dataset.id);saveEntries();render()}
 else if(a==='export'){
  const payload={version:2,exportedAt:new Date().toISOString(),entries:state.entries,ear:state.stats,training:state.earHistory,voiceNotes:state.voiceNotes,voiceTarget:state.voiceTarget};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),el=document.createElement('a');el.href=url;el.download='music-lab-backup.json';el.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
}
const pitchHistory=[];
async function enableMic(){
 if(state.micActive)return;
 state.micError='';let stopped=false;
 try{
  const stop=await startMicrophone((info,wave,analysis)=>{
   const n=$('#pitch-note'),f=$('#pitch-freq'),c=$('#pitch-cents'),line=$('#pitch-line');if(!n||!f||!c||!line)return;
   n.textContent=info?.note||'—';f.textContent=info?`${info.hz.toFixed(1)} Hz`:'음 감지 대기';c.textContent=info?`${Math.round(100*(69+12*Math.log2(info.hz/440)-state.voiceTarget))>=0?'+':''}${Math.round(100*(69+12*Math.log2(info.hz/440)-state.voiceTarget))} cents`:'—';
   pitchHistory.push(info?info.midi+info.cents/100:NaN);if(pitchHistory.length>65)pitchHistory.shift();
   const metrics=getAcousticMetrics(wave,analysis?.spectrum,analysis?.sampleRate||44100);
   const level=$('#voice-level'),center=$('#voice-centroid'),desc=$('#voice-interpretation');
   if(level&&metrics)level.textContent=`${metrics.dbfs.toFixed(0)} dBFS`;
   if(center&&metrics)center.textContent=metrics.centroid===null?'—':`${Math.round(metrics.centroid)} Hz`;
   if(desc&&metrics){const spread=pitchSpread(pitchHistory);desc.textContent=describeAcoustics(metrics,spread)};

   const points=pitchHistory.map((x,i)=>`${i*420/64},${Number.isFinite(x)?Math.max(8,Math.min(100,110-(x-40)*2.0)):54}`).join(' ');
   line.setAttribute('points',points);
   const bars=$('#mic-bands');if(bars&&analysis?.spectrum){const data=analysis.spectrum,ny=analysis.sampleRate/2;const logMin=Math.log(90),logMax=Math.log(5000);bars.innerHTML=Array.from({length:34},(_,i)=>{const lo=Math.exp(logMin+(logMax-logMin)*i/34),hi=Math.exp(logMin+(logMax-logMin)*(i+1)/34);const first=Math.max(1,Math.floor(lo/ny*data.length)),last=Math.min(data.length-1,Math.max(first+1,Math.ceil(hi/ny*data.length)));let top=-120;for(let j=first;j<last;j++)top=Math.max(top,data[j]);const t=Math.max(.02,Math.min(1,(top+95)/70));const bh=t*75;return `<rect x="${9+i*11.9}" y="${85-bh}" width="8.5" height="${bh}" rx="2" fill="var(--accent)" opacity="${.6+.35*t}"/>`;}).join('');}

  });
  if(stopped){stop();return}micStop=stop;state.micActive=true;const b=$('[data-action="mic-start"]');if(b){b.dataset.action='mic-stop';b.innerHTML=icon('stop',17)+' 마이크 중지'}const status=$('#mic-status');if(status){status.textContent='측정 중';status.classList.add('active')}
 }catch(e){state.micError=e?.name==='NotAllowedError'?'마이크 권한이 거부되었습니다. 브라우저의 마이크 권한을 확인하세요.':String(e?.message||e);const x=$('#mic-error');if(x)x.textContent=state.micError}
}
document.addEventListener('click',e=>{const target=e.target.closest('[data-action]');if(target&&!target.disabled)handleAction(target,e)});
document.addEventListener('change',async e=>{
 const t=e.target;
 if(t.id==='global-key'){state.root=t.value;state.selectedChord=0;saveSettings();render()}
 else if(t.id==='global-mode'){state.mode=t.value;state.selectedChord=0;saveSettings();render()}
 else if(t.id==='staff-clef'){state.clef=t.value==='bass'?'bass':'treble';state.question=null;state.feedback=null;state.melodyInputs=[];state.earSession={completed:0,correct:0};render()}
 else if(t.id==='staff-level'){state.staffLevel=t.value==='diatonic'?'diatonic':'chromatic';state.question=null;state.feedback=null;state.melodyInputs=[];state.earSession={completed:0,correct:0};render()}
 else if(t.id==='seventh-check'){state.seventh=t.checked;render()}
 else if(t.id==='guitar-scale'){state.guitarScale=t.value;render()}
 else if(t.id==='guitar-display'){state.guitarDisplay=t.value;render()}
 else if(t.hasAttribute('data-comp-slot')){state.compDegrees[Number(t.dataset.compSlot)]=Number(t.value);render()}
 else if(t.id==='bpm'){state.bpm=Math.min(220,Math.max(40,Number(t.value)||82));render()}
 else if(t.id==='import-file'&&t.files?.[0]){
  try{const data=JSON.parse(await t.files[0].text());if(!Array.isArray(data.entries)||!data.ear||typeof data.ear.total!=='number')throw new Error('지원하지 않는 백업 형식입니다.');
   const valid=data.entries.length<=10000&&data.entries.every(e=>typeof e.date==='string'&&typeof e.category==='string'&&typeof e.minutes==='number'&&typeof e.memo==='string'&&String(e.memo).length<=1500);
   if(!valid)throw new Error('데이터 형식이 올바르지 않습니다.');
   if(!confirm('현재의 연습 기록과 청음 통계를 백업 파일로 교체할까요?'))return;
   state.entries=data.entries;if(Array.isArray(data.training)){state.earHistory=data.training.slice(-3000).filter(x=>typeof x.date==='string'&&typeof x.kind==='string'&&typeof x.correct==='boolean');localStorage.setItem('musiclab-training-history',JSON.stringify(state.earHistory));}if(typeof data.voiceNotes==='string'){state.voiceNotes=data.voiceNotes.slice(0,1800);localStorage.setItem('musiclab-voice-notes',JSON.stringify(state.voiceNotes));}if(Number.isInteger(data.voiceTarget)&&data.voiceTarget>=48&&data.voiceTarget<=72){state.voiceTarget=data.voiceTarget;localStorage.setItem('musiclab-voice-target',JSON.stringify(state.voiceTarget));}state.stats={total:Math.max(0,Number(data.ear.total)||0),correct:Math.max(0,Number(data.ear.correct)||0)};saveEntries();localStorage.setItem('musiclab-ear',JSON.stringify(state.stats));render();alert('가져오기를 완료했습니다.');
  }catch(err){alert('가져오기에 실패했습니다: '+err.message)}
 }
});
document.addEventListener('input',e=>{const t=e.target,k=t.dataset.slider;
 if(k&&['larynxYaw','larynxPitch','larynxZoom','glottalOpen'].includes(k)){
  state[k]=Number(t.value);const label=$('#v-'+k);if(label)label.textContent=state[k]+(['larynxYaw','larynxPitch'].includes(k)?'°':'%');
  if(!state.larynxAnimating)drawLarynx($('#larynx-canvas'),modelOptions());return;
 }
 if(k&&['jaw','tongue','lips','vocalF0','vocalBreath'].includes(k)){
 if(['jaw','tongue','lips'].includes(k)){state.vowelPreset='custom';document.querySelectorAll('.voice-preset-row .chip').forEach(b=>b.classList.remove('on'));}state[k]=Number(t.value);const label=$('#v-'+k);if(label)label.textContent=t.value+(k==='vocalF0'?' Hz':'%');const f=$('#formant-values');if(f)f.innerHTML=voiceStats();const g=$('#formant-spectrum');if(g)g.innerHTML=voiceSpectrumSVG();const svg=$('.resonance-graphic');if(svg){const newSvg=document.createElement('div');newSvg.innerHTML=resonanceSvg();svg.replaceWith(newSvg.firstElementChild)}
 }});
document.addEventListener('submit',e=>{if(e.target.id!=='entry-form')return;e.preventDefault();const f=new FormData(e.target),minutes=Number(f.get('minutes'));if(!Number.isInteger(minutes)||minutes<1||minutes>600)return;
 state.entries.push({id:typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():String(Date.now()),date:String(f.get('date')),category:String(f.get('category')),minutes,memo:String(f.get('memo')||'').slice(0,1500)});saveEntries();render();});
window.addEventListener('pagehide',()=>{if(recordingSlot())stopRecording();if(micStop)micStop();if(seqStop)seqStop();if(larynxStop)larynxStop()});
render();
setInterval(updatePianoIndicator,900);
loadPianoSamples().catch(()=>{});
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register(`${import.meta.url.replace(/src\/app\.js(?:\?.*)?$/,'')}sw.js`).catch(()=>{}));
