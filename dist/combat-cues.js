/* Essential combat information. Render after decorative feedback, in the same
   world/camera transform. Geometry is supplied by gameplay; this is read-only. */
'use strict';
window.HUNTER_COMBAT=(()=>{
 const TAU=Math.PI*2,palette=Object.freeze({danger:'#ff785e',unavoidable:'#d69bff',friendly:'#ffe3a1',target:'#f3cf81'}),ink='#07151f';
 const pixel=scale=>1/Math.max(.15,scale||1);
 function line(g,path,color,width=2.3,u=1){
  g.beginPath();path();g.strokeStyle=ink;g.lineWidth=(width+3)*u;g.stroke();g.strokeStyle=color;g.lineWidth=width*u;g.stroke();
 }
 function arrow(g,x,y,a,color,u=1,size=10){
  g.save();g.translate(x,y);g.rotate(a);line(g,()=>{g.moveTo(-size*u,-size*.6*u);g.lineTo(0,0);g.lineTo(-size*u,size*.6*u);},color,2.3,u);g.restore();
 }
 function cross(g,x,y,color,u){line(g,()=>{g.moveTo(x-4*u,y-4*u);g.lineTo(x+4*u,y+4*u);g.moveTo(x+4*u,y-4*u);g.lineTo(x-4*u,y+4*u);},color,1.6,u);}
 function hazard(g,h,{outline=false,scale=1}={}){
  if(h.life<=0||outline&&h.friendly)return;
  const color=h.friendly?palette.friendly:h.purple?palette.unavoidable:palette.danger,u=pixel(scale);g.save();
  g.beginPath();g.arc(h.x,h.y,h.r,0,TAU);
  if(!outline){g.fillStyle=color+(h.friendly?'08':'14');g.fill();g.strokeStyle=color+'80';g.lineWidth=1.4;if(h.friendly)g.setLineDash([4,9]);g.stroke();}
  else{
   g.strokeStyle=ink;g.lineWidth=5.4*u;g.stroke();g.strokeStyle=color;g.lineWidth=2.4*u;g.stroke();
   // Inward ticks / crosses distinguish an active area from a winding-up cue.
   for(let i=0;i<8;i++){const a=i*TAU/8,r=Math.max(0,h.r-9*u),x=h.x+Math.cos(a)*r,y=h.y+Math.sin(a)*r;
    if(h.purple)cross(g,x,y,color,u);
    else line(g,()=>{g.moveTo(x,y);g.lineTo(h.x+Math.cos(a)*Math.max(0,h.r-17*u),h.y+Math.sin(a)*Math.max(0,h.r-17*u));},color,1.5,u);
   }
  }g.restore();
 }
 function cue(g,c,u){
  const color=c.color||palette.danger;g.save();g.lineJoin='round';g.lineCap='round';
  if(c.kind==='circle'){
   line(g,()=>g.arc(c.x,c.y,c.radius,0,TAU),color,2.3,u);
   line(g,()=>g.arc(c.x,c.y,Math.max(0,c.radius-6*u),-Math.PI/2,-Math.PI/2+TAU*c.progress),color,3,u);
   if(color===palette.unavoidable)for(let i=0;i<4;i++){const a=Math.PI/4+i*TAU/4,r=Math.max(0,c.radius-17*u);cross(g,c.x+Math.cos(a)*r,c.y+Math.sin(a)*r,color,u);}
   else line(g,()=>{g.moveTo(c.x-5*u,c.y);g.lineTo(c.x+5*u,c.y);g.moveTo(c.x,c.y-5*u);g.lineTo(c.x,c.y+5*u);},color,1.4,u);
  }else if(c.kind==='charge'){
   g.translate(c.x,c.y);g.rotate(c.angle);
   // Rounded ends describe the swept contact capsule, including its start.
   const r=c.halfWidth,len=c.length;
   line(g,()=>{g.moveTo(0,-r);g.lineTo(len,-r);g.arc(len,0,r,-Math.PI/2,Math.PI/2);g.lineTo(0,r);g.arc(0,0,r,Math.PI/2,Math.PI*1.5);g.closePath();},color,2.3,u);
   for(const t of [.35,.7,1])arrow(g,len*t,0,0,color,u,10);
   line(g,()=>{g.moveTo(0,-r);g.lineTo(len*c.progress,-r);},'#ffe5d7',2.5,u);
  }else if(c.kind==='shot'){
   for(let i=0;i<c.count;i++){
    const a=c.angle+(i-(c.count-1)/2)*.19;g.save();g.translate(c.x,c.y);g.rotate(a);
    // Solid thin rays are aim directions, not a filled damage cone.
    line(g,()=>{g.moveTo(22,0);g.lineTo(c.length,0);},color,1.2,u);
    arrow(g,c.length*.4,0,0,color,u,8);arrow(g,c.length,0,0,color,u,9);g.restore();
   }
  }else if(c.kind==='objective'){
   const target=c.enemy.target;line(g,()=>{g.moveTo(c.x,c.y);g.lineTo(target.x,target.y);},color,1.6,u);arrow(g,target.x,target.y,c.angle,color,u);
  }g.restore();
 }
 function actor(g,e,u){
  const color=e.exposed?'#c9ffe8':palette.danger,r=e.r+7*u,y=e.y+7;
  // Brackets identify a body, never imply a circular damage radius.
  line(g,()=>{for(const side of [-1,1]){const x=e.x+side*r;g.moveTo(x-side*6*u,y-22*u);g.lineTo(x,y-22*u);g.lineTo(x,y);g.lineTo(x-side*6*u,y);}},color,e.telegraph>0||e.dash>0?1.8:1.1,u);
 }
 function projectile(g,p,u){
  if(!p.enemy||p.life<=0)return;g.save();g.translate(p.x,p.y);g.rotate(Math.atan2(p.vy,p.vx));
  // Hostile ammunition has an orange-red, dark-backed pointed head even when
  // particles are disabled. Keep its visual core near the actual r=6 hitbox.
  line(g,()=>{g.moveTo(-11,0);g.lineTo(0,0);},palette.danger,2,u);
  g.beginPath();g.moveTo(7,0);g.lineTo(-5,-5);g.lineTo(-2,0);g.lineTo(-5,5);g.closePath();g.strokeStyle=ink;g.lineWidth=3*u;g.stroke();g.fillStyle=palette.danger;g.fill();g.restore();
 }
 function label(g,entry,u,occupied){
  g.font=`600 ${11*u}px "Microsoft YaHei",sans-serif`;g.textAlign='center';g.textBaseline='middle';
  const width=Math.max(60*u,(g.measureText(entry.label)?.width||entry.label.length*11*u)+16*u),height=21*u;
  const x=entry.x;let y=entry.y;
  for(let i=0;i<8&&occupied.some(b=>Math.abs(x-b.x)<(width+b.w)/2+4*u&&Math.abs(y-b.y)<(height+b.h)/2+3*u);i++)y-=height+4*u;
  occupied.push({x,y,w:width,h:height});g.fillStyle='#07151ff0';g.fillRect(x-width/2,y-height/2,width,height);
  g.fillStyle=entry.color;g.fillRect(x-width/2,y-height/2,2*u,height);g.fillText(entry.label,x,y);
 }
 function render(g,v){
  const u=pixel(v.scale),cues=v.cues||[],enemies=v.enemies||[],hazards=v.hazards||[],projectiles=v.projectiles||[],labels=[];
  g.save();g.globalCompositeOperation='source-over';g.globalAlpha=1;g.setLineDash([]);
  for(const h of hazards){hazard(g,h,{outline:true,scale:v.scale});if(h.life>0&&!h.friendly)labels.push({x:h.x,y:h.y-h.r-17*u,color:h.purple?palette.unavoidable:palette.danger,label:h.purple?'× 梦蚀 · 必须走出':h.poison?'! 毒雾 · 持续伤害':'! 灼烧 · 持续伤害'});}
  for(const c of cues){if(c.enemy.dead||c.enemy.exposed||c.enemy.telegraph<=0&&c.enemy.dash<=0)continue;cue(g,c,u);labels.push({x:c.x,y:c.y-(c.radius?c.radius+17*u:c.enemy.r+86+16*u),color:c.color,label:c.label,progress:c.progress});}
  for(const e of enemies)if(!e.dead&&(e.exposed||e.aggro||e.telegraph>0||e.dash>0||e.hp<e.maxHp))actor(g,e,u);
  for(const p of projectiles)projectile(g,p,u);
  // Keep a crowded encounter readable: six nearby text instructions at most;
  // every danger boundary and direction still renders independently of text.
  // Reserve health / pressure bars as well as earlier labels.
  const occupied=(v.healthBars||enemies.filter(e=>!e.dead).map(e=>({x:e.x,y:e.y-e.r-27,w:e.boss?84:52,h:14}))).map(box=>({...box}));labels.sort((a,b)=>Math.hypot(a.x-v.player.x,a.y-v.player.y)-Math.hypot(b.x-v.player.x,b.y-v.player.y));
  for(const entry of labels.slice(0,6))label(g,entry,u,occupied);g.restore();
 }
 return {palette,render,hazard};
})();
