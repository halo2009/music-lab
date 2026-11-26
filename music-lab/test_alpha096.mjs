import assert from 'node:assert/strict';
import {generateQuestion,makeSession,scoreSession,QUIZ_CATEGORIES,GENERATOR_VERSION} from './src/problem-engine-v2.js';
const categories=QUIZ_CATEGORIES.map(x=>x.id);
assert.equal(categories.length,6);
let checked=0;
for(const category of categories)for(let level=1;level<=3;level++)for(let seed=1;seed<=500;seed++){
 const q=generateQuestion({category,level,seed});
 assert.equal(q.options.length,4);
 assert.equal(new Set(q.options).size,4);
 assert.ok(q.options.includes(q.answer));
 assert.equal(q.version,GENERATOR_VERSION);
 assert.deepEqual(generateQuestion({category,level,seed}),q,'same seed recreates question');
 if(category==='sight'){
  assert.ok(q.staffMidi>=52&&q.staffMidi<=91);
  const ans=/^(\d)번 줄 (\d+)프렛$/.exec(q.answer);
  const open=[0,64,59,55,50,45,40];
  assert.ok(ans);assert.equal(open[Number(ans[1])]+Number(ans[2])+12,q.staffMidi);
 }
 if(category==='fretboard'){
  const match=/표준 튜닝에서 (\d)번 줄 (?:개방현|(\d+)프렛)/.exec(q.prompt);
  assert.ok(match);
 }
 checked++;
}
const s=makeSession({category:'harmony',count:5,mode:'exam',level:2});
assert.equal(s.questions.length,5);assert.equal(new Set(s.questions.map(x=>x.signature)).size,5);
s.answers=s.questions.map((q,i)=>({correct:i%2===0,category:q.category}));
assert.deepEqual(scoreSession(s).percentage,60);
const r=makeSession({category:'harmony',count:10,mode:'review',weak:['chord','rhythm'],level:2});
assert.deepEqual([...new Set(r.questions.map(x=>x.category))].sort(),['chord','rhythm']);
console.log('PASS Alpha 0.9.6: '+checked+' generated questions, deterministic seeds, unique options, sight octave & exam/review sessions');
