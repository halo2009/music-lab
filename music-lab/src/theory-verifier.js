// Independently inspect the displayed facts rather than generating a second question.
const noteBases = {C:0,D:2,E:4,F:5,G:7,A:9,B:11};
const letterOrder = 'CDEFGAB';
const mod = n => ((n % 12) + 12) % 12;
const pc = note => noteBases[note[0]] + Array.from(note.slice(1)).reduce((sum,a)=>sum+(a==='♯'?1:-1),0);
const distance = (a,b) => mod(pc(b)-pc(a));
const letters = (a,b) => (letterOrder.indexOf(b[0])-letterOrder.indexOf(a[0])+7)%7;
const sharpKeys = 'G D A E B F♯ C♯'.split(' ');
const flatKeys = 'F B♭ E♭ A♭ D♭ G♭ C♭'.split(' ');
const modeGaps = {'아이오니안':'2212221','도리안':'2122212','프리지안':'1222122','리디안':'2221221','믹솔리디안':'2212212','에올리안':'2122122','로크리안':'1221222'};
const intervalNames = {'단2도':[1,1],'장2도':[1,2],'단3도':[2,3],'장3도':[2,4],'완전4도':[3,5],'증4도':[3,6],'감5도':[4,6],'완전5도':[4,7],'단6도':[5,8],'장6도':[5,9],'단7도':[6,10],'장7도':[6,11],'장9도':[1,2]};
const tensions = {'9':[1,2],'♭9':[1,1],'♯9':[1,3],'11':[3,5],'♯11':[3,6],'13':[5,9],'♭13':[5,8]};
const borrowed = {'iv':[3,5,'m'],'♭III':[2,3,''],'♭VI':[5,8,''],'♭VII':[6,10,'']};
const notePattern = /^[A-G][♭♯]*$/u;

function fits(note, root, step, semitone) {
  return notePattern.test(note) && letters(root,note) === step && distance(root,note) === semitone;
}

function matches(kind, facts, option) {
  const {root,target,bass,notes,tag,degree,roman,dominant} = facts;
  switch (kind) {
    case 'signature':
      if (root === 'C') return option === '조표 없음';
      return option === (sharpKeys.includes(root) ? `♯ ${sharpKeys.indexOf(root)+1}개` : `♭ ${flatKeys.indexOf(root)+1}개`);
    case 'interval': {
      const shape = intervalNames[option];
      // Compound intervals need explicit octave information to distinguish M2 from M9.
      return shape && (option==='장9도') === (facts.compound===true) && fits(target,root,...shape);
    }
    case 'inversion':
      return ['기본위치','제1전위','제2전위','제3전위'].indexOf(option) === notes.indexOf(bass);
    case 'tension':
      return fits(option,root,...tensions[tag]);
    case 'mode': {
      const tonic = [...notes.slice(1),root];
      return modeGaps[option] === notes.map((note,i)=>distance(note,tonic[i])).join('');
    }
    case 'secondary': {
      const relative = {1:9,2:11,3:0,4:2,5:4};
      return option.endsWith('7') && fits(option.slice(0,-1),root,(degree+4)%7,relative[degree]);
    }
    case 'mixture': {
      const [step,semi,suffix] = borrowed[roman];
      return option.endsWith(suffix) && fits(suffix?option.slice(0,-suffix.length):option,root,step,semi);
    }
    case 'substitute':
      return option.endsWith('7') && fits(option.slice(0,-1),root,1,1)
        && distance(dominant.slice(0,-1),option.slice(0,-1))===6;
    case 'enharmonic':
      return notePattern.test(option) && distance(root,option)===0;
    default:
      return false;
  }
}

export function verifyTheory(question) {
  const {kind, facts, options, answers, answer} = question;
  if (!facts || options.length !== 4 || new Set(options).size !== 4 || !answers.includes(answer)) return false;
  const computed = options.filter(option=>matches(kind,facts,option));
  return computed.length === answers.length && computed.every(option=>answers.includes(option));
}

export function verifyAdvanced(question) {
  const {kind,facts,options,answers,answer,staffMidi,playback}=question;
  if (options.length!==4||new Set(options).size!==4||!answers.includes(answer)) return false;
  let computed;
  if (kind.startsWith('fret-') || kind.startsWith('staff-')) {
    const open={1:64,2:59,3:55,4:50,5:45,6:40};
    const [fromString,fromFret]=facts.source;
    const pitch=kind.startsWith('staff-')?staffMidi-12:open[fromString]+fromFret;
    computed=options.filter(option=>{
      const match=/^([1-6])번 줄 (\d+)프렛$/u.exec(option);
      if(!match) return false;
      const [,s,f]=match.map(Number);
      return open[s]+f===pitch && f>=facts.bounds[0] && f<=facts.bounds[1]
        && (facts.allowedString===null || s===facts.allowedString)
        && (kind.startsWith('staff-') || s!==fromString || f!==fromFret);
    });
  } else if (kind==='ear-seventh') {
    const gaps=playback.slice(1).map((m,i)=>m-playback[i]).join('');
    const quality={'434':'장7화음','433':'도미넌트 7화음','343':'단7화음','334':'반감7화음'};
    computed=[quality[gaps]];
  } else if (kind==='ear-inversion') {
    const order=playback.map(n=>mod(n-facts.root)).sort((a,b)=>a-b);
    computed=[['기본위치','제1전위','제2전위','제3전위'][order.indexOf(mod(Math.min(...playback)-facts.root))]];
  } else {
    const values={'점4분음표':1.5,'8분음표':.5,'16분음표':.25,'4분쉼표':1};
    const sum=facts.written.reduce((units,name)=>units+values[name],0);
    computed=[kind==='rhythm-completion'?`${4-sum}박`:`8분음표 ${6-2*sum}개 분량`];
  }
  return computed.length===answers.length && computed.every(option=>options.includes(option)&&answers.includes(option));
}
