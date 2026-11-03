/* Cached scenery detail and bounded lighting passes. All coordinates are world
   space; these routines never change collision, combat state or gameplay RNG. */
'use strict';
window.HUNTER_SCENE=(()=>{
 const TAU=Math.PI*2;
 const palettes={forest:{light:'#b4e5db',mist:'#739faa',spark:'#c8edb4',soil:'#9bbd91'},forge:{light:'#f8b06b',mist:'#845963',spark:'#ffc27b',soil:'#d6a582'},tide:{light:'#91e9eb',mist:'#7ab3c3',spark:'#b9ffff',soil:'#a2c8bd'},ruins:{light:'#f4dc9a',mist:'#a4997e',spark:'#ffe9b6',soil:'#cebf94'},eclipse:{light:'#bda4f6',mist:'#7b71a6',spark:'#e1c4ff',soil:'#9f9bc1'}};
 Object.assign(palettes,{cloud:{light:'#fff4ce',mist:'#fff8ed',spark:'#fffdf5',soil:'#b5d79c'},meadow:{light:'#e9fadb',mist:'#cbf0bb',spark:'#fffdf5',soil:'#9adca2'},lagoon:{light:'#e4f7ff',mist:'#bde9fb',spark:'#fffdf5',soil:'#8ed2f0'},honey:{light:'#fff6df',mist:'#ffe9b8',spark:'#fffdf5',soil:'#f7c96f'},mirror:{light:'#f8f1ff',mist:'#e9d8fb',spark:'#fffdf5',soil:'#cbaaee'},throne:{light:'#fff2f7',mist:'#ffdfea',spark:'#fffdf5',soil:'#f8b3cd'}});
 const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
 const visible=(p,c,pad=200)=>p.x>c.x-pad&&p.y>c.y-pad&&p.x<c.x+c.w+pad&&p.y<c.y+c.h+pad;
 function oval(g,x,y,rx,ry,color){g.fillStyle=color;g.beginPath();g.ellipse(x,y,rx,ry,0,0,TAU);g.fill();}
 function glow(g,x,y,r,color){const fill=g.createRadialGradient(x,y,0,x,y,r);fill.addColorStop(0,color);fill.addColorStop(1,'transparent');g.fillStyle=fill;g.fillRect(x-r,y-r,r*2,r*2);}
 function shape(g,points,color,stroke){g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=color;g.fill();if(stroke){g.strokeStyle=stroke;g.stroke();}}
 let mist=null;
 function mistTexture(){
  if(mist)return mist;if(typeof document==='undefined')return null;
  mist=document.createElement('canvas');mist.width=384;mist.height=192;const g=mist.getContext('2d');
  for(let i=0;i<15;i++)glow(g,60+hash(i+7)*264,75+hash(i+42)*40,28+hash(i)*28,'#b9d3dd14');
  return mist;
 }
 function bake(g,world,scenery,id='forest'){
  if(id==='cloud')return;
  const p=palettes[id]||palettes.forest;g.save();
  // Broad mineral / moss patches break up flat fills. Keep the river, paths and
  // solid walls legible; cache this work once per map entry, never every frame.
  for(let i=0;i<1600;i++){
   const x=hash(i*3+2)*world.width,y=hash(i*3+3)*world.height;
   if(world.bridges.length&&x>1190&&x<1420||world.onPath(x,y,58)||world.walls.some(w=>x>w.x&&x<w.x+w.w&&y>w.y&&y<w.y+w.h))continue;
   const r=7+hash(i+9)*27;
   oval(g,x,y,r,r*.44,i%3?'#04131c08':p.soil+'08');
   if(i%4===0){g.strokeStyle=p.soil+'25';g.lineWidth=.8;g.beginPath();g.moveTo(x-r*.5,y);g.lineTo(x-4,y-2);g.lineTo(x+4,y-6);g.stroke();}
   if(i%7===0){const size=3+hash(i+100)*6;oval(g,x+2,y+3,size+2,size*.5,'#020c1444');shape(g,[[x-size,y],[x-size*.4,y-size*.7],[x+size*.7,y-size*.5],[x+size,y+2]],p.soil+'38',p.soil+'22');}
  }
  for(const prop of scenery.props){
   const s=prop.size;g.save();g.translate(prop.x,prop.y);g.rotate(-.7);
   const shade=g.createLinearGradient(0,0,0,s*1.8);shade.addColorStop(0,'#020b1e50');shade.addColorStop(1,'#020b1e00');
   shape(g,[[-s*.35,0],[s*.4,0],[s*.9,s*1.8],[-s*.3,s*2.1]],shade);g.restore();
   oval(g,prop.x,prop.y+7,s*.62,s*.2,'#03101a30');
  }
  // Small leaf clusters, flowers and grass tufts have lit tips and dark roots.
  if(id==='forest'||id==='tide')for(let i=0;i<900;i++){
   const x=hash(i+4100)*world.width,y=hash(i+5100)*world.height;
   if(world.bridges.length&&x>1180&&x<1425||world.onPath(x,y,70))continue;
   for(let j=0;j<3;j++){const a=hash(i+j*49)*TAU,r=5+j*2;g.strokeStyle=j===0?'#b7d5a352':'#518d7a4d';g.lineWidth=1;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+Math.cos(a)*r*.7,y-5,x+Math.cos(a)*r,y-5-r);g.stroke();}
   if(i%11===0){glow(g,x,y-9,12,p.spark+'16');oval(g,x,y-9,2,1.8,p.spark+'b0');}
  }
  for(const rock of scenery.rocks)oval(g,rock.x+8,rock.y+10,rock.r*1.15,rock.r*.48,'#020c203b');
  g.restore();
 }
 function rock(g,p,id='forest'){
  if(id==='cloud'){oval(g,p.x,p.y,p.r,p.r*.65,'#b6cea1');oval(g,p.x-4,p.y-5,p.r*.75,p.r*.42,'#e6f1ce');return;}
  const color=palettes[id]?.soil||'#9bbd91',r=p.r;g.save();g.translate(p.x,p.y);
  shape(g,[[-r,0],[-r*.6,-r*.65],[r*.25,-r*.8],[r*.85,-r*.3],[r,3],[r*.35,r*.4],[-r*.6,r*.35]],'#34494e','#71888366');
  shape(g,[[-r,0],[-r*.6,-r*.65],[r*.25,-r*.8],[0,-r*.1]],color+'50');
  shape(g,[[0,-r*.1],[r*.25,-r*.8],[r*.85,-r*.3],[r,3],[r*.35,r*.4]],'#172d394f');
  g.strokeStyle='#b1c9ba66';g.lineWidth=1;g.beginPath();g.moveTo(-r*.6,-r*.65);g.lineTo(r*.25,-r*.8);g.lineTo(r*.85,-r*.3);g.stroke();g.restore();
 }
 function floor(g,v){
  if(v.id==='cloud')return;
  const {world,camera:c,player,id,rich}=v,p=palettes[id]||palettes.forest,t=rich?v.time:0;
  g.save();g.globalCompositeOperation='screen';
  // Directional, soft edged pools make the player silhouette read against the ground.
  glow(g,player.x-55,player.y-60,280,p.light+'0b');
  for(const site of world.sites)if(visible(site,c,260))glow(g,site.x,site.y,site.kind==='camp'?210:140,(site.kind==='camp'?'#ffbd69':site.color)+(site.kind==='camp'?'20':'0b'));
  for(const terrain of world.terrain){
   if(!visible(terrain,c,terrain.rx))continue;
   if(terrain.kind==='embers'){
    const pulse=rich?.8+Math.sin(t*1.4)*.15:.8;g.globalAlpha=pulse;
    glow(g,terrain.x,terrain.y,Math.max(terrain.rx,terrain.ry),'#fb78351e');
    for(let i=0;i<(rich?16:5);i++){const a=hash(i+13)*TAU,r=Math.sqrt(hash(i+24))*.8,x=terrain.x+Math.cos(a)*r*terrain.rx,y=terrain.y+Math.sin(a)*r*terrain.ry;
     g.strokeStyle='#fba66966';g.lineWidth=1.5;g.beginPath();g.moveTo(x-9,y+5);g.lineTo(x,y);g.lineTo(x+4,y-8);g.stroke();}
   }else{
    g.strokeStyle=p.light+'32';g.lineWidth=1;for(let i=0;i<4;i++){const cycle=(t*.13+i*.25)%1;g.globalAlpha=Math.sin(cycle*Math.PI)*.5;g.beginPath();g.ellipse(terrain.x+(i-1.5)*terrain.rx*.3,terrain.y+Math.sin(i*2)*terrain.ry*.4,12+cycle*45,5+cycle*15,0,0,TAU);g.stroke();}
   }
  }
  // Actual river only; all crossings remain clearly visible.
  if(world.bridges.length&&c.x+c.w>1220&&c.x<1390){
   g.lineWidth=1;g.strokeStyle='#99dce650';g.globalAlpha=.5;
   for(let y=Math.floor(c.y/75)*75;y<c.y+c.h;y+=75){if(world.bridges.some(b=>Math.abs(y-b)<130))continue;const shift=Math.sin(t*.65+y*.03)*15;g.beginPath();g.ellipse(1300+shift,y,45,5,0,0,Math.PI*.9);g.stroke();}
  }
  g.restore();
 }
 function atmosphere(g,v){
  if(v.id==='cloud'){
   if(!v.rich)return;
   const p=palettes[v.world.regionAt(v.player.x,v.player.y).id]||palettes.cloud;
   for(let i=0;i<24;i++){const x=v.camera.x+hash(i+21)*v.camera.w,y=v.camera.y+(hash(i+48)*v.camera.h+v.time*5)%v.camera.h;oval(g,x,y,2+i%3,2+i%3,p.spark+'88');}return;
  }
  const {camera:c,id,player,rich,world}=v,p=palettes[id]||palettes.forest,t=rich?v.time:0;g.save();
  // Local light shafts have a bright inner sliver and a soft outer spread.
  g.globalCompositeOperation='screen';
  for(let i=0;i<3;i++){
   const anchor=Math.floor((c.x-200)/850)*850+i*850+320,top=c.y-200,sway=rich?Math.sin(t*.1+i)*22:0;
   const beam=g.createLinearGradient(anchor,top,anchor-480,c.y+c.h);beam.addColorStop(0,p.light+'00');beam.addColorStop(.22,p.light+'06');beam.addColorStop(.7,p.light+'04');beam.addColorStop(1,p.light+'00');
   shape(g,[[anchor+sway,top],[anchor+100+sway,top],[anchor-350,c.y+c.h],[anchor-620,c.y+c.h]],beam);
   shape(g,[[anchor+24+sway,top],[anchor+40+sway,top],[anchor-452,c.y+c.h],[anchor-495,c.y+c.h]],beam);
  }
  if(rich){
   const tile=420,x0=Math.floor(c.x/tile),y0=Math.floor(c.y/tile),x1=Math.ceil((c.x+c.w)/tile),y1=Math.ceil((c.y+c.h)/tile),density=Math.max(1,Math.min(7,Math.floor(100/((x1-x0+1)*(y1-y0+1)))));
   for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++)for(let i=0;i<density;i++){
    const seed=tx*157+ty*331+i*17,x=tx*tile+hash(seed)*tile+Math.sin(t*.3+seed)*15,y=ty*tile+((hash(seed+1)*tile-t*(id==='forge'?22:5))%tile+tile)%tile;
    if(!visible({x,y},c,10))continue;
    const radius=1+hash(seed+8)*1.6;g.globalAlpha=.3+Math.sin(t*.9+seed)**2*.5;
    if(i<2)glow(g,x,y,12,p.spark+'42');oval(g,x,y,radius,id==='forge'?radius*1.9:radius,p.spark);
   }
  }
  g.globalAlpha=1;g.globalCompositeOperation='source-over';
  const fog=rich?mistTexture():null;
  if(fog){
   g.globalAlpha=id==='tide'?.27:id==='eclipse'?.22:.13;
   for(let i=0;i<3;i++){const span=c.w+650,x=c.x-450+((i*560+t*(i+1)*3)%span),y=c.y+c.h*(.2+i*.32)+Math.sin(t*.14+i)*22;g.drawImage(fog,x,y,780,300);}
  }
  g.globalAlpha=1;
  const camp=world.sites[0];if(visible(camp,c,220)){
   // Existing camp landmark remains the anchor; a small fire sits beside it.
   const x=camp.x+55,y=camp.y;oval(g,x,y+5,23,8,'#030e17a0');
   for(let i=0;i<7;i++){const a=i*TAU/7;oval(g,x+Math.cos(a)*20,y+Math.sin(a)*7,4,3,'#727b71');}
   g.globalCompositeOperation='screen';glow(g,x,y-15,90,'#ffa45328');
   for(let i=0;i<4;i++){const h=17+i*7+(rich?Math.sin(t*5+i*2)*4:0),sx=x+(i-1.5)*5;g.fillStyle=['#e86839','#ff9950','#ffd383','#fff0bc'][i];g.beginPath();g.moveTo(sx-8,y);g.quadraticCurveTo(sx-12,y-14,sx+Math.sin(t*3+i)*4,y-h);g.quadraticCurveTo(sx+12,y-13,sx+6,y);g.fill();}
   if(rich)for(let i=0;i<7;i++){const lift=(t*25+i*14)%90;g.globalAlpha=1-lift/90;oval(g,x+Math.sin(t+i)*12,y-lift,1,2,'#ffe1a5');}
  }
  g.restore();
 }
 function aura(g,player,time,rich){
  if(!(player.shield>0||player.charging>.15))return;g.save();g.globalCompositeOperation='screen';
  const x=player.x,y=player.y-24;
  if(player.shield>0){
   const fill=g.createRadialGradient(x-12,y-20,7,x,y,55);fill.addColorStop(0,'#aee9ff00');fill.addColorStop(.7,'#aee9ff08');fill.addColorStop(1,'#b9eaff50');g.fillStyle=fill;g.beginPath();g.ellipse(x,y,48,61,0,0,TAU);g.fill();
   g.strokeStyle='#c3f3ff90';g.lineWidth=1.2;g.stroke();
   for(let i=0;i<6;i++){const a=i*TAU/6+(rich?time*.3:0),sx=x+Math.cos(a)*36,sy=y+Math.sin(a)*42;g.beginPath();for(let j=0;j<6;j++){const b=j*TAU/6;j?g.lineTo(sx+Math.cos(b)*7,sy+Math.sin(b)*7):g.moveTo(sx+Math.cos(b)*7,sy+Math.sin(b)*7);}g.closePath();g.strokeStyle='#c0eaff55';g.stroke();}
  }
  if(player.charging>.15){const charge=Math.min(1,player.charging/.5);glow(g,x+Math.cos(player.angle)*33,y+Math.sin(player.angle)*22,20+charge*18,'#f2d99d55');}
  g.restore();
 }
 function projectile(g,p,rich){
  if(p.life<=0)return;const a=Math.atan2(p.vy,p.vx),len=Math.min(75,Math.hypot(p.vx,p.vy)*.085);g.save();g.translate(p.x,p.y);g.rotate(a);g.globalCompositeOperation='screen';
  if(rich){const trail=g.createLinearGradient(-len,0,5,0);trail.addColorStop(0,p.color+'00');trail.addColorStop(.65,p.color+'60');trail.addColorStop(1,p.color+'dd');shape(g,[[-len,-1],[0,-4],[9,0],[0,4],[-len,1]],trail);glow(g,0,0,p.enemy?17:22,p.color+'45');}
  g.strokeStyle=p.enemy?'#ffd8cb':'#eeffeb';g.lineWidth=1.6;g.beginPath();g.moveTo(-len*.6,0);g.lineTo(7,0);g.stroke();g.restore();
 }
 return {bake,floor,atmosphere,rock,aura,projectile};
})();
