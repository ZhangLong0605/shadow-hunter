/* Eight-direction textured character rig; enemies, foliage and light remain local Canvas artwork. */
'use strict';
window.HUNTER_ART=(()=>{
 const tau=Math.PI*2;
 const hunterAtlas=typeof window.Image==='function'?new window.Image():null;
 if(hunterAtlas)hunterAtlas.src='assets/hunter-directions.png';
 // Each pose pivots around its boots, rather than the centre of its flowing cape.
 const poses=[
  [0,0,488,444,273,443,425],[444,0,443,444,229,443,425],
  [887,0,444,444,231,438,421],[1331,0,443,444,177,443,426],
  [0,444,488,443,245,411,412],[444,444,443,443,277,413,414],
  [887,444,444,443,219,401,398],[1331,444,443,443,237,411,412]
 ];
 function direction(angle){return Math.round(((angle%tau)+tau)%tau/(tau/8))%8;}
 const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
 const smooth=n=>{n=clamp(n);return n*n*(3-2*n);};
 // Anatomical anchors in each source pose. Skin weights keep the original painted
 // armour, boots and bowblade attached to their joints; no second weapon is overlaid.
 const rigs=[
  {hips:[[281,258],[332,261]],knees:[[262,344],[335,338]],feet:[[254,424],[348,404]],shoulder:[312,124],elbow:[321,193],hand:[330,258],off:[[350,136],[353,200],[353,241]],blade:[[323,248],[420,279],[451,246],[488,250],[488,444],[433,444],[417,329],[343,288]],cape:-1},
  {hips:[[211,258],[286,257]],knees:[[191,333],[293,331]],feet:[[177,424],[314,414]],shoulder:[315,130],elbow:[337,194],hand:[355,253],off:[[188,132],[174,193],[183,248]],blade:[[344,244],[396,270],[418,240],[443,240],[443,444],[408,437],[382,320],[344,276]],cape:-1},
  {hips:[[201,257],[268,257]],knees:[[177,335],[285,333]],feet:[[144,423],[306,421]],shoulder:[296,125],elbow:[310,191],hand:[326,252],off:[[169,128],[147,193],[140,252]],blade:[[315,243],[385,272],[416,241],[444,240],[444,444],[401,435],[353,315],[315,277]],cape:-1},
  {hips:[[117,253],[192,257]],knees:[[103,331],[214,336]],feet:[[86,410],[237,426]],shoulder:[215,130],elbow:[225,192],hand:[218,249],off:[[91,132],[76,196],[65,249]],blade:[[208,242],[294,278],[324,267],[331,253],[344,274],[354,300],[355,332],[342,363],[316,408],[309,411],[322,358],[319,333],[308,315],[285,307],[240,282],[208,272]],cape:1},
  {hips:[[208,239],[254,239]],knees:[[205,317],[280,314]],feet:[[199,400],[291,382]],shoulder:[206,107],elbow:[199,167],hand:[182,213],off:[[243,125],[241,181],[244,224]],blade:[[189,202],[132,231],[65,212],[0,212],[0,414],[81,414],[151,276],[194,235]],cape:1},
  {hips:[[218,269],[305,268]],knees:[[208,331],[313,335]],feet:[[188,402],[331,407]],shoulder:[313,121],elbow:[337,181],hand:[354,227],off:[[238,140],[229,194],[222,243]],blade:[[346,215],[397,239],[428,213],[443,211],[443,414],[405,411],[370,286],[344,248]],cape:-1},
  {hips:[[176,268],[279,268]],knees:[[162,325],[289,324]],feet:[[147,388],[304,393]],shoulder:[300,113],elbow:[321,179],hand:[337,232],off:[[178,123],[162,181],[159,228]],blade:[[327,218],[379,242],[410,215],[444,215],[444,407],[391,405],[355,287],[327,249]],cape:-1},
  {hips:[[212,266],[265,263]],knees:[[203,327],[276,332]],feet:[[206,396],[290,408]],shoulder:[276,107],elbow:[281,169],hand:[294,225],off:[[245,125],[239,182],[240,225]],blade:[[286,212],[371,239],[420,210],[443,212],[443,430],[396,426],[321,290],[286,247]],cape:-1}
 ];
 function createMotion(){return {motionTime:0,stridePhase:0,moveBlend:0,moveHeading:0,attackPoseTime:0,attackPoseDuration:0,attackPoseAngle:0,attackPoseWeapon:'blade',attackStrong:false};}
 function advanceMotion(m,dx,dy,dt,options={}){
  if(!Number.isFinite(m.stridePhase))Object.assign(m,createMotion());
  if(!(dt>0))return;
  m.motionTime+=dt;m.attackPoseTime=Math.max(0,m.attackPoseTime-dt);
  const travelled=Math.hypot(dx,dy),walking=!options.dash&&!options.capture&&travelled>.001;
  const target=walking?clamp(travelled/dt/200):0;
  m.moveBlend+=(target-m.moveBlend)*(1-Math.exp(-dt*15));
  if(m.moveBlend<.001)m.moveBlend=0;
  if(walking){m.moveHeading=Math.atan2(dy,dx);m.stridePhase=(m.stridePhase+travelled*tau/120)%tau;}
 }
 function beginAttack(m,weapon,angle,charged=false){
  m.attackPoseDuration=charged?.46:weapon==='cast'?.38:.3;
  m.attackPoseTime=m.attackPoseDuration;m.attackPoseWeapon=weapon;m.attackPoseAngle=angle;m.attackStrong=charged;
 }
 function curve(t,points){for(let i=1;i<points.length;i++){if(t<=points[i][0]){const [a,x]=points[i-1],[b,y]=points[i];return x+(y-x)*smooth((t-a)/(b-a));}}return points[points.length-1][1];}
 function motionPose(time,moving,angle,weapon,m={}){
  const weight=Number.isFinite(m.moveBlend)?m.moveBlend:moving?1:0,phase=Number.isFinite(m.stridePhase)?m.stridePhase:time*11;
  const progress=m.attackPoseTime>0?clamp(1-m.attackPoseTime/m.attackPoseDuration):1,active=m.attackPoseTime>0;
  const swing=active?curve(progress,[[0,m.attackStrong?-.65:0],[.18,-.8],[.53,.65],[.72,.75],[1,0]]):0;
  const facing=Math.cos(angle)>=0?1:-1,charge=active?0:clamp((m.charging||0)/.55),bow=weapon==='bow'&&m.attackPoseWeapon!=='cast';
  return {phase,weight,heading:Number.isFinite(m.moveHeading)?m.moveHeading:angle,progress,active,charge,bow,
   upper:bow?facing*(-charge*.23+(active?Math.sin(progress*Math.PI)*.24:0)):facing*(swing*(m.attackStrong?1.15:1)-charge*.65),
   fore:bow?facing*(-charge*.4+(active?Math.sin(progress*Math.PI)*.6:0)):facing*(active?Math.sin(progress*Math.PI)*-.38:-charge*.2),
   off:bow?facing*(charge*.6+(active?Math.sin(progress*Math.PI)*-.5:0)):facing*swing*-.28,
   bob:Math.abs(Math.sin(phase))*weight*2.2+Math.sin(time*2.1)*.45,
   lean:(Math.cos(m.moveHeading||0)*weight*.025)+(active?facing*Math.sin(progress*Math.PI)*.035:0),dash:m.dash>0};
 }
 function rotatePoint(p,pivot,a){const x=p[0]-pivot[0],y=p[1]-pivot[1],c=Math.cos(a),s=Math.sin(a);return [pivot[0]+x*c-y*s,pivot[1]+x*s+y*c];}
 function segmentDistance(p,a,b){const x=b[0]-a[0],y=b[1]-a[1],t=clamp(((p[0]-a[0])*x+(p[1]-a[1])*y)/(x*x+y*y||1));return Math.hypot(p[0]-a[0]-x*t,p[1]-a[1]-y*t);}
 function inside(p,polygon){let yes=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
 function weights(p,r){
  const weapon=inside(p,r.blade),arm=Math.max(weapon?1:0,smooth(1-segmentDistance(p,r.shoulder,r.elbow)/42),smooth(1-segmentDistance(p,r.elbow,r.hand)/32));
  const off=smooth(1-Math.min(segmentDistance(p,r.off[0],r.off[1]),segmentDistance(p,r.off[1],r.off[2]))/30)*(1-arm);
  const legs=r.hips.map((h,i)=>smooth((p[1]-h[1])/65)*smooth(1-segmentDistance(p,h,r.feet[i])/51)*(1-arm)*(1-off));
  const sum=legs[0]+legs[1];if(sum>1){legs[0]/=sum;legs[1]/=sum;}
  const centre=(r.hips[0][0]+r.hips[1][0])/2;
  const cape=smooth((r.cape*(p[0]-centre)-48)/110)*smooth((p[1]-115)/155)*(1-arm)*(1-off)*(1-Math.max(...legs));
  return {arm,off,legs,cape,fore:smooth((p[1]-r.elbow[1]+12)/45),offFore:smooth((p[1]-r.off[1][1]+8)/40)};
 }
 function armPoint(p,shoulder,elbow,upper,fore,blend){
  const lower=rotatePoint(p,elbow,fore*blend);return rotatePoint(lower,shoulder,upper);
 }
 function deform(p,w,r,a){
  let x=p[0],y=p[1];
  for(let i=0;i<2;i++)if(w.legs[i]){
   const cycle=a.phase+i*Math.PI,step=Math.sin(cycle),lift=Math.max(0,Math.cos(cycle)),forward=Math.cos(a.heading),depth=Math.sin(a.heading);
   const upper=step*(forward*.24+(i?-.035:.035))*a.weight;
   const lower=(upper-lift*.48*(forward>=0?1:-1)*Math.abs(forward)*a.weight);
   const t=smooth((p[1]-r.knees[i][1]+10)/38),q=armPoint(p,r.hips[i],r.knees[i],upper,lower-upper,t);
   x+=(q[0]-p[0])*w.legs[i];y+=(q[1]-p[1]+(depth*step*24-lift*15)*a.weight*smooth((p[1]-r.hips[i][1])/130))*w.legs[i];
  }
  if(w.arm){const walk=Math.sin(a.phase+Math.PI)*.065*a.weight*(a.active||a.charge?0:1),q=armPoint(p,r.shoulder,r.elbow,a.upper+walk,a.fore,w.fore);x+=(q[0]-p[0])*w.arm;y+=(q[1]-p[1])*w.arm;}
  if(w.off){const q=armPoint(p,r.off[0],r.off[1],a.off+Math.sin(a.phase)*.12*a.weight,0,w.offFore);x+=(q[0]-p[0])*w.off;y+=(q[1]-p[1])*w.off;}
  x+=(Math.sin(a.phase-.7)*11*a.weight-Math.cos(a.heading)*(a.dash?55:18*a.weight))*w.cape;
  y+=(Math.cos(a.phase)*4*a.weight+(a.dash?-18:0))*w.cape;
  return [x,y];
 }
 const meshes=[];
 function surfaceFor(w,h){const surface=typeof OffscreenCanvas==='function'?new OffscreenCanvas(w,h):typeof document!=='undefined'?document.createElement('canvas'):null;if(surface){surface.width=w;surface.height=h;}return surface;}
 function limbMask(c,a,b,radius){c.lineCap='round';c.lineWidth=radius*2;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();}
 function forearmMask(c,r){limbMask(c,r.elbow,r.hand,25);shape(c,r.blade,'#fff');c.lineJoin='round';c.lineWidth=12;c.stroke();}
 function cleanFragments(c,w,h){
  const bitmap=c.getImageData(0,0,w,h),data=bitmap.data,seen=new Uint8Array(w*h),queue=new Uint32Array(w*h);
  for(let start=0;start<seen.length;start++)if(!seen[start]&&data[start*4+3]>8){
   let head=0,tail=1;queue[0]=start;seen[start]=1;
   while(head<tail){const p=queue[head++],x=p%w;
    for(const n of [x?p-1:-1,x<w-1?p+1:-1,p-w,p+w])if(n>=0&&n<seen.length&&!seen[n]&&data[n*4+3]>8){seen[n]=1;queue[tail++]=n;}
   }
   if(tail<300)for(let i=0;i<tail;i++)data[queue[i]*4+3]=0;
  }
  c.putImageData(bitmap,0,0);return data;
 }
 function meshFor(index){
  if(meshes[index])return meshes[index];
  const pose=poses[index],r=rigs[index],step=28,columns=Math.ceil(pose[2]/step),rows=Math.ceil(pose[3]/step),points=[],triangles=[];
  let image=hunterAtlas,sourceX=pose[0],sourceY=pose[1],pixels=null,upper=null,fore=null;
  // Pre-light once. Culling transparent tiles keeps the one-character mesh cheap.
  try{const surface=surfaceFor(pose[2],pose[3]);
   if(surface){surface.width=pose[2];surface.height=pose[3];const c=surface.getContext('2d');c.filter='brightness(1.3)';c.drawImage(hunterAtlas,...pose.slice(0,4),0,0,pose[2],pose[3]);
    // The supplied atlas has a few silhouettes crossing its nominal cell edges.
    if(index===1||index===5)c.clearRect(0,0,45,pose[3]);if(index===6)c.clearRect(0,0,22,pose[3]);if(index>=4)c.clearRect(0,0,pose[2],6);
    const extract=mask=>{const layer=surfaceFor(pose[2],pose[3]),lc=layer.getContext('2d');lc.fillStyle=lc.strokeStyle='#fff';mask(lc);lc.globalCompositeOperation='source-in';lc.drawImage(surface,0,0);try{cleanFragments(lc,pose[2],pose[3]);}catch{}return layer;};
    fore=extract(lc=>forearmMask(lc,r));
    upper=extract(lc=>{limbMask(lc,r.shoulder,r.elbow,32);lc.globalCompositeOperation='destination-out';forearmMask(lc,r);lc.globalCompositeOperation='source-over';});
    c.filter='none';c.globalCompositeOperation='destination-out';c.fillStyle=c.strokeStyle='#fff';limbMask(c,r.shoulder,r.elbow,32);forearmMask(c,r);
    c.globalCompositeOperation='destination-over';
    const sx=r.shoulder[0],sy=r.shoulder[1];
    c.save();const torso=[[sx-25,sy],[sx+15,sy+10],[r.hips[1][0]+10,r.hips[1][1]+10],[r.hips[0][0]-5,r.hips[0][1]+5],[sx-35,sy+80]];
    c.beginPath();torso.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.clip();
    c.drawImage(hunterAtlas,pose[0]+Math.min(r.hips[0][0],r.hips[1][0])+20,pose[1]+140,30,120,sx-38,sy,85,155);c.restore();
    if(index===3){
     c.save();
     const cloth=c.createLinearGradient(230,190,410,390);cloth.addColorStop(0,'#19232b');cloth.addColorStop(.5,'#30333a');cloth.addColorStop(1,'#151f28');
     shape(c,[[210,150],[280,194],[399,261],[433,384],[309,383],[210,309]],cloth);c.restore();
    }
    c.globalCompositeOperation='source-over';
    image=surface;sourceX=sourceY=0;try{pixels=cleanFragments(c,pose[2],pose[3]);}catch{}}
  }catch{}
  for(let row=0;row<=rows;row++)for(let col=0;col<=columns;col++){const p=[Math.min(col*step,pose[2]),Math.min(row*step,pose[3])];points.push({p,w:weights(p,r)});}
  for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
   const i=row*(columns+1)+col,a=points[i].p,b=points[i+columns+2].p;let visible=!pixels;
   if(pixels)for(let y=a[1];y<b[1]&&!visible;y++)for(let x=a[0];x<b[0];x++)if(pixels[(y*pose[2]+x)*4+3]>0){visible=true;break;}
   if(visible)triangles.push([i,i+1,i+columns+2],[i,i+columns+2,i+columns+1]);
  }
  if(upper)points.forEach(v=>{v.w.arm=0;});
  const faces=triangles.map(ids=>({ids,src:ids.map(i=>points[i].p)}));
  return meshes[index]={points,triangles,faces,image,sourceX,sourceY,upper,fore};
 }
 function texturedTriangle(g,mesh,pose,src,dst){
  const [p,q,r]=src,[a,b,c]=dst,ux=q[0]-p[0],uy=q[1]-p[1],vx=r[0]-p[0],vy=r[1]-p[1],det=ux*vy-uy*vx;
  const A=((b[0]-a[0])*vy-(c[0]-a[0])*uy)/det,B=((b[1]-a[1])*vy-(c[1]-a[1])*uy)/det;
  const C=((c[0]-a[0])*ux-(b[0]-a[0])*vx)/det,D=((c[1]-a[1])*ux-(b[1]-a[1])*vx)/det;
  const mx=(a[0]+b[0]+c[0])/3,my=(a[1]+b[1]+c[1])/3;
  g.save();g.beginPath();for(let i=0;i<3;i++){const v=dst[i],dx=v[0]-mx,dy=v[1]-my,len=Math.hypot(dx,dy)||1,x=v[0]+dx/len*.55,y=v[1]+dy/len*.55;i?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();g.clip();
  g.transform(A,B,C,D,a[0]-A*p[0]-C*p[1],a[1]-B*p[0]-D*p[1]);
  g.drawImage(mesh.image,mesh.sourceX,mesh.sourceY,pose[2],pose[3],0,0,pose[2],pose[3]);g.restore();
 }
 function shape(g,points,fill,stroke){g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=1;g.stroke();}}
 function oval(g,x,y,rx,ry,color){g.beginPath();g.ellipse(x,y,rx,ry,0,0,tau);g.fillStyle=color;g.fill();}
 function light(g,x,y,r,color){const gradient=g.createRadialGradient(x,y,0,x,y,r);gradient.addColorStop(0,color);gradient.addColorStop(1,'transparent');g.fillStyle=gradient;g.fillRect(x-r,y-r,r*2,r*2);}
 function hunter(g,x,y,angle,color,scale,enemy,time,moving,weapon,motion={}){
  if(!enemy&&hunterAtlas?.complete&&hunterAtlas.naturalWidth){drawHunterSprite(g,x,y,angle,color,scale,time,moving,weapon,motion);return;}
  g.save();g.translate(x,y);g.scale(scale,scale);
  const stride=moving?Math.sin(time*13)*4:Math.sin(time*2)*.7,sway=Math.sin(time*3+x)*2;
  oval(g,2,16,24,8,'#020b13a8');
  if(!enemy){light(g,0,-8,47,'#80e3d71b');g.strokeStyle='#a8f5d37a';g.lineWidth=1;g.beginPath();g.ellipse(0,16,22,9,0,0,tau);g.stroke();}
  shape(g,[[-10,0],[-13,23+stride],[-5,25+stride],[-1,5]],'#0b1726','#537277');
  shape(g,[[4,2],[6,24-stride],[13,24-stride],[13,0]],'#102033','#628182');
  shape(g,[[-14,-20],[-24+sway,19],[-11,13],[-4,22],[4,13],[15+sway,18],[15,-17]],enemy?'#343242':'#183d49',enemy?'#78657a':'#7ca3a3');
  shape(g,[[-14,-20],[-22+sway,16],[-11,9],[-4,-16]],enemy?'#625062':'#48777a');
  shape(g,[[-4,-18],[-6,17],[4,10],[15+sway,18],[14,-17]],enemy?'#24263b':'#102b40');
  shape(g,[[-12,-10],[-12,1],[12,2],[13,-8]],'#24393e','#93aaa0');
  g.fillStyle='#c8b780';g.fillRect(-2,-4,5,4);
  shape(g,[[-12,-22],[-9,-34],[0,-40],[11,-34],[16,-21],[9,-12],[-6,-14]],enemy?'#25263b':'#294957',color+'aa');
  shape(g,[[-9,-27],[0,-34],[10,-27],[7,-18],[-6,-18]],'#071523');
  g.strokeStyle=color;g.lineWidth=2;g.beginPath();g.moveTo(-5,-24);g.lineTo(5,-24);g.stroke();
  shape(g,[[-12,-20],[-4,-14],[7,-14],[13,-20],[8,-8],[-7,-10]],enemy?'#74657e':'#8cb0a3');
  shape(g,[[9,-13],[22,-4],[25,6],[16,8],[10,-3]],enemy?'#474359':'#496b71',color+'88');
  g.save();g.translate(10,-2);g.rotate(angle);g.strokeStyle='#c5cbb2';g.lineWidth=3;g.beginPath();g.moveTo(0,0);g.lineTo(18,0);g.stroke();
  if(weapon==='bow'){
   g.strokeStyle=color;g.lineWidth=2.5;g.beginPath();g.arc(5,0,28,-1.2,1.2);g.stroke();g.lineWidth=.7;g.beginPath();g.moveTo(15,-26);g.lineTo(15,26);g.stroke();
  }else{
   shape(g,[[17,-3],[46,-10],[40,-2],[19,3]],'#c8e4d3',color);g.strokeStyle='#e9ffe9';g.lineWidth=1;g.beginPath();g.moveTo(20,-2);g.lineTo(45,-9);g.stroke();
  }g.restore();
  if(!enemy){g.strokeStyle='#e3d29a';g.lineWidth=1.5;g.beginPath();g.moveTo(-15,-3);g.lineTo(-18,9);g.stroke();light(g,-18,9,15,'#e8c17a44');oval(g,-18,9,3,4,'#ffe3a2');}
  g.restore();
 }
 function drawHunterSprite(g,x,y,angle,color,scale,time,moving,weapon,motion){
  if(motion.attackPoseTime>0)angle=motion.attackPoseAngle;
  const index=direction(angle),pose=poses[index],factor=94/pose[6],rig=rigs[index],mesh=meshFor(index),a=motionPose(time,moving,angle,weapon,motion);
  g.save();g.translate(x,y);g.scale(scale,scale);
  oval(g,0,13,22,8,'#020b18a3');light(g,0,-18,53,'#9fddd51a');
  g.save();g.translate(0,12-a.bob);g.rotate(a.lean+(a.dash?Math.cos(a.heading)*.1:0));g.scale(factor,factor);g.translate(-pose[4],-pose[5]);
  g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
  const vertices=mesh.points.map(v=>deform(v.p,v.w,rig,a));
  for(const face of mesh.faces)texturedTriangle(g,mesh,pose,face.src,face.ids.map(i=>vertices[i]));
  if(mesh.upper){
   const walk=Math.sin(a.phase+Math.PI)*.065*a.weight*(a.active||a.charge?0:1);
   g.save();g.translate(...rig.shoulder);g.rotate(a.upper+walk);g.translate(-rig.shoulder[0],-rig.shoulder[1]);g.drawImage(mesh.upper,0,0);
   g.translate(...rig.elbow);g.rotate(a.fore);g.translate(-rig.elbow[0],-rig.elbow[1]);g.drawImage(mesh.fore,0,0);g.restore();
  }
  if(weapon==='bow'){
   // A drawn string and arrow follow the animated grip of the folding bowblade.
   const hand=armPoint(rig.hand,rig.shoulder,rig.elbow,a.upper,a.fore,1);
   g.save();g.translate(...hand);g.rotate(angle-a.lean);g.strokeStyle='#d7ecd6';g.lineWidth=3;
   const pull=12+a.charge*28+(a.active?Math.sin(a.progress*Math.PI)*10:0);
   g.beginPath();g.moveTo(47,-50);g.lineTo(8-pull,0);g.lineTo(47,50);g.stroke();
   g.strokeStyle='#ead7a1';g.beginPath();g.moveTo(8-pull,0);g.lineTo(82-pull,0);g.lineTo(72-pull,-5);g.moveTo(82-pull,0);g.lineTo(72-pull,5);g.stroke();g.restore();
  }
  g.restore();
  if(motion.charging>.15){
   light(g,Math.cos(angle)*22,-20+Math.sin(angle)*14,26,'#e4d69b55');
   g.strokeStyle='#f0dca1';g.lineWidth=1;g.beginPath();g.arc(0,-18,33,-Math.PI/2,-Math.PI/2+Math.min(1,motion.charging/.5)*tau);g.stroke();
  }
  g.restore();
 }
 function wolf(g,e,player,time){
  const s=e.boss?2.6:e.elite?1.4:1,fur=e.boss?'#62637e':'#668d89',accent=e.boss?'#e0b9ff':'#c9f3de';
  g.save();g.translate(e.x,e.y);if(player.x<e.x)g.scale(-1,1);g.scale(s,s);
  const stride=e.dash>0?5:Math.sin(time*9+e.x)*2;
  oval(g,0,17,35,9,'#020e1bb0');if(e.boss)light(g,5,-9,58,'#a27fda28');
  shape(g,[[-22,-2],[-15,20+stride],[-8,21+stride],[-9,1],[12,-2],[15,21-stride],[23,20-stride],[22,-3]],'#213947','#7f9f9d');
  shape(g,[[-23,1],[-46,-25],[-34,-15],[-26,-17],[-18,-4]],fur,'#a1b9b1');
  shape(g,[[-28,-4],[-18,-21],[-2,-24],[13,-31],[25,-19],[35,-12],[37,-5],[25,4],[8,2],[-7,10],[-20,5]],e.hit>0?'#c3d9cd':fur,accent+'88');
  shape(g,[[-26,-5],[-15,-18],[2,-21],[14,-28],[10,-11],[-5,4]],e.boss?'#85809b':'#87a89a');
  shape(g,[[11,-26],[12,-43],[21,-31],[26,-43],[29,-19]],fur,accent+'aa');
  shape(g,[[16,-29],[16,-37],[20,-30]],'#273443');
  shape(g,[[22,-19],[35,-12],[38,-5],[26,0],[20,-8]],'#283d4d',accent+'55');
  g.strokeStyle=accent;g.lineWidth=2;g.beginPath();g.moveTo(22,-19);g.lineTo(29,-16);g.stroke();
  light(g,26,-18,12,e.boss?'#cc9cff66':'#a6ffda44');
  if(e.boss){for(const [x,y] of [[-16,-20],[-5,-24],[5,-27]])shape(g,[[x-3,y+3],[x-2,y-20],[x+6,y-29],[x+5,y+4]],'#aaa0c0','#e7d2ff77');}
  g.restore();
 }
 function tree(g,p,time,player,enemies=[]){
  const {x,y,size:s}=p,kind=p.tone>.47?0:1,behind=a=>Math.abs(a.x-x)<s+(a.r||15)&&a.y<y+20&&a.y>y-s*2.5;
  const fade=behind(player)||enemies.some(e=>!e.dead&&(e.aggro||e.exposed||e.telegraph>0||e.dash>0||e.hp<e.maxHp)&&behind(e));
  g.save();g.translate(x,y);if(fade)g.globalAlpha=.27;
  oval(g,16,13,s*.85,s*.29,'#020f1c65');
  shape(g,[[-9,8],[-4,-s*1.5],[4,-s*1.5],[11,8],[3,14]],'#384d40','#93a77c44');
  g.strokeStyle='#a7b18144';g.lineWidth=2;g.beginPath();g.moveTo(-3,0);g.lineTo(-1,-s*.9);g.stroke();
  const breeze=Math.sin(time*.8+x*.02)*1.3;
  if(!kind){
   for(let i=0;i<4;i++){
    const yy=-s*(.35+i*.37),w=s*(.94-i*.16),tip=yy-s*.9;
    shape(g,[[-w,yy+13],[-w*.55,yy-s*.25],[-w*.5,yy-s*.1],[breeze,tip],[w*.43,yy-s*.25],[w*.5,yy-s*.1],[w,yy+13],[w*.4,yy+9],[4,yy+16],[-w*.5,yy+8]],['#22473d','#2e5b48','#427259','#5b8664'][i],'#90b58b3b');
    shape(g,[[breeze,tip],[-w*.6,yy],[-w*.15,yy-6]],'#bbd2a51e');
    g.strokeStyle='#b0c79844';g.lineWidth=1;g.beginPath();g.moveTo(-w*.6,yy+2);g.lineTo(-w*.2,yy-4);g.stroke();
   }
  }else{
   const clusters=[[-.48,-.8,.58], [.44,-.92,.62],[-.13,-1.4,.64],[.14,-1.85,.5]];
   for(const [dx,dy,r] of clusters){
    const gradient=g.createLinearGradient(0,s*(dy-r),0,s*(dy+r));gradient.addColorStop(0,'#688e69');gradient.addColorStop(.48,'#456f54');gradient.addColorStop(1,'#22463e');
    oval(g,dx*s+breeze,dy*s,r*s,r*s*.71,gradient);
    g.strokeStyle='#a9c28c25';g.lineWidth=1;g.stroke();
    for(let j=0;j<5;j++)oval(g,(dx+Math.sin(j*2.3)*r*.6)*s+breeze,(dy+Math.cos(j*2.3)*r*.35)*s,6+j,2.2,'#a7c18a20');
   }
  }
  for(let j=0;j<3;j++){const xx=(j-1)*s*.4;oval(g,xx,8+j%2*3,7,2.5,'#9fbb8055');}
  g.restore();
 }
 function atmosphere(g,camera,time,region){
  const {x,y,w,h}=camera;g.save();g.globalCompositeOperation='screen';
  const beam=g.createLinearGradient(x+w*.8,y,x+w*.2,y+h);beam.addColorStop(0,'#e8eedb0c');beam.addColorStop(.5,'#b4dec10b');beam.addColorStop(1,'#a8cfce00');
  shape(g,[[x+w*.57,y],[x+w*.71,y],[x+w*.28,y+h],[x-w*.1,y+h]],beam);
  shape(g,[[x+w*.9,y],[x+w*.94,y],[x+w*.65,y+h],[x+w*.55,y+h]],beam);g.globalCompositeOperation='source-over';
  const color=region==='ash'?'#e7ad79':region==='lair'?'#c5b2ed':'#b6edd0';
  for(let i=0;i<27;i++){
   const px=x+((i*139.7+Math.sin(time*.16+i)*29)%w+w)%w,py=y+((i*81.9-time*(region==='ash'?12:3))%h+h)%h;
   const alpha=.2+(.5+.5*Math.sin(time*1.2+i*1.7))*.5;
   g.globalAlpha=alpha;oval(g,px,py,i%4===0?1.7:1,i%4===0?1.7:1,color);
  }
  g.restore();
 }
 function ground(g,world){
  let seed=819;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<1100;i++){
   const x=rand()*world.width,y=rand()*world.height;if(x>1180&&x<1420||world.onPath(x,y,78))continue;
   const region=world.regionAt(x,y).id;
   if(region==='forest'||region==='marsh'){
    const color=region==='marsh'?'#89d9d27a':'#e7d6a374';
    if(i%4===0){g.strokeStyle='#8cac7460';g.lineWidth=1;g.beginPath();g.moveTo(x,y);g.lineTo(x+1,y-7);g.stroke();for(let j=0;j<4;j++){const a=j*tau/4;oval(g,x+1+Math.cos(a)*2,y-7+Math.sin(a)*2,1.9,1.4,color);}}
    else if(i%7===0){oval(g,x,y,9,3,'#10292866');oval(g,x,y-3,5,3,'#779a8766');g.fillStyle='#a8c5a4';g.fillRect(x,y-4,1,1);}
   }else if(region==='ruins'&&i%3===0){g.strokeStyle='#bdccd32c';g.lineWidth=1;g.beginPath();g.moveTo(x,y);g.lineTo(x+14,y+4);g.lineTo(x+20,y-2);g.stroke();}
  }
 }
 if(hunterAtlas)hunterAtlas.onload=()=>{
  let index=0;const schedule=fn=>typeof window.requestIdleCallback==='function'?window.requestIdleCallback(fn,{timeout:1000}):window.setTimeout?.(fn,20);
  const warm=()=>{meshFor(index++);if(index<poses.length)schedule(warm);};schedule(warm);
 };
 return {hunter,wolf,tree,atmosphere,ground,direction,createMotion,advanceMotion,beginAttack,motionPose,
  spriteStatus:()=>({ready:!!(hunterAtlas?.complete&&hunterAtlas?.naturalWidth),frames:poses.length,animation:'joint-weighted',triangles:meshes.map(m=>m?.triangles.length||0)})};
})();
