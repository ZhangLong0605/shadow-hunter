/* ============================================================================
 * 《甜梦云原》Q版新世界主题 —— 数据模块
 * ----------------------------------------------------------------------------
 * 结构对齐游戏里的「五境远征」：
 *   一个主题 = 若干张大地图（子地图），之间用解锁路径串成星图；
 *   每张大地图 3600×2400，内部再切成 5 个子区域，每个子区域里都有多个任务。
 *
 * 本文件是独立设计稿，不修改影子猎手现有源码。
 * 对外接口与 shadow-hunter-main/dist/world-data.js 的 HUNTER_WORLD 同构，
 * 日后接入时把 theme.map(worldId) 接到 HUNTER_CAMPAIGN.map() 即可。
 * ========================================================================== */
window.HUNTER_Q_THEME = (() => {
 'use strict';

 /* ---- 任务类型目录 ------------------------------------------------------
  * 12 种任务类型：战斗只保留"戳泡泡"一种，其余为引导 / 钓鱼 / 节奏 / 拼图 /
  * 采集 / 护送 / 赛跑 / 挖掘 / 浇花等轻度玩法。
  * ---------------------------------------------------------------------- */
 const KINDS = {
  camp:   {name:'营地',     symbol:'home',   color:'#ffb3c7', hint:'保存进度 · 休整回血 · 使用背包 · 前往已解锁子地图'},
  herd:   {name:'赶羊归圈', symbol:'sheep',  color:'#8fd99a', hint:'把 5 只团子羊引导回羊圈，全程不用打架'},
  fish:   {name:'星星钓鱼', symbol:'fish',   color:'#7fc9ef', hint:'在 3 个浮标点抛竿，咬钩时收线，钓满 6 条星鱼'},
  rhythm: {name:'节奏采摘', symbol:'note',   color:'#f7c46b', hint:'跟着风车鼓点踩亮糖花，连对 6 次'},
  puzzle: {name:'镜面拼图', symbol:'puzzle', color:'#c9a9ec', hint:'推动糖果方块，把镜面拼成一道彩虹'},
  gather: {name:'采集果子', symbol:'apple',  color:'#ffc46b', hint:'在果林里收集落下的糖果果，收集 6 颗'},
  escort: {name:'护送小鸡', symbol:'chick',  color:'#ffd97a', hint:'领着小鸡回鸡窝，别让泡泡怪把它吓跑'},
  race:   {name:'糖果赛跑', symbol:'flag',   color:'#ff9fbc', hint:'和小动物赛跑，30 秒内冲过终点旗'},
  dig:    {name:'挖掘宝藏', symbol:'dig',    color:'#d9b3f2', hint:'在 5 个土堆上挖掘，挖出藏起来的糖果'},
  water:  {name:'浇灌花圃', symbol:'flower', color:'#b6e39a', hint:'给 8 朵干渴的花浇水，花圃会重新开花'},
  bubble: {name:'戳泡泡',   symbol:'bubble', color:'#bfe9ff', hint:'戳破泡泡怪凑齐糖屑，它们爆掉后不会掉血'},
  boss:   {name:'首领',     symbol:'crown',  color:'#f7aec6', hint:'集齐三枚印记后开启，与首领完成最终试炼'}
 };

 /* ---- 两种地图骨架 ------------------------------------------------------
  * A：西侧长条 + 汽水溪纵贯（桥 y670 / y1650）
  * B：四象限 + 汽水溪横贯（桥 x700 / x2900）
  * ---------------------------------------------------------------------- */
 const SKELETON_A = {
  regions:[
   {id:'r1', x:0,    y:0,    w:1420, h:2400, label:[860,2200]},
   {id:'r2', x:1420, y:0,    w:1120, h:1180, label:[2200,260]},
   {id:'r3', x:1420, y:1180, w:1120, h:1220, label:[2250,2150]},
   {id:'r4', x:2540, y:730,  w:1060, h:1670, label:[2800,1000]},
   {id:'r5', x:2540, y:0,    w:1060, h:730,  label:[2800,230]}
  ],
  river:{vertical:true, x:1220, w:170, bridges:[670,1650]},
  paths:[
   [[520,2010],[520,1600],[505,1150],[540,700],[560,420],[600,150]],
   [[520,2010],[780,1780],[1100,1680],[1305,1650],[1620,1650],[1960,1830],[2450,1900],[2820,1870],[3090,1820]],
   [[540,700],[820,680],[1100,670],[1305,670],[1620,640],[1900,560],[2120,470]],
   [[2120,470],[2350,620],[2600,780],[2850,700],[3000,520],[3070,370]],
   [[1960,1830],[2100,1550],[2300,1320],[2560,1200],[2820,1120],[3000,720],[3070,370]],
   [[3090,1820],[3260,1550],[3300,1150],[3150,800],[3070,370]],
   [[1620,640],[1700,1000],[1750,1520],[1960,1830]],
   [[780,1780],[1000,1400],[1100,1000],[1000,600],[900,250]]
  ]
 };
 const SKELETON_B = {
  regions:[
   {id:'r1', x:0,    y:0,    w:1200, h:2400, label:[330,320]},
   {id:'r2', x:1200, y:0,    w:1200, h:1200, label:[2120,140]},
   {id:'r3', x:1200, y:1200, w:1200, h:1200, label:[1500,2120]},
   {id:'r4', x:2400, y:1200, w:1200, h:1200, label:[2700,1750]},
   {id:'r5', x:2400, y:0,    w:1200, h:1200, label:[2800,150]}
  ],
  /* 汽水溪横向穿过，只有 x700 与 x2900 两座云朵桥能过河 */
  river:{vertical:false, y:1200, h:170, bridges:[700,2900]},
  paths:[
   /* 西侧南北主路，在 x700 过北桥 */
   [[520,2010],[560,1600],[700,1200],[690,800],[600,200]],
   /* 南岸大路，全程在河以南 */
   [[520,2010],[800,1800],[1050,1700],[1400,1620],[1700,1560],[2000,1520],[2400,1480],[2750,1500],[3100,1520],[3350,1560]],
   /* 北岸大路，全程在北边 */
   [[600,200],[900,180],[1200,220],[1500,260],[1800,340],[2100,420],[2400,480],[2700,400],[3000,300],[3200,240]],
   /* 北岸内环 */
   [[1500,260],[1700,600],[1750,900],[1700,1150],[1450,1100],[1300,900],[1250,600],[1200,300]],
   [[2100,420],[2250,750],[2350,1050],[2400,1150]],
   [[2400,480],[2600,800],[2800,1000],[3000,1000],[3150,800],[3200,240]],
   /* 南岸内环 */
   [[1350,1480],[1650,1540],[2000,1600],[2300,1850],[2600,2020],[3000,2150],[3300,2050]],
   /* 西侧支路，在 x700 汇入北桥 */
   [[900,1750],[1000,1500],[820,1330],[700,1200],[620,900],[700,600],[600,300]],
   /* 东侧南北联络，在 x2900 过南桥 */
   [[2750,1500],[2900,1250],[2950,800],[3050,450],[3200,240]]
  ]
 };

 /* ---- 五个子地图（大地图）------------------------------------------------ */
 const worlds = [
  /* ---------- ① 棒棒糖镇 ---------- */
  {
   id:'candy-town', number:'01', name:'棒棒糖镇', en:'Candy Town',
   level:1, requires:[], skeleton:'A', seed:1471, decor:'meadow',
   color:'#8fd99a', accent:'#8fd99a', symbol:'home',
   subtitle:'第一盏糖灯，第一条甜路',
   feature:'汽水溪纵贯 · 棒棒糖农场',
   boss:'奶油糖王',
   desc:'沿着棒棒糖田的小路，把镇子从沉睡的糖霜里一点点叫醒。',
   palette:{base:'#cbf0bb', light:'#e9fadb', deep:'#9adca2', ink:'#41704c'},
   tints:[
    ['#cbf0bb','#e9fadb','#9adca2'],
    ['#bde9fb','#e4f7ff','#8ed2f0'],
    ['#e8e2fb','#f4f1ff','#bdb2ec'],
    ['#ffdfea','#fff2f7','#f8b3cd'],
    ['#ffeccb','#fff8e8','#f5cf8e']
   ],
   regions:[
    {id:'r1', name:'棒棒糖田',   en:'Lollipop Field', hint:'羊群在甜田里打转 · 小路绕着糖杆'},
    {id:'r2', name:'汽水小溪',   en:'Soda Creek',    hint:'浅汽水会拖慢脚步 · 溪边糖果屋会发光'},
    {id:'r3', name:'云朵牧场',   en:'Cloud Pasture', hint:'奶油霜地很滑 · 牧场的风吹起泡泡'},
    {id:'r4', name:'糖果集市',   en:'Candy Bazaar',  hint:'推糖块拼出招牌 · 小贩会请你猜谜'},
    {id:'r5', name:'钟塔屋顶',   en:'Bell Tower',    hint:'钟声能唤醒糖王 · 屋顶视野最好'}
   ],
   sites:[
    {id:'camp', name:'糖浆营地',   kind:'camp',   x:520,  y:2010},
    {id:'t1', name:'棒棒糖羊圈', kind:'herd',   x:540,  y:700},
    {id:'t2', name:'糖风车',     kind:'rhythm', x:505,  y:1150},
    {id:'t3', name:'糖球打靶',   kind:'bubble', x:780,  y:1780},
    {id:'t4', name:'花圃水车',   kind:'water',  x:1000, y:1400},
    {id:'t5', name:'溪边垂钓',   kind:'fish',   x:1900, y:560},
    {id:'t6', name:'溪边采果',   kind:'gather', x:1620, y:640},
    {id:'t7', name:'糖果屋',     kind:'escort', x:1750, y:1520},
    {id:'t8', name:'牧场谜语',   kind:'dig',    x:2100, y:1550},
    {id:'t9', name:'招牌拼图',   kind:'puzzle', x:3090, y:1820},
    {id:'t10',name:'摊位赛跑',   kind:'race',   x:2820, y:1870},
    {id:'t11',name:'糖果仓库',   kind:'gather', x:3300, y:1150},
    {id:'t12',name:'钟塔谜题',   kind:'puzzle', x:2850, y:700},
    {id:'t13',name:'屋顶泡泡',   kind:'bubble', x:3000, y:520},
    {id:'boss',name:'钟塔顶层',  kind:'boss',   x:3070, y:370}
   ],
   charms:[
    {id:'c1', name:'田里星糖', x:900,  y:250},
    {id:'c2', name:'溪边星糖', x:2350, y:620},
    {id:'c3', name:'牧场星糖', x:2300, y:1320},
    {id:'c4', name:'集市星糖', x:3260, y:1550},
    {id:'c5', name:'塔顶星糖', x:3350, y:260}
   ],
   enemies:['bubble','bunny','bee']
  },

  /* ---------- ② 汽水海岸 ---------- */
  {
   id:'soda-coast', number:'02', name:'汽水海岸', en:'Soda Coast',
   level:3, requires:['candy-town'], skeleton:'B', seed:2382, decor:'coast',
   color:'#7fc9ef', accent:'#7fc9ef', symbol:'fish',
   subtitle:'汽水涨潮，把瓶子送回岸上',
   feature:'汽水溪横贯 · 浅滩与礁石',
   boss:'咸泡龙王',
   desc:'退潮时整片浅滩露出来，潮线上的浮标是唯一能钓到星鱼的线索。',
   palette:{base:'#bde9fb', light:'#e4f7ff', deep:'#8ed2f0', ink:'#2f6d8c'},
   tints:[
    ['#ffeccb','#fff8e8','#f5cf8e'],
    ['#bde9fb','#e4f7ff','#8ed2f0'],
    ['#ffd9cf','#fff0ea','#f5a894'],
    ['#d9f0e2','#eefaf2','#9fd9bd'],
    ['#e4e6f7','#f1f3ff','#b0b6e4']
   ],
   regions:[
    {id:'r1', name:'汽水海滩',   en:'Soda Beach',   hint:'沙滩上有搁浅的瓶子 · 泡泡怪藏在沙里'},
    {id:'r2', name:'汽水灯塔',   en:'Lighthouse',   hint:'灯塔光束扫过海面 · 灯下能钓到大星鱼'},
    {id:'r3', name:'珊瑚浅滩',   en:'Coral Shallows', hint:'浅滩减速 · 珊瑚要一段段拼起来'},
    {id:'r4', name:'漂流瓶湾',   en:'Driftwood Bay', hint:'捡瓶子完成任务 · 沙滩排球随时开局'},
    {id:'r5', name:'老邮轮',     en:'Old Liner',    hint:'甲板晃得厉害 · 船长在等一封信'}
   ],
   sites:[
    {id:'camp', name:'渔棚营地',   kind:'camp',   x:520,  y:2010},
    {id:'t1', name:'潮汐浮标',   kind:'fish',   x:560,  y:1600},
    {id:'t2', name:'沙堡擂台',   kind:'bubble', x:1000, y:1500},
    {id:'t3', name:'拾瓶小径',   kind:'gather', x:800,  y:1800},
    {id:'t4', name:'灯塔垂钓',   kind:'fish',   x:1500, y:260},
    {id:'t5', name:'灯塔谜题',   kind:'puzzle', x:1800, y:340},
    {id:'t6', name:'甲板采集',   kind:'gather', x:2600, y:800},
    {id:'t7', name:'浅滩赛跑',   kind:'race',   x:1400, y:1620},
    {id:'t8', name:'搁浅鲸骨',   kind:'dig',    x:2300, y:1850},
    {id:'t9', name:'浅滩护送',   kind:'escort', x:2000, y:1520},
    {id:'t10',name:'贝壳拼盘',   kind:'puzzle', x:2600, y:2000},
    {id:'t11',name:'排球沙滩',   kind:'bubble', x:3000, y:2150},
    {id:'t12',name:'港湾花圃',   kind:'water',  x:3300, y:2050},
    {id:'t13',name:'船长节拍',   kind:'rhythm', x:2800, y:1000},
    {id:'t14',name:'灯塔贝壳',   kind:'gather', x:2250, y:750},
    {id:'boss',name:'老邮轮顶',  kind:'boss',   x:3200, y:240}
   ],
   charms:[
    {id:'c1', name:'沙滩星糖', x:1000, y:1050},
    {id:'c2', name:'灯塔星糖', x:2100, y:420},
    {id:'c3', name:'浅滩星糖', x:1700, y:1560},
    {id:'c4', name:'海湾星糖', x:3100, y:1520},
    {id:'c5', name:'甲板星糖', x:2700, y:400}
   ],
   enemies:['drop','bubble','mirror']
  },

  /* ---------- ③ 蜜糖山谷 ---------- */
  {
   id:'honey-valley', number:'03', name:'蜜糖山谷', en:'Honey Valley',
   level:3, requires:['candy-town'], skeleton:'A', seed:3293, decor:'honey',
   color:'#f7c46b', accent:'#f7c46b', symbol:'note',
   subtitle:'蜂群把整座山谷酿成了金色',
   feature:'缓坡长路 · 蜜糖风车节拍',
   boss:'蜂王糖罐',
   desc:'风车每转一圈亮一次，跟着鼓点走，山谷就会替你打开下一条路。',
   palette:{base:'#ffe9b8', light:'#fff6df', deep:'#f7c96f', ink:'#8d5c24'},
   tints:[
    ['#ffe9b8','#fff6df','#f7c96f'],
    ['#ffe0c9','#fff2e8','#f5b98e'],
    ['#f3dcf5','#faf0fd','#d3aae0'],
    ['#e0f0d2','#f2fbec','#b4d999'],
    ['#ffd9a8','#fff0dc','#f3b96a']
   ],
   regions:[
    {id:'r1', name:'蜂箱农场',   en:'Beehive Farm', hint:'蜂箱整齐排开 · 蜜蜂会绕着你飞'},
    {id:'r2', name:'蜜糖风车',   en:'Honey Mill',   hint:'风车决定节奏 · 跟着鼓点踩糖花'},
    {id:'r3', name:'糖浆洞穴',   en:'Syrup Cave',   hint:'洞里很暗 · 蜜滴会黏住脚步'},
    {id:'r4', name:'糖果梯田',   en:'Candy Terrace',hint:'一层一层往下 · 每层藏着不同答案'},
    {id:'r5', name:'蜂王巢穴',   en:'Hive Throne',  hint:'巢室正中央 · 蜂王在等你'}
   ],
   sites:[
    {id:'camp', name:'蜂农营地',   kind:'camp',   x:520,  y:2010},
    {id:'t1', name:'分蜂仪式',   kind:'rhythm', x:540,  y:700},
    {id:'t2', name:'蜜桶搬运',   kind:'escort', x:1000, y:1400},
    {id:'t3', name:'蜂群驱赶',   kind:'bubble', x:780,  y:1780},
    {id:'t4', name:'花蜜采集',   kind:'gather', x:1620, y:640},
    {id:'t5', name:'风车节拍',   kind:'rhythm', x:1900, y:560},
    {id:'t6', name:'蜜池垂钓',   kind:'fish',   x:2120, y:470},
    {id:'t7', name:'糖浆管道',   kind:'puzzle', x:1750, y:1520},
    {id:'t8', name:'洞底挖掘',   kind:'dig',    x:2100, y:1550},
    {id:'t9', name:'洞穴花圃',   kind:'water',  x:2300, y:1320},
    {id:'t10',name:'梯田谜题',   kind:'puzzle', x:3090, y:1820},
    {id:'t11',name:'蜜罐赛跑',   kind:'race',   x:2820, y:1870},
    {id:'t12',name:'梯田采集',   kind:'gather', x:3300, y:1150},
    {id:'t13',name:'巢门泡泡',   kind:'bubble', x:3000, y:520},
    {id:'boss',name:'蜂王巢室',  kind:'boss',   x:3070, y:370}
   ],
   charms:[
    {id:'c1', name:'农场星糖', x:900,  y:250},
    {id:'c2', name:'风车星糖', x:2350, y:620},
    {id:'c3', name:'洞穴星糖', x:2450, y:1900},
    {id:'c4', name:'梯田星糖', x:3260, y:1550},
    {id:'c5', name:'巢穴星糖', x:3350, y:260}
   ],
   enemies:['bee','bubble','giant']
  },

  /* ---------- ④ 镜面回廊 ---------- */
  {
   id:'mirror-arcade', number:'04', name:'镜面回廊', en:'Mirror Arcade',
   level:5, requires:['soda-coast','honey-valley'], skeleton:'B', seed:4204, decor:'mirror',
   color:'#c9a9ec', accent:'#c9a9ec', symbol:'puzzle',
   subtitle:'每面镜子里都有一条没走完的路',
   feature:'棱镜与倒影 · 顺序机关',
   boss:'折镜君主',
   desc:'回廊会把你的动作反过来，玩家必须先看懂镜子里发生的事。',
   palette:{base:'#e9d8fb', light:'#f8f1ff', deep:'#cbaaee', ink:'#6d4e9c'},
   tints:[
    ['#e9d8fb','#f8f1ff','#cbaaee'],
    ['#d5ecfb','#edf8ff','#a2d5f0'],
    ['#dff2e4','#f1fbf4','#a8d9bb'],
    ['#ffe3ec','#fff4f8','#f6b7ca'],
    ['#e2e8fb','#f0f3ff','#b4c2ee']
   ],
   regions:[
    {id:'r1', name:'镜面花厅',   en:'Mirror Hall',  hint:'地面会映出倒影 · 倒影泡泡会反打'},
    {id:'r2', name:'棱镜喷泉',   en:'Prism Spring', hint:'光被拆成七色 · 颜色顺序是线索'},
    {id:'r3', name:'倒影森林',   en:'Inverted Woods',hint:'树是上下颠倒的 · 采集要按倒着的顺序'},
    {id:'r4', name:'玻璃温室',   en:'Glass House',  hint:'温室里很暖 · 花要一株株浇'},
    {id:'r5', name:'无限镜厅',   en:'Endless Hall', hint:'镜子一直排到天边 · 尽头是君主'}
   ],
   sites:[
    {id:'camp', name:'廊厅入口',   kind:'camp',   x:520,  y:2010},
    {id:'t1', name:'倒影采集',   kind:'gather', x:560,  y:1600},
    {id:'t2', name:'镜面泡泡',   kind:'bubble', x:1000, y:1500},
    {id:'t3', name:'花厅拼图',   kind:'puzzle', x:800,  y:1800},
    {id:'t4', name:'棱镜拼图',   kind:'puzzle', x:1500, y:260},
    {id:'t5', name:'喷泉垂钓',   kind:'fish',   x:1800, y:340},
    {id:'t6', name:'光色关卡',   kind:'rhythm', x:2600, y:800},
    {id:'t7', name:'倒影赛跑',   kind:'race',   x:1400, y:1620},
    {id:'t8', name:'树根挖掘',   kind:'dig',    x:2300, y:1850},
    {id:'t9', name:'森林浇花',   kind:'water',  x:2000, y:1520},
    {id:'t10',name:'玻璃谜题',   kind:'puzzle', x:2600, y:2000},
    {id:'t11',name:'温室信使',   kind:'escort', x:3000, y:2150},
    {id:'t12',name:'玻璃碎片',   kind:'gather', x:3300, y:2050},
    {id:'t13',name:'镜厅泡泡',   kind:'bubble', x:2800, y:1000},
    {id:'t14',name:'棱镜碎屑',   kind:'gather', x:2250, y:750},
    {id:'boss',name:'无限镜厅',  kind:'boss',   x:3200, y:240}
   ],
   charms:[
    {id:'c1', name:'花厅星糖', x:1000, y:1050},
    {id:'c2', name:'喷泉星糖', x:2100, y:420},
    {id:'c3', name:'森林星糖', x:1700, y:1560},
    {id:'c4', name:'温室星糖', x:3100, y:1520},
    {id:'c5', name:'镜厅星糖', x:2700, y:400}
   ],
   enemies:['mirror','bubble','ghost']
  },

  /* ---------- ⑤ 云顶王座 ---------- */
  {
   id:'cloudtop-throne', number:'05', name:'云顶王座', en:'Cloudtop Throne',
   level:7, requires:['mirror-arcade'], skeleton:'A', seed:5115, decor:'cloud',
   color:'#f7aec6', accent:'#f7aec6', symbol:'crown',
   subtitle:'把黎明带上最高的那朵云',
   feature:'云层阶梯 · 混合精英怪',
   boss:'梦魇棉花糖',
   desc:'所有路都通向这里，最后一朵云上等着把长梦重新缝好。',
   palette:{base:'#ffdfea', light:'#fff2f7', deep:'#f8b3cd', ink:'#9c5070'},
   tints:[
    ['#f0f4ff','#f8faff','#c9d5f2'],
    ['#e6f7e0','#f4fdf1','#b3e0a6'],
    ['#ffe6f0','#fff5f9','#f7b6d2'],
    ['#fff0d2','#fff9ec','#f6d189'],
    ['#ffdfea','#fff2f7','#f8b3cd']
   ],
   regions:[
    {id:'r1', name:'登云阶梯',   en:'Cloud Stairs', hint:'台阶悬在云上 · 掉落也只是软着陆'},
    {id:'r2', name:'风车高原',   en:'Mill Plateau',hint:'大风车一圈圈转 · 影子会跟着风走'},
    {id:'r3', name:'彩虹桥头',   en:'Rainbow Head', hint:'桥会随颜色变化 · 选对颜色才过得去'},
    {id:'r4', name:'星屑广场',   en:'Stardust Plaza',hint:'广场上全是小星屑 · 收集它们拼图'},
    {id:'r5', name:'云顶王座',   en:'Throne Cloud', hint:'王座就在最高处 · 梦魇在此醒来'}
   ],
   sites:[
    {id:'camp', name:'阶梯营地',   kind:'camp',   x:520,  y:2010},
    {id:'t1', name:'云阶采集',   kind:'gather', x:540,  y:700},
    {id:'t2', name:'风中泡泡',   kind:'bubble', x:505,  y:1150},
    {id:'t3', name:'阶梯护送',   kind:'escort', x:780,  y:1780},
    {id:'t4', name:'高原垂钓',   kind:'fish',   x:1900, y:560},
    {id:'t5', name:'风车节拍',   kind:'rhythm', x:1620, y:640},
    {id:'t6', name:'彩虹配对',   kind:'puzzle', x:1750, y:1520},
    {id:'t7', name:'星屑挖掘',   kind:'dig',    x:2100, y:1550},
    {id:'t8', name:'桥头赛跑',   kind:'race',   x:2300, y:1320},
    {id:'t9', name:'光台花圃',   kind:'water',  x:3090, y:1820},
    {id:'t10',name:'星屑拼图',   kind:'puzzle', x:2820, y:1870},
    {id:'t11',name:'高塔采集',   kind:'gather', x:3300, y:1150},
    {id:'t12',name:'王座谜题',   kind:'puzzle', x:2850, y:700},
    {id:'t13',name:'云顶泡泡',   kind:'bubble', x:3000, y:520},
    {id:'boss',name:'云顶王座',  kind:'boss',   x:3070, y:370}
   ],
   charms:[
    {id:'c1', name:'阶梯星糖', x:900,  y:250},
    {id:'c2', name:'高原星糖', x:2350, y:620},
    {id:'c3', name:'桥头星糖', x:2450, y:1900},
    {id:'c4', name:'广场星糖', x:3260, y:1550},
    {id:'c5', name:'王座星糖', x:3350, y:260}
   ],
   enemies:['nightmare','mirror','bubble']
  }
 ];

 /* ---- 可爱版怪物 -------------------------------------------------------- */
 const variants = {
  bubble:{name:'泡泡怪',   shadow:'ghost',  color:'#bfe9ff', tip:'轻轻一戳就会「啵」地爆掉，不会伤害你'},
  bunny:{name:'云朵兔',   shadow:'wolf',   color:'#ffdcea', tip:'会叼走糖果，先靠近再戳掉它'},
  drop:{name:'水滴怪',   shadow:'fire',   color:'#9fd8ff', tip:'碰到会弄湿地面，绕开蓝色水渍'},
  bee:{name:'蜜糖蜂',   shadow:'swarm',  color:'#ffd66e', tip:'喜欢绕圈飞，瞄准中心再戳'},
  giant:{name:'布丁巨人', shadow:'giant',  color:'#ffc2a1', tip:'震地只晃不动，慢慢绕开'},
  mirror:{name:'镜面泡泡', shadow:'mirror', color:'#e0c8ff', tip:'会反弹戳击，从侧面靠近'},
  ghost:{name:'薄荷幽灵', shadow:'ghost',  color:'#b6f0e2', tip:'飘忽不定，先用影技定住'},
  nightmare:{name:'梦魇泡泡',shadow:'mirror',color:'#e7a9d6', tip:'BOSS 形态 · 破开外层泡泡才会现形'}
 };

 /* ---- 工具 ------------------------------------------------------------- */
 const width = 3600, height = 2400;
 function rngOf(seed){ let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
 function distToPaths(paths, x, y){
  let best = Infinity;
  for(const line of paths) for(let i = 1; i < line.length; i++){
   const [ax, ay] = line[i - 1], [bx, by] = line[i];
   const vx = bx - ax, vy = by - ay;
   const t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy)));
   best = Math.min(best, Math.hypot(x - ax - vx * t, y - ay - vy * t));
  }
  return best;
 }
 function onPath(paths, x, y, pad = 90){ return distToPaths(paths, x, y) < pad; }

 /* ---- 把一个世界装配成完整地图 ----------------------------------------- */
 function build(world){
  const sk = world.skeleton === 'A' ? SKELETON_A : SKELETON_B;
  const rng = rngOf(world.seed);

  // 区域：套用骨架矩形 + 本世界命名与配色
  const regions = sk.regions.map((r, i) => {
   const reg = world.regions[i];
   const tint = (world.tints && world.tints[i]) || [world.palette.base, world.palette.light, world.palette.deep];
   return {id:r.id, name:reg.name, en:reg.en, hint:reg.hint,
           x:r.x, y:r.y, w:r.w, h:r.h, label:r.label,
           color:tint[0], light:tint[1], deep:tint[2],
           ink:world.palette.ink, accent:world.accent};
  });

  // 地标：套用任务类型
  const sites = world.sites.map(s => {
   const k = KINDS[s.kind];
   return {id:s.id, name:s.name, kind:s.kind, x:s.x, y:s.y,
           symbol:k.symbol, color:k.color, hint:k.hint};
  });
  const charms = world.charms.map(c => ({...c, color:world.accent}));

  const paths = sk.paths.map(p => p.map(pt => [pt[0], pt[1]]));

  // 敌人群：每个区域 3 组，位置按世界种子落在区域空地
  const packs = [];
  for(const reg of regions){
   let placed = 0, tries = 0;
   while(placed < 3 && tries++ < 200){
    const x = reg.x + 130 + rng() * (reg.w - 260);
    const y = reg.y + 130 + rng() * (reg.h - 260);
    if(sites.some(s => Math.hypot(x - s.x, y - s.y) < 380)) continue;
    if(charms.some(c => Math.hypot(x - c.x, y - c.y) < 170)) continue;
    if(onPath(paths, x, y, 150)) continue;
    if(sk.river.vertical && x > sk.river.x - 90 && x < sk.river.x + sk.river.w + 90) continue;
    if(!sk.river.vertical && y > sk.river.y - 90 && y < sk.river.y + sk.river.h + 90) continue;
    const e = world.enemies;
    packs.push({x:Math.round(x), y:Math.round(y),
                types:[e[placed % e.length], e[(placed + 1) % e.length]]});
    placed++;
   }
  }

  // 树篱：每区域 1~2 条，避开小路与地标
  const walls = [];
  for(const reg of regions){
   let placed = 0, tries = 0;
   while(placed < 2 && tries++ < 240){
    const vertical = rng() < .45;
    const len = 260 + rng() * 320;
    const x = reg.x + 90 + rng() * Math.max(60, reg.w - len - 180);
    const y = reg.y + 90 + rng() * Math.max(60, reg.h - len - 180);
    const w = vertical ? 34 + rng() * 26 : len;
    const h = vertical ? len : 34 + rng() * 26;
    if(x + w > reg.x + reg.w - 60 || y + h > reg.y + reg.h - 60) continue;
    const cx = x + w / 2, cy = y + h / 2;
    if(distToPaths(paths, cx, cy) < 230) continue;
    // 树篱不能压住地标：用「矩形到点」的距离判定，而不是中心点距离
    if(sites.some(s => {
     const dx = Math.max(x - s.x, 0, s.x - (x + w));
     const dy = Math.max(y - s.y, 0, s.y - (y + h));
     return Math.hypot(dx, dy) < 180;
    })) continue;
    if(packs.some(p => Math.hypot(cx - p.x, cy - p.y) < 190)) continue;
    walls.push({x:Math.round(x), y:Math.round(y), w:Math.round(w), h:Math.round(h), kind:'wall'});
    placed++;
   }
  }

  // 地形：每区域 1~2 片减速带
  const terrain = [];
  const kinds = ['sprinkle', 'frost', 'shallow'];
  for(const reg of regions){
   let placed = 0, tries = 0;
   while(placed < 2 && tries++ < 240){
    const rx = 108 + rng() * 82, ry = 78 + rng() * 52;
    const x = reg.x + rx + rng() * Math.max(60, reg.w - rx * 2);
    const y = reg.y + ry + rng() * Math.max(60, reg.h - ry * 2);
    if(onPath(paths, x, y, 130)) continue;
    if(sites.some(s => Math.hypot(x - s.x, y - s.y) < 300)) continue;
    terrain.push({x:Math.round(x), y:Math.round(y), rx:Math.round(rx), ry:Math.round(ry),
                  kind:kinds[(placed + regions.indexOf(reg)) % 3]});
    placed++;
   }
  }

  const river = sk.river;
  const bridges = river.bridges;
  const regionAt = (x, y) => regions.slice().reverse().find(r => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) || regions[0];
  const terrainAt = (x, y) => terrain.find(t => ((x - t.x) / t.rx) ** 2 + ((y - t.y) / t.ry) ** 2 < 1);

  function create(){
   const r2 = rngOf(world.seed + 77);
   const props = [], rocks = [];
   const spawns = packs.flatMap(p => p.types.map((_, i) => ({x:p.x + (i % 2) * 72, y:p.y + Math.floor(i / 2) * 66})));
   for(let i = 0; i < 900; i++){
    const x = 70 + r2() * (width - 140), y = 80 + r2() * (height - 160);
    const reg = regionAt(x, y);
    if(onPath(paths, x, y, 105) || sites.some(s => Math.hypot(x - s.x, y - s.y) < 400) ||
       charms.some(s => Math.hypot(x - s.x, y - s.y) < 150) ||
       walls.some(w => x > w.x - 70 && x < w.x + w.w + 70 && y > w.y - 70 && y < w.y + w.h + 70)) continue;
    props.push({x, y, size: 30 + r2() * 35, tone: r2(), kind: reg.id});
    if(i % 5 === 0){
     const rock = {x, y, r: 19 + r2() * 12};
     if(!spawns.some(p => Math.hypot(x - p.x, y - p.y) < rock.r + 44)) rocks.push(rock);
    }
   }
   return {props, rocks};
  }

  /* 可爱风地面绘制 */
  function drawGround(g){
   const TAU = Math.PI * 2;
   g.fillStyle = '#fff8ec';
   g.fillRect(0, 0, width, height);
   for(const r of regions){
    g.fillStyle = r.color;
    g.fillRect(r.x, r.y, r.w, r.h);
    const grad = g.createRadialGradient(r.x + r.w * .5, r.y + r.h * .45, 20, r.x + r.w * .5, r.y + r.h * .45, Math.max(r.w, r.h) * .62);
    grad.addColorStop(0, r.light + 'cc');
    grad.addColorStop(1, 'transparent');
    g.fillStyle = grad;
    g.fillRect(r.x, r.y, r.w, r.h);
   }
   let seed = world.seed % 99991;
   const rr = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
   for(let i = 0; i < 5200; i++){
    const x = rr() * width, y = rr() * height;
    g.fillStyle = i % 3 === 0 ? '#ffffff77' : i % 3 === 1 ? '#f7d9a733' : '#c8a98a1c';
    g.beginPath();
    g.ellipse(x, y, 4 + rr() * 26, 2 + rr() * 5, 0, 0, TAU);
    g.fill();
   }
   g.lineCap = 'round';
   g.lineJoin = 'round';
   for(const line of paths){
    g.beginPath();
    line.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
    g.strokeStyle = '#e0c39a3d'; g.lineWidth = 128; g.stroke();
    g.strokeStyle = '#fff1d4'; g.lineWidth = 112; g.stroke();
    g.strokeStyle = '#f6dcb0'; g.lineWidth = 86; g.stroke();
    g.setLineDash([26, 30]);
    g.strokeStyle = '#ffffff8c'; g.lineWidth = 12; g.stroke();
    g.setLineDash([]);
   }
   // 汽水溪
   if(river.vertical){
    g.fillStyle = '#bfe6f7'; g.fillRect(river.x - 30, 0, river.w + 60, height);
    g.fillStyle = '#d8f2ff'; g.fillRect(river.x - 12, 0, river.w + 24, height);
    g.fillStyle = '#9fd9f2'; g.fillRect(river.x, 0, river.w, height);
    for(let y = 20; y < height; y += 46){
     g.strokeStyle = '#ffffff9c'; g.lineWidth = 2.2;
     g.beginPath(); g.moveTo(river.x + 14, y);
     g.bezierCurveTo(river.x + 52, y - 16, river.x + 110, y + 17, river.x + 154, y); g.stroke();
    }
   }else{
    g.fillStyle = '#bfe6f7'; g.fillRect(0, river.y - 30, width, river.h + 60);
    g.fillStyle = '#d8f2ff'; g.fillRect(0, river.y - 12, width, river.h + 24);
    g.fillStyle = '#9fd9f2'; g.fillRect(0, river.y, width, river.h);
    for(let x = 20; x < width; x += 46){
     g.strokeStyle = '#ffffff9c'; g.lineWidth = 2.2;
     g.beginPath(); g.moveTo(x, river.y + 14);
     g.bezierCurveTo(x - 16, river.y + 52, x + 17, river.y + 110, x, river.y + 154); g.stroke();
    }
   }
   // 彩虹云朵桥
   for(const by of bridges){
    const bx = river.vertical ? river.x - 40 : by;
    const byy = river.vertical ? by : river.y - 40;
    const bw = river.vertical ? river.w + 80 : 240;
    const bh = river.vertical ? 240 : river.h + 80;
    g.fillStyle = '#f7e3c4';
    g.beginPath();
    if(river.vertical) g.rect(bx, byy - bh / 2, bw, bh); else g.rect(bx - bw / 2, byy, bw, bh);
    g.fill();
   }
   // 地形
   for(const t of terrain){
    g.beginPath();
    g.ellipse(t.x, t.y, t.rx, t.ry, 0, 0, TAU);
    g.fillStyle = t.kind === 'sprinkle' ? '#ffd7e4aa' : t.kind === 'frost' ? '#ffffffbb' : '#a9ddf5bb';
    g.fill();
    g.strokeStyle = t.kind === 'sprinkle' ? '#f3a8c288' : t.kind === 'frost' ? '#d8e8f088' : '#79c4e688';
    g.lineWidth = 3;
    g.stroke();
   }
   // 树篱
   for(const w of safeWalls){
    g.fillStyle = '#a9d98f';
    g.fillRect(w.x, w.y, w.w, w.h);
    g.fillStyle = '#c7efa8';
    g.fillRect(w.x + 8, w.y + 8, w.w - 16, Math.min(w.h - 16, 26));
    g.strokeStyle = '#6fa45f';
    g.lineWidth = 3;
    g.strokeRect(w.x, w.y, w.w, w.h);
   }
   // 地标光环
   for(const s of sites){
    g.save();
    g.translate(s.x, s.y);
    g.scale(1, .68);
    g.strokeStyle = s.color + '77';
    g.lineWidth = 4;
    g.setLineDash([18, 16]);
    g.beginPath(); g.arc(0, 0, 108, 0, TAU); g.stroke();
    g.setLineDash([]);
    g.restore();
   }
  }

  /* 这一行保持单行书写，方便外部导入脚本用字符串替换的方式打补丁 */
  const riverWalls=[];
  let edge=0;
  for(const bridge of [...bridges, (river.vertical?height:width)+120]){
   const end=bridge-120;
   if(end>edge)riverWalls.push(river.vertical?{x:river.x,y:edge,w:river.w,h:end-edge,kind:'river'}:{x:edge,y:river.y,w:end-edge,h:river.h,kind:'river'});
   edge=bridge+120;
  }
  sites.forEach(s=>s.symbol=({camp:'⌂',herd:'♧',fish:'≈',rhythm:'♫',puzzle:'◇',boss:'♛',gather:'✿',escort:'➤',race:'⚑',dig:'⛏',water:'❀',bubble:'◉'})[s.kind]);
  const safeWalls=walls.filter(w=>![...sites,...charms].some(s=>Math.hypot(Math.max(w.x-s.x,0,s.x-w.x-w.w),Math.max(w.y-s.y,0,s.y-w.y-w.h))<310));
  const make=create;
  function runtimeCreate(){const v=make();v.props.forEach(p=>p.kind=world.decor);v.rocks=v.rocks.filter(r=>![...sites,...charms].some(s=>Math.hypot(s.x-r.x,s.y-r.y)<330));return v;}
  return {id:world.id, name:world.name, decor:world.decor, discoveries:[], width, height, regions, sites, charms, bridges, walls:[...safeWalls,...riverWalls], terrain, paths, packs, variants, river, regionAt, terrainAt, onPath:(x, y, p = 90) => onPath(paths, x, y, p), create:runtimeCreate, drawGround};
 }

 /* ---- 星图：解锁路径 ---------------------------------------------------- */
 const atlas = {
  nodes: worlds.map(w => ({id:w.id, number:w.number, name:w.name, en:w.en, level:w.level,
                          requires:w.requires, color:w.color, accent:w.accent, symbol:w.symbol,
                          subtitle:w.subtitle, feature:w.feature, boss:w.boss, desc:w.desc,
                          regions:w.regions.map(r => ({name:r.name, en:r.en, hint:r.hint}))})),
  edges: []
 };
 worlds.forEach(w => w.requires.forEach(r => atlas.edges.push([r, w.id])));

 /* ---- 游戏内用的符号表（单字符，可直接喂给 drawWorldLandmark）---------- */
 const gameSymbols = {
  camp:'⌂', herd:'♧', fish:'≈', rhythm:'♫', puzzle:'◇', boss:'♛',
  gather:'✿', escort:'➤', race:'⚑', dig:'⛏', water:'❀', bubble:'◉'
 };

 const built = {};
 worlds.forEach(w => { built[w.id] = build(w); });

 function map(worldId){
  if(!built[worldId]) throw Error('Unknown world: ' + worldId);
  return built[worldId];
 }

 const THEME = {id:'cloud', name:'甜梦云原', en:'Sweet Dream Cloud Plain',
        desc:'一座由糖果、汽水与云朵搭成的长梦。五个子地图沿解锁路径依次展开，每一张都藏着十几个小任务。',
        worlds, atlas, kinds:KINDS, variants, gameSymbols, map,
        get world(){ return worlds; }};

 /* 兼容别名：旧代码里引用的 HUNTER_WORLD 仍然拿得到第一张地图（棒棒糖镇） */
 window.HUNTER_Q_WORLD = built[worlds[0].id];
 return THEME;
})();
