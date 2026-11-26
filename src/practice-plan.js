const tasks={
 harmony:['화성학','조표와 코드 기능 섞어 풀기','quiz'],
 chord:['코드','기타 코드의 구성음과 전위 풀기','quiz'],
 fretboard:['기타 지판','같은 음을 다른 줄에서 찾아보기','quiz'],
 sight:['기타 초견','악보 2마디를 읽고 지판에서 답하기','quiz'],
 ear:['청음','틀린 유형을 다시 듣고 답하기','ear'],
 rhythm:['리듬','리듬을 먼저 듣고 동일한 간격으로 탭하기','ear'],
};
export function buildPracticePlan({quiz=[],ear=[],minutes=20}={}){
 const rows=[...quiz.slice(-80),...ear.slice(-40).map(row=>({...row,category:row.kind==='tap-rhythm'?'rhythm':'ear'}))];
 const categories=Object.entries(tasks).map(([category,[name,detail,tab]])=>{
  const attempts=rows.filter(row=>row.category===category);
  const mistakes=attempts.filter(row=>row.correct===false).length;
  return {category,name,detail,tab,total:attempts.length,mistakes,
   priority:mistakes/Math.max(5,attempts.length)};
 });
 const available=[...categories].sort((a,b)=>b.priority-a.priority||a.total-b.total);
 const total=[10,20,30].includes(minutes)?minutes:20;
 const blocks=[Math.floor(total*.5),Math.floor(total*.3)];
 blocks.push(total-blocks[0]-blocks[1]);
 return {categories,routine:available.slice(0,3).map((item,i)=>({...item,minutes:blocks[i]}))};
}
