// An interactive procedural 3D schematic of the laryngeal opening.
// Deliberately stylized: never infer laryngeal mechanism, pressure, or health from a cartoon.
export function drawLarynx(canvas,{yaw=24,openness=30}={}){
 if(!canvas)return;
 const dpr=Math.min(2,window.devicePixelRatio||1),w=480,h=285;
 canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
 const ctx=canvas.getContext('2d');if(!ctx)return;ctx.scale(dpr,dpr);
 const style=getComputedStyle(document.documentElement);
 ctx.fillStyle=style.getPropertyValue('--res-bg')||'#1a2935';ctx.fillRect(0,0,w,h);
 const angle=yaw*Math.PI/180, pitch=42*Math.PI/180;
 const rotate=([x,y,z])=>{let xx=x*Math.cos(angle)+y*Math.sin(angle),yy=-x*Math.sin(angle)+y*Math.cos(angle);
  let py=yy*Math.cos(pitch)-z*Math.sin(pitch),pz=yy*Math.sin(pitch)+z*Math.cos(pitch);
  return {x:w*.50+xx*110,y:h*.52+py*96-pz*20,z:pz};};
 const surfaces=[];
 function face(points,fill,stroke='#263e50'){
  const pp=points.map(rotate);surfaces.push({pp,z:pp.reduce((a,p)=>a+p.z,0)/pp.length,fill,stroke});
 }
 // Transverse laryngeal rim and posterior cartilaginous rim: educational approximations only.
 for(let i=0;i<42;i++){
  const a=i*Math.PI*2/42,b=(i+1)*Math.PI*2/42;
  face([[1.30*Math.cos(a),1.00*Math.sin(a),.07],[1.30*Math.cos(b),1.00*Math.sin(b),.07],
   [1.10*Math.cos(b),.82*Math.sin(b),.35],[1.10*Math.cos(a),.82*Math.sin(a),.35]],'#56768c');
 }
 const gap=Math.min(.6,Math.max(.035,openness/100*.62));
 for(const side of [-1,1]){
  // Mucosal folds meet near the anterior commissure and diverge at the posterior aspect.
  const front=[side*.055,-.88,.42],back=[side*(.18+gap),.76,.45],edge1=[side*(.14+gap),.74,.19],edge2=[side*.16,-.78,.19];
  face([front,back,edge1,edge2],side<0?'#e8a5ad':'#efaeb5','#a66675');
  face([front,[side*.36,-.70,.18],edge2],side<0?'#b76f80':'#d68a98');
  face([back,[side*.62,.77,.11],edge1],side<0?'#bc7484':'#e4a1a7');
  // Small arytenoid-like posterior structures.
  for(let k=0;k<8;k++){const a=k*Math.PI/4,b=(k+1)*Math.PI/4;
   face([[side*.87+.16*Math.cos(a),.74+.15*Math.sin(a),.28],[side*.87+.16*Math.cos(b),.74+.15*Math.sin(b),.28],
    [side*.87+.12*Math.cos(b),.74+.12*Math.sin(b),.54],[side*.87+.12*Math.cos(a),.74+.12*Math.sin(a),.54]],'#a6b8c3');}
 }
 surfaces.sort((a,b)=>a.z-b.z);
 for(const s of surfaces){ctx.beginPath();ctx.moveTo(s.pp[0].x,s.pp[0].y);for(const p of s.pp.slice(1))ctx.lineTo(p.x,p.y);ctx.closePath();ctx.fillStyle=s.fill;ctx.fill();ctx.strokeStyle=s.stroke;ctx.lineWidth=1;ctx.stroke();}
 // Labels and guide lines are illustrative, not anatomically calibrated.
 ctx.strokeStyle='#91cbbd';ctx.fillStyle='#d8e7ed';ctx.lineWidth=1;ctx.font='13px sans-serif';
 ctx.fillText('성대 점막',14,24);ctx.beginPath();ctx.moveTo(80,27);ctx.lineTo(w*.37,h*.5);ctx.stroke();
 ctx.fillText('성문 공간',w-98,24);ctx.beginPath();ctx.moveTo(w-101,30);ctx.lineTo(w*.5,h*.57);ctx.stroke();
 ctx.fillStyle='#9cbdc4';ctx.font='11px sans-serif';ctx.fillText('앞쪽 (Anterior)',w*.41,h-18);ctx.fillText('뒤쪽 (Posterior)',w*.41,22);
}
