// Educational voice pitch guidance only. These acoustic observations cannot classify M1/M2.
export const voicePathStages=[
  {short:'숨의 흐름',sub:'호흡계',title:'01 · 호기',headline:'공기가 성대 쪽으로 흐릅니다.',easy:'숨을 내쉴 때 공기가 폐에서 기도를 따라 후두로 올라와요. 성대가 진동할 수 있는 에너지를 제공해요. 큰 힘으로 밀 필요는 없어요.',caution:'호흡량이나 배의 힘만으로 성대 움직임을 직접 알 수는 없어요.'},
  {short:'성대 진동',sub:'후두',title:'02 · 성문',headline:'성대가 반복적으로 떨리면서 소리의 바탕을 만듭니다.',easy:'두 성대가 공기 흐름과 조직의 탄성에 반응해 빠르게 진동해요. 진동 주기가 짧아지면 대체로 음높이가 올라가요.',caution:'진성·가성은 음높이만으로 구별할 수 없어요.'},
  {short:'성도 공명',sub:'목·입',title:'03 · 공명',headline:'혀와 입의 모양이 배음의 균형을 바꿔요.',easy:'성대에서 시작된 소리가 인두·입안·경우에 따라 코 쪽 통로를 거쳐 나가요. 그 공간의 형태에 따라 특정 주파수 대역이 더 강조돼요.',caution:'소리가 머리에서 울린다는 느낌과 실제 물리적 공명 위치는 구분해야 해요.'},
  {short:'들리는 목소리',sub:'귀·마이크',title:'04 · 음향',headline:'음높이·모음·음색을 귀와 마이크로 관찰해요.',easy:'우리가 듣는 소리는 성대 음원과 성도의 영향이 합쳐진 결과예요. 마이크로 주파수와 스펙트럼을 볼 수 있지만, 몸속 성대 모습까지 알 수는 없어요.',caution:'이 앱은 목 건강이나 발성 기전의 진단 도구가 아니에요.'}
];
export function pitchGuide(hz,targetMidi){
  if(!Number.isFinite(hz)||hz<65||hz>1500||!Number.isInteger(targetMidi))return {valid:false,cents:null,message:'소리가 감지되면 기준음과의 차이가 표시돼요.'};
  const cents=1200*Math.log2(hz/(440*Math.pow(2,(targetMidi-69)/12)));
  if(!Number.isFinite(cents))return {valid:false,cents:null,message:'현재는 음높이를 판단하기 어려워요.'};
  if(Math.abs(cents)<=20)return {valid:true,cents,message:'현재 소리가 기준음과 가까운 편이에요.'};
  if(cents<-100)return {valid:true,cents,message:'현재 음이 기준음보다 반음 이상 낮아요.'};
  if(cents>100)return {valid:true,cents,message:'현재 음이 기준음보다 반음 이상 높아요.'};
  return {valid:true,cents,message:cents<0?'현재 음이 기준음보다 조금 낮아요.':'현재 음이 기준음보다 조금 높아요.'};
}
export function pitchGuidePercent(cents){return Number.isFinite(cents)?Math.max(3,Math.min(97,50+cents/4)):50;}
