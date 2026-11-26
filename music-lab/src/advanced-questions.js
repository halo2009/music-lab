import {choice,shuffle} from './problem-engine.js';

export const ADVANCED_KINDS = {
  fretboard: ['fret-transfer','fret-unison'],
  sight: ['staff-position','staff-unison'],
  ear: ['ear-seventh','ear-inversion'],
  rhythm: ['rhythm-completion','rhythm-compound'],
};
const tuning = [64,59,55,50,45,40];
const location = ([string,fret]) => `${string}번 줄 ${fret}프렛`;
const positions = (midi, low=0, high=22) => tuning.flatMap((open,index)=>{
  const fret=midi-open;
  return fret>=low && fret<=high ? [[index+1,fret]] : [];
});
const names = ['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
const name = midi => names[midi%12]+(Math.floor(midi/12)-1);
const qualities = [
  ['장7화음',[0,4,7,11]],['도미넌트 7화음',[0,4,7,10]],
  ['단7화음',[0,3,7,10]],['반감7화음',[0,3,6,10]],
];
const inversions = ['기본위치','제1전위','제2전위','제3전위'];
const beat = units => `${units/4}박`;

export function generateAdvanced(category,level,rng) {
  const kind = ADVANCED_KINDS[category]?.[level-4];
  if (!kind) return null;
  let question;
  if (category==='fretboard'||category==='sight') {
    const sources = [40,45,50,55,59,64];
    const string = 2+Math.floor(rng()*5);
    const fret = 5+Math.floor(rng()*8);
    const midi = sources[6-string]+fret;
    const source = [string,fret];
    const all = positions(midi);
    const others = all.filter(([s])=>s!==string);
    const bounds = category==='sight' && level===4 ? [Math.max(0,fret-1),fret+2] : [0,22];
    const candidates = category==='sight' ? positions(midi,...bounds) : others;
    const correct = level===5 ? candidates.slice(0,2) : [choice(rng,candidates)];
    const allowedString = level===4 && category==='fretboard' ? correct[0][0] : null;
    const wrong = shuffle(rng,[-3,-2,-1,1,2,3].flatMap(delta=>positions(midi+delta,...bounds))
      .filter(([s])=>allowedString===null||s===allowedString));
    const answers = correct.map(location);
    const prompt = category==='sight'
      ? level===4 ? `악보의 음을 ${bounds[0]}~${bounds[1]}프렛에서 연주할 수 있는 위치를 고르세요.`
        : '악보의 음과 같은 소리가 나는 기타 위치를 하나 고르세요. 정답이 여러 개일 수 있어요.'
      : level===4 ? `${location(source)}와 같은 소리가 나는 ${allowedString}번 줄 위치는?`
        : `${location(source)}와 같은 소리가 나는 다른 위치를 하나 고르세요. 정답이 여러 개일 수 있어요.`;
    question={prompt,answers,wrong:wrong.map(location),facts:{source,allowedString,bounds},staffMidi:category==='sight'?midi+12:undefined,
      explanation:`실제 소리는 ${name(midi)}입니다. 보기 중 가능한 위치는 ${answers.join(', ')}입니다.`};
  } else if (category==='ear') {
    const [quality,offsets] = choice(rng,qualities);
    const root = 48+Math.floor(rng()*18);
    const inversion = level===5 ? Math.floor(rng()*4) : 0;
    const playback = [...offsets.slice(inversion),...offsets.slice(0,inversion).map(n=>n+12)].map(n=>n+root);
    question={playback,simultaneous:true,
      prompt:level===4 ? '동시에 재생된 7화음의 종류는?' : `${name(root)}를 근음으로 하는 ${quality}입니다. 들리는 화음의 전위는?`,
      answers:[level===4?quality:inversions[inversion]],wrong:level===4?qualities.map(([label])=>label):inversions,
      facts:{root},
      explanation:`${quality}의 구성음은 ${offsets.map(n=>name(root+n)).join(' · ')}입니다. 최저음 ${name(playback[0])}은 ${['근음','3음','5음','7음'][inversion]}입니다.`};
  } else {
    const written = [['점4분음표',6],['8분음표',2],['16분음표',1],['4분쉼표',4]];
    const total = level===4?16:12;
    const picked = [];
    let used = 0;
    for (let i=0;i<(level===4?3:2);i++) {
      const pool = written.filter(([,units])=>used+units+(level===4?2-i:2*(1-i))<total && (level===4||units%2===0));
      const item=choice(rng,pool);
      picked.push(item);
      used+=item[1];
    }
    const answer = level===4 ? beat(total-used) : `8분음표 ${(total-used)/2}개 분량`;
    const format = units=>level===4?beat(units):`8분음표 ${units/2}개 분량`;
    question={prompt:`${level===4?'4/4박자(4분음표=1박)':'6/8박자(한 마디에 8분음표 6개)'}에서 ${picked.map(([label])=>label).join(' + ')} 다음에 마디를 채우려면 얼마나 더 필요한가요?`,
      answers:[answer],wrong:[1,2,3,4,6,8,10,12].filter(n=>level===4||n%2===0).map(format),
      facts:{written:picked.map(([label])=>label)},
      explanation:`16분음표를 한 단위로 세면 한 마디 ${total}단위에서 이미 사용한 ${used}단위를 빼서 ${total-used}단위가 남습니다. 즉 ${answer}입니다.`};
  }
  const {wrong,answers,...rest}=question;
  const distractors=[...new Set(wrong)].filter(option=>!answers.includes(option));
  const options=shuffle(rng,[...answers,...distractors.slice(0,4-answers.length)]);
  return {...rest,kind,answer:answers[0],answers,options,signature:`${kind}|${rest.prompt}|${rest.staffMidi??''}|${rest.playback??''}`};
}
