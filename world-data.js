/* Hand-authored routes and deterministic scenery; no network assets or dependencies. */
window.HUNTER_WORLD = (() => {
 const width=3600,height=2400;
 const regions=[
  {id:'forest',name:'月光林地',x:0,y:0,w:1420,h:2400,color:'#253e36',light:'#526b48',ink:'#b5d49d',hint:'狼群与游猎弓手 · 沿石路寻找北方印记'},
  {id:'ash',name:'灰烬荒林',x:1420,y:0,w:1120,h:1180,color:'#352c29',light:'#67503b',ink:'#e1b17c',hint:'灰烬祭司会锁定落火位置 · 离开橙色圆圈'},
  {id:'marsh',name:'沉雾沼泽',x:1420,y:1180,w:1120,h:1220,color:'#183737',light:'#366363',ink:'#99d6c5',hint:'浅沼减速 · 留意潜伏者留下的毒雾'},
  {id:'ruins',name:'断月遗迹',x:2540,y:730,w:1060,h:1670,color:'#333b45',light:'#606b73',ink:'#b9c9e2',hint:'遗迹卫士正面减伤 · 从侧后方进攻'},
  {id:'lair',name:'月狼领地',x:2540,y:0,w:1060,h:730,color:'#2a273e',light:'#534860',ink:'#d6bcea',hint:'完成三处印记后，才能唤醒饥饿月狼'}
 ];
 const sites=[
  {id:'camp',name:'守夜营地',x:520,y:2010,kind:'camp',symbol:'✧',color:'#cce0a1',hint:'保存本局进度；休整恢复生命、净化梦蚀，完成任务补充休整次数'},
  {id:'chase',name:'破镜小径',x:680,y:530,kind:'chase',symbol:'◇',color:'#d6c294',hint:'追猎镜魔 · 45 秒内击破并收割或夺影'},
  {id:'defend',name:'余烬庭院',x:2020,y:520,kind:'defend',symbol:'✦',color:'#eac082',hint:'守护梦灯 · 抵御四波敌人，坚持 36 秒'},
  {id:'capture',name:'缚影祭坛',x:3020,y:1690,kind:'capture',symbol:'◈',color:'#acdee0',hint:'指定夺影 · 击破幽灵精英，长按 E 捕获'},
  {id:'boss',name:'月狼之巢',x:3070,y:370,kind:'boss',symbol:'☾',color:'#d3a7eb',hint:'三处印记齐全后，在这里挑战月狼'}
 ];
 const bridges=[670,1650];
 const walls=[
  {x:1220,y:0,w:170,h:550,kind:'river'}, {x:1220,y:790,w:170,h:740,kind:'river'}, {x:1220,y:1770,w:170,h:630,kind:'river'},
  {x:2700,y:1000,w:330,h:38,kind:'wall'}, {x:3260,y:1000,w:200,h:38,kind:'wall'},
  {x:2700,y:1000,w:38,h:230,kind:'wall'}, {x:3430,y:1000,w:38,h:410,kind:'wall'},
  {x:2640,y:1950,w:240,h:40,kind:'wall'}, {x:3100,y:2110,w:330,h:40,kind:'wall'}
 ];
 const terrain=[
  {x:1770,y:1510,rx:210,ry:130,kind:'mud'}, {x:2070,y:2000,rx:260,ry:150,kind:'mud'}, {x:2380,y:1450,rx:150,ry:175,kind:'mud'},
  {x:1620,y:880,rx:100,ry:65,kind:'embers'}, {x:2360,y:880,rx:140,ry:80,kind:'embers'}, {x:2180,y:150,rx:100,ry:50,kind:'embers'}
 ];
 const paths=[[[520,2300],[520,2010],[700,1650],[680,1150],[680,530],[650,130]],[[680,670],[1300,670],[1650,670],[2020,520],[2450,650],[3070,370]],[[700,1650],[1300,1650],[1570,1730],[2140,1730],[2600,1690],[3020,1690],[3300,1870]],[[2020,520],[2120,1050],[2140,1730]],[[3020,1690],[3150,1150],[3070,370]]];
 const packs=[
  {x:760,y:1020,types:['wolf','wolf']},{x:980,y:960,types:['archer','wolf']},{x:350,y:1000,types:['shield','wolf']},
  {x:1000,y:260,types:['archer','mirror']},{x:1060,y:2300,types:['wolf','swarm']},
  {x:1640,y:1020,types:['cinder','fire']},{x:2350,y:1080,types:['fire','giant']},{x:2420,y:240,types:['cinder','archer']},
  {x:1730,y:1540,types:['stalker','swarm']},{x:2150,y:2070,types:['stalker','ghost']},{x:2420,y:1380,types:['swarm','stalker']},
  {x:2830,y:1180,types:['sentinel','archer']},{x:3300,y:2040,types:['sentinel','giant']},{x:3310,y:1300,types:['mirror','shield']},
  {x:2700,y:720,types:['ghost','wolf']}
 ];
 const variants={
  cinder:{name:'灰烬祭司',shadow:'fire',color:'#edaa6e',tip:'锁定地面后落火，看到橙圈就移动'},
  stalker:{name:'沼泽潜伏者',shadow:'ghost',color:'#8ed2b1',tip:'近身才现形，毒雾会减速并伤害'},
  sentinel:{name:'遗迹卫士',shadow:'shield',color:'#b6ccdf',tip:'正面护甲减伤，绕到侧后方攻击'}
 };
 function regionAt(x,y){return regions.slice().reverse().find(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h)||regions[0];}
 function terrainAt(x,y){return terrain.find(t=>((x-t.x)/t.rx)**2+((y-t.y)/t.ry)**2<1);}
 function onPath(x,y,pad=90){for(const line of paths)for(let i=1;i<line.length;i++){const [ax,ay]=line[i-1],[bx,by]=line[i],vx=bx-ax,vy=by-ay,t=Math.max(0,Math.min(1,((x-ax)*vx+(y-ay)*vy)/(vx*vx+vy*vy)));if(Math.hypot(x-ax-vx*t,y-ay-vy*t)<pad)return true;}return false;}
 function create(){
  let seed=1947;const rng=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const props=[],rocks=[];
  const spawns=packs.flatMap(pack=>pack.types.map((_,i)=>({x:pack.x+(i%2)*72,y:pack.y+Math.floor(i/2)*66})));
  for(let i=0;i<760;i++){
   const x=70+rng()*(width-140),y=80+rng()*(height-160),region=regionAt(x,y);
   if(x>1150&&x<1460||onPath(x,y,105)||sites.some(s=>Math.hypot(x-s.x,y-s.y)<405)||(window.HUNTER_EXPEDITION?.discoveries||[]).some(s=>Math.hypot(x-s.x,y-s.y)<155)||walls.some(w=>x>w.x-70&&x<w.x+w.w+70&&y>w.y-70&&y<w.y+w.h+70))continue;
   const size=30+rng()*35;props.push({x,y,size,tone:rng(),kind:region.id});
   // Consume the same random value even when a rock is rejected, preserving the
   // deterministic scenery. Every pack member needs room to take its first step.
   if(i%5===0){const rock={x,y,r:19+rng()*12};if(!spawns.some(p=>Math.hypot(x-p.x,y-p.y)<rock.r+32+12))rocks.push(rock);}
  }
  return {props,rocks};
 }
 function drawGround(g){
  g.fillStyle='#253e36';g.fillRect(0,0,width,height);
  for(const r of regions){g.fillStyle=r.color;g.fillRect(r.x,r.y,r.w,r.h);const grad=g.createRadialGradient(r.x+r.w*.5,r.y+r.h*.5,20,r.x+r.w*.5,r.y+r.h*.5,Math.max(r.w,r.h)*.6);grad.addColorStop(0,r.light+'75');grad.addColorStop(1,'transparent');g.fillStyle=grad;g.fillRect(r.x,r.y,r.w,r.h);}
  let seed=740;const rng=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<5500;i++){
   const x=rng()*width,y=rng()*height;g.fillStyle=i%2?'#c5d5af0b':'#020e1424';g.beginPath();g.ellipse(x,y,5+rng()*30,2+rng()*6,0,0,Math.PI*2);g.fill();
   if(i%11===0&&!(x>1150&&x<1460)&&!onPath(x,y,66)){
    const region=regionAt(x,y),h=5+i%8;g.strokeStyle=region.id==='ash'?'#baa06d30':'#a0b98237';g.lineWidth=1.3;g.beginPath();g.moveTo(x-3,y+2);g.lineTo(x-6,y-h);g.moveTo(x,y+2);g.lineTo(x+2,y-h-3);g.moveTo(x+2,y+1);g.lineTo(x+7,y-h*.6);g.stroke();
    if(i%7===0&&(region.id==='forest'||region.id==='marsh')){g.fillStyle=region.id==='forest'?'#c7c9a469':'#a0c7ba66';g.beginPath();g.arc(x+2,y-h-3,1.7,0,Math.PI*2);g.fill();}
   }
  }
  // Stone paths connect every landmark and both river crossings.
  g.lineCap='round';g.lineJoin='round';
  for(const line of paths){
   g.beginPath();line.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.strokeStyle='#0d211a2e';g.lineWidth=124;g.stroke();g.strokeStyle='#a7ae7d25';g.lineWidth=108;g.stroke();g.strokeStyle='#bbc29717';g.lineWidth=74;g.stroke();
   for(let i=1;i<line.length;i++){
    const [ax,ay]=line[i-1],[bx,by]=line[i],dx=bx-ax,dy=by-ay,len=Math.hypot(dx,dy),angle=Math.atan2(dy,dx);
    for(let d=35,j=0;d<len;d+=69,j++){
     const offset=(j%2?1:-1)*(12+Math.sin(j*2.7+i)*8),x=ax+dx*d/len-dy/len*offset,y=ay+dy*d/len+dx/len*offset;
     g.save();g.translate(x,y);g.rotate(angle+Math.sin(j+i)*.12);g.beginPath();g.moveTo(-17,-10);g.lineTo(12,-12);g.lineTo(20,-5);g.lineTo(16,10);g.lineTo(-14,12);g.lineTo(-20,4);g.closePath();g.fillStyle=j%3?'#b6be972b':'#d0d0a52d';g.fill();g.strokeStyle='#dce0b51a';g.lineWidth=1.2;g.stroke();g.restore();
     const side=j%2?1:-1;g.fillStyle='#b4c09840';g.beginPath();g.ellipse(ax+dx*d/len-dy/len*side*51,ay+dy*d/len+dx/len*side*51,4+j%3,2.5,angle,0,Math.PI*2);g.fill();
    }
   }
  }
  // Layered banks and still ripples are baked into the ground canvas once.
  g.fillStyle='#0d242777';g.fillRect(1189,0,232,height);g.fillStyle='#648b7650';g.fillRect(1202,0,206,height);g.fillStyle='#102b37';g.fillRect(1220,0,170,height);
  const water=g.createLinearGradient(1220,0,1390,0);water.addColorStop(0,'#35646988');water.addColorStop(.28,'#193e4b44');water.addColorStop(.62,'#244a57aa');water.addColorStop(1,'#345c6177');g.fillStyle=water;g.fillRect(1220,0,170,height);
  for(let y=20;y<height;y+=39){g.strokeStyle='#98c2c32f';g.lineWidth=1.7;g.beginPath();g.moveTo(1235,y);g.bezierCurveTo(1270,y-14,1335,y+15,1373,y);g.stroke();g.strokeStyle='#b8d9cc22';g.lineWidth=1;g.beginPath();g.moveTo(1240,y+12);g.lineTo(1254,y+10);g.moveTo(1346,y-9);g.lineTo(1373,y-7);g.stroke();}
  for(const y of bridges){
   g.fillStyle='#071c1c55';g.fillRect(1192,y-114,228,246);g.fillStyle='#776d55';g.fillRect(1198,y-120,214,240);for(let x=1200;x<1410;x+=20){g.fillStyle='#211e1b4d';g.fillRect(x+1,y-115,3,230);g.fillStyle='#c2b68a30';g.fillRect(x+5,y-115,2,230);}g.strokeStyle='#b5a57a';g.lineWidth=7;g.beginPath();g.moveTo(1190,y-120);g.lineTo(1420,y-120);g.moveTo(1190,y+120);g.lineTo(1420,y+120);g.stroke();
   for(const x of [1202,1408])for(const yy of [y-119,y+119]){const light=g.createRadialGradient(x,yy,1,x,yy,42);light.addColorStop(0,'#edd18b35');light.addColorStop(1,'#edc57d00');g.fillStyle=light;g.beginPath();g.arc(x,yy,42,0,Math.PI*2);g.fill();g.fillStyle='#27342b';g.fillRect(x-5,yy-5,10,10);g.fillStyle='#d6c58a';g.beginPath();g.arc(x,yy,2.8,0,Math.PI*2);g.fill();}
  }
  for(const t of terrain){g.beginPath();g.ellipse(t.x,t.y,t.rx,t.ry,.0,0,Math.PI*2);g.fillStyle=t.kind==='mud'?'#123a3bdd':'#542d20bb';g.fill();g.strokeStyle=t.kind==='mud'?'#689d8066':'#ed9b5266';g.lineWidth=3;g.stroke();for(let j=0;j<25;j++){const a=rng()*Math.PI*2,r=Math.sqrt(rng())*.85,x=t.x+Math.cos(a)*t.rx*r,y=t.y+Math.sin(a)*t.ry*r;g.fillStyle=t.kind==='mud'?'#8ab98b55':'#ed9b52aa';g.fillRect(x,y,t.kind==='mud'?14:3,2);}}
  for(const w of walls.filter(w=>w.kind==='wall')){g.fillStyle='#10192399';g.fillRect(w.x+12,w.y+15,w.w,w.h);g.fillStyle='#54606a';g.fillRect(w.x,w.y,w.w,w.h);g.strokeStyle='#8d9a9c66';g.strokeRect(w.x,w.y,w.w,w.h);for(let x=w.x+35;x<w.x+w.w;x+=46){g.fillStyle='#1f2c3855';g.fillRect(x,w.y,2,w.h);}}
  for(const s of sites){
   if(s.kind==='camp'){const warmth=g.createRadialGradient(s.x,s.y,15,s.x,s.y,225);warmth.addColorStop(0,'#ddb66c36');warmth.addColorStop(.5,'#bf994321');warmth.addColorStop(1,'#b69d4f00');g.fillStyle=warmth;g.beginPath();g.ellipse(s.x,s.y,225,168,0,0,Math.PI*2);g.fill();}
   g.save();g.translate(s.x,s.y);g.scale(1,.7);g.strokeStyle=s.color+'4a';g.lineWidth=3;for(const radius of [95,112,140]){g.beginPath();g.arc(0,0,radius,0,Math.PI*2);g.stroke();}for(let i=0;i<12;i++){const a=i*Math.PI/6;g.fillStyle=s.color+'66';g.fillRect(Math.cos(a)*125-4,Math.sin(a)*125-4,8,8);}g.restore();
  }
  // Relic paving and the cold, broken seal in the north.
  for(let y=830;y<2320;y+=75)for(let x=2610;x<3510;x+=84){g.strokeStyle='#9cadbd13';g.strokeRect(x,y,66,55);}
 }
 return {width,height,regions,sites,bridges,walls,terrain,paths,packs,variants,regionAt,terrainAt,onPath,create,drawGround};
})();
