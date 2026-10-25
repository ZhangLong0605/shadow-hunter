/* Purely visual feedback. No damage, timers, rewards or save data live here. */
'use strict';
window.HUNTER_FEEDBACK=(()=>{
 const tau=Math.PI*2,events=[];
 const durations={attack:.34,cast:.8,dash:.45,capture:1.7,equip:1.05,heal:1.25,boon:1.5,hit:.38,impact:.3,break:.65,vanish:.85};
 let time=0;
 function emit(kind,options={}){
  if(!Object.hasOwn(durations,kind))return;
  if(kind==='impact'&&events.some(e=>e.kind==='impact'&&e.age<.07&&Math.hypot(e.x-options.x,e.y-options.y)<25))return;
  if(kind==='impact'&&events.filter(e=>e.kind===kind).length>=6)return;
  if(events.length>=18){const minor=events.findIndex(e=>e.kind==='impact');events.splice(minor<0?0:minor,1);}
  events.push({kind,...options,age:0,duration:durations[kind]});
 }
 function glow(g,x,y,r,color){const gradient=g.createRadialGradient(x,y,0,x,y,r);gradient.addColorStop(0,color);gradient.addColorStop(1,'transparent');g.fillStyle=gradient;g.fillRect(x-r,y-r,r*2,r*2);}
 function ring(g,x,y,r,color,alpha=1){g.globalAlpha=alpha;g.strokeStyle=color;g.lineWidth=1.6;g.beginPath();g.ellipse(x,y,r,r*.65,0,0,tau);g.stroke();}
 function diamond(g,x,y,size,color){g.fillStyle=color;g.beginPath();g.moveTo(x,y-size);g.lineTo(x+size*.6,y);g.lineTo(x,y+size);g.lineTo(x-size*.6,y);g.closePath();g.fill();}
 function streak(g,x,y,a,length,color,width=1){g.strokeStyle=color;g.lineWidth=width;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*length,y+Math.sin(a)*length);g.stroke();}
 function combat(g,e,p,origin,rich,scale,scaleY=scale){
  const color=e.color||'#bbf7db',fade=(1-p)**1.3,ease=1-(1-p)**3;
  g.save();g.translate(origin.x,origin.y);g.scale(scale,scaleY);g.globalAlpha=fade;g.lineCap='round';
  if(e.kind==='attack'){
   g.rotate(e.angle||0);const radius=e.charged?145:108,head=-1.1+ease*2.3;
   for(let i=0;i<(rich?3:1);i++){
    const r=radius-i*13;g.globalAlpha=fade*(1-i*.25);g.strokeStyle=i===0?'#efffe7':color;g.lineWidth=i===0?3:e.charged?12:8;
    g.beginPath();g.arc(0,-10,r,head-1.6,head);g.stroke();
   }
   if(rich){glow(g,Math.cos(head)*radius,-10+Math.sin(head)*radius,24,color+'65');for(let i=0;i<5;i++){const a=head-.2-i*.23;streak(g,Math.cos(a)*radius,Math.sin(a)*radius-10,a-.8,9+ease*12,color);}}
  }else if(e.kind==='impact'||e.kind==='break'||e.kind==='vanish'){
   const broken=e.kind==='break',dead=e.kind==='vanish',radius=dead?(e.boss?175:75):broken?100:45;
   if(rich)glow(g,0,-16,dead?70:broken?65:30,color+(dead?'38':'65'));
   if(broken||dead)ring(g,0,1,15+ease*radius,color,fade*.7);
   const count=rich?(e.boss?32:broken?20:dead?18:12):5;
   for(let j=0;j<count;j++){
    const a=j*2.399+(e.angle||0),speed=.4+(j%5)*.15,r=8+ease*radius*speed,x=Math.cos(a)*r,y=-16+Math.sin(a)*r*(dead?.65:1);
    g.globalAlpha=fade*(.6+j%3*.2);
    if(dead){g.save();g.translate(x,y-p*30);g.rotate(a+p*2);diamond(g,0,0,(3+j%4)*(1-p),color);g.restore();}
    else streak(g,x,y,a,(broken?17:11)*(1-p),j%3?color:'#f3ffe8',j%4===0?2.5:1.2);
   }
   if(!dead){g.globalAlpha=Math.max(0,1-p*3);streak(g,-18,-16,0,36,'#fff8d8',2);streak(g,0,-34,Math.PI/2,36,'#fff8d8',2);}
  }else if(e.kind==='cast'&&e.skill){
   if(e.skill==='fire'){
    g.rotate(e.angle||0);const radius=45+ease*175;
    glow(g,30,0,50,'#ffe3a124');
    const count=rich?12:5;for(let j=0;j<count;j++){
     const a=-.94+j/(count-1)*1.88,r=radius*(.5+(j%5)*.1),x=Math.cos(a)*r,y=Math.sin(a)*r;
     g.save();g.translate(x,y);g.rotate(a+Math.sin(j*2.7+p*8)*.2);g.globalAlpha=fade*.6;
     const size=14+j%4*5,flame=g.createLinearGradient(-size,0,size*2.1,0);
     flame.addColorStop(0,'#ffe8a900');flame.addColorStop(.25,'#fff5cfaf');flame.addColorStop(.52,'#ffda8888');flame.addColorStop(.8,'#eebc5244');flame.addColorStop(1,'#eebc5200');
     g.fillStyle=flame;g.beginPath();g.moveTo(-size,0);g.bezierCurveTo(-size*.5,-size*.9,size*.6,-size*.8,size*2.1,-size*.35);g.bezierCurveTo(size*.8,-size*.1,size*.3,size*.8,-size,0);g.fill();
     g.strokeStyle='#fff3c1';g.lineWidth=1.3;g.beginPath();g.moveTo(-size*.5,0);g.quadraticCurveTo(size*.6,-size*.35,size*1.7,-size*.25);g.stroke();g.restore();
    }
    if(rich)for(let j=0;j<12;j++){const a=Math.sin(j*2.399)*1.02,r=(50+ease*180)*(.55+j%6*.075);g.globalAlpha=fade*.65;streak(g,Math.cos(a)*r,Math.sin(a)*r,a,3+j%4*2,j%3?'#ffe3a1':'#fff5cd',1.2);}
   }else if(e.skill==='wolf'){
    const dx=(e.tx??e.x)-e.x,dy=(e.ty??e.y)-e.y,len=Math.hypot(dx,dy);g.rotate(Math.atan2(dy,dx));
    const trail=g.createLinearGradient(0,0,Math.max(1,len),0);trail.addColorStop(0,'#96f7d000');trail.addColorStop(.45,'#a2f3df55');trail.addColorStop(1,'#e4ffe6bb');
    g.fillStyle=trail;g.beginPath();g.moveTo(0,-7);g.lineTo(len,-22*(1-p));g.lineTo(len+15,0);g.lineTo(len,22*(1-p));g.lineTo(0,7);g.fill();
    for(let j=-1;j<=1;j++)streak(g,len*.2,j*10,0,len*.8,'#dafff1',j===0?3:1);
    ring(g,len,0,15+ease*60,color,fade*.7);
   }else if(e.skill==='shield'){
    // Open blue arcs cannot be confused with a solid hostile damage boundary.
    for(let j=0;j<(rich?3:1);j++){g.globalAlpha=fade*(.65-j*.15);g.strokeStyle='#b7e8ff';g.lineWidth=1.6;const r=22+ease*(145-j*18);for(let k=0;k<4;k++){g.beginPath();g.ellipse(0,0,r,r*.65,0,k*tau/4+.16,(k+1)*tau/4-.16);g.stroke();}}
    if(rich)for(let j=0;j<12;j++){const a=j*tau/12;g.save();g.translate(Math.cos(a)*(35+ease*110),Math.sin(a)*(35+ease*110)*.65);g.rotate(a);diamond(g,0,0,5*(1-p),'#d7f4ff');g.restore();}
   }else if(e.skill==='archer'){
    g.rotate(e.angle||0);for(let j=-1;j<=1;j++){g.save();g.rotate(j*.15);streak(g,15,0,0,25+ease*75,'#edf9c8',2);g.strokeStyle='#c3e3a2';g.lineWidth=1;g.beginPath();g.moveTo(70+ease*30,-9);g.lineTo(85+ease*30,0);g.lineTo(70+ease*30,9);g.stroke();g.restore();}
    if(rich)glow(g,18,0,40,'#d8edab50');
   }
  }
  g.restore();
 }
 function render(canvas,view){
  const dt=Math.min(.05,Math.max(0,view.dt||0));time+=dt;
  for(const e of events)e.age+=dt;for(let i=events.length-1;i>=0;i--)if(events[i].age>events[i].duration)events.splice(i,1);
  if(!canvas?.getContext)return;const g=canvas.getContext('2d'),w=canvas.clientWidth||1200,h=canvas.clientHeight||780,dpr=Math.min(view.dpr||1,view.rich===false?1.5:2);
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
  g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,w,h);
  if(view.phase==='intro'){events.length=0;return;}
  const project=p=>{const point=view.screenPoint(p);return {x:point.x*w,y:point.y*h};};
  const hero=project(view.player),rich=view.rich!==false;
  g.save();g.globalCompositeOperation='screen';
  if(view.capture>0&&view.target&&view.phase==='playing'){
   const target=project(view.target),progress=Math.min(1,view.capture/(view.instant?.04:view.target.boss?1.65:1.05));
   for(let strand=0;strand<(rich?3:1);strand++){
    const wave=Math.sin(time*8+strand*2)*24;g.strokeStyle=['#c9ffeb','#c2a0ef','#ead299'][strand];g.globalAlpha=.45;g.lineWidth=1.2;
    g.beginPath();g.moveTo(target.x,target.y-10);g.bezierCurveTo(target.x+wave,target.y-55,hero.x-wave,hero.y-55,hero.x,hero.y-25);g.stroke();
    for(let j=0;j<5;j++){const p=(time*1.5+j*.2+strand*.12)%1,x=target.x+(hero.x-target.x)*p+Math.sin(p*Math.PI)*wave,y=target.y+(hero.y-target.y)*p-20-Math.sin(p*Math.PI)*30;diamond(g,x,y,2.5,'#d8fff1');}
   }
   g.globalAlpha=1;g.strokeStyle='#d6ffee';g.lineWidth=3;g.beginPath();g.arc(target.x,target.y-10,34,-Math.PI/2,-Math.PI/2+tau*progress);g.stroke();
  }
  for(const e of events){
   const p=e.age/e.duration,fade=Math.sin(Math.PI*Math.min(1,p)),origin=e.anchor==='hud'?{x:w*.79,y:h*.85}:Number.isFinite(e.x)&&Number.isFinite(e.y)?project(e):hero,color=e.color||'#bbf7db';
   g.save();g.globalAlpha=fade;
   if(['attack','impact','break','vanish'].includes(e.kind)||e.kind==='cast'&&e.skill){combat(g,e,p,origin,rich,view.scale||1,view.scaleY||view.scale||1);}
   else if(e.kind==='capture'){
    const reach=Math.min(1,p*1.6),x=origin.x+(hero.x-origin.x)*reach,y=origin.y+(hero.y-origin.y)*reach-45*Math.sin(reach*Math.PI);
    glow(g,x,y-15,55*(1-p*.5),color+'77');
    for(let j=0;j<(rich?28:5);j++){const a=j*2.399+time*2,r=(1-reach)*65*(.35+j%5*.13);diamond(g,x+Math.cos(a)*r,y-15+Math.sin(a)*r*.6,2+(1-p)*2,color);}
    ring(g,hero.x,hero.y,30+p*90,color,fade*.8);
    if(p>.45){const t=(p-.45)/.55,x=hero.x+(w*.8-hero.x)*t,y=hero.y+(h*.86-hero.y)*t-70*Math.sin(Math.PI*t);glow(g,x,y,22,color+'88');diamond(g,x,y,6,color);}
   }else if(e.kind==='cast'){
    const colors=e.colors?.length?e.colors:[color];
    for(let j=0;j<colors.length;j++){const a=(e.angle||0)+j*tau/colors.length+p*3,r=24+p*68,x=origin.x+Math.cos(a)*r,y=origin.y-20+Math.sin(a)*r*.58;glow(g,x,y,25,colors[j]+'66');diamond(g,x,y,5*(1-p),colors[j]);}
    ring(g,origin.x,origin.y,22+p*95,color,fade*.8);
    if(rich)for(let j=0;j<12;j++){const a=j*tau/12,r=30+p*110;diamond(g,origin.x+Math.cos(a)*r,origin.y+Math.sin(a)*r*.62,2*(1-p),color);}
   }else if(e.kind==='attack'){
    g.translate(origin.x,origin.y-17);g.rotate(e.angle||0);g.strokeStyle=color;g.lineWidth=2+fade*3;
    for(let j=0;j<(rich?3:1);j++){g.globalAlpha=fade*(1-j*.25);g.beginPath();g.arc(0,0,42+j*11,-.9+p*.7,.35+p*.9);g.stroke();}
   }else if(e.kind==='dash'){
    for(let j=0;j<(rich?7:3);j++){const r=(j+1)*8+p*40,a=(e.angle||0)+Math.PI;g.strokeStyle=color;g.lineWidth=2;g.beginPath();g.moveTo(origin.x+Math.cos(a)*r,origin.y+Math.sin(a)*r);g.lineTo(origin.x+Math.cos(a)*(r+16),origin.y+Math.sin(a)*(r+16));g.stroke();}
   }else if(e.kind==='heal'){
    ring(g,origin.x,origin.y,20+p*75,'#b6edb5',fade);glow(g,origin.x,origin.y-20,45,'#a9edb655');
    for(let j=0;j<(rich?10:3);j++){const a=j*2.4,r=20+j%4*7;diamond(g,origin.x+Math.cos(a)*r,origin.y-15-p*70+j%3*10,2.5,'#d7f3b6');}
   }else if(e.kind==='equip'||e.kind==='boon'){
    const x=e.kind==='boon'?w*.5:origin.x,y=e.kind==='boon'?h*.4:origin.y;
    ring(g,x,y,15+p*95,color,fade);glow(g,x,y,65,color+'33');
    for(let j=0;j<(rich?20:5);j++){const a=j*2.399,r=20+p*(40+j%7*10);diamond(g,x+Math.cos(a)*r,y+Math.sin(a)*r*.7,2+fade*2,color);}
   }else if(e.kind==='hit'){
    g.globalCompositeOperation='source-over';const gradient=g.createRadialGradient(w*.5,h*.5,w*.25,w*.5,h*.5,w*.65);gradient.addColorStop(0,'#b9533a00');gradient.addColorStop(1,'#d4756050');g.fillStyle=gradient;g.globalAlpha=fade*.6;g.fillRect(0,0,w,h);
   }
   g.restore();
  }
  g.restore();
 }
 return {emit,render:maskedRender,clear:()=>{events.length=0;},snapshot:()=>events.map(e=>({kind:e.kind,age:e.age,duration:e.duration}))};
 function maskedRender(canvas,view){
  render(canvas,view);if(view.phase==='intro'||!canvas?.getContext||!view.occluders?.length)return;
  // Clear decorative highlights around bodies before the essential cue pass.
  const g=canvas.getContext('2d'),w=canvas.clientWidth||1200,h=canvas.clientHeight||780;
  g.save();g.globalCompositeOperation='destination-out';g.globalAlpha=1;
  for(const actor of view.occluders){
   const p=view.screenPoint(actor),sx=view.scale||1,sy=view.scaleY||sx;g.save();g.translate(p.x*w,p.y*h+(actor.offsetY||0)*sy);g.scale(actor.rx*sx,actor.ry*sy);
   const mask=g.createRadialGradient(0,0,0,0,0,1);mask.addColorStop(0,'#000000f5');mask.addColorStop(.65,'#000000e6');mask.addColorStop(1,'#00000000');g.fillStyle=mask;g.fillRect(-1,-1,2,2);g.restore();
  }g.restore();
 }
})();
