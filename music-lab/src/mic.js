import {frequencyToNote} from './music.js';
// Autocorrelation-based monophonic pitch estimate. This is an educational approximation.
export function estimatePitch(buffer,sampleRate){
 const size=buffer.length;let rms=0;
 for(let i=0;i<size;i++)rms+=buffer[i]*buffer[i];
 rms=Math.sqrt(rms/size);if(rms<.015)return null;
 const minLag=Math.floor(sampleRate/1000),maxLag=Math.min(Math.floor(sampleRate/65),Math.floor(size/2));
 let bestLag=-1,best=0;
 for(let lag=minLag;lag<=maxLag;lag++){
  let sum=0,sqA=0,sqB=0;
  for(let i=0;i<size-lag;i+=2){const a=buffer[i],b=buffer[i+lag];sum+=a*b;sqA+=a*a;sqB+=b*b;}
  const c=sum/Math.sqrt(sqA*sqB+1e-10);
  if(c>best){best=c;bestLag=lag;}
 }
 if(best<.82||bestLag<1)return null;
 // Parabolic interpolation around the best lag for sub-sample accuracy.
 const corr=lag=>{let s=0;for(let i=0;i<size-lag;i+=2)s+=buffer[i]*buffer[i+lag];return s};
 let offset=0;
 if(bestLag>minLag&&bestLag<maxLag){const l=corr(bestLag-1),m=corr(bestLag),r=corr(bestLag+1);const den=l-2*m+r;if(Math.abs(den)>1e-8)offset=Math.max(-.5,Math.min(.5,.5*(l-r)/den));}
 return frequencyToNote(sampleRate/(bestLag+offset));
}
export async function startMicrophone(onFrame){
 if(!navigator.mediaDevices?.getUserMedia)throw new Error('마이크는 HTTPS 또는 localhost에서 사용할 수 있어.');
 const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
 const ctx=new (window.AudioContext||window.webkitAudioContext)();
 try{
  await ctx.resume();const source=ctx.createMediaStreamSource(stream);const analyser=ctx.createAnalyser();
  analyser.fftSize=4096;source.connect(analyser);const data=new Float32Array(analyser.fftSize),spectrum=new Float32Array(analyser.frequencyBinCount);let raf=0,last=0;
  const tick=ts=>{if(ts-last>85){last=ts;analyser.getFloatTimeDomainData(data);analyser.getFloatFrequencyData(spectrum);onFrame(estimatePitch(data,ctx.sampleRate),data,{spectrum,sampleRate:ctx.sampleRate});}raf=requestAnimationFrame(tick)};
  raf=requestAnimationFrame(tick);
  return ()=>{cancelAnimationFrame(raf);source.disconnect();stream.getTracks().forEach(t=>t.stop());ctx.close()};
 }catch(e){stream.getTracks().forEach(t=>t.stop());ctx.close();throw e}
}
