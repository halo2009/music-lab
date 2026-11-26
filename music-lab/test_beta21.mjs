import assert from 'node:assert/strict';
import {generateQuestion, isCorrectAnswer, makeSession, weakConcepts, QUIZ_CATEGORY_IDS} from './src/problem-engine-v3.js';
import {verifyAdvanced,verifyTheory} from './src/theory-verifier.js';

let count=0;
const coverage=new Map();
for (const category of QUIZ_CATEGORY_IDS) {
  for(let level=1;level<=5;level++) {
    for(let i=1;i<=4000;i++) {
      const seed=Math.imul(i,2654435761)>>>0;
      const q=generateQuestion({category,level,seed});
      assert.equal(q.level,level);
      assert.equal(new Set(q.options).size,4);
      assert(q.options.includes(q.answer));
      assert.equal(q.options.filter(option=>isCorrectAnswer(q,option)).length,q.answers?.length??1);
      if(q.facts) assert((q.kind.startsWith("fret-")||q.kind.startsWith("staff-")||q.kind.startsWith("ear-")||q.kind.startsWith("rhythm-")) ? verifyAdvanced(q) : verifyTheory(q));
      assert(q.explanation.length>0);
      coverage.set(q.kind,(coverage.get(q.kind)??0)+1);
      count++;
    }
  }
}
for(const kind of ['signature','interval','inversion','tension','mode','secondary','mixture','substitute','enharmonic']) assert(coverage.has(kind));
const en=generateQuestion({category:'harmony',level:2,seed:123,preferred:'enharmonic'});
assert.equal(en.answers.length,2);
assert(en.answers.every(answer=>isCorrectAnswer(en,answer)));
assert(!verifyTheory({...en,answers:[en.answer]}));
assert.deepEqual(en,generateQuestion(en));
const weak=weakConcepts([
  {category:'harmony',kind:'secondary',correct:false},
  {category:'harmony',kind:'secondary',correct:false},
  {category:'harmony',kind:'interval',correct:false},
  {category:'harmony',kind:'interval',correct:true},
]);
assert.deepEqual(weak,[{category:'harmony',kind:'secondary',misses:2}]);
const session=makeSession({mode:'review',level:1,count:5,weak});
assert(session.questions.every(q=>q.kind==='secondary'));
console.log(`${count} generated questions verified`);
console.log(Object.fromEntries(coverage));

for(const [category,kind] of [['ear','direction'],['ear','interval'],['harmony','chordtones'],['chord','notes'],['rhythm','beats']]){
 const review=makeSession({mode:'review',level:5,count:5,weak:[{category,kind}]});
 assert(review.questions.every(question=>question.kind===kind));
}
