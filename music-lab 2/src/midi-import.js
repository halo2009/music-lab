export function importMelodyMidi(buffer,{maxSteps=64}={}){
 const bytes=new Uint8Array(buffer),view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 const text=(at,length)=>String.fromCharCode(...bytes.subarray(at,at+length));
 if(bytes.length<14||text(0,4)!=='MThd'||view.getUint32(4)<6)throw Error('올바른 MIDI 파일을 선택하세요.');
 const format=view.getUint16(8),trackCount=view.getUint16(10),ppq=view.getUint16(12);
 if(![0,1].includes(format)||!trackCount||(format===0&&trackCount!==1)||!ppq||(ppq&0x8000)||trackCount>128)throw Error('MIDI 형식 0·1의 박자 기준 파일만 지원합니다.');
 let start=8+view.getUint32(4);
 const tracks=[];
 for(let t=0;t<trackCount;t++){
  if(start+8>bytes.length||text(start,4)!=='MTrk')throw Error('MIDI 트랙이 손상되었습니다.');
  const end=start+8+view.getUint32(start+4);
  if(end>bytes.length)throw Error('MIDI 트랙 길이가 올바르지 않습니다.');
  let at=start+8,tick=0,status=0;
  const notes=[],active=new Map();
  let name='';
  const byte=()=>{if(at>=end)throw Error('MIDI 이벤트가 잘렸습니다.');return bytes[at++];};
  const vlq=()=>{
   let value=0;
   for(let i=0;i<4;i++){const b=byte();value=value*128+(b&127);if(!(b&128))return value;}
   throw Error('MIDI 이벤트 길이가 올바르지 않습니다.');
  };
  while(at<end){
   tick+=vlq();
   let type=byte();
   if(type<128){if(!status)throw Error('MIDI 상태 바이트가 없습니다.');type=status;at--;}
   if(type===255||type===240||type===247){
    status=0;const kind=type===255?byte():null;
    const length=vlq();if(at+length>end)throw Error('MIDI 이벤트가 잘렸습니다.');
    if(kind===3)name=text(at,Math.min(length,64));
    at+=length;if(kind===47)break;
    continue;
   }
   if(type<128||type>=240)throw Error('지원하지 않는 MIDI 이벤트입니다.');
   status=type;
   const category=type&240,channel=type&15;
   const a=byte(),b=(category===192||category===208)?0:byte();
   if(a>=128||b>=128)throw Error('MIDI 데이터 값이 올바르지 않습니다.');
   if(channel===9||(category!==128&&category!==144))continue;
   const key=channel*128+a;
   if(category===144&&b){if(!active.has(key))active.set(key,tick);}
   else if(active.has(key)){
    const begin=active.get(key);active.delete(key);
    const step=Math.round(begin/ppq);
    if(step<maxSteps&&a>=48&&a<=83)notes.push({step,midi:a,duration:Math.max(.25,Math.round((tick-begin)*4/ppq)/4)});
   }
  }
  if(notes.length)tracks.push({name,notes});
  start=end;
 }
 const selected=tracks.find(track=>/melody/i.test(track.name))??tracks.at(-1);
 if(!selected)throw Error('현재 마디 범위와 피아노 롤 음역에서 불러올 음표가 없습니다.');
 return [...new Map(selected.notes.map(note=>[`${note.step}:${note.midi}`,note])).values()].slice(0,256);
}
