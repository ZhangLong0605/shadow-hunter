'use strict';
/* Copy the user's two authored collections without changing their artwork. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),source=path.resolve(root,'../NewDesign');
const target=path.join(root,'dist/assets/monsters');
fs.mkdirSync(target,{recursive:true});
const manifest=JSON.parse(fs.readFileSync(path.join(source,'manifest.json'),'utf8'));
const variants={'variant-cinder-priest':'cinder','variant-marsh-stalker':'stalker','variant-ruin-sentinel':'sentinel'};
const bosses={'boss-hungry-moon-wolf':['forest','wolf'],'boss-molten-colossus':['forge','giant'],'boss-deep-tide-wraith':['tide','ghost'],'boss-sand-crowned-warden':['ruins','shield'],'boss-dusk-shadow-king':['eclipse','mirror']};
const entries=manifest.filter(m=>/^(mob-|variant-|boss-)/.test(m.id)).map(m=>{
 const boss=bosses[m.id],variant=variants[m.id];
 for(const [folder,prefix] of [['',''],['R2-超Q版','k-']])fs.copyFileSync(path.join(source,folder,m.group,prefix+m.id+'.png'),path.join(target,prefix+m.id+'.png'));
 return {id:m.id,name:m.cn,role:m.role,color:m.accent,type:boss?boss[1]:variant?{cinder:'fire',stalker:'ghost',sentinel:'shield'}[variant]:m.id.slice(4),...(variant?{variant}:{}),...(boss?{world:boss[0]}:{}),standard:'assets/monsters/'+m.id+'.png',soft:'assets/monsters/k-'+m.id+'.png'};
});
fs.writeFileSync(path.join(root,'dist/monster-data.js'),'/* Authored NewDesign artwork; regenerate with node tools/import-monster-art.cjs. */\nwindow.HUNTER_MONSTER_CATALOG = '+JSON.stringify(entries,null,2)+';\n');
console.log(`Imported ${entries.length} enemies × 2 styles from NewDesign.`);
