// A/B vocal takes remain in this tab, and are never uploaded to a server.
let recorder=null,stream=null,activeSlot=null;
const clips={A:null,B:null};
let callback=null;
export const recordingSlot=()=>activeSlot;
export function clipUrl(slot){return clips[slot]?.url||null}
export async function toggleRecord(slot,onChange){
 if(!['A','B'].includes(slot))return;
 if(activeSlot){
  if(activeSlot===slot){recorder?.stop();return;}
  throw new Error('현재 녹음 중인 테이크를 먼저 정지하세요.');
 }
 if(typeof MediaRecorder==='undefined'||!navigator.mediaDevices?.getUserMedia)throw new Error('이 브라우저에서는 오디오 녹음을 사용할 수 없습니다.');
 const source=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false}});
 stream=source;const mime=['audio/mp4','audio/webm;codecs=opus','audio/webm'].find(m=>MediaRecorder.isTypeSupported(m));
 recorder=new MediaRecorder(source,mime?{mimeType:mime}:undefined);
 const pieces=[];activeSlot=slot;callback=onChange;
 recorder.addEventListener('dataavailable',e=>{if(e.data?.size)pieces.push(e.data)});
 recorder.addEventListener('stop',()=>{
  source.getTracks().forEach(t=>t.stop());stream=null;
  const blob=new Blob(pieces,{type:recorder.mimeType||'audio/webm'});
  if(clips[slot]?.url)URL.revokeObjectURL(clips[slot].url);
  clips[slot]={url:URL.createObjectURL(blob),blob};
  activeSlot=null;recorder=null;if(callback)callback();
 });
 recorder.start();if(callback)callback();
}
export function clearClips(){if(activeSlot)recorder?.stop();for(const v of Object.values(clips))if(v?.url)URL.revokeObjectURL(v.url);clips.A=null;clips.B=null;}
