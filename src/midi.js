// Minimal Standard MIDI File writer (type 0), 480 PPQ, four 4/4 bars.
// Emits acoustic piano (program 0), chord tones and optional quarter-note melody.
import {chordMidi} from './music.js';
const vlq=n=>{n=Math.max(0,Math.floor(n));const out=[n&127];while(n>>=7)out.unshift((n&127)|128);return out};
const be=(n,len)=>Array.from({length:len},(_,i)=>(n>>((len-i-1)*8))&255);
const text=t=>Array.from(new TextEncoder().encode(t));
export function buildMidi(root,mode,degrees,bpm,melody=[]){
 const tpb=480,tempo=Math.round(60000000/Math.max(40,Math.min(220,bpm||82)));
 const ev=[{at:0,bytes:[0xff,0x51,3,...be(tempo,3)]},{at:0,bytes:[0xff,0x58,4,4,2,24,8]},{at:0,bytes:[0xc0,0]}];
 degrees.slice(0,4).forEach((degree,bar)=>{
  const start=bar*4*tpb;const notes=chordMidi(root,mode,degree,true);
  notes.forEach(n=>{ev.push({at:start,bytes:[0x90,n,62]});ev.push({at:start+3.5*tpb,bytes:[0x80,n,0]})});
 });
 melody.forEach(x=>{if(!Number.isInteger(x.midi)||x.midi<24||x.midi>108||x.step<0||x.step>15)return;
  const at=x.step*tpb;ev.push({at,bytes:[0x90,x.midi,98]});ev.push({at:at+tpb*.8,bytes:[0x80,x.midi,0]});
 });
 ev.sort((a,b)=>a.at-b.at||(a.bytes[0]===0x80?-1:1));
 let t=0,data=[];for(const e of ev){data.push(...vlq(e.at-t),...e.bytes);t=e.at}
 data.push(...vlq(16*tpb-t),0xff,0x2f,0);
 const header=[...text('MThd'),...be(6,4),0,0,0,1,1,224];
 const chunk=[...text('MTrk'),...be(data.length,4),...data];
 return new Uint8Array([...header,...chunk]);
}
export function downloadMidi(bytes,filename='music-lab-progression.mid'){
 const url=URL.createObjectURL(new Blob([bytes],{type:'audio/midi'})),a=document.createElement('a');
 a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function pianoRollSVG(chords,melody=[],startBar=0){
 const low=48,high=84,cellW=32,rowH=10,offX=53,offY=18,contentW=512,contentH=(high-low)*rowH;
 const rows=[];
 for(let m=high-1;m>=low;m--){const j=high-1-m,y=offY+j*rowH;
  rows.push(`<rect x="${offX}" y="${y}" width="${contentW}" height="${rowH}" fill="${[1,3,6,8,10].includes(m%12)?'var(--roll-black)':'var(--roll-white)'}"/><text x="44" y="${y+8}" font-size="9" fill="var(--muted)" text-anchor="end">${m%12===0?'C'+(Math.floor(m/12)-1):''}</text>`);
 }
 let bars='',chordNotes='';for(let b=0;b<4;b++){
  bars+=`<line x1="${offX+b*4*cellW}" y1="${offY}" x2="${offX+b*4*cellW}" y2="${offY+contentH}" stroke="var(--accent)" stroke-opacity=".55"/><text x="${offX+b*4*cellW+4}" y="11" fill="var(--muted)" font-size="10">BAR ${startBar+b+1}</text>`;
  (chords[b]||[]).forEach(m=>{if(m<low||m>=high)return;let y=offY+(high-1-m)*rowH;
   chordNotes+=`<rect x="${offX+b*4*cellW+1}" y="${y+1}" width="${4*cellW-2}" height="${rowH-2}" rx="3" fill="var(--roll-chord)" opacity=".62"/>`;});
 }
 const placed=melody.filter(x=>x.step>=startBar*4&&x.step<(startBar+4)*4&&x.midi>=low&&x.midi<high).map(x=>{const y=offY+(high-1-x.midi)*rowH;return `<rect x="${offX+(x.step-startBar*4)*cellW+1}" y="${y+1}" width="${cellW-2}" height="${rowH-2}" rx="2" fill="var(--accent-strong)"/>`}).join('');
 const grid=Array.from({length:17},(_,i)=>`<line x1="${offX+i*cellW}" y1="${offY}" x2="${offX+i*cellW}" y2="${offY+contentH}" stroke="var(--line)" stroke-width="${i%4===0?1.4:.6}"/>`).join('');
 return `<div class="piano-roll-scroll"><svg class="piano-roll-svg" viewBox="0 0 580 396" role="group" aria-label="피아노 롤: 격자를 눌러 멜로디 입력"><rect x="${offX}" y="${offY}" width="${contentW}" height="${contentH}" fill="var(--card2)"/>${rows.join('')}${bars}${grid}${chordNotes}${placed}<rect x="${offX}" y="${offY}" width="${contentW}" height="${contentH}" fill="transparent" data-action="roll-click"/></svg></div>`;
}
