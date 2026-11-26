import {BACKING_PARTS,buildBackingPattern,createBackingVoice,humanizedBeat,partOf,partVolume} from './backing-track.js';
import {be,bytes,track} from './studio-engine.js';

const kit={kick:36,snare:38,hat:42,ride:51};
const instruments={drums:[9,null],bass:[0,33],piano:[1,0],guitar:[2,27]};

export function buildBackingMidi(project,settings){
 const pattern=buildBackingPattern(project,settings),ppq=480,end=pattern.beats*ppq;
 const tempo=track([{at:0,bytes:[255,81,3,...be(Math.round(60e6/pattern.bpm),3)]},
  {at:0,bytes:[255,88,4,4,2,24,8]}],end);
 const tracks=BACKING_PARTS.map(part=>{
  const [channel,program]=instruments[part];
  const name=bytes(part);
  const events=[{at:0,bytes:[255,3,name.length,...name]}];
  if(program!==null)events.push({at:0,bytes:[0xc0|channel,program]});
  const volume=partVolume(pattern.settings,part);
  if(volume>0)pattern.events.forEach((event,index)=>{
   if(partOf(event)!==part)return;
   const on=Math.min(end-1,Math.round(humanizedBeat(event,index,pattern.startBeat)*ppq));
   const off=Math.min(end,on+Math.max(1,Math.round((event.length??.15)*ppq)));
   for(const note of event.notes??[event.midi??kit[event.kind]]){
    events.push({at:on,bytes:[0x90|channel,note,Math.max(1,Math.min(127,Math.round(110*event.velocity*volume)))]},
     {at:off,bytes:[0x80|channel,note,0]});
   }
  });
  return track(events,end);
 });
 return new Uint8Array([...bytes('MThd'),0,0,0,6,0,1,0,5,1,224,...tempo,...tracks.flat()]);
}

export function encodeWav(buffer){
 const channels=buffer.numberOfChannels,frames=buffer.length,size=frames*channels*2;
 const result=new ArrayBuffer(44+size),view=new DataView(result);
 const mark=(offset,text)=>{for(const [i,char] of [...text].entries())view.setUint8(offset+i,char.charCodeAt(0));};
 const word=(offset,value)=>view.setUint16(offset,value,true);
 const dword=(offset,value)=>view.setUint32(offset,value,true);
 mark(0,'RIFF');dword(4,36+size);mark(8,'WAVE');mark(12,'fmt ');dword(16,16);
 word(20,1);word(22,channels);dword(24,buffer.sampleRate);dword(28,buffer.sampleRate*channels*2);
 word(32,channels*2);word(34,16);mark(36,'data');dword(40,size);
 const samples=Array.from({length:channels},(_,channel)=>buffer.getChannelData(channel));
 let offset=44;
 for(let frame=0;frame<frames;frame++)for(const channel of samples){
  const value=Math.max(-1,Math.min(1,channel[frame]));
  view.setInt16(offset,value<0?value*32768:value*32767,true);offset+=2;
 }
 return result;
}

export async function renderBackingWav(project,settings,Offline=globalThis.OfflineAudioContext??globalThis.webkitOfflineAudioContext){
 if(!Offline)throw Error('이 브라우저에서 WAV 내보내기를 사용할 수 없어요.');
 const pattern=buildBackingPattern(project,settings),sec=60/pattern.bpm,sampleRate=44100;
 const offline=new Offline(1,Math.ceil((pattern.beats*sec+.4)*sampleRate),sampleRate);
 const voice=createBackingVoice(offline,sec,pattern.settings);
 pattern.events.forEach((event,index)=>voice.scheduleEvent(event,humanizedBeat(event,index,pattern.startBeat)*sec));
 return encodeWav(await offline.startRendering());
}
