/* Purely visual feedback. No damage, timers, rewards or save data live here. */
'use strict';
window.HUNTER_FEEDBACK=(()=>{
 const tau=Math.PI*2,events=[];
 const durations={attack:.34,cast:.95,dash:.55,capture:1.7,equip:1.05,heal:1.25,boon:1.5,hit:.38};
 let time=0;
 function emit(kind,options={}){if(!Object.hasOwn(durations,kind))return;events.push({kind,...options,age:0,duration:durations[kind]});if(events.length>18)events.shift();}
 function glow(g,x,y,r,color){const gradient=g.createRadialGradient(x,y,0,x,y,r);gradient.addColorStop(0,color);gradient.addColorStop(1,'transparent');g.fillStyle=gradient;g.fillRect(x-r,y-r,r*2,r*2);}
 function ring(g,x,y,r,color,alpha=1){g.globalAlpha=alpha;g.strokeStyle=color;g.lineWidth=1.6;g.beginPath();g.ellipse(x,y,r,r*.65,0,0,tau);g.stroke();}
 function diamond(g,x,y,size,color){g.fillStyle=color;g.beginPath();g.moveTo(x,y-size);g.lineTo(x+size*.6,y);g.lineTo(x,y+size);g.lineTo(x-size*.6,y);g.closePath();g.fill();}
 function render(canvas,view){
  const dt=Math.min(.05,Math.max(0,view.dt||0));time+=dt;
  for(const e of events)e.age+=dt;for(let i=events.length-1;i>=0;i--)if(events[i].age>events[i].duration)events.splice(i,1);
  if(!canvas?.getContext)return;const g=canvas.getContext('2d'),w=canvas.clientWidth||1200,h=canvas.clientHeight||780,dpr=Math.min(view.dpr||1,1.5);
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
   const p=e.age/e.duration,fade=Math.sin(Math.PI*Math.min(1,p)),origin=e.anchor==='hud'?{x:w*.79,y:h*.85}:project(e),color=e.color||'#bbf7db';
   g.save();g.globalAlpha=fade;
   if(e.kind==='capture'){
    const reach=Math.min(1,p*1.6),x=origin.x+(hero.x-origin.x)*reach,y=origin.y+(hero.y-origin.y)*reach-45*Math.sin(reach*Math.PI);
    glow(g,x,y-15,55*(1-p*.5),color+'77');
    for(let j=0;j<(rich?28:5);j++){const a=j*2.399+time*2,r=(1-reach)*65*(.35+j%5*.13);diamond(g,x+Math.cos(a)*r,y-15+Math.sin(a)*r*.6,2+(1-p)*2,color);}
    ring(g,hero.x,hero.y,30+p*90,color,fade*.8);
    if(p>.45){const t=(p-.45)/.55,x=hero.x+(w*.8-hero.x)*t,y=hero.y+(h*.86-hero.y)*t-70*Math.sin(Math.PI*t);glow(g,x,y,22,color+'88');diamond(g,x,y,6,color);}
   }else if(e.kind==='cast'){
    const colors=e.colors||[color,'#e9c18b','#bca0e9'];
    for(let j=0;j<3;j++){const a=(e.angle||0)+j*tau/3+p*3,r=24+p*68,x=origin.x+Math.cos(a)*r,y=origin.y-20+Math.sin(a)*r*.58;glow(g,x,y,25,colors[j]+'66');diamond(g,x,y,5*(1-p),colors[j]);}
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
 return {emit,render,clear:()=>{events.length=0;},snapshot:()=>events.map(e=>({kind:e.kind,age:e.age,duration:e.duration}))};
})();
