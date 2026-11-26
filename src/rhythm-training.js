import {choice,seededRng} from './problem-engine.js';

const patterns = [
 [[0,1,2,3],[0,1,3],[0,2,3]],
 [[0,.5,2,3],[0,1.5,2.5,3],[0,.5,1.5,3.5]],
 [[0,.5,1.5,2.5],[0,1,1.5,2],[0,.5,1,1.5,2.5]],
];
export function rhythmExercise(level,seed){
 const difficulty=Math.max(1,Math.min(3,Math.trunc(Number(level)||1)));
 const beats=choice(seededRng(seed),patterns[difficulty-1]);
 return {kind:'tap-rhythm',meter:difficulty===3?'6/8':'4/4',beats,bpm:difficulty===1?76:88,
  prompt:'리듬을 듣고 같은 간격으로 두드리세요. 첫 탭을 시작점으로 삼아요.',
  signature:`tap|${difficulty}|${beats.join('.')}`};
}
export function gradeRhythm(exercise,taps){
 if(taps.length!==exercise.beats.length)return {correct:false,error:Infinity};
 const ms=60000/exercise.bpm;
 const error=Math.max(...exercise.beats.map((beat,i)=>Math.abs(taps[i]-taps[0]-beat*ms)));
 return {correct:error<=Math.max(95,ms*.15),error:Math.round(error)};
}
