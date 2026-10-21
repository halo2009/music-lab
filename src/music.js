// Music Lab — dependency-free tonal primitives, with diatonic note spelling.
export const ROOTS = ['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
export const PC_NAMES = ['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
export const CHROMATIC = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
export const LETTERS = ['C','D','E','F','G','A','B'];
const NAT = {C:0,D:2,E:4,F:5,G:7,A:9,B:11};
export const INTERVALS = {major:[0,2,4,5,7,9,11], minor:[0,2,3,5,7,8,10],harmonicMinor:[0,2,3,5,7,8,11],melodicMinor:[0,2,3,5,7,9,11],phrygian:[0,1,3,5,7,8,10],lydian:[0,2,4,6,7,9,11],locrian:[0,1,3,5,6,8,10], pentMajor:[0,2,4,7,9],pentMinor:[0,3,5,7,10],blues:[0,3,5,6,7,10],dorian:[0,2,3,5,7,9,10],mixolydian:[0,2,4,5,7,9,10]};
export const ROMAN_MAJOR=['I','ii','iii','IV','V','vi','vii°'];
export const ROMAN_MINOR=['i','ii°','III','iv','v','VI','VII'];
const MAJOR_TRIADS=['','m','m','','','m','dim'];
const MINOR_TRIADS=['m','dim','','m','m','',''];
const MAJOR_SEVENTHS=['maj7','m7','m7','maj7','7','m7','m7♭5'];
const MINOR_SEVENTHS=['m7','m7♭5','maj7','m7','m7','maj7','7'];
const mod=(n,m)=>((n%m)+m)%m;
export const pitchClass=(name)=>mod(NAT[name[0]]+(name.slice(1).replaceAll('𝄪','##').replaceAll('𝄫','bb').split('').reduce((x,a)=>x+(a==='#'?1:a==='b'?-1:0),0)),12);
export function spellScale(root='C',mode='major') {
 const ints=INTERVALS[mode]||INTERVALS.major;
 // A seven-note scale has conventional heptatonic letter spelling; shorter scales use pitch names.
 if(ints.length!==7) return ints.map(i=>PC_NAMES[mod(pitchClass(root)+i,12)]);
 const base=LETTERS.indexOf(root[0]);
 return ints.map((i,d)=>{
  const letter=LETTERS[(base+d)%7];
  const pc=mod(pitchClass(root)+i,12);
  const delta=mod(pc-NAT[letter]+6,12)-6;
  const accidental=delta===2?'𝄪':delta===-2?'𝄫':delta===1?'#':delta===-1?'b':'';
  return letter+accidental;
 });
}
export const noteToMidi=(name,octave=4)=>12*(octave+1)+pitchClass(name);
export const midiToFrequency=(m)=>440*Math.pow(2,(m-69)/12);
export const frequencyToNote=(hz)=>{
 if(!hz||hz<45||hz>2000) return null;
 const midi=69+12*Math.log2(hz/440); const nearest=Math.round(midi);
 return {hz, midi:nearest, note:CHROMATIC[mod(nearest,12)]+(Math.floor(nearest/12)-1), cents:Math.round((midi-nearest)*100)};
};
export function scaleOf(root='C',mode='major'){
 return {notes:spellScale(root,mode),intervals:INTERVALS[mode]||INTERVALS.major};
}
export function chordsOf(root='C',mode='major',seventh=true){
 const minor=mode==='minor'; const scale=spellScale(root,minor?'minor':'major');
 return scale.map((name,i)=>{
  const ids=seventh?[i,(i+2)%7,(i+4)%7,(i+6)%7]:[i,(i+2)%7,(i+4)%7];
  const notes=ids.map(j=>scale[j]); const suffix=seventh?(minor?MINOR_SEVENTHS:MAJOR_SEVENTHS)[i]:(minor?MINOR_TRIADS:MAJOR_TRIADS)[i];
  return {root:name, name:name+suffix, suffix, notes, roman:(minor?ROMAN_MINOR:ROMAN_MAJOR)[i], degree:i};
 });
}
export const chordMidi=(root,mode,degree,seventh=true)=>{
 const ints=mode==='minor'?INTERVALS.minor:INTERVALS.major;
 const tonic=60+pitchClass(root);
 const steps=seventh?[0,2,4,6]:[0,2,4];
 return steps.map(s=>tonic+ints[(degree+s)%7]+(degree+s>=7?12:0));
};
export function fretPitch(openMidi,fret){return openMidi+fret}
export const GUITAR_OPEN=[64,59,55,50,45,40]; // first to sixth string, screen top to bottom
export const FORMATS={major:'메이저',minor:'내추럴 마이너',pentMajor:'메이저 펜타토닉',pentMinor:'마이너 펜타토닉',blues:'블루스',dorian:'도리안',mixolydian:'믹솔리디안'};
export const INTERVAL_QUIZ=[{n:'단2도',s:1},{n:'장2도',s:2},{n:'단3도',s:3},{n:'장3도',s:4},{n:'완전4도',s:5},{n:'증4도/감5도',s:6},{n:'완전5도',s:7},{n:'단6도',s:8},{n:'장6도',s:9},{n:'단7도',s:10},{n:'장7도',s:11},{n:'완전8도',s:12}];
