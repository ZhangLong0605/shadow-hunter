/* Eight-direction hunter atlas with procedural motion; enemies, foliage and light remain local Canvas artwork. */
'use strict';
window.HUNTER_ART=(()=>{
 const tau=Math.PI*2;
 const hunterAtlas=typeof window.Image==='function'?new window.Image():null;
 if(hunterAtlas)hunterAtlas.src='assets/hunter-directions.png';
 // Each pose pivots around its boots, rather than the centre of its flowing cape.
 const poses=[
  [0,0,444,444,273,443,425],[444,0,443,444,229,443,425],
  [887,0,444,444,231,438,421],[1331,0,443,444,177,443,426],
  [0,444,444,443,245,411,412],[444,444,443,443,277,413,414],
  [887,444,444,443,219,401,398],[1331,444,443,443,237,411,412]
 ];
 function direction(angle){return Math.round(((angle%tau)+tau)%tau/(tau/8))%8;}
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
  const pose=poses[direction(angle)],factor=94/pose[6],stride=moving?Math.sin(time*13):0;
  g.save();g.translate(x,y);g.scale(scale,scale);
  oval(g,0,13,22,8,'#020b18a3');light(g,0,-18,53,'#9fddd51a');
  g.save();g.translate(0,12-Math.abs(stride)*1.7-Math.sin(time*2.1)*.5);
  g.rotate(stride*.012);g.transform(1,0,Math.sin(time*(moving?7:2))*.009,1,0,0);
  g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
  g.shadowColor=color+'88';g.shadowBlur=2.2;g.filter='brightness(1.3)';
  g.drawImage(hunterAtlas,pose[0],pose[1],pose[2],pose[3],-pose[4]*factor,-pose[5]*factor,pose[2]*factor,pose[3]*factor);
  g.restore();
  if(motion.charging>.15){
   light(g,Math.cos(angle)*22,-20+Math.sin(angle)*14,26,'#e4d69b55');
   g.strokeStyle='#f0dca1';g.lineWidth=1;g.beginPath();g.arc(0,-18,33,-Math.PI/2,-Math.PI/2+Math.min(1,motion.charging/.5)*tau);g.stroke();
  }
  if(motion.slash>0&&weapon==='blade'){
   g.save();g.translate(0,-17);g.rotate(angle+(motion.slash/.3-.5)*1.2);
   const gradient=g.createLinearGradient(10,0,70,0);gradient.addColorStop(0,'#cbd9dc22');gradient.addColorStop(1,'#e8ffe6dd');
   shape(g,[[12,-3],[69,-12],[56,1],[14,4]],gradient,'#dfffe8aa');g.restore();
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
 function tree(g,p,time,player){
  const {x,y,size:s}=p,kind=p.tone>.47?0:1,fade=Math.abs(player.x-x)<s&&player.y<y+20&&player.y>y-s*2.5;
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
 return {hunter,wolf,tree,atmosphere,ground,direction,spriteStatus:()=>({ready:!!(hunterAtlas?.complete&&hunterAtlas?.naturalWidth),frames:poses.length})};
})();
