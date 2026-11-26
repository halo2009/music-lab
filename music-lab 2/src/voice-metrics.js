// Exploratory, uncalibrated acoustic descriptors from microphone frames.
// NOT suitable for diagnosis, phonation mechanism classification, or formant extraction.
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
export function getAcousticMetrics(wave,spectrum,sampleRate){
 if(!wave?.length)return null;
 let sum=0;for(const v of wave)sum+=v*v;
 const rms=Math.sqrt(sum/wave.length);
 const dbfs=20*Math.log10(Math.max(rms,1e-8));
 let weighted=0,energy=0,low=0,high=0;
 if(spectrum?.length){const binHz=sampleRate/(spectrum.length*2);for(let i=1;i<spectrum.length;i++){
  const hz=i*binHz;if(hz<90||hz>5000)continue;
  const power=10**(clamp(spectrum[i],-120,0)/10);
  weighted+=power*hz;energy+=power;
  if(hz<=1600)low+=power;else high+=power;
 }}
 return {dbfs:clamp(dbfs,-100,0),centroid:energy>1e-10?weighted/energy:null,highBandRatio:energy>1e-10?high/energy:null,rms};
}
export function pitchSpread(history){
 const valid=history.filter(x=>Number.isFinite(x));if(valid.length<7)return null;
 const values=valid.slice(-22),mean=values.reduce((a,b)=>a+b,0)/values.length;
 const dev=Math.sqrt(values.reduce((a,b)=>a+(b-mean)**2,0)/values.length);
 return {cents:dev*100,count:values.length};
}
export function describeAcoustics(m,pitch){
 if(!m||m.dbfs < -53)return '입력 대기 중입니다. 조용한 환경에서 편안한 크기로 소리를 내거나 말해 보세요.';
 const items=[];
 if(m.centroid!==null)items.push(m.centroid>1850?'고주파 쪽에 상대적으로 에너지가 많은 소리예요.':m.centroid<950?'저주파 쪽에 상대적으로 에너지가 많은 소리예요.':'중간 주파수 영역에 에너지가 분포해 있어요.');
 if(pitch)items.push(pitch.cents>60?'최근 음높이 변화 폭이 비교적 큽니다.':'최근 음높이 변화 폭이 비교적 작습니다.');
 return items.join(' ')+' 이 정보만으로 진성·가성·두성 또는 발성 건강 상태를 판정하지 않습니다.';
}
