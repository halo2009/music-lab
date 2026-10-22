import {ROOTS,PC_NAMES,INTERVALS,FORMATS,INTERVAL_QUIZ,GUITAR_OPEN,scaleOf,chordsOf,chordMidi,pitchClass,noteToMidi,midiToFrequency} from './music.js';
import {note,chord,arpeggio,playInterval,playSequence,stopAllScheduled,demoFormant,pianoStatus,getVoiceFormants,loadPianoSamples,context} from './audio.js';
import {startMicrophone} from './mic.js';
import {staffSVG,trainingKeyboard,prettyNote} from './staff.js';
import {buildMidi,downloadMidi,pianoRollSVG} from './midi.js';
import {drawLarynx,animateLarynx} from './larynx3d.js';
import {VOICE_LESSONS,VOICE_QUIZ,VOWEL_PRESETS} from './vocal-content.js';
import {getAcousticMetrics,pitchSpread,describeAcoustics} from './voice-metrics.js';
import {pitchGuide,pitchGuidePercent,voicePathStages} from './pitch-guide.js';
import {toggleRecord,recordingSlot,clipUrl,clearClips,stopRecording,clipDownloadName} from './recorder.js';
import {SIGHT_KEYS,generateGuitarSight,sightStaffSVG,sightTabSVG,fretInput,keyById,CHORD_QUALITIES,chooseChord,randomMovableChord,chordPitches,chordDiagram,chordPitchClassesValid,midiName} from './guitar-lab.js';
import {CHORD_TYPES,ROOT_CHOICES,QUALITY_GROUPS,parseChord,describeChord,voicingsFor,gripMidis,chordDiagramSVG,realisticFretboard} from './chord-library.js';
import {cagedShapes,triadShapes,arpeggioNotes,dropVoicings,TRIAD_STRING_SETS,DROP_STRING_SETS,DROP_QUALITIES,fretWindowSVG,gripDescription} from './guitar-theory.js';
import {CHROMATIC_PATTERNS} from './chromatic.js';
import {startMetronome} from './metronome.js';
import {PROGRESSION_PRESETS,parseProgression,planProgression} from './chord-progression.js';
import {newStudioProject,normalizeStudioProject,cloneProject,addBar,removeBar,duplicateBar,splitSlot,mergeSlot,setStudioChord,setStudioVoicing,studioEvents,studioVoicing,STUDIO_PRESETS,applyStudioPreset,studioSuggestions,buildStudioMidi} from './studio-engine.js';
import {nextSeed,uniqueGenerated,makeHarmonyProblem,makeEarProblem} from './problem-engine.js';
import {BACKING_STYLES,normalizeBacking,startBackingTrack} from './backing-track.js';
const APP_VERSION='0.9.4';
const $=sel=>document.querySelector(sel);
const safe=(s)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const persisted=read('musiclab-settings',{});
const state={tab:'home',root:persisted.root||'C',mode:persisted.mode||'major',theme:persisted.theme||'dark',seventh:true,theoryScale:persisted.mode||'major',theoryOctave:4,harmonyLevel:1,harmonyQuestion:null,harmonyAnswer:null,harmonyHistory:read('musiclab-harmony-questions',[]),problemRecent:read('musiclab-problem-recent',[]),guitarScale:'major',guitarDisplay:'scale',guitarView:'library',theoryMode:'caged',theoryRoot:'C',theoryMinor:false,theoryTriadSet:'123',theoryArpQuality:'maj7',theoryStartFret:1,theoryDropQuality:'maj7',theoryDropType:2,theoryDropSet:'4321',theorySelected:0,theoryHistory:read('musiclab-guitar-theory-history',[]),libGripFavorites:read('musiclab-grip-favorites',[]),chromaticPattern:'1234',chromaticBpm:60,chromaticPlaying:false,chromaticHistory:read('musiclab-chromatic-history',[]),proInput:'F#m7 B7 EM7 C#m7',proPlan:null,proSelected:0,proBpm:80,proPlaying:false,proError:'',libRoot:'F#',libQuality:'m7',libBass:'',libString:'all',libSelected:0,libAdvanced:false,libFavorites:read('musiclab-lib-favorites',[]),libRecent:read('musiclab-lib-recent',[]),realFretMax:22,libFretOpen:false,guitarSightKey:'C-major',guitarSightLevel:1,guitarSightBpm:80,guitarSightPos:0,guitarSightExam:false,guitarSight:null,guitarSightIndex:0,guitarSightHits:0,guitarSightMistakes:0,guitarSightRetried:false,guitarSightStatus:'idle',guitarSightShowTab:false,guitarSightLast:'',guitarSightHistory:read('musiclab-guitar-sight',[]),guitarGripRootString:'R6',guitarGripQuality:'all',guitarGrip:chooseChord({root:'C',quality:'m7',rootString:'R6'}),guitarProgression:[],guitarCurrent:0,guitarRhythmBpm:80,guitarRhythmPattern:['D','-','D','U','D','-','D','U','D','-','D','U','D','-','D','U'],guitarRhythmPlaying:-1,selectedChord:0,earMode:'staff',clef:'treble',staffLevel:'chromatic',melodyInputs:[],earSession:{completed:0,correct:0},earHistory:read('musiclab-training-history',[]),question:null,feedback:null,reg:'m1',part:'folds',vocalView:'science',voiceStep:0,vocalLesson:'fold',vowelPreset:'a',voiceQuizIndex:0,voiceQuizChoice:null,voiceQuizScore:0,voiceTarget:read('musiclab-voice-target',60),voiceNotes:read('musiclab-voice-notes',''),larynxFocus:'all',larynxYaw:20,larynxPitch:43,larynxZoom:100,larynxAnimating:false,glottalOpen:30,jaw:55,tongue:50,lips:30,vocalF0:180,vocalBreath:24,compDegrees:[0,5,3,4],studioProject:read('musiclab-studio-active',null),studioProjects:read('musiclab-studio-projects',[]),studioSelected:[0,0],studioRollPage:0,studioLoop:false,studioError:'',backing:read('musiclab-backing',null),backingPlaying:false,backingBar:null,melodyNotes:read('musiclab-melody',[]),bpm:82,playing:-1,entries:read('musiclab-entries',[]),stats:read('musiclab-ear',{total:0,correct:0}),micActive:false,micError:''};
const saveSettings=()=>localStorage.setItem('musiclab-settings',JSON.stringify({root:state.root,mode:state.mode,theme:state.theme}));
const saveEntries=()=>localStorage.setItem('musiclab-entries',JSON.stringify(state.entries));
let micStop=null,seqStop=null,larynxStop=null,voiceCompareTimer=null,guitarAudioTimers=[],guitarRhythmTimer=null,chromaticMetronomeStop=null,backingPlayer=null;
const icon=(n,size=20)=>{const p={home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',theory:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M9 8h6M9 12h8"/>',guitar:'<path d="m13 6 5-5 5 5-5 5"/><path d="m4 20 9-9m-5-2 7 7M2 22l5-1-4-4-1 5Z"/>',ear:'<path d="M6 10a6 6 0 1 1 12 0c0 5-6 5-6 10M12 22h.01"/><path d="M9 10a3 3 0 0 1 6 0"/>',vocal:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5m-4 0h8"/>',compose:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',journal:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12l3 3 5-6"/>',play:'<path d="m8 5 11 7-11 7z"/>',pause:'<path d="M9 5v14M15 5v14"/>',chevron:'<path d="m9 18 6-6-6-6"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2m10-10h-2M4 12H2m17.07 7.07-1.41-1.41M6.34 6.34 4.93 4.93m14.14 0-1.41 1.41M6.34 17.66l-1.41 1.41"/>',moon:'<path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13z"/>',spark:'<path d="m12 3 1.8 6.2L20 11l-6.2 1.8L12 19l-1.8-6.2L4 11l6.2-1.8z"/>',download:'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',mic:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5"/>',stop:'<rect x="5" y="5" width="14" height="14" rx="2"/>',music:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',check:'<path d="m4 12 5 5L20 6"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',info:'<circle cx="12" cy="12" r="10"/><path d="M12 10v7m0-10v.1"/>',headphones:'<path d="M3 14v-3a9 9 0 0 1 18 0v3M3 14h4v7H5a2 2 0 0 1-2-2zm18 0h-4v7h2a2 2 0 0 0 2-2z"/>',layers:'<path d="m12 2 9 5-9 5-9-5zM3 12l9 5 9-5M3 17l9 5 9-5"/>',refresh:'<path d="M20 7v5h-5M4 17v-5h5M5 9a8 8 0 0 1 14-2l1 2M4 15l1 2a8 8 0 0 0 14-2"/>'}[n]||'<circle cx="12" cy="12" r="9"/>';return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`};
const NAV=[['home','대시보드','home'],['theory','화성학 연구실','theory'],['guitar','기타 연습실','guitar'],['ear','청음 트레이너','ear'],['vocal','보컬 과학','vocal'],['compose','코드 스튜디오','compose'],['journal','연습 기록','journal']];
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
const THEORY_SCALES=[['major','Major'],['minor','Natural minor'],['harmonicMinor','Harmonic minor'],['melodicMinor','Melodic minor'],['dorian','Dorian'],['phrygian','Phrygian'],['lydian','Lydian'],['mixolydian','Mixolydian'],['locrian','Locrian'],['pentMajor','Major pentatonic'],['pentMinor','Minor pentatonic'],['blues','Blues']];
function theoryPiano(scale,octave=4){
 const noteMap=new Map(scale.notes.map((name,i)=>[pitchClass(name),{name,degree:i+1}]));
 const whites=[0,2,4,5,7,9,11],blacks=[1,3,6,8,10],positions=[14.285,28.571,57.143,71.429,85.714],tonic=pitchClass(scale.notes[0]);
 const key=(pc,black,position)=>{const info=noteMap.get(pc),isRoot=pc===tonic,midi=12*(octave+1)+pc;
 return `<button type="button" class="${black?'black-key':'white-key'} theory-piano-key ${info?'scale-on':''} ${isRoot?'scale-root':''}" ${black?`style="left:${position}%"`:''} data-action="play-midi" data-midi="${midi}" aria-label="${info?info.name:PC_NAMES[pc]}${octave}${info?', '+info.degree+'도':''}"><span class="theory-piano-label">${info?safe(info.name):''}</span>${info?`<b class="theory-piano-degree">${info.degree}</b>`:''}</button>`};
 return `<div class="theory-piano-scroll"><div class="piano theory-piano" role="group" aria-label="스케일 음표를 하이라이트한 ${octave}옥타브 건반">${whites.map(pc=>key(pc,false)).join('')}${blacks.map((pc,i)=>key(pc,true,positions[i])).join('')}</div></div><div class="theory-piano-legend"><span><i class="theory-dot-root"></i>루트음</span><span><i class="theory-dot-note"></i>스케일 구성음</span><span>숫자 = 음계의 순서</span></div>`;
}
function generateHarmony(){const r=uniqueGenerated(()=>makeHarmonyProblem({root:state.root,mode:state.mode,level:state.harmonyLevel,seed:nextSeed()}),x=>x.signature,state.harmonyHistory);state.harmonyQuestion=r.item;state.harmonyAnswer=null;state.harmonyHistory=[...state.harmonyHistory,r.signature].slice(-40);localStorage.setItem('musiclab-harmony-questions',JSON.stringify(state.harmonyHistory));}
function harmonyQuiz(){const q=state.harmonyQuestion,done=state.harmonyAnswer!==null;
 return `<section class="panel harmony-quiz"><div class="panel-head"><div><span class="mini-label">RULE-BASED QUESTION ENGINE</span><h3>화성학 자동 문제</h3><p class="small-muted">미리 저장한 문제 파일이 아니라 현재 조성과 난이도를 바탕으로 새 문제를 생성해요.</p></div></div>
 <div class="harmony-quiz-top"><label>난이도 <select id="harmony-level">${[1,2,3].map(n=>`<option value="${n}" ${state.harmonyLevel===n?'selected':''}>${n}단계</option>`).join('')}</select></label>${btn('harmony-next',q?'다른 문제 생성':'문제 생성','btn primary')}</div>
 ${q?`<div class="harmony-question"><small>문제 생성 번호 ${q.seed}</small><h4>${safe(q.question)}</h4><div class="harmony-answers">${q.answers.map(ans=>`<button data-action="harmony-answer" data-answer="${safe(ans)}" ${done?'disabled':''} class="${done?(ans===q.correct?'correct':ans===state.harmonyAnswer?'wrong':''):''}">${safe(ans)}</button>`).join('')}</div>${done?`<p class="harmony-explain">${state.harmonyAnswer===q.correct?'정답':'정답 확인'} · ${safe(q.explanation)}</p>`:''}</div>`:'<p class="small-muted">문제 생성을 눌러 시작해 봐.</p>'}</section>`;
}
function recentMinutes(){const date=new Date().toLocaleDateString('sv-SE');return state.entries.filter(e=>e.date===date).reduce((s,e)=>s+Number(e.minutes||0),0)}
function allMinutes(){return state.entries.reduce((s,e)=>s+Number(e.minutes||0),0)}
function home(){
 const scales=scaleOf(state.root,state.mode),ch=chordsOf(state.root,state.mode,true);
 const pct=state.stats.total?Math.round(100*state.stats.correct/state.stats.total):0;
 return `${pageHeader('YOUR MUSIC WORKSPACE','연습과 이론을, 하나의 흐름으로.','오늘 배운 이론을 바로 듣고, 기타로 확인하고, 나만의 음악으로 만들어보세요.')}
 <section class="hero"><div class="hero-inner"><div class="hero-tag">${icon('spark',15)} MUSIC LAB / ALPHA ${APP_VERSION}</div><h2>Understand the sound.<br><em>Make it yours.</em></h2><p>하나의 조성을 선택하면 화성학, 지판, 코드 스튜디오가 함께 바뀝니다.</p><div class="hero-actions">${btn('nav-theory',`${icon('theory',17)} 이론 시작하기`)}${btn('nav-vocal',`${icon('mic',17)} 보컬 과학 보기`,'btn ghost')}</div></div><div class="hero-orbit" aria-hidden="true"><div class="orbit-circle one"></div><div class="orbit-circle two"></div><div class="orbit-core">${icon('music',48)}</div><span class="orbit-note n1">♩</span><span class="orbit-note n2">♪</span><span class="orbit-note n3">♫</span></div></section>
 <div class="stat-grid"><div class="stat"><div class="stat-label">${icon('clock',16)} 오늘의 연습</div><div class="stat-number">${recentMinutes()}<small>분</small></div><span>기록한 연습 시간</span></div><div class="stat"><div class="stat-label">${icon('target',16)} 청음 정답률</div><div class="stat-number">${state.stats.total?pct+'%':'—'}</div><span>${state.stats.total}문제 중 ${state.stats.correct}문제 정답</span></div><div class="stat"><div class="stat-label">${icon('layers',16)} 현재 조성</div><div class="stat-number key-stat">${safe(state.root)} <small>${state.mode==='major'?'Major':'minor'}</small></div><span>모든 학습 페이지에 연동</span></div></div>
 ${cap('학습 도구','지금 필요한 도구를 선택하세요.')}
 <div class="tool-grid">${[['theory','화성학 연구실','스케일 · 다이아토닉 · 코드톤','theory'],['guitar','기타 연습실','코드 사전 · 크로매틱 · 초견 · 코드 진행','guitar'],['ear','청음 트레이너','오선지 · 피아노 · 음정 · 선율','headphones'],['vocal','보컬 과학','해부학 · 발성 비교 · 피치','vocal'],['compose','코드 스튜디오','자유로운 코드 편집 · MIDI','compose'],['journal','연습 기록','레슨 노트 · 학습 데이터','journal']].map(([id,t,d,ico])=>`<button class="tool-card" data-action="nav-${id}"><span class="tool-icon">${icon(ico,23)}</span><strong>${t}</strong><span>${d}</span><span class="card-arrow">${icon('chevron',19)}</span></button>`).join('')}</div>
 <div class="two-col"><div class="panel"><div class="panel-head"><div><span class="mini-label">KEY EXPLORER</span><h3>${safe(state.root)} ${state.mode==='major'?'Major':'Natural minor'} scale</h3></div><span class="pill">${scales.notes.length} notes</span></div><div class="note-pills">${scales.notes.map((n,i)=>`<button data-action="play-midi" data-midi="${noteToMidi(n,4)}" class="note-pill ${i===0?'root':''}">${safe(n)}</button>`).join('')}</div><div class="small-muted">음을 누르면 직접 소리를 들을 수 있어요.</div></div><div class="panel"><div class="panel-head"><div><span class="mini-label">DIATONIC CHORDS</span><h3>현재 조성의 7화음</h3></div></div><div class="mini-chords">${ch.map(x=>`<span><small>${x.roman}</small>${safe(x.name)}</span>`).join('')}</div></div></div>`;
}
function theory(){const s=scaleOf(state.root,state.theoryScale),ch=chordsOf(state.root,state.mode,state.seventh),sel=ch[state.selectedChord]||ch[0];
 return `${pageHeader('HARMONY ENGINE','화성학 연구실','조성, 음계, 다이아토닉 코드와 구성음을 하나의 화면에서 확인합니다.')}
 <div class="two-col top-align"><div class="panel"><div class="panel-head"><div><span class="mini-label">01 / SCALE CONSTRUCTION</span><h3>${safe(state.root)} ${safe(THEORY_SCALES.find(x=>x[0]===state.theoryScale)?.[1]||state.theoryScale)}</h3></div>${btn('play-scale',`${icon('play',16)} 음계 듣기`,'btn small')}</div><div class="scale-steps">${s.notes.map((n,i)=>`<button class="scale-step" data-action="play-midi" data-midi="${noteToMidi(n,4)}"><span>${i+1}</span><strong>${safe(n)}</strong><small>${s.intervals[i]}st</small></button>`).join('')}</div><div class="subhead">피아노에서 확인</div><div class="theory-piano-controls"><label>스케일<select id="theory-scale">${THEORY_SCALES.map(([id,label])=>`<option value="${id}" ${state.theoryScale===id?'selected':''}>${label}</option>`).join('')}</select></label><label>옥타브<select id="theory-octave">${[3,4,5].map(n=>`<option value="${n}" ${state.theoryOctave===n?'selected':''}>${n}옥타브 (C${n})</option>`).join('')}</select></label></div>${theoryPiano(s,state.theoryOctave)}<p class="footnote">하이라이트된 건반이 현재 스케일의 구성음이에요. 샵·플랫은 조성에 맞는 이름으로 표시되며, 건반을 누르면 실제 음을 들을 수 있어요.</p></div>
 <div class="panel"><div class="panel-head"><div><span class="mini-label">02 / CHORD ANALYSIS</span><h3>다이아토닉 코드</h3></div><label class="switch-wrap"><input id="seventh-check" type="checkbox" ${state.seventh?'checked':''}><span>7th</span></label></div><div class="chord-grid">${ch.map((c,i)=>`<button class="chord-tile ${state.selectedChord===i?'selected':''}" data-action="select-chord" data-index="${i}"><small>${c.roman}</small><b>${safe(c.name)}</b></button>`).join('')}</div><div class="chord-inspector"><div><span class="mini-label">SELECTED CHORD</span><div class="selected-name">${safe(sel.name)}</div><p>구성음: ${sel.notes.map(safe).join(' · ')}</p></div>${btn('play-chord',`${icon('play',16)} 듣기`,'btn small')}</div><div class="note-pills">${sel.notes.map((n,i)=>`<span class="note-pill ${i===0?'root':''}">${safe(n)}</span>`).join('')}</div></div></div>
 ${harmonyQuiz()} ${infoBox('건반은 여러 스케일을 지원하며, 오른쪽 다이아토닉 코드 분석은 현재 전역 조성의 Major/Natural minor를 기준으로 합니다.')}`;
}
function guitar(){const ints=INTERVALS[state.guitarScale]||INTERVALS.major,tonic=pitchClass(state.root);const active=new Set(ints.map(i=>(tonic+i)%12));const selChord=chordsOf(state.root,state.mode,true)[state.selectedChord];
 const chordPcs=new Set(selChord.notes.map(pitchClass));const labels={};scaleOf(state.root,state.guitarScale).notes.forEach(n=>labels[pitchClass(n)]=n);const labelOf=pc=>pc===tonic?state.root:(labels[pc]||PC_NAMES[pc]);const dots=GUITAR_OPEN.map((open,si)=>Array.from({length:16},(_,f)=>{
 const pc=(open+f)%12;const on=state.guitarDisplay==='all'||(state.guitarDisplay==='chord'?chordPcs.has(pc):active.has(pc));const root=pc===tonic;
 const name=labelOf(pc);return `<button class="fret-note ${on?'lit':''} ${on&&root?'tonic':''} ${f===0?'open':''}" title="${name} · ${si+1}현 ${f}프렛" aria-label="${si+1}현 ${f}프렛 ${name}" data-action="play-midi" data-midi="${open+f}" style="grid-column:${f+1}">${on?name:'·'}</button>`;
 }).join('')).join('');
 return `<div class="panel"><div class="control-row"><label>스케일<select id="guitar-scale">${Object.keys(FORMATS).map(k=>`<option value="${k}" ${state.guitarScale===k?'selected':''}>${FORMATS[k]}</option>`).join('')}</select></label><label>표시 기준<select id="guitar-display"><option value="scale" ${state.guitarDisplay==='scale'?'selected':''}>스케일 음</option><option value="chord" ${state.guitarDisplay==='chord'?'selected':''}>선택 코드</option><option value="all" ${state.guitarDisplay==='all'?'selected':''}>전체 음</option></select></label><div class="legend"><span class="legend-dot tonic"></span> 루트 <span class="legend-dot"></span> 구성음</div></div>
 <div class="fret-scroll"><div class="fret-wrapper"><div class="fret-header"><div>현 \ 프렛</div>${Array.from({length:16},(_,i)=>`<span>${i===0?'Open':i}</span>`).join('')}</div><div class="fretboard">${GUITAR_OPEN.map((open,i)=>`<div class="string-row"><span class="string-label">${['E','B','G','D','A','E'][i]}</span>${Array.from({length:16},(_,f)=>{const pc=(open+f)%12;const activeScale=(state.guitarDisplay==='all'||(state.guitarDisplay==='chord'?chordPcs.has(pc):active.has(pc)));return `<button class="fret-note ${activeScale?'lit':''} ${activeScale&&pc===tonic?'tonic':''} ${f===0?'open':''}" title="${labelOf(pc)} · ${i+1}현 ${f}프렛" aria-label="${i+1}현 ${f}프렛 ${labelOf(pc)}" data-action="play-midi" data-midi="${open+f}">${activeScale?labelOf(pc):'·'}</button>`}).join('')}</div>`).join('')}</div><div class="fret-markers"><span></span>${Array.from({length:16},(_,i)=>`<span>${[3,5,7,9,12,15].includes(i)?'●':''}</span>`).join('')}</div></div></div>
 <div class="fret-footer"><div><b>${safe(state.root)} ${FORMATS[state.guitarScale]}</b><p>음 간격: ${ints.join(' · ')} 반음</p></div>${btn('play-guitar-scale',`${icon('play',16)} 스케일 듣기`,'btn secondary')}</div></div>
 <div class="panel compact"><div class="panel-head"><div><span class="mini-label">CHORD TONES</span><h3>코드톤 집중 연습</h3></div></div><div class="chip-row">${chordsOf(state.root,state.mode,true).map((c,i)=>`<button class="chip ${state.selectedChord===i?'on':''}" data-action="guitar-chord" data-index="${i}">${safe(c.name)}</button>`).join('')}</div><p class="footnote">코드를 누른 다음 ‘선택 코드’로 바꾸면 해당 구성음만 표시됩니다. 루트 강조는 현재 조성의 으뜸음 기준입니다.</p></div>`;
}

function stopGuitarAudio(){guitarAudioTimers.forEach(clearTimeout);guitarAudioTimers=[];if(guitarRhythmTimer!==null){clearInterval(guitarRhythmTimer);guitarRhythmTimer=null;}if(chromaticMetronomeStop){chromaticMetronomeStop();chromaticMetronomeStop=null;}state.guitarRhythmPlaying=-1;state.chromaticPlaying=false;state.proPlaying=false;}
function guitarTop(){return `<div class="guitar-nav" role="group" aria-label="기타 훈련 메뉴">${[['library','코드 사전'],['theory','지판 학습'],['chromatic','크로매틱'],['progression','코드 진행'],['sight','기타 초견'],['chords','랜덤 코드'],['fretboard','실제 지판'],['rhythm','리듬']].map(([id,label])=>`<button class="guitar-nav-tab ${state.guitarView===id?'on':''}" data-action="guitar-view" data-view="${id}">${label}</button>`).join('')}</div>`;}
function guitarPage(){return `${pageHeader('GUITAR STUDIO / ALPHA ${APP_VERSION}','기타 연습실','악보를 보고 프렛을 찾고, 코드폼과 리듬까지 연습하세요. 6현 표준 튜닝(E–A–D–G–B–e) 기준입니다.')}${guitarTop()}${state.guitarView==='library'?guitarLibrary():state.guitarView==='theory'?guitarTheory():state.guitarView==='chromatic'?guitarChromatic():state.guitarView==='progression'?guitarProgressionPro():state.guitarView==='sight'?guitarSight():state.guitarView==='chords'?guitarChords():state.guitarView==='rhythm'?guitarRhythm():guitarReal()}`;}
function selectedLibraryChord(){return describeChord(state.libRoot,state.libQuality,state.libBass)}
function libraryFavoritesSave(){localStorage.setItem('musiclab-lib-favorites',JSON.stringify(state.libFavorites))}
function libraryRecentTrack(name){state.libRecent=[name,...state.libRecent.filter(v=>v!==name)].slice(0,12);localStorage.setItem('musiclab-lib-recent',JSON.stringify(state.libRecent))}
function libraryPickChord(text){const found=parseChord(text);if(!found)return false;state.libRoot=found.root;state.libQuality=found.quality;state.libBass=found.bass;state.libSelected=0;libraryRecentTrack(found.name);return true}
function guitarLibrary(){
 const d=selectedLibraryChord(),voices=voicingsFor(d,{rootString:state.libString,maxResults:12});
 const selected=voices[Math.min(voices.length-1,state.libSelected)]||null;
 state.libSelected=Math.max(0,Math.min(voices.length-1,state.libSelected));
 const favorite=state.libFavorites.includes(d.name);
 const gripId=selected?d.name+'|'+selected.frets.join(','):'';const savedGrip=state.libGripFavorites.some(x=>x.id===gripId);
 const popular=[['','M'],['m','m'],['7','7'],['maj7','M7'],['m7','m7'],['sus4','sus4'],['m7b5','m7♭5'],['9','9']];
 const options=QUALITY_GROUPS.map(cat=>`<optgroup label="${cat}">${Object.entries(CHORD_TYPES).filter(([id,q])=>q.category===cat).map(([id,q])=>`<option value="${id}" ${state.libQuality===id?'selected':''}>${id||'M'} · ${q.label}</option>`).join('')}</optgroup>`).join('');
 const intervalRoles=d.parts.map(x=>`<span class="lib-interval"><b>${safe(x.tag)}</b>${safe(x.name)}</span>`).join('');
 const frets=selected?selected.frets.map((f,i)=>`<span>${6-i}번 줄 <b>${f===null?'× 뮤트':f===0?'○ 개방':f+'프렛'}</b></span>`).join(''):'';
 return `<section class="panel lib09-search"><div class="lib09-intro"><div><span class="mini-label">GUITAR CHORD LIBRARY · ALPHA 0.9</span><h2>코드 찾기</h2><p>코드만 입력하면 바로 큰 운지도를 볼 수 있어요.</p></div><span class="pill">40종 코드</span></div>
 <div class="lib-search"><label for="chord-search">① 코드 이름 입력</label><div class="lib-search-row"><input id="chord-search" type="text" spellcheck="false" autocomplete="off" placeholder="예: F#m7, BbM7, C/E" aria-describedby="lib-help"><button class="btn primary" data-action="lib-search">찾기</button></div><small id="lib-help">M7 / maj7 / △7, m7♭5 / ø, sus, 텐션, 슬래시 코드 지원</small></div>
 <div class="lib09-easy"><div class="lib09-mini-title">빠른 코드 선택</div><div class="lib09-key-row" role="group" aria-label="코드 루트 선택">${ROOT_CHOICES.map(r=>`<button class="lib-root-chip ${state.libRoot===r?'active':''}" data-action="lib-root-quick" data-root="${r}" aria-pressed="${state.libRoot===r}">${r}</button>`).join('')}</div><div class="lib09-quality-row" role="group" aria-label="자주 쓰는 코드 종류">${popular.map(([k,n])=>`<button class="lib09-quality ${state.libQuality===k?'active':''}" data-action="lib-quality-quick" data-quality="${k}" aria-pressed="${state.libQuality===k}">${n}</button>`).join('')}</div></div>
 <div class="lib09-filter"><label>코드 전체 목록<select id="lib-quality">${options}</select></label><label>루트 현 선택<select id="lib-string">${[['all','모든 루트 현'],['R6','R6 · 6번 줄'],['R5','R5 · 5번 줄'],['R4','R4 · 4번 줄']].map(([id,l])=>`<option value="${id}" ${state.libString===id?'selected':''}>${l}</option>`).join('')}</select></label></div>
 </section>
 <section class="lib09-current"><div class="lib09-heading"><div><span class="mini-label">② 코드 운지</span><h2>${safe(d.name)}</h2><p>${d.parts.map(x=>safe(x.name)).join(' · ')}</p></div><div class="lib09-top-actions"><button class="btn secondary" data-action="lib-favorite" aria-pressed="${favorite}">${favorite?'★ 코드 저장됨':'☆ 코드 저장'}</button>${selected?`<button class="btn secondary" data-action="lib-grip-favorite" aria-pressed="${savedGrip}">${savedGrip?'★ 운지 저장됨':'☆ 이 운지 저장'}</button>`:''}${selected?`<button class="btn primary" data-action="lib-play">${icon('play',17)} 듣기</button>`:''}</div></div>
 ${selected?`<div class="panel lib09-showcase"><div class="lib09-diagram-col"><div class="lib09-grip-tag">${selected.rootString} · ${selected.rootFret}프렛 · 운지 ${state.libSelected+1}/${voices.length}</div>${chordDiagramSVG(selected,d)}<div class="lib09-key-legend">● 루트음 · ○ 개방현 · × 뮤트현 · 숫자는 ${selected.verifiedDiagram?'손가락':'코드톤'}</div></div><div class="lib09-grip-meta"><h3>운지 정보</h3><div class="lib09-fret-labels">${frets}</div><p class="small-muted">${selected.verifiedDiagram?'숫자는 손가락 번호입니다. 같은 손가락을 여러 줄에 놓는 경우 바레 표시를 참고하세요.':'숫자는 손가락 번호가 아닌 코드톤입니다.'} ${selected.missing.length?'생략된 구성음: '+safe(selected.missing.join(', ')):'모든 구성음 포함'}.</p><div class="lib09-move">${btn('lib-prev','← 이전 운지','btn secondary',state.libSelected===0?'disabled':'')}${btn('lib-next','다음 운지 →','btn secondary',state.libSelected===voices.length-1?'disabled':'')}</div></div></div>`:`<div class="panel lib-no-grip"><h3>선택한 조건에서 가능한 운지가 없어요.</h3><p>루트 현을 ‘모든 루트 현’으로 바꿔 보세요. 검증되지 않은 운지를 표시하지 않아요.</p></div>`}
 </section>
 ${voices.length?`<section class="panel lib09-alternatives"><div class="lib-rail-title"><strong>③ 다른 운지 고르기</strong><small>${voices.length}개 · 원하는 카드를 눌러 비교</small></div><div class="lib09-grid">${voices.map((g,i)=>`<button class="lib09-choice ${i===state.libSelected?'on':''}" data-action="lib-voicing" data-index="${i}" aria-pressed="${i===state.libSelected}"><span>${g.rootString}</span><strong>${g.rootFret}프렛</strong><small>${g.verifiedDiagram?'손가락 번호 표시':'코드톤 표시'} · ${g.frets.filter(f=>f!==null).length}현</small></button>`).join('')}</div></section>`:''}
 <section class="panel lib09-extra"><details class="lib-details"><summary>전체 22프렛 지판에서 코드톤 확인하기</summary><p class="small-muted">선택한 운지는 테두리로 표시돼요. 프렛의 음을 누르면 소리를 들을 수 있어요.</p>${realisticFretboard({root:d.root,show:'chord',chord:d,grip:selected})}</details></section>
 <section class="panel lib09-extra"><details class="lib-details"><summary>코드 구성 원리 · 공식 · 텐션</summary><div class="lib-role-row">${intervalRoles}</div><p>코드 공식: ${d.parts.map(x=>safe(x.tag)).join(' · ')}. 현 수와 운지 범위의 한계로 일부 텐션이나 5음을 생략할 수 있어요.</p></details></section>
 ${state.libGripFavorites.length?`<section class="panel lib09-grip-saved"><h3>저장한 운지</h3><div class="lib09-grip-saved-row">${state.libGripFavorites.map((g,i)=>`<button data-action="lib-grip-load" data-index="${i}">${safe(g.name)} <small>${safe(g.string)} · ${safe(g.position)}프렛</small></button>`).join('')}</div></section>`:''}
 ${state.libFavorites.length||state.libRecent.length?`<section class="panel lib-history"><div><strong>즐겨찾기</strong><div class="lib-history-chips">${state.libFavorites.length?state.libFavorites.map(name=>`<button data-action="lib-history" data-name="${safe(name)}">★ ${safe(name)}</button>`).join(''):'<span>저장한 코드가 없어요.</span>'}</div></div><div><strong>최근 검색</strong><div class="lib-history-chips">${state.libRecent.map(name=>`<button data-action="lib-history" data-name="${safe(name)}">${safe(name)}</button>`).join('')}</div></div></section>`:''}
 ${infoBox('운지 표시는 표준 튜닝 기준이며, 실제 손에 맞는지 확인하면서 사용하세요. 현재 소리 듣기는 기존 피아노 음원을 사용해요.')}`;
}
function guitarTheory(){
 const root=state.theoryRoot,mode=state.theoryMode,quality=state.theoryArpQuality;
 const options=ROOT_CHOICES.map(r=>`<option value="${r}" ${r===root?'selected':''}>${r}</option>`).join('');
 const modes=[['caged','CAGED'],['triad','트라이어드'],['arp','아르페지오'],['drop','Drop 2 / 3']];
 let grips=[],panel='',selected=null;
 if(mode==='caged'){
  grips=cagedShapes(root);selected=grips[Math.min(state.theorySelected,grips.length-1)];
  panel=`<p class="theory-explainer">메이저 코드를 C·A·G·E·D 다섯 형태로 연결해요. 형태는 이동형이며 실제 프렛과 연주 가능한 음을 계산했어요.</p>
   <div class="theory-grips">${grips.map((g,i)=>`<button class="theory-shape ${g===selected?'active':''}" data-action="theory-shape" data-index="${i}"><strong>${g.shape} Form</strong><small>${g.rootString} · ${g.rootFret}프렛</small></button>`).join('')}</div>`;
 }else if(mode==='triad'){
  grips=triadShapes(root,state.theoryMinor?'m':'',state.theoryTriadSet);selected=grips[Math.min(state.theorySelected,grips.length-1)];
  panel=`<p class="theory-explainer">선택한 세 줄에서 코드의 1·3·5음만 연주해요. 기본형과 1·2전위를 구분하고 다른 포지션을 살펴보세요.</p>
   <div class="theory-controls"><label>코드 종류<select id="theory-triad-quality"><option value="" ${!state.theoryMinor?'selected':''}>Major</option><option value="m" ${state.theoryMinor?'selected':''}>minor</option></select></label><label>사용할 현<select id="theory-triad-set">${TRIAD_STRING_SETS.map(x=>`<option value="${x.id}" ${x.id===state.theoryTriadSet?'selected':''}>${x.label}</option>`).join('')}</select></label></div>
   <div class="theory-grips">${grips.map((g,i)=>`<button class="theory-shape ${g===selected?'active':''}" data-action="theory-shape" data-index="${i}"><strong>${g.label}</strong><small>${g.frets.filter(f=>f!==null).join(' · ')}프렛</small></button>`).join('')}</div>`;
 }else if(mode==='arp'){
  const low=state.theoryStartFret,high=low+4,d=describeChord(root,quality),tones=arpeggioNotes(root,quality,low,high);
  panel=`<p class="theory-explainer">코드톤을 음높이 순서로 확인하고 아르페지오를 연습해요. 지판에서 각 음을 눌러 소리도 확인할 수 있어요.</p>
  <div class="theory-controls"><label>코드 종류<select id="theory-arp-quality">${['','m','7','maj7','m7','m7b5','dim7','9','m9'].map(q=>`<option value="${q}" ${q===quality?'selected':''}>${q||'M'}</option>`).join('')}</select></label><label>포지션<select id="theory-start-fret">${[0,1,3,5,7,9,12,15].map(f=>`<option value="${f}" ${f===low?'selected':''}>${f}~${f+4}프렛</option>`).join('')}</select></label></div>
  <div class="theory-note-tags">${d.parts.map(p=>`<span><b>${p.tag}</b>${safe(p.name)}</span>`).join('')}</div>
  ${fretWindowSVG({root,quality,startFret:low,endFret:high})}
  <div class="theory-arp-tools"><span>${tones.length}개의 연주 위치 · 음높이 순서</span>${btn('theory-arp-play','▶ 아르페지오 듣기','btn primary')}</div><p class="small-muted">악보를 따라 연주하는 정해진 한 가지 손가락 경로가 아니라, 선택한 포지션의 코드톤 위치를 보여줘요.</p>`;
 }else{
  const type=state.theoryDropType,allowed=DROP_STRING_SETS[type],set=allowed.find(s=>s.id===state.theoryDropSet)||allowed[0];
  grips=dropVoicings(root,state.theoryDropQuality,type,set.id);selected=grips[Math.min(state.theorySelected,grips.length-1)];
  panel=`<p class="theory-explainer">7화음의 밀집배치에서 2번째 또는 3번째 높은 성부를 한 옥타브 내린 보이싱이에요. 지정한 4개 현에서 실제로 연주할 수 있는 경우만 보여줘요.</p>
   <div class="theory-controls"><label>7화음<select id="theory-drop-quality">${DROP_QUALITIES.map(q=>`<option value="${q}" ${q===state.theoryDropQuality?'selected':''}>${q==='maj7'?'M7':q==='m7b5'?'m7♭5':q}</option>`).join('')}</select></label><label>배치<select id="theory-drop-type"><option value="2" ${type===2?'selected':''}>Drop 2</option><option value="3" ${type===3?'selected':''}>Drop 3</option></select></label><label>현 세트<select id="theory-drop-set">${allowed.map(x=>`<option value="${x.id}" ${x.id===set.id?'selected':''}>${x.label}</option>`).join('')}</select></label></div>
   <div class="theory-grips">${grips.map((g,i)=>`<button class="theory-shape ${g===selected?'active':''}" data-action="theory-shape" data-index="${i}"><strong>${g.label}</strong><small>${g.rootFret}프렛 · ${g.rootString}</small></button>`).join('')}</div>`;
 }
 const chordData=mode==='caged'?describeChord(root,''):mode==='triad'?describeChord(root,state.theoryMinor?'m':''):mode==='drop'?describeChord(root,state.theoryDropQuality):null;
 const gripping=mode!=='arp'?(selected?`<div class="panel theory-selected"><div class="theory-display"><div><span class="mini-label">현재 코드폼</span><h3>${safe(chordData.name)} · ${safe(selected.label)}</h3><p class="small-muted">${safe(gripDescription(selected))}</p><div class="theory-display-actions">${btn('theory-grip-play','▶ 코드 듣기','btn secondary')}${btn('theory-save','연습 기록 저장','btn primary')}</div></div><div class="theory-display-diagram">${chordDiagramSVG(selected,chordData)}</div></div>
  ${fretWindowSVG({root,quality:chordData.quality,startFret:Math.max(0,(selected.frets.filter(f=>f!==null&&f>0).length?Math.min(...selected.frets.filter(f=>f!==null&&f>0))-1:0)),endFret:Math.min(22,Math.max(...selected.frets.filter(f=>f!==null))+1),grip:selected})}
  </div>`:`<div class="panel theory-empty"><strong>이 조건에서는 간단하고 정확한 운지 예시를 찾지 못했어요.</strong><p>현 세트나 루트를 바꿔 보세요. 무리한 손가락 모양을 임의로 추천하지 않아요.</p></div>`):'';
 const history=state.theoryHistory.slice(-5).reverse();
 return `<div class="panel theory-heading"><div class="panel-head"><div><span class="mini-label">GUITAR FRETBOARD THEORY / ALPHA ${APP_VERSION}</span><h2>코드와 지판을 연결해서 공부하기</h2><p>루트와 학습 유형을 선택하면 실제 기타 지판에서 바로 확인할 수 있어요.</p></div></div>
  <div class="theory-tab-list" role="group" aria-label="기타 지판 학습 주제">${modes.map(([id,text])=>`<button data-action="theory-mode" data-mode="${id}" class="${mode===id?'active':''}" aria-pressed="${mode===id}">${text}</button>`).join('')}</div><div class="theory-main-selector"><label>코드 루트 <select id="theory-root">${options}</select></label><span class="pill">6현 표준 튜닝 · 22프렛</span></div>
  ${panel}</div>${gripping}${mode==='arp'?`<div class="panel theory-practice-bottom">${btn('theory-save','이 포지션 연습 기록 저장','btn primary')}</div>`:''}
  <section class="panel theory-records"><div class="panel-head"><div><span class="mini-label">PRACTICE HISTORY</span><h3>최근 지판 학습</h3></div><span class="pill">${state.theoryHistory.length}회</span></div>${history.length?`<div class="theory-recent">${history.map(h=>`<div><b>${safe(h.root)} ${safe(h.quality)} · ${safe(h.mode)}</b><span>${safe(h.date)}</span></div>`).join('')}</div>`:'<p class="small-muted">폼이나 아르페지오를 연습한 뒤 저장 버튼을 누르면 기록돼요.</p>'}</section>`;
}

function guitarReal(){const ints=INTERVALS[state.guitarScale]||INTERVALS.major,tonic=pitchClass(state.root);
 let ch=null;
 if(state.guitarDisplay==='chord')ch=describeChord(state.libRoot,state.libQuality,state.libBass);
 return `<div class="panel"><div class="panel-head"><div><span class="mini-label">INTERACTIVE REAL GUITAR FRETBOARD</span><h3>22프렛 로즈우드 기타 지판</h3></div><span class="pill">25.5″ · Fender-style</span></div>
 <p class="guitar-help">프렛 간격과 현 두께를 실제 비율에 맞췄어요. 원하는 음표를 누르면 소리가 나고, 가로로 움직이며 22프렛까지 확인할 수 있어요.</p>
 <div class="control-row"><label>스케일<select id="guitar-scale">${Object.keys(FORMATS).map(k=>`<option value="${k}" ${state.guitarScale===k?'selected':''}>${FORMATS[k]}</option>`).join('')}</select></label><label>표시 기준<select id="guitar-display"><option value="scale" ${state.guitarDisplay==='scale'?'selected':''}>스케일 음</option><option value="chord" ${state.guitarDisplay==='chord'?'selected':''}>코드 사전 선택 코드</option><option value="all" ${state.guitarDisplay==='all'?'selected':''}>전체 음</option></select></label></div>
 ${realisticFretboard({root:ch?ch.root:state.root,intervals:ints,show:state.guitarDisplay,chord:ch})}
 <div class="guitar-toolbar">${btn('play-guitar-scale','▶ 스케일 듣기','btn secondary')}${btn('guitar-view-library','코드 사전 열기','btn primary')}</div><p class="small-muted">네온 민트는 루트, 흰 원은 다른 구성음이에요. 실제 일렉기타의 시각적 구조를 참고한 SVG 모델이며 특정 제조사의 공식 도면은 아닙니다.</p></div>`;
}
function chromaticRecords(){
 const history=Array.isArray(state.chromaticHistory)?state.chromaticHistory:[];
 const values={};for(const pattern of CHROMATIC_PATTERNS)values[pattern]={best:null,last:null,count:0};
 for(const h of history){if(!values[h?.pattern]||!Number.isFinite(Number(h.bpm)))continue;
  const bpm=Number(h.bpm);if(bpm<40||bpm>240)continue;
  const v=values[h.pattern];v.best=Math.max(v.best??0,bpm);v.last=h;v.count++;
 }
 return values;
}
function startChromatic(){
 if(state.chromaticPlaying)return;
 try{chromaticMetronomeStop=startMetronome({context:context(),bpm:state.chromaticBpm});state.chromaticPlaying=true;render();}
 catch(err){console.warn('Metronome unavailable:',err);alert('메트로놈을 시작할 수 없어요. 브라우저 오디오 설정을 확인해 주세요.');}
}
function saveChromaticPractice(){
 const record={date:new Date().toLocaleDateString('sv-SE'),savedAt:new Date().toISOString(),pattern:state.chromaticPattern,bpm:state.chromaticBpm,range:'1–12–1'};
 state.chromaticHistory=[...state.chromaticHistory,record].slice(-500);
 localStorage.setItem('musiclab-chromatic-history',JSON.stringify(state.chromaticHistory));
 render();
}
function guitarChromatic(){
 const stats=chromaticRecords(),current=stats[state.chromaticPattern],recent=state.chromaticHistory.slice(-8).reverse();
 return `<div class="chromatic-intro"><div><span class="mini-label">CHROMATIC · PRACTICE TRACKER</span><h2>크로매틱</h2><p>실제 기타로 1~12프렛을 왕복하면서 연습해요. 화면은 메트로놈과 BPM 기록에만 집중합니다.</p></div><span class="pill">1 → 12 → 1프렛</span></div>
 <div class="chromatic09-layout"><section class="panel chromatic09-player"><div class="chromatic09-label">현재 연습 패턴</div><div class="chromatic09-pattern">${safe(state.chromaticPattern)}</div><label class="chromatic09-select-label" for="chromatic-pattern">패턴 바꾸기</label><select id="chromatic-pattern" class="chromatic09-select">${CHROMATIC_PATTERNS.map(p=>`<option value="${p}" ${p===state.chromaticPattern?'selected':''}>${p.split('').join('-')}</option>`).join('')}</select>
 <div class="chromatic09-label" style="margin-top:22px">메트로놈</div><div class="chromatic09-bpm"><button data-action="chromatic-bpm" data-delta="-5" aria-label="BPM 5 낮추기">−5</button><button data-action="chromatic-bpm" data-delta="-1" aria-label="BPM 1 낮추기">−1</button><label><input id="chromatic-bpm" type="number" min="60" max="120" value="${state.chromaticBpm}" aria-label="현재 BPM"><span>BPM</span></label><button data-action="chromatic-bpm" data-delta="1" aria-label="BPM 1 높이기">+1</button><button data-action="chromatic-bpm" data-delta="5" aria-label="BPM 5 높이기">+5</button></div>
 <div class="chromatic09-actions">${btn('chromatic-toggle',state.chromaticPlaying?'■ 메트로놈 정지':'▶ 메트로놈 시작',state.chromaticPlaying?'btn secondary':'btn primary')}${btn('chromatic-save','✓ 연습 기록 저장','btn secondary')}</div><p class="chromatic09-note">4/4 박자 · 첫 박 강조 · 60~120 BPM. 패턴을 실제 기타로 연주한 후 달성 속도만 저장하세요.</p></section>
 <section class="panel chromatic09-stats"><div class="panel-head"><div><span class="mini-label">MY CHROMATIC RECORD</span><h3>${safe(state.chromaticPattern)} 최고 기록</h3></div></div><div class="chromatic09-best">${current.best===null?'—':current.best}<small>BPM</small></div><p class="small-muted">${current.last?'마지막 기록 '+safe(current.last.date)+' · '+current.last.bpm+' BPM':'아직 기록이 없어요.'}</p><div class="chromatic09-pattern-list"><div class="chromatic09-label">빠른 패턴 선택</div><div class="chromatic-quick">${['1234','1243','1324','1342','1432','4321'].map(p=>`<button class="${p===state.chromaticPattern?'active':''}" data-action="chromatic-preset" data-pattern="${p}">${p}</button>`).join('')}</div></div><details class="chromatic09-all"><summary>24가지 패턴의 최고 BPM 보기</summary><div class="chromatic09-record-grid">${CHROMATIC_PATTERNS.map(p=>`<button data-action="chromatic-preset" data-pattern="${p}" class="${p===state.chromaticPattern?'active':''}"><b>${p}</b><span>${stats[p].best===null?'미연습':stats[p].best+' BPM'}</span></button>`).join('')}</div></details></section></div>
 <section class="panel chromatic09-history"><div class="panel-head"><div><span class="mini-label">HISTORY</span><h3>최근 연습 기록</h3></div><span class="pill">총 ${state.chromaticHistory.length}회</span></div>${recent.length?`<div class="chromatic09-logs">${recent.map(h=>`<div><b>${safe(h.pattern)} <strong>${Math.round(Number(h.bpm))} BPM</strong></b><span>${safe(h.date||'날짜 없음')}</span></div>`).join('')}</div>`:'<p class="small-muted">크로매틱을 연습한 뒤 ‘연습 기록 저장’을 누르면 쌓여요.</p>'}<p class="chromatic09-note">기록은 이 기기에 저장되며, 연습 기록 메뉴의 JSON 백업으로 옮길 수 있어요. 속도는 자동 판정하지 않아요.</p></section>`;
}
function ensureProgression(){if(state.proPlan||state.proError)return;try{state.proPlan=planProgression(state.proInput);}catch(e){state.proError=e.message;}}
function guitarProgressionPro(){ensureProgression();const plan=state.proPlan||[],chosen=plan[Math.min(state.proSelected,plan.length-1)],presets=PROGRESSION_PRESETS;
 return `<section class="panel"><div class="panel-head"><div><span class="mini-label">PRACTICAL VOICE LEADING</span><h3>코드 진행 연습실</h3><p class="small-muted">코드 1~8개를 입력하면 손 이동을 고려한 보이싱을 추천해요.</p></div></div>
 <label class="pro-input-label" for="pro-chords">코드 진행 (공백으로 구분)</label><div class="pro-search"><input id="pro-chords" type="text" spellcheck="false" autocomplete="off" value="${safe(state.proInput)}" placeholder="F#m7 B7 EM7 C#m7"><button class="btn primary" data-action="pro-generate">운지 찾기</button></div>
 <div class="pro-presets">${presets.map(p=>`<button data-action="pro-preset" data-id="${p.id}">${p.label}</button>`).join('')}</div>
 <div class="pro-action-row"><label>BPM <input id="pro-bpm" type="number" value="${state.proBpm}" min="40" max="160" step="1"></label><button class="btn secondary" data-action="pro-play" ${plan.length?'':'disabled'}>${state.proPlaying?'■ 정지':'▶ 4박씩 재생'}</button><button class="btn secondary" data-action="pro-send-studio" ${plan.length?'':'disabled'}>이 진행으로 반주 만들기 →</button></div>
 ${state.proError?`<div class="pro-error" role="alert">${safe(state.proError)}</div>`:''}
 ${plan.length?`<div class="pro-progression">${plan.map((p,i)=>`<button class="pro-chord-tile ${state.proSelected===i?'active':''}" data-action="pro-select" data-index="${i}"><small>BAR ${i+1}</small><strong>${safe(p.chord.name)}</strong><span>${p.grip.rootString} · ${p.grip.rootFret}fr</span></button>`).join('')}</div>
 <div class="pro-detail"><div><h3>${safe(chosen.chord.name)} · 추천 운지</h3><p>다른 코드로 바꿀 때 프렛 이동과 운지 범위를 함께 고려한 예시예요. 반드시 유일한 정답은 아니에요.</p><div class="lib-role-row">${chosen.chord.parts.map(x=>`<span class="lib-interval"><b>${safe(x.tag)}</b>${safe(x.name)}</span>`).join('')}</div><button class="btn secondary" data-action="pro-play-one">${icon('play',16)} 이 코드 듣기</button></div>${chordDiagramSVG(chosen.grip,chosen.chord)}</div>
 <p class="small-muted">실제 코드 운지를 비교하는 가이드입니다. 손가락 번호는 다양한 해석이 가능하므로 아직 강제로 지정하지 않아요. 재생 소리는 기존 피아노 샘플입니다.</p>`:''}</section>`;
}
function playPlannedProgression(){if(state.proPlaying){stopGuitarAudio();render();return;}ensureProgression();const plan=state.proPlan||[];if(!plan.length)return;stopGuitarAudio();state.proPlaying=true;render();
 plan.forEach((p,i)=>guitarAudioTimers.push(setTimeout(()=>{if(!state.proPlaying||state.tab!=='guitar'||state.guitarView!=='progression')return;state.proSelected=i;chord(gripMidis(p.grip),undefined,1.05);render();},i*4*60000/state.proBpm)));
 guitarAudioTimers.push(setTimeout(()=>{state.proPlaying=false;render();},plan.length*4*60000/state.proBpm));
}
function guitarSight(){const ex=state.guitarSight,done=state.guitarSightStatus==='done',idx=state.guitarSightIndex,total=ex?.events.length||0;const progress=total?Math.round(100*idx/total):0;const canTab=(!state.guitarSightExam)||done;const last=state.guitarSightLast;
 return `<div class="panel guitar-study-start"><div class="panel-head"><div><span class="mini-label">GUITAR SIGHT READING</span><h3>① 악보를 읽고 ② 지판에서 같은 음 찾기</h3></div><span class="pill">높은음자리표 8↓</span></div><p class="guitar-help">화면에 악보가 나타나면 음을 읽고 기타의 해당 프렛을 눌러 답해 보세요. 실제 기타를 잡고 찾아본 뒤 화면에서 확인해도 좋아요.</p>
 <div class="guitar-control-grid"><label>조성<select id="guitar-sight-key">${SIGHT_KEYS.map(k=>`<option value="${k.id}" ${state.guitarSightKey===k.id?'selected':''}>${k.label}</option>`).join('')}</select></label><label>난이도<select id="guitar-sight-level">${[[1,'1단계 · 4분음표 / 가까운 음'],[2,'2단계 · 8분·2분음표'],[3,'3단계 · 도약과 다양한 리듬']].map(([v,label])=>`<option value="${v}" ${state.guitarSightLevel===v?'selected':''}>${label}</option>`).join('')}</select></label><label>지판 포지션<select id="guitar-sight-pos"><option value="0" ${state.guitarSightPos===0?'selected':''}>1포지션 (0–4프렛)</option><option value="5" ${state.guitarSightPos===5?'selected':''}>5포지션 (5–9프렛)</option><option value="9" ${state.guitarSightPos===9?'selected':''}>9포지션 (9–12프렛)</option></select></label><label>연습 유형<select id="guitar-sight-exam"><option value="practice" ${!state.guitarSightExam?'selected':''}>연습 · 바로 확인</option><option value="exam" ${state.guitarSightExam?'selected':''}>실전 · 끝나면 채점</option></select></label><label>예시 연주 BPM<input class="guitar-bpm-input" type="number" id="guitar-sight-bpm" min="40" max="180" value="${state.guitarSightBpm}"></label></div>
 <div class="guitar-toolbar">${btn('guitar-sight-new',`${icon('refresh',17)} ${ex?'새 악보 만들기':'초견 시작'}`)}${btn('guitar-sight-play',`${icon('play',17)} 정답 소리 듣기`,'btn secondary',ex?'':'disabled')}${btn('guitar-sight-tab',state.guitarSightShowTab?'TAB 숨기기':'정답 TAB 보기','btn secondary',!ex||!canTab?'disabled title="실전 모드는 완료 후 정답 공개"':'')}</div>
 ${ex?`<div class="guitar-progress"><span>${done?'연습 완료':`현재 ${idx+1} / ${total}음`}</span><span>${progress}%</span></div><div class="progress-track"><div style="width:${progress}%"></div></div><div class="guitar-score-heading"><strong>${ex.key} · ${ex.bars}마디</strong><span>해당 음을 연주하는 프렛을 선택하세요.</span></div>${sightStaffSVG(ex,{active:done?-1:idx,reveal:done})}${state.guitarSightShowTab&&canTab?`<div class="guitar-tab-solution"><strong>추천 운지 · TAB</strong>${sightTabSVG(ex,{active:done?-1:idx})}<p>같은 음은 다른 줄에서도 낼 수 있어요. 화면은 추천 위치 한 가지를 보여줍니다.</p></div>`:''}`:`<div class="guitar-empty">설정을 선택한 뒤 <b>초견 시작</b>을 눌러 새로운 악보를 만들어 보세요.</div>`}
 ${last?`<div class="guitar-feedback" aria-live="polite">${safe(last)}</div>`:''}
 ${done?`<div class="guitar-result"><strong>이번 초견 ${Math.round(state.guitarSightHits/total*100)}점</strong><span>첫 시도 정답 ${state.guitarSightHits}/${total}음 · 틀린 입력 ${state.guitarSightMistakes}회</span>${btn('guitar-sight-new','다음 악보 연습')}</div>`:ex?`<div class="guitar-answer-area"><div class="guitar-score-heading"><strong>지판에서 답하기</strong><small>초록색 표시 없이 음이름만 보고 선택하세요.</small></div>${fretInput({position:state.guitarSightPos})}</div>`:''}
 </div><div class="guitar-side-by-side"><div class="panel"><span class="mini-label">PRACTICE GUIDE</span><h3>쉽게 연습하는 법</h3><p class="guitar-help">① 위 악보의 색 표시된 음표를 읽어보세요.<br>② 기타에서 해당 음을 찾고 실제로 한 번 연주하세요.<br>③ 아래 지판 버튼으로 답을 확인하세요.<br>④ 끝나면 정답 TAB을 보며 운지 위치를 복습해요.</p></div><div class="panel"><span class="mini-label">YOUR PROGRESS</span><h3>최근 기타 초견 기록</h3>${state.guitarSightHistory.length?`<div class="guitar-stats"><strong>${Math.round(state.guitarSightHistory.slice(-10).reduce((a,b)=>a+b.accuracy,0)/Math.min(state.guitarSightHistory.length,10))}%</strong><span>최근 10회 평균 첫 시도 정답률</span></div><small class="small-muted">완료 세트 ${state.guitarSightHistory.length}회</small>`:'<p class="small-muted">완료한 초견 연습이 아직 없어요.</p>'}</div></div>
 ${infoBox('기타는 실음보다 한 옥타브 높게 기보하는 악기입니다. 화면의 8↓ 음자리표는 그 차이를 나타내며, 소리는 실제 음높이로 재생됩니다. 지금은 지판 입력의 음높이만 채점하며 리듬 연주·실제 기타 마이크 채점은 지원하지 않습니다.')}`;
}
function guitarChords(){const grip=state.guitarGrip,progression=state.guitarProgression;
 return `<div class="guitar-side-by-side"><div class="panel"><div class="panel-head"><div><span class="mini-label">MOVABLE CHORDS</span><h3>R6 · R5 코드폼 연습</h3></div><span class="pill">${grip.rootString}</span></div><p class="guitar-help">루트가 6번 줄이면 R6, 5번 줄이면 R5예요. 코드 이름을 보고 직접 잡아본 다음 그림으로 비교하세요.</p><div class="guitar-control-grid small"><label>루트 줄<select id="guitar-root-string"><option ${state.guitarGripRootString==='R6'?'selected':''} value="R6">R6 · 6번 줄</option><option ${state.guitarGripRootString==='R5'?'selected':''} value="R5">R5 · 5번 줄</option></select></label><label>코드 종류<select id="guitar-chord-quality"><option value="all">전체 랜덤</option>${CHORD_QUALITIES.map(q=>`<option value="${q}" ${state.guitarGripQuality===q?'selected':''}>${q==='M'?'Major':q}</option>`).join('')}</select></label></div><div class="guitar-toolbar">${btn('guitar-new-chord',`${icon('refresh',16)} 랜덤 코드`)}${btn('guitar-play-chord',`${icon('play',16)} 소리 듣기`,'btn secondary')}</div><div class="guitar-chord-visual"><div class="guitar-chord-name"><small>오늘의 코드</small><strong>${safe(grip.name)}</strong><span>${grip.rootString} · 루트 ${grip.fret}프렛</span></div>${chordDiagram(grip)}</div><p class="small-muted">×는 치지 않는 줄, ● 안 숫자는 실제 프렛 번호예요. 프렛 숫자가 꼭 손가락 번호를 뜻하지는 않아요.</p></div>
 <div class="panel"><span class="mini-label">4 CHORD PRACTICE</span><h3>랜덤 4코드 전환</h3><p class="guitar-help">순서대로 코드를 잡으며 전환 연습을 해보세요. 코드를 선택하면 추천 코드폼이 바뀝니다.</p><div class="guitar-toolbar">${btn('guitar-random-four',`${icon('refresh',16)} 4코드 생성`)}${btn('guitar-play-four',`${icon('play',16)} 순서 듣기`,'btn secondary',progression.length?'':'disabled')}</div>${progression.length?`<div class="guitar-four-grid">${progression.map((g,i)=>`<button class="guitar-four-item ${state.guitarCurrent===i?'current':''}" data-action="guitar-four-select" data-index="${i}"><small>BAR ${i+1}</small><strong>${safe(g.name)}</strong><span>${g.rootString} · ${g.fret}fr</span></button>`).join('')}</div>`:`<div class="guitar-empty">4코드 생성을 누르면 다양한 코드가 등장해요.</div>`}<div class="guitar-remember"><strong>코드 전환 루틴 · 5분</strong><p>① 4코드를 한 번씩 천천히 잡아보세요.<br>② 코드 음을 듣고 구성음을 확인해요.<br>③ 각 코드에 4박씩 주며 연결해요.</p></div></div></div>${infoBox('코드 운지는 이동형 보이싱 예시이며 모든 가능한 운지를 의미하지 않습니다. 코드 소리 듣기는 기존 피아노 샘플로 재생합니다.')}`;
}
function guitarRhythm(){const slots=state.guitarRhythmPattern,bpm=state.guitarRhythmBpm;
 return `<div class="panel"><div class="panel-head"><div><span class="mini-label">16TH NOTE STRUMMING</span><h3>4/4 · 16분 스트로크 패턴</h3></div><span class="pill">기타 리듬</span></div><p class="guitar-help">각 칸을 눌러 <b>다운(D) → 업(U) → 쉼(—)</b> 순서로 바꿔보세요. 소리를 들으며 일정한 박으로 스트로크하는 연습이에요.</p><div class="guitar-toolbar"><label class="guitar-bpm">BPM <input id="guitar-rhythm-bpm" type="number" min="40" max="180" value="${bpm}" step="1"></label>${btn('guitar-rhythm-play',state.guitarRhythmPlaying>=0?'정지':'▶ 리듬 재생',state.guitarRhythmPlaying>=0?'btn secondary':'btn primary')}${btn('guitar-rhythm-reset','기본 패턴','btn secondary')}</div><div class="guitar-rhythm-scroll"><div class="guitar-rhythm-grid">${slots.map((x,i)=>`<button class="guitar-rhythm-cell ${x==='D'?'down':x==='U'?'up':'rest'} ${state.guitarRhythmPlaying===i?'playing':''}" data-action="guitar-rhythm-cell" data-index="${i}" title="${Math.floor(i/4)+1}박 ${['1','e','&','a'][i%4]}"><small>${Math.floor(i/4)+1} ${['','e','&','a'][i%4]}</small><b>${x==='D'?'↓':x==='U'?'↑':'—'}</b></button>`).join('')}</div></div><p class="small-muted">기본 리듬에서는 박마다 4개의 16분 구획이 있으며, 음표 길이보다 스트로크 시작 위치를 익히는 도구예요. 클릭 소리는 리듬 가이드이며 실제 기타 녹음은 아닙니다.</p></div>`;
}
function startGuitarRhythm(){stopGuitarAudio();const bpm=state.guitarRhythmBpm,ctx=context();let step=0;
 const trigger=()=>{
  const cells=document.querySelectorAll('.guitar-rhythm-cell');cells.forEach((el,i)=>el.classList.toggle('playing',i===step));
  const status=state.guitarRhythmPattern[step];const beat=step%4===0;
  if(beat||status!=='-'){
   const osc=ctx.createOscillator(),gain=ctx.createGain(),t=ctx.currentTime;
   osc.type=status==='-'?'sine':'triangle';osc.frequency.setValueAtTime(beat?880:status==='D'?275:355,t);osc.frequency.exponentialRampToValueAtTime(beat?600:status==='D'?155:235,t+.035);
   gain.gain.setValueAtTime(beat?.08:.045,t);gain.gain.exponentialRampToValueAtTime(.0001,t+.07);
   osc.connect(gain);gain.connect(ctx.destination);osc.start(t);osc.stop(t+.075);
  }
  step=(step+1)%16;state.guitarRhythmPlaying=step;
 };
 state.guitarRhythmPlaying=0;trigger();guitarRhythmTimer=setInterval(trigger,60000/bpm/4);
 const b=document.querySelector('[data-action="guitar-rhythm-play"]');if(b)b.textContent='■ 정지';
}
function playGuitarExercise(){stopGuitarAudio();const ex=state.guitarSight;if(!ex)return;
 const delay=60000/state.guitarSightBpm;ex.events.forEach((item,i)=>{const millis=(item.bar*4+item.beat)*delay;guitarAudioTimers.push(setTimeout(()=>{if(state.tab==='guitar'&&state.guitarView==='sight')note(item.midi,undefined,Math.max(.2,item.duration*.47))},millis));});}
function playGuitarProgression(){stopGuitarAudio();state.guitarProgression.forEach((g,i)=>guitarAudioTimers.push(setTimeout(()=>{if(state.tab==='guitar'&&state.guitarView==='chords'){chord(chordPitches(g));state.guitarCurrent=i;state.guitarGrip=g;render()}},i*1350)));}
function storeGuitarSight(){const ex=state.guitarSight;if(!ex)return;const accuracy=ex.events.length?Math.round(100*state.guitarSightHits/ex.events.length):0;state.guitarSightHistory.push({date:new Date().toLocaleDateString('sv-SE'),key:ex.keyId,level:ex.level,position:ex.position,accuracy,count:ex.events.length});state.guitarSightHistory=state.guitarSightHistory.slice(-300);localStorage.setItem('musiclab-guitar-sight',JSON.stringify(state.guitarSightHistory));}
function guitarSightAnswer(midi){const ex=state.guitarSight;if(!ex||state.guitarSightStatus==='done')return;
 const expected=ex.events[state.guitarSightIndex];if(!expected)return;const right=midi===expected.midi;
 state.guitarSightLast=state.guitarSightExam?'진행 중입니다. 결과는 끝나면 확인할 수 있어요.':right?`맞았어요! ${midiName(midi)} · ${expected.place.string}번 줄 ${expected.place.fret}프렛 등에서 연주할 수 있어요.`:`아직 달라요. ${midiName(midi)} 대신 다른 프렛을 찾아보세요.`;
 if(right&&!state.guitarSightRetried)state.guitarSightHits++;
 if(!right){state.guitarSightMistakes++;state.guitarSightRetried=true;}
 if(right||state.guitarSightExam){state.guitarSightIndex++;state.guitarSightRetried=false;}
 if(state.guitarSightIndex>=ex.events.length){state.guitarSightStatus='done';state.guitarSightLast='모든 음을 확인했어요! 악보와 정답 TAB을 비교해 보세요.';state.guitarSightShowTab=true;storeGuitarSight();}
 render();
}

function newQuestion(){
 state.feedback=null;state.melodyInputs=[];
 const kind=state.earMode;
 const r=uniqueGenerated(()=>makeEarProblem({mode:kind,clef:state.clef,level:state.staffLevel,seed:nextSeed()}),x=>x.signature,state.problemRecent);
 state.question=r.item;state.problemRecent=[...state.problemRecent,r.signature].slice(-50);
 localStorage.setItem('musiclab-problem-recent',JSON.stringify(state.problemRecent));
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
const PARTS={
 folds:['성대 · Vocal folds','목 안에 있는 한 쌍의 조직이에요. 공기가 지나갈 때 빠르게 진동하여 소리의 바탕을 만들어요. 소리가 커졌다고 성대가 무조건 세게 닫히는 것은 아니에요.'],
 larynx:['후두 · Larynx','성대가 들어 있는 목 안의 기관이에요. 연골과 근육이 함께 성대의 위치·길이·긴장 등을 조절해요.'],
 tongue:['혀 · Tongue','혀를 올리거나 앞뒤로 움직이면 입 안과 목 뒤의 공간이 달라져요. 그래서 같은 음높이도 다른 모음이나 음색으로 들릴 수 있어요.'],
 palate:['연구개 · Soft palate','입천장의 뒤쪽 부드러운 부분이에요. 코 쪽 통로의 연결 상태를 조절해요. 특히 비음이 만들어지는 데 중요한 역할을 해요.'],
 pharynx:['인두 · Pharynx','목 안쪽의 소리 통로예요. 크기와 모양이 바뀌면 성도 공명, 즉 어떤 주파수가 더 잘 들리는지가 달라질 수 있어요.'],
 lungs:['호흡 · Respiratory system','폐에서 나온 공기는 발성의 에너지원이에요. 소리를 내기 위해 항상 강하게 밀어낼 필요는 없어요.']
};
const REG={
 m1:{title:'진성 · M1',tag:'실제로 구분하는 후두 진동 기전',desc:'주로 일상 말소리에서 많이 쓰는 진동 방식이에요. 성대 조직의 움직임과 접촉 특성이 M2와 달라질 수 있어요. 다만 소리가 크거나 낮다는 이유만으로 진성이라고 확정할 수는 없어요.',feeling:'가슴 쪽 진동이나 단단한 느낌을 말하는 사람이 있지만, 사람마다 다릅니다.',source:'Roubeau et al. (2009)'},
 m2:{title:'가성 · M2',tag:'실제로 구분하는 후두 진동 기전',desc:'M1과는 다른 성대 진동 방식이에요. 가볍고 부드럽게 들리는 경우가 많지만, 가성이라고 해서 반드시 숨이 많이 섞이는 것은 아니에요.',feeling:'가벼워지거나 힘이 덜 드는 것처럼 느낄 수 있지만, 감각만으로 M2 여부를 알 수 없습니다.',source:'Roubeau et al. (2009)'},
 head:{title:'두성 · Head voice',tag:'정의가 여러 개인 교육 용어',desc:'두성은 선생님이나 장르에 따라 의미가 달라요. 머리에서 소리가 만들어지는 건 아니고, 실제 음원은 성대에서 생겨요. 두성을 M1 또는 M2 중 하나라고 무조건 단정할 수 없어요.',feeling:'머리나 얼굴 쪽 울림을 느낄 수 있어요. 이는 개인이 느끼는 감각입니다.',source:'Roubeau et al. (2009)'},
 mix:{title:'믹스보이스 · Mix',tag:'하나의 고정된 성대 모양이 아님',desc:'음역을 바꿀 때 음색과 감각이 자연스럽게 이어지도록 조절하는 가창 용어예요. 특정 근육 하나가 작동하는 방식이나 한 가지 성대 모양으로 고정해 정의하지 않아요.',feeling:'음이 올라가도 소리가 갑자기 바뀌지 않는다고 느끼는 경우가 있어요.',source:'가창 교육 용어와 후두 기전의 구분'}
};
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
function vocalSteps(){
 const steps={
 science:{title:'먼저 이렇게 둘러보세요',summary:'소리가 생기는 원리를 그림과 쉬운 설명으로 익혀요.',items:['성대·혀 등 관심 있는 부위를 누르기','3D에서 성대 움직임 재생하기','아래에서 진성·가성 설명 읽고 퀴즈 풀기']},
 listen:{title:'이렇게 소리를 비교해 보세요',summary:'같은 음높이라도 입 모양에 따라 음색이 달라질 수 있어요.',items:['아·에·이·오·우 중 한 모음 선택','「선택한 소리 듣기」 누르기','다른 모음을 선택해 다시 들어보기']},
 practice:{title:'처음 사용하는 방법',summary:'편안한 음 하나를 기준으로 소리를 듣고 자신의 목소리를 관찰해요.',items:['「기준음 듣기」로 피아노 소리 확인','「마이크 켜기」 후 짧고 편안하게 소리 내기','필요하면 A·B 두 번 녹음해 다시 듣기']}
 }[state.vocalView];
 return `<section class="voice-start" aria-label="사용 방법"><div class="voice-start-head"><span class="voice-start-kicker">QUICK START</span><strong>${steps.title}</strong><p>${steps.summary}</p></div><ol>${steps.items.map(t=>`<li>${t}</li>`).join('')}</ol></section>`;
}
function vocalViewNav(){const views=[['science','원리 배우기','그림·3D·쉬운 설명'],['listen','소리 비교하기','모음 선택·들어보기'],['practice','내 목소리 보기','마이크·A/B 녹음']];return `<div class="voice-tabs" role="group" aria-label="보컬 연구실 모드">${views.map(([k,t,d])=>`<button data-action="vocal-view" data-view="${k}" class="voice-tab ${state.vocalView===k?'on':''}" aria-pressed="${state.vocalView===k}"><strong>${t}</strong><span>${d}</span></button>`).join('')}</div>`;}
function lessonPanel(){const lesson=VOICE_LESSONS.find(x=>x.id===state.vocalLesson)||VOICE_LESSONS[0];return `<section class="panel voice-lesson"><div class="panel-head"><div><span class="mini-label">8가지 기초 발성 원리</span><h3>쉽게 배우고, 더 깊게 이해하기</h3><p class="small-muted">왼쪽(휴대폰에서는 위쪽)에서 궁금한 주제를 선택하세요.</p></div></div><div class="lesson-layout"><div class="lesson-topics">${VOICE_LESSONS.map((x,i)=>`<button class="lesson-topic ${x.id===lesson.id?'selected':''}" data-action="voice-lesson" data-id="${x.id}"><small>${String(i+1).padStart(2,'0')} · ${x.category}</small><strong>${x.title}</strong></button>`).join('')}</div><article class="lesson-article"><span class="pill accent">오늘의 핵심</span><h3>${lesson.title}</h3><p class="lesson-one-line">${lesson.summary}</p><h4 class="lesson-subtitle">쉽게 설명하면</h4><p class="lesson-easy">${lesson.easy}</p><div class="lesson-try"><b>앱에서 직접 확인하기</b><p>${lesson.tryit}</p></div><details class="voice-disclosure"><summary>조금 더 자세한 과학 설명 보기</summary><div class="lesson-points">${lesson.points.map((p,i)=>`<div><span>${String(i+1).padStart(2,'0')}</span><p>${p}</p></div>`).join('')}</div></details><details class="voice-disclosure"><summary>어려운 용어 뜻 보기</summary><p>${lesson.terms}</p></details><a href="${lesson.url}" target="_blank" rel="noopener noreferrer" class="research-link">원문·근거 확인 · ${lesson.source} ↗</a></article></div></section>`;}
function vocalPathGuide(){const step=voicePathStages[state.voiceStep]||voicePathStages[0];
 return `<section class="panel voice-path-panel"><div class="panel-head"><div><span class="mini-label">VOICE PATH · 4 STAGES</span><h3>내 목소리는 어떻게 만들어질까?</h3><p class="small-muted">각 단계를 누르면 그 부분이 하는 일을 쉬운 말로 설명해 줘요.</p></div></div>
 <div class="voice-path-flow" role="group" aria-label="소리가 만들어지는 네 단계">${voicePathStages.map((v,i)=>`<button type="button" class="voice-path-stage ${state.voiceStep===i?'selected':''}" data-action="voice-step" data-step="${i}" aria-pressed="${state.voiceStep===i}"><span>${String(i+1).padStart(2,'0')}</span><strong>${v.short}</strong><small>${v.sub}</small></button>`).join('')}</div>
 <div class="voice-path-explain" role="status"><div class="voice-path-illustration" aria-hidden="true"><svg viewBox="0 0 300 110"><defs><linearGradient id="air-path" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#9bc4cc"/><stop offset="1" stop-color="#62b9a8"/></linearGradient></defs><path d="M32 56H268" stroke="var(--line)" stroke-width="13" stroke-linecap="round"/><path d="M32 56H${45+state.voiceStep*65}" stroke="url(#air-path)" stroke-width="13" stroke-linecap="round"/><path d="m258 44 13 12-13 12" fill="none" stroke="var(--muted)" stroke-width="4"/><g>${voicePathStages.map((v,i)=>`<circle cx="${42+i*66}" cy="56" r="${state.voiceStep===i?20:16}" fill="${state.voiceStep===i?'var(--accent)':'var(--card)'}" stroke="${state.voiceStep===i?'var(--accent)':'var(--line)'}" stroke-width="2"/><text x="${42+i*66}" y="61" text-anchor="middle" font-size="14" fill="${state.voiceStep===i?'#09221d':'var(--text)'}">${i+1}</text>`).join('')}</g></svg></div><div><span class="pill accent">${step.title}</span><h4>${step.headline}</h4><p>${step.easy}</p><small>${step.caution}</small></div></div>
 <div class="voice-path-next">${btn('voice-step-next','다음 단계 보기 →','btn secondary small')}${btn('vocal-jump-listen','소리로 확인하기','btn ghost dark small')}</div></section>`;
}
function vocalScience(){const reg=REG[state.reg];return `${vocalPathGuide()}<div class="voice-section-marker><span class="pill accent">01 / ANATOMY &amp; MECHANISMS</span><span>측정된 사실과 교육적 비유를 구분합니다.</span></div>
<div class="two-col top-align"><section class="panel"><div class="panel-head"><div><span class="mini-label">INTERACTIVE ANATOMY</span><h3>발성 기관 단면 탐색</h3></div><span class="pill">교육용 그림</span></div>${anatomySvg()}<div class="chip-row">${Object.entries(PARTS).map(([k,v])=>`<button class="chip ${state.part===k?'on':''}" data-action="anatomy-part" data-part="${k}">${v[0].split(' · ')[0]}</button>`).join('')}</div><div class="anatomy-info"><strong>${PARTS[state.part][0]}</strong><p>${PARTS[state.part][1]}</p></div><p class="footnote">인체 비율을 정확히 재현한 의료 영상이 아니라 위치 관계를 설명하는 단면 개념도입니다.</p></section>
<section class="panel"><div class="panel-head"><div><span class="mini-label">ROTATABLE LARYNX</span><h3>성대·후두 입체 관찰</h3></div><span class="pill">3D 개념 모델</span></div><p class="small-muted">「성대 움직임 재생」을 누르면 천천히 움직여요. 더 자세히 보고 싶으면 아래 상세 조작을 열어 보세요.</p><canvas id="larynx-canvas" role="img" aria-label="교육용 후두 3D 입체 구조: 회전, 기울기, 확대, 성문 개폐 관찰"></canvas><label class="voice-target-select">구조 강조<select id="larynx-focus">${[['all','전체 구조'],['folds','진성대'],['falseFold','전정주름'],['cartilage','연골'],['ary','피열연골']].map(([k,t])=>`<option value="${k}" ${state.larynxFocus===k?'selected':''}>${t}</option>`).join('')}</select></label><div class="voice-view-controls">${btn('larynx-animate',state.larynxAnimating?'⏸ 느린 움직임 정지':'▶ 성대 움직임 재생','btn secondary small')}${btn('larynx-reset','시야 초기화','btn ghost dark small')}</div><details class="voice-disclosure voice-controls"><summary>3D 상세 조작 (회전·확대·성문)</summary><div class="sliders">${[['larynxYaw','좌우 회전','°',-115,115],['larynxPitch','위아래 시야','°',10,80],['larynxZoom','확대','%',72,130],['glottalOpen','성문 열림','%',0,100]].map(([k,t,u,mi,ma])=>`<label class="slider-label"><span>${t}</span><b id="v-${k}">${state[k]}${u}</b><input type="range" min="${mi}" max="${ma}" value="${state[k]}" data-slider="${k}"></label>`).join('')}</div></details><p class="footnote">느린 애니메이션은 음향적 진동 속도와 무관하며 실제 후두 내시경 영상이 아닙니다. 개인의 성대 접촉 상태를 표시하지 않습니다.</p></section></div>
<section class="panel"><div class="panel-head"><div><span class="mini-label">LARYNGEAL MECHANISMS</span><h3>진성·가성·두성·믹스, 쉽게 비교</h3></div></div><div class="register-grid">${[['m1','진성 / M1'],['m2','가성 / M2'],['head','두성'],['mix','믹스']].map(([k,label])=>`<button class="register-option ${state.reg===k?'selected':''}" data-action="register" data-register="${k}">${label}</button>`).join('')}</div><p class="small-muted">버튼을 누르면 그 발성이 무엇을 뜻하는지, 어떤 느낌으로 설명되는지 확인할 수 있어요. 아래 그림은 실제 성대 촬영 화면이 아니에요.</p><div class="voice-reg-comparison"><div><span class="pill accent">${reg.tag}</span><h3>${reg.title}</h3><p>${reg.desc}</p><div class="sensation"><b>사람이 느낄 수 있는 감각</b><p>${reg.feeling}</p></div><p class="footnote">용어와 기전의 구분 근거: Roubeau et al., 2009. “두성”과 “믹스”는 단일한 생리학적 구조가 아닙니다.</p></div><div class="voice-register-figure"><div class="folds-schematic ${state.reg}"><svg viewBox="0 0 250 124" role="img" aria-label="성대 구조 차이를 설명하기 위한 개념도"><path d="M21 21Q104 38 124 112Q148 38 229 21L229 117L21 117Z" fill="#d38f92" opacity=".78"/><path d="M${state.reg==='m2'?114:121} 49Q124 72 ${state.reg==='m2'?114:121} 106L${state.reg==='m2'?136:127} 106Q126 70 ${state.reg==='m2'?136:127} 49" fill="#303c4f" opacity=".95"/></svg></div><small>고정된 실제 성문 형태를 뜻하지 않습니다</small></div></div></section>
${lessonPanel()}
<section class="panel"><div class="panel-head"><div><span class="mini-label">CHECK YOUR KNOWLEDGE</span><h3>발성 과학 이해도 퀴즈</h3></div><span class="pill">${(state.voiceQuizIndex%VOICE_QUIZ.length)+1} / ${VOICE_QUIZ.length} · 정답 ${state.voiceQuizScore}</span></div>${(()=>{const q=VOICE_QUIZ[state.voiceQuizIndex%VOICE_QUIZ.length];return `<p class="voice-quiz-question">${q.q}</p><div class="voice-quiz-answers">${q.answers.map((t,i)=>`<button ${state.voiceQuizChoice!==null?'disabled':''} class="answer ${state.voiceQuizChoice!==null?(i===q.correct?'correct':i===state.voiceQuizChoice?'incorrect':''):''}" data-action="voice-quiz-answer" data-index="${i}">${t}</button>`).join('')}</div>${state.voiceQuizChoice!==null?`<div class="voice-quiz-explain" role="status">${state.voiceQuizChoice===q.correct?'정답!':'다시 확인해 보세요.'} ${q.why}</div>${btn('voice-quiz-next','다음 개념 →','btn secondary small')}`:''}`})()}</section>
${infoBox('마이크만으로 후두 진동 기전·성대 접촉률·음성 건강을 판정할 수 없습니다. 몸의 감각이나 “소리가 앞으로 간다” 같은 표현도 해부학적 사실과 별도로 다룹니다.')}`;}
function vocalListen(){return `<div class="voice-section-marker"><span class="pill accent">02 / SOURCE &amp; FILTER LAB</span><span>변수를 바꾸어 소리의 변화 자체를 들어보세요.</span></div><div class="two-col top-align"><section class="panel"><div class="panel-head"><div><span class="mini-label">VOCAL TRACT CONTROLS</span><h3>성도 공명 실험실</h3></div>${btn('formant-play',`${icon('play',16)} 선택한 소리 듣기`,'btn primary small')}</div><div class="voice-compare-inline">${btn('voice-compare-au','아 → 우 순서대로 듣기','btn secondary small')}<span id="voice-compare-status" role="status">같은 음높이로 모음의 차이를 들어볼 수 있어요.</span></div><p class="small-muted">먼저 모음 하나를 누르고 「선택한 소리 듣기」를 눌러 보세요. 다른 모음과 차이를 비교하면 돼요.</p><div class="voice-preset-row">${Object.entries(VOWEL_PRESETS).map(([key,p])=>`<button class="chip ${state.vowelPreset===key?'on':''}" data-action="voice-vowel" data-vowel="${key}">${p.label.split(' · ')[0]}</button>`).join('')}</div>${resonanceSvg()}<details class="voice-disclosure voice-controls"><summary>고급 설정 열기 · 입 모양과 소리 직접 조절</summary><p class="small-muted">처음에는 이 설정을 건드리지 않아도 돼요. F0는 음높이에, 아래 조절 값들은 합성된 음색에 영향을 줍니다.</p><div class="sliders">${[['jaw','턱 열림',0,100],['tongue','혀 위치 (교육용)',0,100],['lips','입술 모음',0,100],['vocalF0','기본 주파수 F0',90,550],['vocalBreath','기식 소음 혼합',0,100]].map(([k,title,mi,ma])=>`<label class="slider-label"><span>${title}</span><b id="v-${k}">${state[k]}${k==='vocalF0'?' Hz':'%'}</b><input type="range" min="${mi}" max="${ma}" step="${k==='vocalF0'?5:1}" value="${state[k]}" data-slider="${k}"></label>`).join('')}</div></details><details class="voice-disclosure voice-controls"><summary>F1·F2·F3 공명 그래프와 숫자 보기</summary><p class="small-muted">포먼트는 특정 주파수가 더 잘 들리는 부분이에요. 아래 수치는 실제 사람이 아닌 교육용 계산 결과예요.</p><div id="formant-values" class="formant-values">${voiceStats()}</div><div id="formant-spectrum">${voiceSpectrumSVG()}</div></details><p class="footnote">슬라이더 수치와 F1·F2·F3는 반응형 교육 모델 계산값입니다. 실제 사람의 특정 모음·인두 길이·성대 상태를 측정한 값이 아닙니다.</p></section>
<section class="panel"><div class="panel-head"><div><span class="mini-label">HOW SOUND IS FORMED</span><h3>소리가 만들어지는 4단계</h3></div></div><div class="voice-process"><div><span>01</span><b>호기 흐름</b><p>폐에서 올라온 공기가 성대 아래쪽에 압력을 만들어요.</p></div><div><span>02</span><b>성대 진동</b><p>성대가 빠르게 떨리며 소리의 바탕을 만들어요.</p></div><div><span>03</span><b>성도 공명</b><p>입·혀·목의 공간이 바뀌면 어떤 주파수가 더 잘 들리는지도 달라져요.</p></div><div><span>04</span><b>들리는 음색</b><p>그 결과 「아·이·우」처럼 서로 다른 음색이 들려요.</p></div></div><div class="voice-audio-pair">${btn('voice-ex-m1','▶ M1 경향 합성 예시','btn secondary')}${btn('voice-ex-m2','▶ M2 경향 합성 예시','btn secondary')}</div><p class="footnote">두 버튼은 발성 기전의 정확한 음향 서명을 재현하는 자료가 아니며 단순화한 합성음 비교입니다. “자연스러운 진짜 보컬” 음원을 가장하지 않습니다.</p><div class="vocal-guidance"><b>왜 소리가 전자음처럼 들릴 수 있나요?</b><p>사람마다 성대의 주기성·불규칙성·성도·발음·감정이 달라요. 현재 합성 엔진은 연구 내용을 이해하기 위한 음향 데모로, 실제 사람의 발성과 완전히 같지는 않습니다. 아래 연습실에서 직접 녹음한 목소리로 비교하는 것이 더 정확해요.</p></div></section></div>
<section class="panel"><span class="mini-label">LISTENING CHECK</span><h3>음색을 판단할 때 확인할 질문</h3><div class="voice-check-grid"><article><b>기본 주파수가 바뀌었나?</b><p>F0를 바꾸면 음높이가 달라져요. 같은 F0라도 음색은 다를 수 있어요.</p></article><article><b>모음이 바뀌었나?</b><p>입·혀·턱 형태가 바뀌면 공명 에너지의 분포가 달라져요.</p></article><article><b>숨이 더 섞인 것처럼 들리나?</b><p>기식성은 여러 원인과 음향 지표가 관련돼 있어요. 느낌만으로 성대 접촉을 단정하지 마세요.</p></article></div></section>`;}
function vocalPractice(){const tgt=Number.isInteger(state.voiceTarget)?state.voiceTarget:60;return `<div class="voice-section-marker"><span class="pill accent">03 / LISTEN &amp; COMPARE</span><span>마이크는 기기 안에서 분석하고, 녹음은 서버로 전송하지 않습니다.</span></div><div class="two-col top-align"><section class="panel mic-panel"><div class="panel-head"><div><span class="mini-label">LIVE AUDIO FEATURES</span><h3>내 목소리 실시간 관찰</h3></div><span class="dot-status ${state.micActive?'active':''}" id="mic-status">${state.micActive?'측정 중':'대기 중'}</span></div><div class="voice-measures"><div><span>지금 낸 음</span><strong id="pitch-note">—</strong><small id="pitch-freq">마이크 대기</small></div><div><span>기준음과 차이</span><strong id="pitch-cents">—</strong><small>cents · 감지되는 경우</small></div><div><span>마이크에 들어온 소리 크기</span><strong id="voice-level">—</strong><small>마이크 기준의 상대적인 값</small></div><div><span>음색 관련 수치</span><strong id="voice-centroid">—</strong><small>주파수 에너지의 무게중심</small></div></div><div class="voice-pitch-coach" aria-label="현재 음정과 기준음의 차이"><div class="voice-coach-heading"><b>기준음과 얼마나 가까울까?</b><span id="voice-pitch-hint">기준음을 들은 후 마이크를 켜 보세요.</span></div><div class="voice-pitch-scale" role="img" aria-label="왼쪽은 낮음, 중앙은 기준음, 오른쪽은 높음"><span class="left">낮음</span><span class="center">기준음</span><span class="right">높음</span><div id="voice-pitch-pointer" class="voice-pitch-pointer" style="left:50%" aria-hidden="true"></div></div><p class="footnote">차이는 센트(cents)로 표시돼요. 100센트는 반음이에요. 소리가 편안하지 않으면 멈추세요.</p></div><div class="pitch-graph"><svg viewBox="0 0 420 108 preserveAspectRatio="none"><path d="M0 54H420M0 27H420M0 81H420" stroke="var(--line)" stroke-dasharray="4 5"/><polyline id="pitch-line" points="" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div><details class="voice-disclosure voice-controls"><summary>고급 분석 · 주파수 그래프 보기</summary><p class="small-muted">그래프의 봉우리는 특정 주파수 성분이 두드러짐을 보여요. 진성·가성을 확정하는 검사는 아닙니다.</p><div class="voice-live-panel"><span class="mini-label">SPECTRUM · 90–5000 Hz</span><svg id="mic-spectrum" viewBox="0 0 420 92" role="img" aria-label="마이크 주파수 스펙트럼"><rect width="420" height="92" rx="9" fill="var(--res-bg)"/><g id="mic-bands"></g></svg></div></details><div class="voice-acoustic-text" id="voice-interpretation" aria-live="polite">「마이크 켜기」를 누르고 편안하게 한 음을 내보세요. 화면에 현재 음높이가 표시됩니다. 진성·가성은 자동 판정하지 않아요.</div>${btn(state.micActive?'mic-stop':'mic-start',`${icon(state.micActive?'stop':'mic',17)} ${state.micActive?'마이크 중지':'마이크 켜기'}`,'btn '+(state.micActive?'secondary':'primary')+' full')}<div id="mic-error" class="error-text"></div><p class="footnote">음높이 추정·스펙트럼은 환경 소음 및 마이크 설정에 영향을 받습니다. “두성·믹스” 자동 판정이나 치료·진단 기능은 제공하지 않습니다.</p></section>
<section class="panel"><div class="panel-head"><div><span class="mini-label">REFERENCE PIANO</span><h3>기준음을 듣고 비교</h3></div></div><p class="small-muted">편안한 음역의 목표음을 선택해 피아노 소리를 들어본 뒤, 자신의 소리와 비교해 보세요. 불편할 정도로 높은 음을 낼 필요는 없습니다.</p><label class="voice-target-select">기준음<select id="voice-target">${Array.from({length:25},(_,i)=>48+i).map(m=>`<option value="${m}" ${m===tgt?'selected':''}>${['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'][m%12]}${Math.floor(m/12)-1} · ${Math.round(midiToFrequency(m))}Hz</option>`).join('')}</select></label><div class="voice-target-buttons">${btn('voice-target-down','− 반음 낮추기','btn secondary small')}${btn('voice-target-play',`${icon('play',17)} 기준음 듣기`,'btn primary')}${btn('voice-target-up','+ 반음 높이기','btn secondary small')}</div><div class="vocal-guidance"><strong>측정 가능한 것</strong><p>주파수·음높이 변화·상대적인 주파수 에너지 분포</p><strong>이것만으로는 알 수 없는 것</strong><p>CT·TA의 실제 수축 정도, 성문 접촉률, 진성·가성의 확정적인 구분, 목소리의 건강 상태</p></div><p class="footnote">입력 레벨은 dBFS이며 실제 음압(dB SPL)이 아닙니다. 마이크 장치와 거리에 따라 수치가 변할 수 있어요.</p></section></div>
<section class="panel"><div class="panel-head"><div><span class="mini-label">TAKE A / TAKE B</span><h3>녹음해서 직접 듣고 판단하기</h3></div></div><p class="small-muted">같은 문장·멜로디를 편안한 목소리로 두 번 녹음한 다음, 타이밍·음높이·발음·음색을 비교해 봐. 녹음 데이터는 현재 탭의 메모리에만 존재해.</p><div class="record-takes">${['A','B'].map(slot=>`<div class="record-take"><strong>Take ${slot}</strong>${btn('record-toggle',recordingSlot()===slot?'■ 녹음 정지':'● 녹음 시작',recordingSlot()===slot?'btn secondary':'btn primary',`data-slot="${slot}"`)}${clipUrl(slot)?`<audio controls preload="metadata" src="${clipUrl(slot)}" aria-label="Take ${slot} 재생"></audio><a class="btn secondary record-download" href="${clipUrl(slot)}" download="${clipDownloadName(slot)}">Take ${slot} 파일 저장</a>`:'<span class="small-muted">아직 녹음 없음</span>'}</div>`).join('')}</div><div class="error-text" id="record-error"></div><p class="footnote">브라우저에 따라 다운로드 파일의 실제 형식이 webm이나 mp4일 수 있습니다. 저장하지 않은 녹음은 새로고침하면 사라집니다. A/B 재생 결과만으로 발성 기전은 판정할 수 없습니다.</p></section>
<section class="panel"><div class="panel-head"><div><span class="mini-label">LESSON REVIEW</span><h3>내가 들은 차이 기록</h3></div></div><label class="voice-note-label" for="voice-observation">선생님 피드백, 발음 변화, 내 감각, 소리에서 확인된 특징을 구분해서 기록해 보세요.</label><textarea id="voice-observation" rows="5" maxlength="1800" placeholder="예: Take A는 음정 진입이 빨랐고, Take B는 발음이 선명하게 들렸어. 이건 내 청각적 판단이며 성대의 실제 움직임을 직접 측정한 건 아냐.">${safe(state.voiceNotes)}</textarea><div class="voice-note-actions">${btn('voice-note-save','관찰 메모 저장','btn primary small')}<span id="voice-note-status" role="status">이 기기의 브라우저에만 저장</span></div></section>
${infoBox('녹음이나 분석 중 통증·어지러움·목소리 이상이 느껴지면 즉시 멈추세요. 강하게 밀어붙이거나 오래 소리를 유지해야 하는 훈련은 필요하지 않습니다.')}`;}
function vocal(){return `${pageHeader('VOICE SCIENCE / ALPHA ${APP_VERSION}','보컬 연구실','성대가 어떻게 소리를 만드는지 배우고, 직접 소리를 들어보고, 내 목소리도 확인해요.')}${vocalViewNav()}${vocalSteps()}${state.vocalView==='science'?vocalScience():state.vocalView==='listen'?vocalListen():vocalPractice()}`;}
function ensureStudio(){try{state.studioProject=normalizeStudioProject(state.studioProject||newStudioProject(state.root,state.mode,state.bpm))}catch{state.studioProject=newStudioProject(state.root,state.mode,state.bpm)}return state.studioProject;}
function persistStudio(){if(state.studioProject){state.melodyNotes=state.melodyNotes.filter(x=>Number.isInteger(x.step)&&x.step>=0&&x.step<state.studioProject.bars.length*4&&Number.isInteger(x.midi)&&x.midi>=48&&x.midi<=83).slice(0,256);state.studioProject.melody=state.melodyNotes.map(x=>({midi:x.midi,step:x.step}));}localStorage.setItem('musiclab-studio-active',JSON.stringify(state.studioProject));localStorage.setItem('musiclab-melody',JSON.stringify(state.melodyNotes));}
function studioStop(){
 if(backingPlayer){const b=backingPlayer;backingPlayer=null;b.stop();}
 state.backingPlaying=false;state.backingBar=null;
 if(seqStop){seqStop();seqStop=null;}
 stopAllScheduled();state.playing=-1;
}
function backingPersist(){localStorage.setItem('musiclab-backing',JSON.stringify(state.backing));}
function backingIndicator(bar=null){
 const label=$('#backing-status');if(label)label.textContent=state.backingPlaying?(bar?'연주 중 · '+bar+'마디':'재생 준비 중'):'정지됨';
 document.querySelectorAll('.studio092-bar').forEach((el,i)=>el.classList.toggle('backing-active',bar===i+1));
 const play=$('[data-action="studio-backing-toggle"]');if(play)play.textContent=state.backingPlaying?'■ 반주 정지':'▶ 반주 시작';
}
function studioBackingToggle(){
 if(backingPlayer){studioStop();backingIndicator();return;}
 studioStop();const project=ensureStudio();
 const config=normalizeBacking(state.backing,project.bars.length);state.backing=config;backingPersist();
 try{
  backingPlayer=startBackingTrack({context:context(),project,settings:config,playPiano:note,
   onBar:bar=>{state.backingBar=bar;backingIndicator(bar);},
   onEnd:()=>{backingPlayer=null;state.backingPlaying=false;state.backingBar=null;backingIndicator();}});
  state.backingPlaying=true;backingIndicator();
 }catch(e){state.studioError=String(e?.message||e);state.backingPlaying=false;render();}
}

function studioRender(){persistStudio();render();}
function studioPlayback(){
 studioStop();const p=ensureStudio(),events=studioEvents(p),beat=60/p.bpm,duration=p.bars.length*4*beat;
 let timers=[],active=true;
 function cycle(){if(!active||state.tab!=='compose')return;
  const start=context().currentTime+.12;
  for(const ev of events){for(const midi of studioVoicing(ev.symbol,ev.voicing))note(midi,start+ev.start*beat,ev.beats*beat*.90,{volume:.16});
   timers.push(setTimeout(()=>{if(!active||state.tab!=='compose')return;state.playing=ev.bar;document.querySelectorAll('.studio092-bar').forEach((b,i)=>b.classList.toggle('playing',i===ev.bar));},(ev.start*beat+.12)*1000));}
  for(const x of state.melodyNotes){if(Number.isInteger(x.step)&&x.step>=0&&x.step<p.bars.length*4)note(x.midi,start+x.step*beat,beat*.85,{volume:.15});}
  timers.push(setTimeout(()=>{if(!active)return;state.playing=-1;document.querySelectorAll('.studio092-bar').forEach(b=>b.classList.remove('playing'));if(state.studioLoop){timers=[];cycle();}else{active=false;seqStop=null;}},(duration+.18)*1000));
 }
 seqStop=()=>{active=false;timers.forEach(clearTimeout);timers=[];stopAllScheduled();state.playing=-1;};
 cycle();
}
function studioSaveNamed(){const p=ensureStudio();if(!p.title.trim())p.title='새 코드 진행';const copy=cloneProject(p);const now=new Date().toISOString();const existing=state.studioProjects.findIndex(x=>x.title===copy.title);const record={...copy,melody:state.melodyNotes.map(x=>({midi:x.midi,step:x.step})),backing:normalizeBacking(state.backing,copy.bars.length),updatedAt:now};if(existing>=0)state.studioProjects.splice(existing,1);state.studioProjects=[record,...state.studioProjects].slice(0,20);localStorage.setItem('musiclab-studio-projects',JSON.stringify(state.studioProjects));studioRender();}
function compose(){const p=ensureStudio(),[currentBar,currentSlot]=state.studioSelected,active=p.bars[currentBar]?.segments[currentSlot]||p.bars[0].segments[0],suggestions=studioSuggestions(p);
 const bk=normalizeBacking(state.backing,p.bars.length),barOptions=Array.from({length:p.bars.length},(_,i)=>i+1);state.backing=bk;
 return `${pageHeader('CHORD STUDIO 2.0 / ALPHA '+APP_VERSION,'코드 스튜디오','코드를 편집하고 16마디까지 멜로디를 더해 MIDI로 내보내세요.')}
 <section class="panel studio092-head"><div class="studio092-heading"><div><span class="mini-label">MY CHORD PROJECT</span><label class="studio092-project-label">프로젝트 이름<input id="studio-title" maxlength="70" value="${safe(p.title)}" aria-label="프로젝트 이름"></label></div><span class="pill">4/4 · ${p.bars.length}마디</span></div>
 <div class="studio092-toolbar"><label>BPM<input type="number" id="studio-bpm" min="40" max="220" value="${p.bpm}"></label>${btn('studio-play',`${icon('play',17)} 전체 재생`)}${btn('studio-stop','■ 정지','btn secondary')}<label class="studio093-loop"><input type="checkbox" id="studio-loop" ${state.studioLoop?'checked':''}> 반복 재생</label>${btn('studio-midi',`${icon('download',17)} MIDI`,'btn secondary')}</div>
 <section class="backing-lab" aria-labelledby="backing-heading"><div class="backing-heading"><div><span class="mini-label">BACKING TRACK LAB · NEW</span><h3 id="backing-heading">코드 진행을 반주로 연습</h3><p>현재 프로젝트의 코드를 드럼·베이스·피아노로 재생해요. 원하는 구간을 반복하면서 기타를 연습하세요.</p></div><div class="backing-control"><button type="button" class="btn primary" data-action="studio-backing-toggle">${state.backingPlaying?'■ 반주 정지':'▶ 반주 시작'}</button><span id="backing-status" role="status">${state.backingPlaying?(state.backingBar?`연주 중 · ${state.backingBar}마디`:'재생 준비 중'):'정지됨'}</span></div></div>
 <div class="backing-options"><label>반주 스타일<select id="backing-style">${Object.entries(BACKING_STYLES).map(([key,style])=>`<option value="${key}" ${bk.style===key?'selected':''}>${style.label}</option>`).join('')}</select></label><label>시작 마디<select id="backing-start">${barOptions.map(n=>`<option value="${n}" ${bk.startBar===n?'selected':''}>${n}마디</option>`).join('')}</select></label><label>마지막 마디<select id="backing-end">${barOptions.filter(n=>n>=bk.startBar).map(n=>`<option value="${n}" ${bk.endBar===n?'selected':''}>${n}마디</option>`).join('')}</select></label></div>
 <p class="backing-style-desc">${safe(BACKING_STYLES[bk.style].desc)} · BPM은 위의 코드 스튜디오 설정을 사용합니다.</p>
 <div class="backing-checks"><label><input type="checkbox" id="backing-loop" ${bk.loop?'checked':''}> 구간 반복</label><label><input type="checkbox" id="backing-countin" ${bk.countIn?'checked':''}> 시작 전 4박 카운트인</label></div>
 <div class="backing-mixer">${[['drums','드럼'],['bass','베이스'],['piano','피아노']].map(([key,name])=>`<label><span>${name} <output id="backing-label-${key}">${bk.mix[key]}%</output></span><input type="range" min="0" max="100" step="5" value="${bk.mix[key]}" data-backing-mix="${key}" aria-label="${name} 음량"></label>`).join('')}</div>
 <p class="small-muted">반주는 새 음원 다운로드 없이 브라우저에서 생성됩니다. 드럼과 베이스는 합성음, 피아노는 기존 실제 샘플을 사용해요.</p></section>
 <div class="studio092-project-actions">${btn('studio-save','프로젝트 저장','btn secondary')}${btn('studio-new','새 프로젝트','btn ghost dark')}${btn('studio-add-bar','+ 마디 추가','btn secondary')}${btn('studio-duplicate-bar','선택 마디 복제','btn secondary')}${btn('studio-remove-bar','− 마지막 마디 삭제','btn ghost dark')}</div>
 <div class="studio092-bulk"><label for="studio-bulk">진행을 한 번에 입력</label><div><input id="studio-bulk" type="text" autocomplete="off" spellcheck="false" placeholder="F#m7 B7 EM7 C#m7"><button class="btn secondary" data-action="studio-bulk-apply">진행 만들기</button></div><small>코드를 공백 또는 →로 구분 · 1코드 = 1마디 · 최대 16마디</small></div>
 <p class="small-muted">마디를 누르면 편집할 수 있어요. 코드 이름은 <b>F#m7, BbM7, C7(#9), C/E</b>처럼 직접 입력할 수 있어요.</p>
 <div class="studio092-bars">${p.bars.map((bar,b)=>`<div class="studio092-bar ${state.playing===b?'playing':''}"><div class="studio092-bar-head"><span>BAR ${String(b+1).padStart(2,'0')}</span><span>4/4</span></div><div class="studio092-segments">${bar.segments.map((seg,i)=>`<button type="button" class="studio092-slot ${currentBar===b&&currentSlot===i?'selected':''}" data-action="studio-select" data-bar="${b}" data-slot="${i}" style="flex:${seg.beats}"><strong>${safe(seg.symbol)}</strong><small>${seg.beats}박 · ${seg.voicing===0?'기본형':seg.voicing+'전위'}</small></button>`).join('')}</div></div>`).join('')}</div>
 </section>
 <section class="panel studio092-editor"><div class="panel-head"><div><span class="mini-label">CHORD EDITOR</span><h3>${currentBar+1}마디 · ${currentSlot+1}번째 코드 편집</h3></div></div>
 <div class="studio092-edit-grid"><label>코드 이름<div class="studio092-code-row"><input id="studio-code" spellcheck="false" autocomplete="off" value="${safe(active.symbol)}" aria-label="선택한 코드 이름">${btn('studio-set-code','적용')}</div></label><label>전위 선택<select id="studio-voicing">${[0,1,2,3].map(n=>`<option value="${n}" ${n===active.voicing?'selected':''}>${n===0?'기본형':n+'번째 전위'}</option>`).join('')}</select></label></div>
 <div class="studio092-editor-actions">${btn('studio-split','코드 나누기 (+)','btn secondary')}${btn('studio-merge','코드 합치기 (−)','btn secondary')}${btn('studio-shift-back','앞 코드 길이 −1박','btn ghost dark')}${btn('studio-shift-forward','앞 코드 길이 +1박','btn ghost dark')}${btn('studio-guitar','기타 운지 보기','btn secondary')}</div>
 <div class="studio092-preview"><div><span class="mini-label">PIANO VOICING</span><h4>${safe(active.symbol)}</h4><p>${studioVoicing(active.symbol,active.voicing).map(n=>`${PC_NAMES[n%12]}${Math.floor(n/12)-1}`).join(' · ')}</p></div>${btn('studio-play-one','이 코드 듣기','btn primary')}</div>
 <div class="studio092-suggestions"><strong>${safe(p.root)} ${p.mode==='minor'?'minor':'Major'} 추천 코드</strong><div>${suggestions.map(x=>`<button data-action="studio-suggest" data-symbol="${safe(x.name)}" title="${safe(x.roman)}">${safe(x.name)} <small>${safe(x.roman)}</small></button>`).join('')}</div></div>
 ${state.studioError?`<p class="studio092-error" role="alert">${safe(state.studioError)}</p>`:''}</section>
 <div class="two-col studio092-bottom"><section class="panel"><div class="panel-head"><div><span class="mini-label">HARMONY IDEAS</span><h3>진행 프리셋</h3></div></div><div class="preset-list">${Object.keys(STUDIO_PRESETS).map(name=>`<button class="preset" data-action="studio-preset" data-name="${safe(name)}"><span>${safe(name)}</span>${icon('chevron',18)}</button>`).join('')}</div><p class="small-muted">프리셋을 선택하면 현재 마디를 4마디 진행으로 변경해요.</p></section>
 <section class="panel"><div class="panel-head"><div><span class="mini-label">MY PROJECTS</span><h3>저장한 프로젝트</h3></div></div><div class="studio092-saved">${state.studioProjects.length?state.studioProjects.map((x,i)=>`<div><button data-action="studio-load" data-index="${i}"><b>${safe(x.title)}</b><small>${x.bars.length}마디 · ${x.bpm}BPM</small></button><button class="studio092-delete" data-action="studio-delete" data-index="${i}" aria-label="${safe(x.title)} 삭제">삭제</button></div>`).join(''):'<p class="small-muted">저장한 프로젝트가 아직 없어요.</p>'}</div></section></div>
 <details class="panel studio092-melody"><summary>멜로디 피아노 롤 · 최대 16마디 편집</summary><p class="small-muted">4마디씩 이동하며 음을 넣거나 다시 누르면 지울 수 있어요. 메인 화면의 코드 진행과 별도 멜로디 MIDI 트랙에 함께 반영돼요.</p>
 <div class="studio093-roll-nav"><button type="button" data-action="studio-roll-prev" ${state.studioRollPage<=0?'disabled':''}>← 이전 4마디</button><span>${state.studioRollPage*4+1}–${Math.min((state.studioRollPage+1)*4,p.bars.length)}마디 / 총 ${p.bars.length}마디</span><button type="button" data-action="studio-roll-next" ${state.studioRollPage>=Math.ceil(p.bars.length/4)-1?'disabled':''}>다음 4마디 →</button></div>
 ${pianoRollSVG(Array.from({length:4},(_,i)=>p.bars[state.studioRollPage*4+i]?studioVoicing(p.bars[state.studioRollPage*4+i].segments[0].symbol):[]),state.melodyNotes,state.studioRollPage*4)}
 <div class="studio092-melody-actions">${btn('studio-roll-clear-page','현재 구간의 멜로디 지우기','btn secondary')}${btn('roll-clear','전체 멜로디 지우기','btn secondary')}${btn('studio-midi','코드 + 멜로디 MIDI 저장','btn primary')}</div></details>
 ${infoBox('작업은 자동으로 이 브라우저에 임시 저장돼요. 별도 프로젝트로 보관하려면 「프로젝트 저장」을 누르세요. 크로매틱·청각훈련과 기타 기록은 기존대로 유지됩니다.')}`;
}
function journal(){const sorted=[...state.entries].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,12),today=new Date().toLocaleDateString('sv-SE');
 return `${pageHeader('PRACTICE JOURNAL','연습 기록','레슨에서 배운 내용과 연습 목표를 남기고 기록을 계속 쌓아보세요.')}
 <div class="stat-grid"><div class="stat"><div class="stat-label">${icon('clock',16)} 전체 연습 시간</div><div class="stat-number">${allMinutes()}<small>분</small></div></div><div class="stat"><div class="stat-label">${icon('journal',16)} 기록 수</div><div class="stat-number">${state.entries.length}<small>개</small></div></div><div class="stat"><div class="stat-label">${icon('target',16)} 오늘의 기록</div><div class="stat-number">${recentMinutes()}<small>분</small></div></div></div>
 <section class="panel theory-journal-summary"><div class="panel-head"><div><span class="mini-label">GUITAR LEARNING</span><h3>기타 자동 기록</h3></div></div><div class="theory-summary-row"><div><b>${state.chromaticHistory.length}</b><span>크로매틱 연습 횟수</span></div><div><b>${state.theoryHistory.length}</b><span>지판 학습 횟수</span></div><div><b>${state.libGripFavorites.length}</b><span>저장한 코드 운지</span></div></div><div class="theory-recent">${state.theoryHistory.slice(-4).reverse().map(h=>`<div><b>${safe(h.root)} ${safe(h.quality)} · ${safe(h.mode)}</b><span>${safe(h.date)}</span></div>`).join('')||'<p class="small-muted">아직 CAGED·트라이어드·아르페지오 기록이 없습니다.</p>'}</div></section>
 <div class="two-col top-align"><div class="panel"><span class="mini-label">NEW ENTRY</span><h3>연습 내용 기록</h3><form id="entry-form" class="entry-form"><label>날짜<input type="date" name="date" value="${today}" required></label><div class="form-pair"><label>연습 분야<select name="category"><option>보컬</option><option>기타</option><option>청음</option><option>화성학</option><option>작곡</option><option>기타 연습</option></select></label><label>시간 (분)<input type="number" name="minutes" min="1" max="600" value="30" required></label></div><label>레슨 노트 · 연습 메모<textarea name="memo" rows="4" maxlength="1500" placeholder="오늘의 목표, 느낀 점, 다음 레슨 때 확인할 내용..."></textarea></label><button type="submit" class="btn primary full">${icon('check',17)} 기록 저장</button></form></div>
 <div class="panel"><div class="panel-head"><div><span class="mini-label">HISTORY</span><h3>최근 연습</h3></div></div><div class="entry-list">${sorted.length?sorted.map(e=>`<div class="entry"><div><span class="pill">${safe(e.category)}</span><small>${safe(e.date)} · ${Number(e.minutes)}분</small></div><p>${safe(e.memo)||'메모 없음'}</p><button class="text-btn" data-action="delete-entry" data-id="${e.id}">삭제</button></div>`).join(''):'<div class="empty-state">아직 저장된 기록이 없습니다.<br>첫 번째 연습을 기록해 보세요.</div>'}</div></div></div>
 <div class="panel"><div class="panel-head"><div><span class="mini-label">DATA MANAGEMENT</span><h3>기록 백업</h3></div></div><div class="backup-controls">${btn('export',`${icon('download',17)} JSON 내보내기`,'btn secondary')}<label class="btn secondary file-btn">JSON 가져오기<input type="file" id="import-file" accept=".json,application/json" hidden></label></div><p class="footnote">데이터는 현재 브라우저의 로컬 저장소에만 남습니다. 다른 기기로 옮길 때는 JSON을 내보낸 뒤 가져오세요. 새 파일을 가져오면 기존 기록과 청음 통계가 교체됩니다.</p></div>`;
}
function modelOptions(){return {yaw:state.larynxYaw,pitch:state.larynxPitch,zoom:state.larynxZoom/100,openness:state.glottalOpen,focus:state.larynxFocus};}
function updateLarynx(){if(larynxStop){larynxStop();larynxStop=null;}const canvas=$('#larynx-canvas');if(!canvas)return;
 if(state.larynxAnimating)larynxStop=animateLarynx(canvas,modelOptions);else drawLarynx(canvas,modelOptions());}
function updatePianoIndicator(){const el=$('#piano-indicator');if(!el)return;const p=pianoStatus();el.textContent=p.ready?'● 실제 피아노 음원 준비됨':`피아노 샘플 ${p.loaded}/${p.total} 로딩 중${p.failed?' · 일부 오류':''}`;}
function render(){
 const guitarScroll=$('.guitar-answer-scroll')?.scrollLeft||0;
 if(larynxStop){larynxStop();larynxStop=null;}
 document.documentElement.setAttribute('data-theme',state.theme);
 const content={home,theory,guitar:guitarPage,ear,vocal,compose,journal}[state.tab]();
 $('#app').innerHTML=`<div class="shell"><aside class="sidebar"><div class="brand"><div class="brand-icon">${icon('music',25)}</div><div><strong>Music Lab</strong><small>Explore your sound.</small></div></div><div class="sidebar-label">WORKSPACE</div><nav class="side-nav" aria-label="기능 메뉴">${NAV.map(([id,t,ico])=>`<button class="nav-link ${state.tab===id?'selected':''}" data-action="nav-${id}">${icon(ico,19)}<span>${t}</span>${state.tab===id?'<i></i>':''}</button>`).join('')}</nav><div class="sidebar-bottom"><div class="research-badge"><span>${icon('spark',20)}</span><strong>Keep exploring.</strong><small>Sound is a science<br>and an art.</small></div><div class="sidebar-version">ALPHA ${APP_VERSION} · 2026</div></div></aside>
 <div class="main-shell"><header class="topbar"><div class="breadcrumb"><span>WORKSPACE</span>${icon('chevron',15)}<strong>${title()}</strong></div><div class="top-controls"><span class="piano-indicator" id="piano-indicator" aria-live="polite">피아노 준비 중</span><label class="top-field">KEY<select id="global-key" aria-label="조성 으뜸음 선택">${rootOptions()}</select></label><label class="top-field">SCALE<select id="global-mode" aria-label="장조 단조 선택">${modeOptions()}</select></label><button class="theme-toggle" data-action="toggle-theme" aria-label="테마 전환">${icon(state.theme==='dark'?'sun':'moon',19)}</button></div></header><main class="content">${content}<footer class="footer">MUSIC LAB / Built for musicians <span>교육용 학습 앱 · 발성 의료 진단 도구가 아닙니다.</span></footer></main></div></div>
 <nav class="bottom-nav" aria-label="모바일 메뉴">${[['home','홈','home'],['theory','이론','theory'],['guitar','기타','guitar'],['ear','청음','ear'],['vocal','보컬','vocal'],['compose','작곡','compose'],['journal','기록','journal']].map(([id,t,ico])=>`<button class="${state.tab===id?'selected':''}" data-action="nav-${id}">${icon(ico,19)}<span>${t}</span></button>`).join('')}</nav>`;
 if(state.tab==='guitar'&&state.guitarView==='sight'&&$('.guitar-answer-scroll'))$('.guitar-answer-scroll').scrollLeft=guitarScroll;
 if(state.tab==='vocal')requestAnimationFrame(()=>updateLarynx());
 updatePianoIndicator();
}
function navTo(id){stopGuitarAudio();if(voiceCompareTimer){clearTimeout(voiceCompareTimer);voiceCompareTimer=null;}if(recordingSlot())stopRecording();if(larynxStop){larynxStop();larynxStop=null;}state.larynxAnimating=false;if(!NAV.some(n=>n[0]===id))return;if(micStop){micStop();micStop=null;state.micActive=false;}if(backingPlayer)studioStop();if(seqStop){seqStop();seqStop=null}state.playing=-1;state.tab=id;state.micError='';render();window.scrollTo({top:0,behavior:'instant'});}
function playScale(){const sc=scaleOf(state.root,state.tab==='theory'?state.theoryScale:state.mode),oct=state.tab==='theory'?state.theoryOctave:4;arpeggio([...sc.notes.map(n=>noteToMidi(n,oct)),noteToMidi(sc.notes[0],oct+1)],.19)}
function handleAction(target,e){const a=target.dataset.action;
 if(a==='harmony-next'){generateHarmony();render();return;}
 if(a==='harmony-answer'){if(!state.harmonyQuestion||state.harmonyAnswer!==null)return;state.harmonyAnswer=target.dataset.answer;render();return;}
 if(a?.startsWith('studio-')){
  const p=ensureStudio(),bar=Number(state.studioSelected[0]),slot=Number(state.studioSelected[1]);state.studioError='';
  try{
   if(a==='studio-loop-toggle'){state.studioLoop=!state.studioLoop;render();return;}
   if(a==='studio-roll-prev'||a==='studio-roll-next'){const maxPage=Math.ceil(p.bars.length/4)-1;state.studioRollPage=Math.max(0,Math.min(maxPage,state.studioRollPage+(a==='studio-roll-next'?1:-1)));studioRender();document.querySelector('.studio092-melody')?.setAttribute('open','');return;}
   if(a==='studio-roll-clear-page'){state.melodyNotes=state.melodyNotes.filter(x=>x.step<state.studioRollPage*16||x.step>=(state.studioRollPage+1)*16);studioRender();document.querySelector('.studio092-melody')?.setAttribute('open','');return;}
   if(a==='studio-select'){state.studioSelected=[Number(target.dataset.bar),Number(target.dataset.slot)];render();return;}
   if(a==='studio-stop'){studioStop();render();return;}
   if(a==='studio-backing-toggle'){studioBackingToggle();return;}
   if(a==='studio-play'){studioPlayback();return;}
   if(a==='studio-play-one'){const cur=p.bars[bar]?.segments[slot];if(cur)chord(studioVoicing(cur.symbol,cur.voicing),undefined,.95);return;}
   if(a==='studio-midi'){downloadMidi(buildStudioMidi(p,state.melodyNotes),'music-lab-studio.mid');return;}
   if(a==='studio-guitar'){const cur=p.bars[bar]?.segments[slot],d=cur&&parseChord(cur.symbol);if(d){studioStop();state.libRoot=d.root;state.libQuality=d.quality;state.libBass=d.bass;state.libSelected=0;state.guitarView='library';navTo('guitar');}return;}
   if(a==='studio-bulk-apply'){
    const text=($('#studio-bulk')?.value||'').replaceAll('→',' ').replaceAll('->',' ').replaceAll('|',' ').trim(),chunks=text.split(/\s+/).filter(Boolean);
    if(chunks.length<1||chunks.length>16)throw Error('코드는 1~16개까지 입력할 수 있어요.');
    const parsed=chunks.map(x=>{const c=parseChord(x);if(!c)throw Error('지원되지 않는 코드: '+x);return c.name;});
    if(!confirm('현재 진행을 입력한 코드로 바꿀까요?'))return;
    studioStop();state.studioProject=normalizeStudioProject({...p,bars:parsed.map(symbol=>({segments:[{symbol,beats:4,voicing:0}]}))});state.studioSelected=[0,0];state.studioRollPage=0;state.backing=normalizeBacking({...state.backing,startBar:1,endBar:state.studioProject.bars.length},state.studioProject.bars.length);backingPersist();studioRender();return;
   }
   if(a==='studio-set-code'){state.studioProject=setStudioChord(p,bar,slot,$('#studio-code')?.value||'');studioRender();return;}
   if(a==='studio-suggest'){state.studioProject=setStudioChord(p,bar,slot,target.dataset.symbol);studioRender();return;}
   if(a==='studio-split'){state.studioProject=splitSlot(p,bar,slot);studioRender();return;}
   if(a==='studio-merge'){state.studioProject=mergeSlot(p,bar,slot);state.studioSelected=[bar,Math.min(slot,state.studioProject.bars[bar].segments.length-1)];studioRender();return;}
   if(a==='studio-shift-back'||a==='studio-shift-forward'){
    const draft=cloneProject(p),items=draft.bars[bar].segments,delta=a==='studio-shift-forward'?1:-1;
    if(slot+1>=items.length||items[slot].beats+delta<1||items[slot+1].beats-delta<1){state.studioError='길이를 조절하려면 선택한 코드 뒤에 다른 코드가 있어야 하고, 각 코드는 최소 1박이어야 해요.';render();return;}
    items[slot].beats+=delta;items[slot+1].beats-=delta;state.studioProject=normalizeStudioProject(draft);studioRender();return;
   }
   if(a==='studio-add-bar'){state.studioProject=addBar({...p,melody:state.melodyNotes});studioRender();return;}
   if(a==='studio-duplicate-bar'){studioStop();state.studioProject=duplicateBar({...p,melody:state.melodyNotes},bar);state.melodyNotes=state.studioProject.melody||[];state.studioSelected=[Math.min(bar+1,state.studioProject.bars.length-1),0];studioRender();return;}
   if(a==='studio-remove-bar'){state.studioProject=removeBar({...p,melody:state.melodyNotes},p.bars.length-1);state.melodyNotes=state.studioProject.melody||[];state.studioRollPage=Math.min(state.studioRollPage,Math.ceil(state.studioProject.bars.length/4)-1);state.studioSelected=[0,0];studioRender();return;}
   if(a==='studio-new'){if(!confirm('새 프로젝트를 만들까요? 저장하지 않은 현재 진행은 교체됩니다.'))return;studioStop();state.studioProject=newStudioProject(state.root,state.mode,state.bpm);state.studioSelected=[0,0];state.studioRollPage=0;state.melodyNotes=[];studioRender();return;}
   if(a==='studio-preset'){if(!confirm('현재 진행을 '+target.dataset.name+' 프리셋으로 바꿀까요?'))return;studioStop();state.studioProject=applyStudioPreset(p,target.dataset.name);state.studioSelected=[0,0];state.studioRollPage=0;studioRender();return;}
   if(a==='studio-save'){studioSaveNamed();return;}
   if(a==='studio-load'){const x=state.studioProjects[Number(target.dataset.index)];if(!x)return;if(!confirm('선택한 저장 프로젝트를 불러올까요?'))return;studioStop();state.studioProject=normalizeStudioProject(x);state.backing=normalizeBacking(x.backing||state.backing,state.studioProject.bars.length);backingPersist();state.studioSelected=[0,0];state.studioRollPage=0;state.melodyNotes=state.studioProject.melody||[];studioRender();return;}
   if(a==='studio-delete'){const i=Number(target.dataset.index);if(!state.studioProjects[i]||!confirm('저장된 프로젝트를 삭제할까요?'))return;state.studioProjects.splice(i,1);localStorage.setItem('musiclab-studio-projects',JSON.stringify(state.studioProjects));render();return;}
  }catch(err){state.studioError=err.message||'편집에 실패했어요.';render();return;}
 }

 if(a?.startsWith('nav-')){navTo(a.slice(4));return}
 if(a==='theory-mode'){if(!['caged','triad','arp','drop'].includes(target.dataset.mode))return;state.theoryMode=target.dataset.mode;state.theorySelected=0;render();return;}
 if(a==='theory-shape'){state.theorySelected=Math.max(0,Math.min(99,Number(target.dataset.index)||0));render();return;}
 if(a==='theory-grip-play'){
  const root=state.theoryRoot,m=state.theoryMode;
  const shapes=m==='caged'?cagedShapes(root):m==='triad'?triadShapes(root,state.theoryMinor?'m':'',state.theoryTriadSet):dropVoicings(root,state.theoryDropQuality,state.theoryDropType,state.theoryDropSet);
  const g=shapes[Math.min(state.theorySelected,shapes.length-1)];if(g)chord(gripMidis(g),undefined,.95);return;
 }
 if(a==='theory-arp-play'){
  const notes=arpeggioNotes(state.theoryRoot,state.theoryArpQuality,state.theoryStartFret,state.theoryStartFret+4);
  if(notes.length)arpeggio(notes.map(x=>x.midi),.18);return;
 }
 if(a==='theory-save'){
  const record={date:new Date().toLocaleDateString('sv-SE'),savedAt:new Date().toISOString(),root:state.theoryRoot,mode:state.theoryMode,quality:state.theoryMode==='arp'?state.theoryArpQuality:state.theoryMode==='drop'?state.theoryDropQuality:state.theoryMode==='triad'?(state.theoryMinor?'m':'M'):'M',detail:state.theoryMode==='arp'?state.theoryStartFret+'~'+(state.theoryStartFret+4)+'fr':state.theorySelected};
  state.theoryHistory=[...state.theoryHistory,record].slice(-500);localStorage.setItem('musiclab-guitar-theory-history',JSON.stringify(state.theoryHistory));render();return;
 }
 if(a==='lib-grip-favorite'){
  const d=selectedLibraryChord(),all=voicingsFor(d,{rootString:state.libString,maxResults:12}),g=all[state.libSelected];if(!g)return;
  const id=d.name+'|'+g.frets.join(',');const match=state.libGripFavorites.some(x=>x.id===id);
  state.libGripFavorites=match?state.libGripFavorites.filter(x=>x.id!==id):[{id,name:d.name,string:g.rootString,position:g.rootFret,frets:[...g.frets]},...state.libGripFavorites].slice(0,60);
  localStorage.setItem('musiclab-grip-favorites',JSON.stringify(state.libGripFavorites));render();return;
 }
 if(a==='lib-grip-load'){
  const item=state.libGripFavorites[Number(target.dataset.index)];if(!item||!libraryPickChord(item.name))return;
  state.libString='all';const found=voicingsFor(selectedLibraryChord(),{rootString:'all',maxResults:12});
  state.libSelected=Math.max(0,found.findIndex(g=>g.frets.join(',')===item.frets.join(',')));render();return;
 }
 if(a==='lib-search'){const value=$('#chord-search')?.value||'';if(!libraryPickChord(value)){const input=$('#chord-search');if(input){input.setCustomValidity('지원되지 않는 코드입니다. 예: F#m7, BbM7, C7(#9)');input.reportValidity();input.setCustomValidity('');}return;}render();return;}
 if(a==='lib-quality-quick'){if(!(target.dataset.quality in CHORD_TYPES))return;state.libQuality=target.dataset.quality;state.libBass='';state.libSelected=0;render();return;}
 if(a==='lib-prev'||a==='lib-next'){const d=selectedLibraryChord(),v=voicingsFor(d,{rootString:state.libString,maxResults:12});state.libSelected=Math.max(0,Math.min(v.length-1,state.libSelected+(a==='lib-next'?1:-1)));render();return;}
 if(a==='lib-root-quick'){state.libRoot=target.dataset.root;state.libBass='';state.libSelected=0;render();return;}
 if(a==='lib-voicing'){state.libSelected=Math.max(0,Number(target.dataset.index)||0);render();return;}
 if(a==='lib-play'){const d=selectedLibraryChord(),v=voicingsFor(d,{rootString:state.libString,maxResults:12});const g=v[state.libSelected]||v[0];if(g)chord(gripMidis(g),undefined,1.25);return;}
 if(a==='lib-favorite'){const name=selectedLibraryChord().name;state.libFavorites=state.libFavorites.includes(name)?state.libFavorites.filter(x=>x!==name):[name,...state.libFavorites].slice(0,100);libraryFavoritesSave();render();return;}
 if(a==='lib-history'){libraryPickChord(target.dataset.name);render();return;}
 if(a==='pro-generate'){stopGuitarAudio();state.proInput=($('#pro-chords')?.value||'').trim();state.proPlan=null;state.proSelected=0;state.proError='';ensureProgression();render();return;}
 if(a==='pro-preset'){const p=PROGRESSION_PRESETS.find(x=>x.id===target.dataset.id);if(!p)return;stopGuitarAudio();state.proInput=p.text;state.proPlan=null;state.proError='';state.proSelected=0;ensureProgression();render();return;}
 if(a==='pro-select'){const i=Number(target.dataset.index);if(!state.proPlan?.[i])return;state.proSelected=i;render();return;}
 if(a==='pro-play'){playPlannedProgression();return;}
  if(a==='pro-send-studio'){
   ensureProgression();const plan=state.proPlan||[];if(!plan.length)return;
   if(!confirm('선택한 기타 코드 진행으로 코드 스튜디오 프로젝트를 새로 만들까요? 현재 편집 중인 진행은 교체됩니다.'))return;
   stopGuitarAudio();studioStop();
   const draft=newStudioProject(state.root,state.mode,state.proBpm);
   draft.title='기타 반주 연습';draft.bars=plan.map(x=>({segments:[{symbol:x.chord.name,beats:4,voicing:0}]}));
   state.studioProject=normalizeStudioProject(draft);state.melodyNotes=[];state.studioRollPage=0;state.studioSelected=[0,0];
   state.backing=normalizeBacking({...state.backing,startBar:1,endBar:draft.bars.length},draft.bars.length);backingPersist();persistStudio();navTo('compose');return;
  }
 if(a==='pro-play-one'){const g=state.proPlan?.[state.proSelected]?.grip;if(g)chord(gripMidis(g),undefined,.9);return;}
 if(a==='chromatic-toggle'){state.chromaticPlaying?(stopGuitarAudio(),render()):startChromatic();return;}
 if(a==='chromatic-preset'){if(!CHROMATIC_PATTERNS.includes(target.dataset.pattern))return;state.chromaticPattern=target.dataset.pattern;render();return;}
 if(a==='chromatic-bpm'){const delta=Number(target.dataset.delta);if(![-5,-1,1,5].includes(delta))return;state.chromaticBpm=Math.max(60,Math.min(120,state.chromaticBpm+delta));if(state.chromaticPlaying){stopGuitarAudio();startChromatic();}else render();return;}
 if(a==='chromatic-save'){saveChromaticPractice();return;}
 if(a==='guitar-view-library'){state.guitarView='library';render();return;}
 if(a==='guitar-view'){stopGuitarAudio();state.guitarView=target.dataset.view;render();return}
 if(a==='guitar-sight-new'){stopGuitarAudio();state.guitarSight=generateGuitarSight({keyId:state.guitarSightKey,level:state.guitarSightLevel,position:state.guitarSightPos,bars:state.guitarSightLevel===3?4:2});state.guitarSightIndex=0;state.guitarSightHits=0;state.guitarSightMistakes=0;state.guitarSightRetried=false;state.guitarSightStatus='active';state.guitarSightShowTab=false;state.guitarSightLast='';render();return}
 if(a==='guitar-sight-play'){playGuitarExercise();return}
 if(a==='guitar-sight-tab'){if(!state.guitarSight||state.guitarSightExam&&state.guitarSightStatus!=='done')return;state.guitarSightShowTab=!state.guitarSightShowTab;render();return}
 if(a==='guitar-sight-answer'){const m=Number(target.dataset.midi);if(!Number.isInteger(m))return;note(m,undefined,.4);guitarSightAnswer(m);return}
 if(a==='guitar-new-chord'){state.guitarGrip=randomMovableChord({rootString:state.guitarGripRootString,quality:state.guitarGripQuality});render();return}
 if(a==='guitar-play-chord'){chord(chordPitches(state.guitarGrip));return}
 if(a==='guitar-random-four'){state.guitarProgression=Array.from({length:4},()=>randomMovableChord({rootString:state.guitarGripRootString,quality:state.guitarGripQuality}));state.guitarGrip=state.guitarProgression[0];state.guitarCurrent=0;render();return}
 if(a==='guitar-four-select'){const i=Number(target.dataset.index);if(!state.guitarProgression[i])return;state.guitarCurrent=i;state.guitarGrip=state.guitarProgression[i];render();return}
 if(a==='guitar-play-four'){playGuitarProgression();return}
 if(a==='guitar-rhythm-reset'){stopGuitarAudio();state.guitarRhythmPattern=['D','-','D','U','D','-','D','U','D','-','D','U','D','-','D','U'];render();return}
 if(a==='guitar-rhythm-play'){if(guitarRhythmTimer!==null){stopGuitarAudio();render()}else startGuitarRhythm();return}
 if(a==='guitar-rhythm-cell'){const i=Number(target.dataset.index);if(!Number.isInteger(i)||i<0||i>=16)return;const cycle=['D','U','-'];state.guitarRhythmPattern[i]=cycle[(cycle.indexOf(state.guitarRhythmPattern[i])+1)%3];render();return}

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
  if(voiceCompareTimer){clearTimeout(voiceCompareTimer);voiceCompareTimer=null;}
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
 else if(a==='voice-step'){state.voiceStep=Math.max(0,Math.min(3,Number(target.dataset.step)||0));render()}
 else if(a==='voice-step-next'){state.voiceStep=(state.voiceStep+1)%4;render()}
 else if(a==='vocal-jump-listen'){state.vocalView='listen';render()}
 else if(a==='voice-compare-au'){
  if(voiceCompareTimer)clearTimeout(voiceCompareTimer);
  const a=VOWEL_PRESETS.a,u=VOWEL_PRESETS.u;
  demoFormant(a.jaw,a.tongue,a.lips,{f0:state.vocalF0,breath:state.vocalBreath,register:state.reg});
  const status=$('#voice-compare-status');if(status)status.textContent='① 아 → ② 우 재생 중';
  voiceCompareTimer=setTimeout(()=>{demoFormant(u.jaw,u.tongue,u.lips,{f0:state.vocalF0,breath:state.vocalBreath,register:state.reg});voiceCompareTimer=null;const node=$('#voice-compare-status');if(node)node.textContent='비교 완료 · 모음에 따른 공명 차이를 다시 들어보세요.'},1100);
 }
 else if(a==='voice-target-down'||a==='voice-target-up'){
  state.voiceTarget=Math.max(48,Math.min(72,state.voiceTarget+(a==='voice-target-up'?1:-1)));
  localStorage.setItem('musiclab-voice-target',JSON.stringify(state.voiceTarget));pitchHistory.length=0;
  render();
 }
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
 else if(a==='roll-clear'){state.melodyNotes=[];persistStudio();render();document.querySelector('.studio092-melody')?.setAttribute('open','')}
 else if(a==='roll-click'){
  const svg=target.closest('svg');if(!svg)return;const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const p=pt.matrixTransform(svg.getScreenCTM().inverse());
  const step=state.studioRollPage*16+Math.floor((p.x-53)/32),midi=83-Math.floor((p.y-18)/10);if(step<state.studioRollPage*16||step>=(state.studioRollPage+1)*16||step>=ensureStudio().bars.length*4||midi<48||midi>83)return;
  const j=state.melodyNotes.findIndex(x=>x.step===step&&x.midi===midi);
  if(j>=0)state.melodyNotes.splice(j,1);else{state.melodyNotes=state.melodyNotes.filter(x=>x.step!==step);state.melodyNotes.push({step,midi})}
  persistStudio();note(midi);render();document.querySelector('.studio092-melody')?.setAttribute('open','');
 }
 else if(a==='comp-stop'){if(seqStop)seqStop();seqStop=null;stopAllScheduled();state.playing=-1;render()}
 else if(a==='comp-random'){state.compDegrees=Array.from({length:4},()=>Math.floor(Math.random()*7));render()}
 else if(a==='comp-preset'){state.compDegrees=[[0,4,5,3],[0,5,3,4],[1,4,0,5]][Number(target.dataset.id)].slice();render()}
 else if(a==='delete-entry'){state.entries=state.entries.filter(e=>String(e.id)!==target.dataset.id);saveEntries();render()}
 else if(a==='export'){
  const payload={version:8,backing:normalizeBacking(state.backing,ensureStudio().bars.length),studio:{...ensureStudio(),melody:state.melodyNotes},studioProjects:state.studioProjects,harmonyHistory:state.harmonyHistory,problemRecent:state.problemRecent,guitarTheory:state.theoryHistory,favoriteGrips:state.libGripFavorites,chromatic:state.chromaticHistory,favoriteChords:state.libFavorites,recentChords:state.libRecent,guitarSight:state.guitarSightHistory,exportedAt:new Date().toISOString(),entries:state.entries,ear:state.stats,training:state.earHistory,voiceNotes:state.voiceNotes,voiceTarget:state.voiceTarget};
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
   const guide=pitchGuide(info?.hz,state.voiceTarget);
   const coach=$('#voice-pitch-hint'),pointer=$('#voice-pitch-pointer');
   if(coach)coach.textContent=guide.message;
   if(pointer){pointer.style.left=pitchGuidePercent(guide.cents)+'%';pointer.classList.toggle('measured',guide.valid)}
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
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='studio-bulk'){e.preventDefault();document.querySelector('[data-action="studio-bulk-apply"]')?.click();}else if(e.key==='Enter'&&e.target.id==='pro-chords'){e.preventDefault();document.querySelector('[data-action="pro-generate"]')?.click();}else if(e.key==='Enter'&&e.target.id==='studio-code'){e.preventDefault();document.querySelector('[data-action="studio-set-code"]')?.click();}else if(e.key==='Enter'&&e.target.id==='chord-search'){e.preventDefault();document.querySelector('[data-action="lib-search"]')?.click();}else if((e.key==='Enter'||e.key===' ')&&e.target.matches('svg [data-action="play-midi"]')){e.preventDefault();note(Number(e.target.dataset.midi),undefined,.6);}});
document.addEventListener('change',async e=>{
 const t=e.target;
 if(t.id==='global-key'){state.root=t.value;state.selectedChord=0;state.harmonyQuestion=null;saveSettings();render()}
 else if(t.id==='global-mode'){state.mode=t.value;state.theoryScale=t.value;state.selectedChord=0;state.harmonyQuestion=null;saveSettings();render()}
 else if(t.id==='staff-clef'){state.clef=t.value==='bass'?'bass':'treble';state.question=null;state.feedback=null;state.melodyInputs=[];state.earSession={completed:0,correct:0};render()}
 else if(t.id==='staff-level'){state.staffLevel=t.value==='diatonic'?'diatonic':'chromatic';state.question=null;state.feedback=null;state.melodyInputs=[];state.earSession={completed:0,correct:0};render()}
 else if(t.id==='seventh-check'){state.seventh=t.checked;render()}
 else if(t.id==='theory-scale'){if(THEORY_SCALES.some(x=>x[0]===t.value))state.theoryScale=t.value;render();}
 else if(t.id==='theory-octave'){state.theoryOctave=[3,4,5].includes(Number(t.value))?Number(t.value):4;render();}
 else if(t.id==='harmony-level'){state.harmonyLevel=Math.max(1,Math.min(3,Number(t.value)||1));state.harmonyQuestion=null;state.harmonyAnswer=null;render();}
 else if(t.id==='studio-loop'){state.studioLoop=t.checked;render();}
  else if(t.id==='backing-style'||t.id==='backing-start'||t.id==='backing-end'||t.id==='backing-loop'||t.id==='backing-countin'){
   studioStop();const cfg={...state.backing};
   if(t.id==='backing-style')cfg.style=t.value;
   else if(t.id==='backing-start'){cfg.startBar=Number(t.value);cfg.endBar=Math.max(cfg.startBar,cfg.endBar);}
   else if(t.id==='backing-end')cfg.endBar=Number(t.value);
   else if(t.id==='backing-loop')cfg.loop=t.checked;
   else if(t.id==='backing-countin')cfg.countIn=t.checked;
   state.backing=normalizeBacking(cfg,ensureStudio().bars.length);backingPersist();render();
  }
 else if(t.id==='studio-voicing'){const p=ensureStudio(),[b,i]=state.studioSelected;state.studioProject=setStudioVoicing(p,b,i,Number(t.value));studioRender();}
 else if(t.id==='studio-bpm'){const p=ensureStudio();p.bpm=Math.max(40,Math.min(220,Math.round(Number(t.value)||82)));state.studioProject=normalizeStudioProject(p);studioStop();studioRender();}
 else if(t.id==='studio-title'){const p=ensureStudio();p.title=String(t.value||'새 코드 진행').slice(0,70);state.studioProject=p;persistStudio();}
 else if(t.id==='pro-bpm'){state.proBpm=Math.max(40,Math.min(160,Math.round(Number(t.value)||80)));stopGuitarAudio();render()}
 else if(t.id==='chromatic-pattern'){if(CHROMATIC_PATTERNS.includes(t.value))state.chromaticPattern=t.value;render();}
 else if(t.id==='chromatic-bpm'){const bpm=Number(t.value);state.chromaticBpm=Math.max(60,Math.min(120,Number.isFinite(bpm)?Math.round(bpm):60));if(state.chromaticPlaying){stopGuitarAudio();startChromatic();}else render();}
 else if(t.id==='theory-root'){if(ROOT_CHOICES.includes(t.value))state.theoryRoot=t.value;state.theorySelected=0;render();}
 else if(t.id==='theory-triad-quality'){state.theoryMinor=t.value==='m';state.theorySelected=0;render();}
 else if(t.id==='theory-triad-set'){if(TRIAD_STRING_SETS.some(x=>x.id===t.value))state.theoryTriadSet=t.value;state.theorySelected=0;render();}
 else if(t.id==='theory-arp-quality'){if(Object.hasOwn(CHORD_TYPES,t.value))state.theoryArpQuality=t.value;render();}
 else if(t.id==='theory-start-fret'){if([0,1,3,5,7,9,12,15].includes(Number(t.value)))state.theoryStartFret=Number(t.value);render();}
 else if(t.id==='theory-drop-quality'){if(DROP_QUALITIES.includes(t.value))state.theoryDropQuality=t.value;state.theorySelected=0;render();}
 else if(t.id==='theory-drop-type'){state.theoryDropType=t.value==='3'?3:2;state.theoryDropSet=DROP_STRING_SETS[state.theoryDropType][0].id;state.theorySelected=0;render();}
 else if(t.id==='theory-drop-set'){if(DROP_STRING_SETS[state.theoryDropType].some(x=>x.id===t.value))state.theoryDropSet=t.value;state.theorySelected=0;render();}
 else if(t.id==='lib-root'){state.libRoot=t.value;state.libBass='';state.libSelected=0;render()}
 else if(t.id==='lib-quality'){state.libQuality=t.value;state.libBass='';state.libSelected=0;render()}
 else if(t.id==='lib-string'){state.libString=t.value;state.libSelected=0;render()}
 else if(t.id==='guitar-sight-key'){state.guitarSightKey=keyById(t.value).id;state.guitarSight=null;state.guitarSightStatus='idle';render()}
 else if(t.id==='guitar-sight-level'){state.guitarSightLevel=Math.max(1,Math.min(3,Number(t.value)||1));state.guitarSight=null;state.guitarSightStatus='idle';render()}
 else if(t.id==='guitar-sight-pos'){state.guitarSightPos=[0,5,9].includes(Number(t.value))?Number(t.value):0;state.guitarSight=null;state.guitarSightStatus='idle';render()}
 else if(t.id==='guitar-sight-exam'){state.guitarSightExam=t.value==='exam';state.guitarSight=null;state.guitarSightStatus='idle';render()}
 else if(t.id==='guitar-sight-bpm'){state.guitarSightBpm=Math.max(40,Math.min(180,Math.round(Number(t.value)||80)));stopGuitarAudio();render()}
 else if(t.id==='guitar-root-string'){state.guitarGripRootString=t.value==='R5'?'R5':'R6';state.guitarGrip=randomMovableChord({rootString:state.guitarGripRootString,quality:state.guitarGripQuality});state.guitarProgression=[];render()}
 else if(t.id==='guitar-chord-quality'){state.guitarGripQuality=CHORD_QUALITIES.includes(t.value)?t.value:'all';state.guitarGrip=randomMovableChord({rootString:state.guitarGripRootString,quality:state.guitarGripQuality});state.guitarProgression=[];render()}
 else if(t.id==='guitar-rhythm-bpm'){state.guitarRhythmBpm=Math.max(40,Math.min(180,Math.round(Number(t.value)||80)));stopGuitarAudio();render()}
 else if(t.id==='guitar-scale'){state.guitarScale=t.value;render()}
 else if(t.id==='guitar-display'){state.guitarDisplay=t.value;render()}
 else if(t.hasAttribute('data-comp-slot')){state.compDegrees[Number(t.dataset.compSlot)]=Number(t.value);render()}
 else if(t.id==='voice-target'){
  const midi=Number(t.value);if(!Number.isInteger(midi)||midi<48||midi>72)return;
  state.voiceTarget=midi;localStorage.setItem('musiclab-voice-target',JSON.stringify(midi));pitchHistory.length=0;
  render();
 }
 else if(t.id==='bpm'){state.bpm=Math.min(220,Math.max(40,Number(t.value)||82));render()}
 else if(t.id==='import-file'&&t.files?.[0]){
  try{const data=JSON.parse(await t.files[0].text());if(!Array.isArray(data.entries)||!data.ear||typeof data.ear.total!=='number')throw new Error('지원하지 않는 백업 형식입니다.');
   const valid=data.entries.length<=10000&&data.entries.every(e=>typeof e.date==='string'&&typeof e.category==='string'&&typeof e.minutes==='number'&&typeof e.memo==='string'&&String(e.memo).length<=1500);
   if(!valid)throw new Error('데이터 형식이 올바르지 않습니다.');
   if(!confirm('현재의 연습 기록과 청음 통계를 백업 파일로 교체할까요?'))return;
   state.entries=data.entries;if(data.backing){state.backing=normalizeBacking(data.backing,16);backingPersist();}if(data.studio){try{state.studioProject=normalizeStudioProject(data.studio);state.studioRollPage=0;state.melodyNotes=state.studioProject.melody||[];persistStudio()}catch{}}if(Array.isArray(data.studioProjects)){state.studioProjects=data.studioProjects.slice(0,20).flatMap(x=>{try{return [{...normalizeStudioProject(x),backing:normalizeBacking(x.backing||state.backing,Math.max(1,Array.isArray(x.bars)?x.bars.length:4))}]}catch{return []}});localStorage.setItem('musiclab-studio-projects',JSON.stringify(state.studioProjects))}if(Array.isArray(data.harmonyHistory)){state.harmonyHistory=data.harmonyHistory.filter(x=>typeof x==='string').slice(-40);localStorage.setItem('musiclab-harmony-questions',JSON.stringify(state.harmonyHistory));}if(Array.isArray(data.problemRecent)){state.problemRecent=data.problemRecent.filter(x=>typeof x==='string').slice(-50);localStorage.setItem('musiclab-problem-recent',JSON.stringify(state.problemRecent));}if(Array.isArray(data.guitarTheory)){state.theoryHistory=data.guitarTheory.slice(-500).filter(x=>typeof x.date==='string'&&typeof x.root==='string'&&['caged','triad','arp','drop'].includes(x.mode));localStorage.setItem('musiclab-guitar-theory-history',JSON.stringify(state.theoryHistory));}if(Array.isArray(data.favoriteGrips)){state.libGripFavorites=data.favoriteGrips.slice(0,60).filter(g=>typeof g.name==='string'&&Array.isArray(g.frets)&&g.frets.length===6&&g.frets.every(f=>f===null||(Number.isInteger(f)&&f>=0&&f<=22)));localStorage.setItem('musiclab-grip-favorites',JSON.stringify(state.libGripFavorites));}if(Array.isArray(data.favoriteChords)){state.libFavorites=data.favoriteChords.filter(x=>typeof x==='string'&&x.length<=50).slice(0,100);libraryFavoritesSave();}if(Array.isArray(data.recentChords)){state.libRecent=data.recentChords.filter(x=>typeof x==='string'&&x.length<=50).slice(0,12);localStorage.setItem('musiclab-lib-recent',JSON.stringify(state.libRecent));}if(Array.isArray(data.chromatic)){state.chromaticHistory=data.chromatic.slice(-500).filter(x=>typeof x.date==='string'&&CHROMATIC_PATTERNS.includes(x.pattern)&&Number.isFinite(x.bpm));localStorage.setItem('musiclab-chromatic-history',JSON.stringify(state.chromaticHistory));}if(Array.isArray(data.guitarSight)){state.guitarSightHistory=data.guitarSight.slice(-300).filter(x=>Number.isFinite(x.accuracy)&&typeof x.date==='string');localStorage.setItem('musiclab-guitar-sight',JSON.stringify(state.guitarSightHistory));}if(Array.isArray(data.training)){state.earHistory=data.training.slice(-3000).filter(x=>typeof x.date==='string'&&typeof x.kind==='string'&&typeof x.correct==='boolean');localStorage.setItem('musiclab-training-history',JSON.stringify(state.earHistory));}if(typeof data.voiceNotes==='string'){state.voiceNotes=data.voiceNotes.slice(0,1800);localStorage.setItem('musiclab-voice-notes',JSON.stringify(state.voiceNotes));}if(Number.isInteger(data.voiceTarget)&&data.voiceTarget>=48&&data.voiceTarget<=72){state.voiceTarget=data.voiceTarget;localStorage.setItem('musiclab-voice-target',JSON.stringify(state.voiceTarget));}state.stats={total:Math.max(0,Number(data.ear.total)||0),correct:Math.max(0,Number(data.ear.correct)||0)};saveEntries();localStorage.setItem('musiclab-ear',JSON.stringify(state.stats));render();alert('가져오기를 완료했습니다.');
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
document.addEventListener('input',e=>{
 const key=e.target.dataset?.backingMix;
 if(!['drums','bass','piano'].includes(key))return;
 const n=Math.min(100,Math.max(0,Number(e.target.value)||0));
 state.backing=normalizeBacking({...state.backing,mix:{...state.backing.mix,[key]:n}},ensureStudio().bars.length);
 const label=$('#backing-label-'+key);if(label)label.textContent=n+'%';
 if(backingPlayer)backingPlayer.setMix(state.backing.mix);
 backingPersist();
});
document.addEventListener('submit',e=>{if(e.target.id!=='entry-form')return;e.preventDefault();const f=new FormData(e.target),minutes=Number(f.get('minutes'));if(!Number.isInteger(minutes)||minutes<1||minutes>600)return;
 state.entries.push({id:typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():String(Date.now()),date:String(f.get('date')),category:String(f.get('category')),minutes,memo:String(f.get('memo')||'').slice(0,1500)});saveEntries();render();});
window.addEventListener('pagehide',()=>{stopGuitarAudio();if(voiceCompareTimer)clearTimeout(voiceCompareTimer);if(recordingSlot())stopRecording();if(micStop)micStop();if(seqStop)seqStop();if(backingPlayer)backingPlayer.stop();if(larynxStop)larynxStop()});
render();
setInterval(updatePianoIndicator,900);
loadPianoSamples().catch(()=>{});
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register(`${import.meta.url.replace(/src\/app\.js(?:\?.*)?$/,'')}sw.js`).catch(()=>{}));
