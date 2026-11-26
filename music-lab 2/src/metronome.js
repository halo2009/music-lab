// Music Lab Alpha 0.9 — lightweight guitar practice metronome.
// Four quarter-note clicks per bar, stronger first beat. No melodic pitch guidance.
export function startMetronome({context,bpm=60}={}){
 if(!context||typeof context.createOscillator!=='function')throw new Error('Web Audio가 필요합니다.');
 const safeBpm=Math.max(40,Math.min(240,Number(bpm)||60));
 const master=context.createGain();master.gain.value=.42;master.connect(context.destination);
 let nextTime=context.currentTime+.06,beat=0,stopped=false;
 function click(when,accent){
  const osc=context.createOscillator(),gain=context.createGain();osc.type='sine';osc.frequency.value=accent?1040:740;
  const volume=accent?.20:.11;
  gain.gain.setValueAtTime(.0001,when);gain.gain.exponentialRampToValueAtTime(volume,when+.002);
  gain.gain.exponentialRampToValueAtTime(.0001,when+.065);
  osc.connect(gain);gain.connect(master);osc.start(when);osc.stop(when+.075);
 }
 function schedule(){
  if(stopped)return;
  if(nextTime<context.currentTime-.1){nextTime=context.currentTime+.05;beat=0;}
  let count=0;
  while(nextTime<context.currentTime+.14 && count<12){
   click(nextTime,beat%4===0);beat++;nextTime+=60/safeBpm;count++;
  }
 }
 schedule();const timer=setInterval(schedule,25);
 return ()=>{if(stopped)return;stopped=true;clearInterval(timer);master.gain.cancelScheduledValues(context.currentTime);master.gain.setValueAtTime(0,context.currentTime);setTimeout(()=>{try{master.disconnect()}catch{}},200);};
}
