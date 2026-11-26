import {choice, shuffle} from './problem-engine.js';

const letters = 'CDEFGAB';
const natural = [0, 2, 4, 5, 7, 9, 11];
const mod = (n, size) => (n % size + size) % size;

export function spell(root, steps, semitones) {
  const start = letters.indexOf(root[0]);
  const target = start + steps;
  const letter = mod(target, 7);
  const accidental = natural[start] + (root[1] === '♯' ? 1 : root[1] === '♭' ? -1 : 0)
    + semitones - natural[letter] - 12 * Math.floor(target / 7);
  return letters[letter] + (accidental < 0 ? '♭' : '♯').repeat(Math.abs(accidental));
}

const majorKeys = ['C','G','D','A','E','B','F♯','C♯','F','B♭','E♭','A♭','D♭','G♭','C♭'];
const major = [0, 2, 4, 5, 7, 9, 11];
const roots = ['C','D','E','F','G','A','B','B♭','E♭','F♯'];
const intervals = [
  ['단2도',1,1],['장2도',1,2],['단3도',2,3],['장3도',2,4],
  ['완전4도',3,5],['증4도',3,6],['감5도',4,6],['완전5도',4,7],
  ['단6도',5,8],['장6도',5,9],['단7도',6,10],['장7도',6,11],['장9도',8,14],
];
const modes = [
  ['아이오니안',[0,2,4,5,7,9,11]], ['도리안',[0,2,3,5,7,9,10]],
  ['프리지안',[0,1,3,5,7,8,10]], ['리디안',[0,2,4,6,7,9,11]],
  ['믹솔리디안',[0,2,4,5,7,9,10]], ['에올리안',[0,2,3,5,7,8,10]],
  ['로크리안',[0,1,3,5,6,8,10]],
];

const keyOptions = ['조표 없음', ...Array.from({length: 7}, (_, i) => [`♯ ${i+1}개`, `♭ ${i+1}개`]).flat()];
const inversions = ['기본위치', '제1전위', '제2전위', '제3전위'];
const romans = ['I','ii','iii','IV','V','vi','vii°'];
const namesOf = notes => notes.join(' · ');
const secondaryChord = (root, degree) => spell(root, degree + 4, major[degree] + 7) + '7';
const borrowed = [['iv',3,5,'m'],['♭VI',5,8,''],['♭VII',6,10,''],['♭III',2,3,'']];
const concepts = {
  signature(rng, level) {
    const root = choice(rng, majorKeys.slice(0, level === 1 ? 12 : 15));
    const notes = major.map((semi, i) => spell(root, i, semi));
    const altered = notes.filter(n => n.length > 1);
    const answer = altered.length ? `${altered[0][1]} ${altered.length}개` : keyOptions[0];
    return {root, prompt: `${root}장조의 조표는?`, answer, distractors: keyOptions,
      explanation: `${root}장음계는 ${namesOf(notes)}입니다. 조표는 ${answer}입니다.`};
  },
  interval(rng, level) {
    const root = choice(rng, level === 1 ? roots.slice(0, 7) : roots);
    const [answer, steps, semis] = choice(rng, intervals.slice(0, level < 3 ? 8 : level < 5 ? 12 : 13));
    const target = spell(root, steps, semis);
    return {root,target,compound:steps>=7,prompt: `${root}에서 위로 ${target}${steps>=7?"(한 옥타브를 넘는 음정)":"(한 옥타브 이내)"}까지의 음정은? 음이름 표기를 기준으로 고르세요.`,
      answer,distractors: intervals.map(entry => entry[0]),explanation: `음이름을 양끝 포함해 세면 ${steps+1}도이고, 간격은 ${semis}반음이라 ${answer}입니다.`};
  },
  inversion(rng) {
    const root = choice(rng, roots);
    const minor = rng() < .5;
    const notes = [root,spell(root,2,minor ? 3 : 4),spell(root,4,7),spell(root,6,10)];
    const bassIndex = Math.floor(rng()*4);
    const bass = notes[bassIndex];
    return {root,bass,notes,prompt: `${root}${minor ? 'm7' : '7'}/${bass}의 전위는?`,
      answer: inversions[bassIndex],distractors: inversions,
      explanation: `구성음은 ${namesOf(notes)}입니다. 베이스 ${bass}는 ${['근음','3음','5음','7음'][bassIndex]}이므로 ${inversions[bassIndex]}입니다.`};
  },
  tension(rng, level) {
    const root = choice(rng, roots);
    const entries = [['9',8,14],['♭9',8,13],['♯9',8,15],['11',10,17],['♯11',10,18],['13',12,21],['♭13',12,20]];
    const [tag,steps,semi] = choice(rng,level < 5 ? entries.slice(0,5) : entries);
    const answer = spell(root,steps,semi);
    return {root,tag,prompt: `${root}7 코드 기호에 ${tag}가 명시되면 해당 텐션의 음이름은?`,answer,
      distractors: entries.map(([,s,p])=>spell(root,s,p)),explanation: `근음 ${root}에서 ${tag}는 위로 ${semi}반음인 ${answer}입니다.`};
  },
  mode(rng) {
    const root = choice(rng, roots);
    const [answer, offsets] = choice(rng,modes);
    const notes = offsets.map((semi,i)=>spell(root,i,semi));
    return {root,notes,prompt: `${root}를 으뜸음으로 하는 ${namesOf(notes)}의 모드는?`,answer,
      distractors: modes.map(([name])=>name),explanation: `으뜸음부터 구성음의 반음 위치가 ${offsets.join(' · ')}이면 ${answer}입니다.`};
  },
  secondary(rng) {
    const root = choice(rng, roots);
    const targets = [1,2,3,4,5];
    const degree = choice(rng,targets);
    const answer = secondaryChord(root,degree);
    return {root,degree,prompt:`${root}장조에서 V7/${romans[degree]}에 해당하는 코드는?`,answer,
      distractors: targets.map(i=>secondaryChord(root,i)),explanation:`${romans[degree]}의 근음은 ${spell(root,degree,major[degree])}입니다. 그 음의 완전5도 위를 근음으로 도미넌트 7화음을 만들면 ${answer}입니다.`};
  },
  mixture(rng) {
    const root = choice(rng,roots);
    const [roman,steps,semi,suffix] = choice(rng,borrowed);
    const answer = spell(root,steps,semi)+suffix;
    return {root,roman,prompt:`${root}장조에서 같은 으뜸음의 자연단음계로부터 빌린 ${roman} 3화음은?`,answer,
      distractors: borrowed.map(([,s,p,q])=>spell(root,s,p)+q),explanation:`같은 으뜸음의 자연단음계에서 ${roman}에 해당하는 근음에 3도씩 쌓으면 ${answer}입니다.`};
  },
  substitute(rng) {
    const root = choice(rng,roots);
    const answer = spell(root,1,1)+'7';
    const dominant = spell(root,4,7)+'7';
    return {root,dominant,prompt:`${root}장조의 ${dominant}를 대신해 I로 진행하는 트라이톤 대리 도미넌트(♭II7)는?`,answer,
      distractors:[dominant,spell(root,3,5)+'7',spell(root,5,9)+'7',spell(root,2,3)+'7'],
      explanation:`${dominant}에서 트라이톤 떨어진 근음에 만든 ${answer}는 두 코드의 3음과 7음을 이명동음으로 공유합니다.`};
  },
  enharmonic(rng) {
    const sets = [['C♯','D♭'],['D♯','E♭'],['F♯','G♭'],['G♯','A♭'],['A♯','B♭'],['B','C♭'],['E','F♭']];
    const [root,answer] = choice(rng,sets);
    return {root,prompt:`12평균율에서 ${root}과 음높이가 같은 표기를 하나 고르세요. 같은 표기도 정답입니다.`,
      answer,answers:[root,answer],distractors:['D','F','G','A'].filter(n=>n!==root),
      explanation:`${root}과 ${answer}은 표기가 다르고 12평균율에서 음높이가 같습니다.`};
  },
};

const harmonyByLevel = [
  ['signature','interval','legacy'], ['signature','interval','legacy','enharmonic'],
  ['interval','mode','signature','legacy'], ['mode','secondary','mixture','interval'],
  ['secondary','mixture','substitute','mode','interval'],
];
const chordByLevel = [
  ['legacy'], ['legacy','inversion'], ['legacy','inversion','enharmonic'],
  ['inversion','tension','legacy'], ['tension','inversion','legacy'],
];

export function levelForConcept(category, level, preferred) {
  const pools = category === 'chord' ? chordByLevel : harmonyByLevel;
  if (!preferred || pools[level-1].includes(preferred)) return level;
  const first = pools.findIndex(pool => pool.includes(preferred));
  return first < 0 ? level : first+1;
}

export function generateTheory(rng, category, level, preferred) {
  const pool = (category === 'chord' ? chordByLevel : harmonyByLevel)[level-1];
  const kind = pool.includes(preferred) ? preferred : choice(rng,pool);
  if (kind === 'legacy') return null;
  const {answer, answers=[answer], distractors, prompt, explanation, ...facts} = concepts[kind](rng,level);
  const wrong = shuffle(rng,[...new Set(distractors)].filter(option=>!answers.includes(option)));
  const options = shuffle(rng,[...answers,...wrong.slice(0,4-answers.length)]);
  return {kind,prompt,answer,answers,options,explanation,facts,signature:`${kind}|${JSON.stringify(facts)}`};
}
