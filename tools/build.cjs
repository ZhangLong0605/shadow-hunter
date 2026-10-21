'use strict';
/* Generate a portable offline HTML artifact from the editable project. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
const output=process.argv[2]?path.resolve(process.argv[2]):path.join(root,'release');
fs.mkdirSync(output,{recursive:true});
let html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
html=html.replace(/<link rel="stylesheet" href="([^"]+)">/g,(_,name)=>{
 let css=fs.readFileSync(path.join(dist,name),'utf8');
 css=css.replace(/url\(['"]?(assets\/[^'"\)]+)['"]?\)/g,(_,asset)=>{
  const bytes=fs.readFileSync(path.join(dist,asset)),mime=asset.endsWith('.png')?'image/png':'image/jpeg';return `url("data:${mime};base64,${bytes.toString('base64')}")`;
 });
 return `<style>/* ${name} */\n${css}\n</style>`;
});
html=html.replace(/<script src="([^"]+)"><\/script>/g,(_,name)=>{
 let source=fs.readFileSync(path.join(dist,name),'utf8');
 source=source.replace(/(['"])(assets\/[^'"\n]+\.(?:png|webp))\1/g,(_,quote,asset)=>JSON.stringify('data:image/'+(asset.endsWith('.webp')?'webp':'png')+';base64,'+fs.readFileSync(path.join(dist,asset)).toString('base64')));
 return `<script>/* ${name} */\n${source.replace(/<\/script/gi,'<\\/script')}\n</script>`;
});
if(/<(?:script|link)[^>]+(?:src|href)="[^"#]+\.(?:js|css)"/.test(html))throw Error('An external code reference remains in the build');
const target=path.join(output,'影子猎手-直接玩.html');
fs.writeFileSync(target,html,'utf8');
fs.copyFileSync(path.join(root,'游玩说明.md'),path.join(output,'游玩说明.md'));
fs.copyFileSync(path.join(root,'制作与资源说明.md'),path.join(output,'制作与资源说明.md'));
console.log(`Offline build: ${target} (${(Buffer.byteLength(html)/1024/1024).toFixed(2)} MiB)`);
