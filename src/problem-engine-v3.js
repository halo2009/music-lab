import {generateQuestion as legacy, QUIZ_CATEGORIES, QUIZ_CATEGORY_IDS, scoreSession} from './problem-engine-v2.js';
import {seededRng} from './problem-engine.js';
import {generateTheory,levelForConcept} from './theory-questions.js';
import {ADVANCED_KINDS,generateAdvanced} from './advanced-questions.js';
import {verifyAdvanced,verifyTheory} from './theory-verifier.js';

export {QUIZ_CATEGORIES, QUIZ_CATEGORY_IDS, scoreSession};
export const GENERATOR_VERSION = 3;

export function isCorrectAnswer(question, option) {
  return (question.answers ?? [question.answer]).includes(option);
}


const legacyLevels = {
  harmony:{roman:1,degree:2,chordtones:2},
  chord:{formula:1,notes:2},
  fretboard:{note:3},
  sight:{staff:3},
  ear:{direction:1,interval:2,triad:3},
  rhythm:{beats:3},
};

function legacyReview(category,seed,preferred){
  const levels=legacyLevels[category];
  if(!levels||!Object.hasOwn(levels,preferred))return null;
  const level=levels[preferred];
  let question;
  for(let attempt=0;attempt<48;attempt++){
    const candidateSeed=Number(seed)+Math.imul(attempt,2654435761);
    question=legacy({category,level,seed:candidateSeed});
    if(question.kind===preferred)return {...question,level};
  }
  return null;
}

export function generateQuestion({category='harmony',level=1,seed=1,preferred}={}) {
  const difficulty = Math.max(1,Math.min(5,Math.trunc(Number(level)||1)));
  const reviewed = legacyReview(category,seed,preferred);
  const theory = !reviewed && ['harmony','chord'].includes(category)
    ? generateTheory(seededRng(seed),category,difficulty,preferred)
    : null;
  if (theory && !verifyTheory(theory)) throw Error(`이론 검증 실패: ${theory.signature}`);
  const advanced = reviewed ? null : generateAdvanced(category,difficulty,seededRng(seed));
  if (advanced && !verifyAdvanced(advanced)) throw Error(`응용 문제 검증 실패: ${advanced.signature}`);
  const raw = reviewed ?? theory ?? advanced ?? legacy({category,level:difficulty,seed});
  const itemLevel=reviewed?.level??difficulty;
  return {...raw,category,level:itemLevel,seed,preferred,version:GENERATOR_VERSION,
    id:`v3:${category}:${itemLevel}:${seed}:${preferred??''}`};
}

export function weakConcepts(history) {
  const groups = new Map();
  for (const result of history.slice(-160)) {
    if (!QUIZ_CATEGORY_IDS.includes(result.category) || typeof result.correct !== 'boolean') continue;
    const key = JSON.stringify([result.category,result.kind]);
    const group = groups.get(key) ?? {category:result.category,kind:result.kind,misses:0};
    group.misses = Math.max(0,group.misses+(result.correct?-1:1));
    groups.set(key,group);
  }
  return [...groups.values()].filter(group=>group.misses>0).sort((a,b)=>b.misses-a.misses);
}

export function makeSession({category='harmony',level=1,count=10,mode='learn',recent=[],weak=[],random=Math.random}={}) {
  const validCategory = QUIZ_CATEGORY_IDS.includes(category)?category:'harmony';
  const selectedMode = ['learn','exam','review'].includes(mode)?mode:'learn';
  const n = [5,10,20].includes(Number(count))?Number(count):10;
  const seen = new Set(recent.slice(-90));
  const questions = Array.from({length:n},(_,i)=>{
    const focus = selectedMode==='review' ? weak[i%weak.length] : undefined;
    const pickedCategory = QUIZ_CATEGORY_IDS.includes(focus?.category)?focus.category:validCategory;
    let question;
    for (let attempt=0;attempt<60;attempt++) {
      const seed = (random()*4294967296)>>>0;
      const difficulty = Math.max(1,Math.min(5,Math.trunc(Number(level)||1)));
      const advancedIndex = ADVANCED_KINDS[pickedCategory]?.indexOf(focus?.kind) ?? -1;
      const itemLevel = advancedIndex>=0 ? advancedIndex+4
        : focus && ['harmony','chord'].includes(pickedCategory) ? levelForConcept(pickedCategory,difficulty,focus.kind)
        : difficulty;
      question = generateQuestion({category:pickedCategory,level:itemLevel,seed:seed||1,preferred:focus?.kind});
      if (!seen.has(question.signature)) break;
    }
    seen.add(question.signature);
    return question;
  });
  return {questions,mode:selectedMode,category:validCategory,level:Math.max(1,Math.min(5,Math.trunc(Number(level)||1))),count:n,index:0,answers:[],status:'active'};
}
