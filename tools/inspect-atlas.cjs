'use strict';
// Read a non-interlaced RGBA PNG to verify the generated atlas and foot pivots.
const fs=require('node:fs'),zlib=require('node:zlib');
function inspect(filename){
 const file=fs.readFileSync(filename),width=file.readUInt32BE(16),height=file.readUInt32BE(20);
 if(file[24]!==8||file[25]!==6||file[28]!==0)throw Error('Expected a non-interlaced 8-bit RGBA PNG');
 const parts=[];for(let p=8;p<file.length;){const n=file.readUInt32BE(p),type=file.toString('ascii',p+4,p+8);if(type==='IDAT')parts.push(file.subarray(p+8,p+8+n));p+=n+12;}
 const packed=zlib.inflateSync(Buffer.concat(parts)),stride=width*4,pixels=Buffer.alloc(stride*height);
 const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
 for(let y=0;y<height;y++){const filter=packed[y*(stride+1)];for(let x=0;x<stride;x++){const a=x>=4?pixels[y*stride+x-4]:0,b=y?pixels[(y-1)*stride+x]:0,c=y&&x>=4?pixels[(y-1)*stride+x-4]:0,v=packed[y*(stride+1)+1+x];pixels[y*stride+x]=(v+([0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter]??0))&255;}}
 const frames=[];let transparent=0;for(let p=3;p<pixels.length;p+=4)if(pixels[p]===0)transparent++;
 for(let i=0;i<8;i++){
  const x0=Math.round(i%4*width/4),x1=Math.round((i%4+1)*width/4),y0=Math.round(Math.floor(i/4)*height/2),y1=Math.round((Math.floor(i/4)+1)*height/2);
  let left=x1,right=x0,top=y1,bottom=y0,count=0;
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(pixels[(y*width+x)*4+3]>64){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);count++;}
  let sum=0,weight=0;for(let y=Math.max(top,bottom-60);y<=bottom;y++)for(let x=left;x<=right;x++){const a=pixels[(y*width+x)*4+3];if(a>128){sum+=x;weight++;}}
  frames.push({x:x0,y:y0,w:x1-x0,h:y1-y0,pivotX:Math.round(sum/(weight||1)-x0),pivotY:bottom-y0,bodyHeight:bottom-top+1,pixels:count});
 }
 return {width,height,transparentRatio:transparent/(width*height),frames};
}
module.exports={inspect};
if(require.main===module)console.log(JSON.stringify(inspect(process.argv[2]),null,2));
