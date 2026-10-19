# 第4～6关与新增宠物

2026-10-19。新增18个属性系列，每系列3个独立形态，共54个新宠物形态；与原有54形态合计108。原宠物和玩家存档保留。

## 地图和概率

| 大关 | 地图 | 层数 | 精英 R / SR / SSR | BOSS R / SR / SSR |
|---|---|---|---|---|
|4|翠风群岛|40|80% / 18% / 2%|60% / 25% / 15%|
|5|赤雷荒原|50|75% / 22% / 3%|50% / 30% / 20%|
|6|星渊圣域|60|70% / 26% / 4%|40% / 35% / 25%|

沿用整图5体力、顺序通关解锁；逢5但不逢10为精英，逢10为BOSS。每图4个普通系列、1个精英系列、1个BOSS系列。每次寻蛋按表独立抽品质，再从本图6个系列等概率抽物种；孵化仍采用原有品质下限规则。表中的概率不是孵化后的最终品质概率。

## 新宠物名录

|地图|属性|出怪身份|R|SR|SSR|美术原图|
|---|---|---|---|---|---|---|
|翠风群岛|一般|普通|绒果豚|果篮豚|丰收山豚|[capy](../assets/resources/art/capy-forms-v1.png)|
|翠风群岛|草|普通|荷芽蛙|莲蓬蛙|碧莲仙蛙|[lotus](../assets/resources/art/lotus-forms-v1.png)|
|翠风群岛|水|普通|泡泡鳐|潮纹鳐|瀚海翼鳐|[manta](../assets/resources/art/manta-forms-v1.png)|
|翠风群岛|飞行|普通|风铃鹤|逐风鹤|九霄灵鹤|[crane](../assets/resources/art/crane-forms-v1.png)|
|翠风群岛|虫|精英|叶镰螳|双刃螳|翠甲刃皇|[mantis](../assets/resources/art/mantis-forms-v1.png)|
|翠风群岛|岩石|BOSS|砂晶蟹|晶簇蟹|磐晶蟹王|[cragcrab](../assets/resources/art/cragcrab-forms-v1.png)|
|赤雷荒原|火|普通|炭角羊|炽鬃羊|熔冠炎羊|[cinder](../assets/resources/art/cinder-forms-v1.png)|
|赤雷荒原|电|普通|电绒鼠|雷跃鼠|极电灵鼠|[voltage](../assets/resources/art/voltage-forms-v1.png)|
|赤雷荒原|毒|普通|紫尾蝎|荆毒蝎|蚀毒蝎王|[venom](../assets/resources/art/venom-forms-v1.png)|
|赤雷荒原|地面|普通|沙鳞兽|流砂穿山兽|地脉甲尊|[dune](../assets/resources/art/dune-forms-v1.png)|
|赤雷荒原|格斗|精英|拳袋鼠|斗篷袋鼠|震岳斗王|[monk](../assets/resources/art/monk-forms-v1.png)|
|赤雷荒原|钢|BOSS|铁鼻豕|钢鬃战豕|陨铁巨牙|[ironboar](../assets/resources/art/ironboar-forms-v1.png)|
|星渊圣域|冰|普通|雪耳兔|冰棱兔|霜冠灵兔|[frost](../assets/resources/art/frost-forms-v1.png)|
|星渊圣域|幽灵|普通|幽泡灵|夜灯水母|冥幕灯母|[spirit](../assets/resources/art/spirit-forms-v1.png)|
|星渊圣域|超能力|普通|梦芽貘|星枕貘|梦境贤貘|[dream](../assets/resources/art/dream-forms-v1.png)|
|星渊圣域|恶|普通|墨羽鸦|暮刃鸦|蚀星鸦王|[shade](../assets/resources/art/shade-forms-v1.png)|
|星渊圣域|妖精|精英|彩翎雏|幻彩孔雀|极光仙凰|[aurora](../assets/resources/art/aurora-forms-v1.png)|
|星渊圣域|龙|BOSS|星鳞幼龙|星环游龙|星渊龙君|[starwyrm](../assets/resources/art/starwyrm-forms-v1.png)|

## 成长与技能

- 新地图R形态普通/精英/BOSS的HP：第四关34/38/42、第五关44/48/52、第六关56/60/64。
- 普通攻击点数组：第四关4/7/10、第五关6/10/14、第六关9/13/18；精英每项+1，BOSS每项+2。
- 新系列SR相对R增加6HP、攻击每项+2；SSR相对R增加12HP、攻击每项+4。各形态有不同自动技能，复用现有经过实装的技能机制，不增加战斗按钮。
- 原有系列品质规则及已拥有/遗传个体属性保持。遗传继续按存档基因，不因地图或显示形态重算。
- 全部形态名称、HP、攻击、技能、敌方逐层数值见[自动数据表](generated/TABLES.md)。曲线是可测试首版，尚未完成玩家全流程平衡验收。

## 图片规格与复用

- 使用内置imagegen生成，每个系列一张透明PNG图集，三行分别为R、SR、SSR，两列分别为我方背面朝右上、敌方正面朝左下，共108个新战斗视图。正面同时用于图鉴、头像及营地。
- 原图放在 `assets/resources/art/*-forms-v1.png`；保留完整像素与alpha，未使用换色或拉伸伪造进化。
- 提示词与设计：[roster.json](../art-source/regions-4-6/roster.json)。生成记录：[generation.json](../art-source/regions-4-6/generation.json)。图集矩形和脚底锚点：[art-index.json](../art-source/regions-4-6/art-index.json)。
- `tools/register-region-art.py` 只复制原图并读取alpha测量边界，不修改生成图像；运行时 `RegionArt.ts` 按矩形取精灵。
- 所有素材随游戏工程保存，不依赖生成工具的缓存路径。生成记录中的缓存路径仅用于源文件追溯。

## 验证入口

`checks/regions-expansion.test.cjs` 检查新形态、地图池、顺序解锁、地区成长、54次孵化与高层存档、最终BOSS结算。`checks/egg-rates.test.cjs` 检查所有42个精英/BOSS检查点的概率边界。`checks/regions-runtime.cjs` 检查图片加载、六图菜单和高层战斗网页。平台真机验证另行进行。

