/* Four learnable skills; enemy families retain their own appearance and combat. */
window.HUNTER_GUIDE={
 skills:{
  wolf:{name:'突进',tag:'近身突击',summary:'向前冲刺，斩穿敌人',use:'追上远敌，也能冲出包围。',detail:'向鼠标方向突进 240 距离，沿途造成 58 伤害、48 影压伤害，短暂无敌。',source:'狼 / 幽灵'},
  fire:{name:'火焰',tag:'范围清怪',summary:'喷出烈焰，持续灼烧',use:'面向聚集的敌人释放。',detail:'扇形火焰造成 64 伤害、36 影压伤害；燃烧持续 4 秒，每秒 9 伤害。',source:'火焰怪 / 蜂群'},
  shield:{name:'护盾',tag:'防守反击',summary:'挡下一击，震击近敌',use:'敌人即将打中时释放。',detail:'震波造成 42 伤害、44 影压伤害。3 秒内格挡一次攻击，并反击周围敌人，造成 40 伤害、35 影压伤害。',source:'盾兵 / 巨人'},
  archer:{name:'影箭',tag:'远程穿透',summary:'三箭齐射，穿透敌群',use:'拉开距离，对准一排敌人。',detail:'向鼠标方向射出 3 支穿透箭，每支造成 48 伤害，可命中沿途多个敌人。',source:'弓手 / 镜魔'}
 },
 skillFor:{wolf:'wolf',ghost:'wolf',fire:'fire',swarm:'fire',shield:'shield',giant:'shield',archer:'archer',mirror:'archer'},
 lessons:[
  {title:'走近弓手',note:'安全练习，不会受伤。'},
  {title:'攻击到目标变白',note:'左键攻击；长按再松开可蓄力。'},
  {title:'现在夺影',note:'靠近目标，按住 E 约 1 秒。'},
  {title:'装备影箭',note:'每次只装备一种技能，随时用 Tab 更换。'},
  {title:'试试新技能',note:'Q 射出三支穿透箭；左键仍是普通攻击。'},
  {title:'学会了！',note:'夺影学技能 → Tab 选一个 → Q 释放。'}
 ]
};
