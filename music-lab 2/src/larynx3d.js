// Rotatable, lit anatomical *schematic* (not a patient-specific scan) made of 3D surface meshes.
// The animation is slowed down and not synchronized to actual human vocal fold vibration frequency.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const rgb=(hex)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
const palette={tissue:'#cb8897',fold:'#f7c5c9',falseFold:'#b47f8f',cartilage:'#86abb6',epi:'#bd8596',back:'#314758',ary:'#c1aeba',inside:'#624b68'};
function vec(x,y,z){return [x,y,z]}
function normalize(v){const s=Math.hypot(...v)||1;return v.map(x=>x/s)}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function sub(a,b){return a.map((x,i)=>x-b[i])}
function paint(ctx,w,h,{yaw=20,pitch=42,openness=30,zoom=1,phase=0,focus='all'}){
 const a=clamp(yaw,-145,145)*Math.PI/180,b=clamp(pitch,5,86)*Math.PI/180;
 const cosA=Math.cos(a),sinA=Math.sin(a),cosB=Math.cos(b),sinB=Math.sin(b);
 const R=p=>{let x=p[0]*cosA+p[1]*sinA,y=-p[0]*sinA+p[1]*cosA,z=p[2];return [x,y*cosB-z*sinB,y*sinB+z*cosB]};
 const scale=clamp(zoom,.72,1.3)*95,light=normalize([-.35,-.65,1.3]);
 const project=p=>{const [x,y,z]=R(p);const perspective=3.4/(3.4-z*.24);return {x:w*.51+x*scale*perspective,y:h*.57+y*scale*perspective-z*9,z}};
 const shapes=[];
 function tri(p,q,r,color,alpha=1){
   const category=color===palette.fold||color==='#ffdce0'?'folds':color===palette.falseFold?'falseFold':color===palette.cartilage?'cartilage':color===palette.ary?'ary':'other';
   if(focus!=='all' && category!==focus)alpha*=.22;const A=project(p),B=project(q),C=project(r);const n=normalize(cross(sub(q,p),sub(r,p)));let illum=.46+.54*Math.abs(n[0]*light[0]+n[1]*light[1]+n[2]*light[2]);
   shapes.push({pts:[A,B,C],depth:(A.z+B.z+C.z)/3,color,alpha,illum});}
 function quad(p,q,r,s,color,alpha=1){tri(p,q,r,color,alpha);tri(p,r,s,color,alpha)}
 function tube(start,end,r0,r1,color,sides=11){
   const axis=normalize(sub(end,start)),reference=Math.abs(axis[2])>.80?[0,1,0]:[0,0,1],up=normalize(cross(axis,reference)),side=normalize(cross(axis,up));
   const ring=(p,rad,k)=>vec(...p.map((v,i)=>v+rad*(up[i]*Math.cos(k)+side[i]*Math.sin(k))));
   for(let i=0;i<sides;i++){const k=i*Math.PI*2/sides,l=(i+1)*Math.PI*2/sides;quad(ring(start,r0,k),ring(start,r0,l),ring(end,r1,l),ring(end,r1,k),color)}
 }
 function pathTube(points,radii,color){for(let i=1;i<points.length;i++)tube(points[i-1],points[i],radii[i-1],radii[i],color,9)}
 function ellipsoid(center,sizes,color,steps=14,lats=8){
   const get=(u,v)=>{const cu=Math.cos(u),su=Math.sin(u),sv=Math.sin(v),cv=Math.cos(v);return [center[0]+sizes[0]*cu*sv,center[1]+sizes[1]*su*sv,center[2]+sizes[2]*cv]};
   for(let t=0;t<lats;t++)for(let j=0;j<steps;j++){
    const u=j*2*Math.PI/steps,du=2*Math.PI/steps,v=t*Math.PI/lats,dv=Math.PI/lats;
    quad(get(u,v),get(u+du,v),get(u+du,v+dv),get(u,v+dv),color);
   }
 }
 // Deep oval vestibule: tessellated walls and tracheal/false-fold tissue layers.
 const annulus=(z,rx,ry,thickness,col)=>{
  for(let j=0;j<48;j++){
   const a=j*Math.PI/24,c=(j+1)*Math.PI/24;
   const at=(r,t)=>[Math.cos(t)*r*rx,Math.sin(t)*r*ry,z+.08*Math.sin(t*2)];
   quad(at(1,a),at(1,c),at(1-thickness,c),at(1-thickness,a),col);
  }
 };
 annulus(-.52,1.34,1.45,.30,palette.cartilage);annulus(-.13,1.16,1.25,.30,palette.inside);
 // Ellipsoid cartilage bulk along the bilateral lateral boundaries.
 ellipsoid([-.98,.10,-.23],[.26,.9,.24],palette.cartilage);ellipsoid([.98,.10,-.23],[.26,.9,.24],palette.cartilage);
 // Vestibular (false) folds are separate from true vocal folds.
 for(const s of [-1,1]){
  pathTube([[-s*.42,-.91,.19],[-s*.53,-.42,.22],[-s*.54,.25,.20],[-s*.71,.77,.25]],[.14,.17,.16,.19],palette.falseFold);
 }
 // Glottal dark space. Its changing width is for visual instruction, not a measured glottal area.
 const gap=clamp(openness,0,100)/100*.39+phase*.085;
 const mid=(y,side)=>{const t=clamp((y+.92)/1.9,0,1);return [side*(.045+(.14+gap)*Math.pow(t,1.7)),y,.55+.08*Math.sin(Math.PI*t)]};
 for(let j=0;j<25;j++){
  const y=-.90+j*1.83/25,ny=-.90+(j+1)*1.83/25;
  quad(mid(y,-1),mid(ny,-1),mid(ny,1),mid(y,1),palette.back);
 }
 // Thick, rounded true folds with visible color variation across superior surface.
 for(const s of [-1,1]){
  let pts=[];for(let j=0;j<=34;j++){const t=j/34,y=-.91+1.84*t,edge=mid(y,s);pts.push([edge[0],edge[1],edge[2]+.05]);}
  pathTube(pts,pts.map((_,j)=>.09+.055*Math.sin(Math.PI*j/34)),palette.fold);
  // Faint longitudinal tissue ridge reflects more specular light.
  const ridges=pts.map(x=>[x[0]+s*.042,x[1],x[2]+.10]);pathTube(ridges,ridges.map(()=>.018),'#ffdce0');
  // Posterior paired arytenoid cartilages (schematic).
  ellipsoid([s*(.51+gap*.70),.96,.55],[.28,.22,.30],palette.ary);
 }
 // Epiglottic plate and anterior thyroid cartilage shape.
 for(let i=0;i<16;i++){const t=i/16,n=(i+1)/16;
  const edge=(u,s)=>[s*(.21+.44*Math.sin(Math.PI*u)), -1.25-.20*Math.sin(Math.PI*u),.48+.23*Math.sin(Math.PI*u)];
  quad(edge(t,-1),edge(n,-1),edge(n,1),edge(t,1),palette.epi,.91);
 }
 annulus(-.80,1.47,1.56,.12,palette.cartilage);
 shapes.sort((a,b)=>a.depth-b.depth);
 const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#15202d');bg.addColorStop(1,'#233245');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
 const halo=ctx.createRadialGradient(w*.5,h*.54,15,w*.5,h*.54,h*.73);halo.addColorStop(0,'rgba(110,176,176,.13)');halo.addColorStop(1,'transparent');ctx.fillStyle=halo;ctx.fillRect(0,0,w,h);
 ctx.save();ctx.lineWidth=.30;
 for(const o of shapes){const v=rgb(o.color),c=v.map(a=>Math.round(a*o.illum));ctx.beginPath();ctx.moveTo(o.pts[0].x,o.pts[0].y);ctx.lineTo(o.pts[1].x,o.pts[1].y);ctx.lineTo(o.pts[2].x,o.pts[2].y);ctx.closePath();ctx.fillStyle=`rgba(${c.join(',')},${o.alpha})`;ctx.fill();ctx.strokeStyle=`rgba(0,10,20,${.15*o.alpha})`;ctx.stroke();}
 ctx.restore();
 ctx.font='600 11px sans-serif';ctx.fillStyle='#dce9eb';ctx.fillText('TRUE VOCAL FOLDS · 성대',15,20);
 ctx.font='10px sans-serif';ctx.fillStyle='#b5ced5';ctx.fillText('Vestibular folds · 성대 윗부분의 전정주름',15,h-31);
 ctx.fillText('교육용 구조 모형 · 실제 해부학 영상이 아님',15,h-15);
 ctx.font='10px sans-serif';ctx.textAlign='right';ctx.fillText(`회전 ${Math.round(yaw)}° / 기울기 ${Math.round(pitch)}°`,w-15,20);
 ctx.textAlign='left';ctx.fillStyle='#b8dccc';ctx.fillText(`강조: ${{all:'전체',folds:'진성대',falseFold:'전정주름',cartilage:'후두 연골',ary:'피열연골'}[focus]||'전체'}`,15,37);
}
export function drawLarynx(canvas,opts={}){
 if(!canvas)return;const dpr=Math.min(2,window.devicePixelRatio||1),w=480,h=305;
 if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
 const ctx=canvas.getContext('2d');if(!ctx)return;ctx.setTransform(dpr,0,0,dpr,0,0);
 paint(ctx,w,h,opts);
}
export function animateLarynx(canvas,getState){
 let active=true,raf=0,last=0,start=performance.now();
 function tick(t){if(!active)return;if(t-last>=55){last=t;const s=getState();drawLarynx(canvas,{...s,phase:Math.sin((t-start)/1000*2*Math.PI*2.8)});}raf=requestAnimationFrame(tick);}
 raf=requestAnimationFrame(tick);
 return ()=>{active=false;cancelAnimationFrame(raf)};
}
