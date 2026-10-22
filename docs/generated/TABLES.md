# 当前游戏完整数据表

> 自动生成；不要手改。来源：PMModel、PMGame、BattleArt、EvolutionArt、RegionArt、HeroArt；精确 SHA-256 见 [design-data.json](design-data.json)。运行 `node tools/export-design-data.cjs` 更新，`--check` 检查过期。

## 内容规模

90 个系列，270 种自然形态，120 关，135 种技能机制。个体遗传后数值以存档为准。

初始流程、三位主角效果与三选一伙伴见 [初始流程](../ONBOARDING.md)。阿岚领取巢穴蛋时有20%概率额外获得一枚蛋，下方寻蛋表不含此额外奖励。

## 地图系列与关卡身份

| 地图 | 关数 | 普通池（等概率） | 精英 | BOSS |
| --- | --- | --- | --- | --- |
| 草叶海岸 | 10 | 绒团兔、芽芽龙、潮泡獭、云翎雀 | 芽角甲虫 | 岩背龟 |
| 熔岩山径 | 10 | 闪尾狐、蓄电貂、毒泡蜗、铲角鼹 | 拳铠猿 | 铁垒犀 |
| 霜月雪原 | 10 | 霜团海豹、灯芯幽灵、星环鸮、暮影猞猁 | 铃芽鹿 | 霆冠龙 |
| 翠风群岛 | 10 | 绒果豚、荷芽蛙、泡泡鳐、风铃鹤 | 叶镰螳 | 砂晶蟹 |
| 赤雷荒原 | 10 | 炭角羊、电绒鼠、紫尾蝎、沙鳞兽 | 拳袋鼠 | 铁鼻豕 |
| 星渊圣域 | 10 | 雪耳兔、幽泡灵、梦芽貘、墨羽鸦 | 彩翎雏 | 星鳞幼龙 |
| 琉璃雨林 | 10 | 蜜团睡鼠、兰芽壁虎、露鳃螈、灯豆萤 | 紫芽蛇 | 冠喙雏 |
| 赤曜沙海 | 10 | 炭团驼、电扇蜥、砂团熊、砾甲虫 | 拳爪獾 | 铁角犊 |
| 冥辉天穹 | 10 | 雪角鲸、幽面狸、念泡章、暮绒蝠 | 月绒蛾 | 曜角驹 |
| 圣枝云庭 | 10 | 祈纹食蚁兽、树咒芽灵、绸冠带鱼、六翎信天雏 | 琉翅蜻 | 叠石幼灵 |
| 万象神炉 | 10 | 日绒狮、雷鼓灵、毒晶浮母、环甲小兽 | 双拳面灵 | 星甲鲎 |
| 太初星界 | 10 | 雪屏雏、折纸幽灵、星瞳球、双吻影蛇 | 花角长颈兽 | 三角幼龙 |

## 全部形态自然数据

角色身份为地图出怪身份；美术级为历史画面尺度分类。点数组按索引等概率，重复项保留。R/SR/SSR自然形态各只有一个下列技能。

| 形态ID | 名称 | 属性 | 品质 | 地图 / 身份 | 美术级 | HP | 攻击点数 | 技能 | 图片 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| fox-normal | 闪尾狐 | 火 | R | 熔岩山径 / 普通 | 普通 | 22 | 1 / 3 / 7 | 火·R·强击 | [源图](../../assets/resources/art/fox-battle-ref.png) |
| fox-SR | 焰鬃狐 | 火 | SR | 熔岩山径 / 普通 | 普通 | 24 | 1 / 3 / 7 | 火·SR·屏障 | [源图](../../assets/resources/art/fox-evolution-v1.png) |
| fox-SSR | 曜焰灵狐 | 火 | SSR | 熔岩山径 / 普通 | 普通 | 26 | 1 / 3 / 7 | 火·SSR·印记 | [源图](../../assets/resources/art/fox-evolution-v1.png) |
| bud-normal | 芽芽龙 | 草 | R | 草叶海岸 / 普通 | 普通 | 24 | 3 / 3 / 4 | 草·R·回春 | [源图](../../assets/resources/art/bud-battle-ref.png) |
| bud-SR | 蕨翼龙 | 草 | SR | 草叶海岸 / 普通 | 普通 | 26 | 3 / 3 / 4 | 草·SR·复苏 | [源图](../../assets/resources/art/bud-evolution-v1.png) |
| bud-SSR | 花冠森龙 | 草 | SSR | 草叶海岸 / 普通 | 普通 | 28 | 3 / 3 / 4 | 草·SSR·屏障 | [源图](../../assets/resources/art/bud-evolution-v1.png) |
| turtle-normal | 岩背龟 | 岩石 | R | 草叶海岸 / BOSS | 普通 | 30 | 2 / 2 / 4 | 岩石·R·屏障 | [源图](../../assets/resources/art/turtle-battle-ref.png) |
| turtle-SR | 峭甲龟 | 岩石 | SR | 草叶海岸 / BOSS | 普通 | 32 | 2 / 2 / 4 | 岩石·SR·屏障 | [源图](../../assets/resources/art/turtle-evolution-v1.png) |
| turtle-SSR | 山垒巨龟 | 岩石 | SSR | 草叶海岸 / BOSS | 普通 | 34 | 2 / 2 / 4 | 岩石·SSR·不屈 | [源图](../../assets/resources/art/turtle-evolution-v1.png) |
| cotton-normal | 绒团兔 | 一般 | R | 草叶海岸 / 普通 | 普通 | 24 | 2 / 3 / 4 | 一般·R·强击 | [源图](../../assets/resources/art/cotton-battle-v1.png) |
| cotton-SR | 绒领兔 | 一般 | SR | 草叶海岸 / 普通 | 普通 | 26 | 2 / 3 / 4 | 一般·SR·改运 | [源图](../../assets/resources/art/cotton-evolution-v1.png) |
| cotton-SSR | 云绒王兔 | 一般 | SSR | 草叶海岸 / 普通 | 普通 | 28 | 2 / 3 / 4 | 一般·SSR·屏障 | [源图](../../assets/resources/art/cotton-evolution-v1.png) |
| otter-normal | 潮泡獭 | 水 | R | 草叶海岸 / 普通 | 普通 | 25 | 2 / 4 / 5 | 水·R·坚守 | [源图](../../assets/resources/art/otter-battle-v1.png) |
| otter-SR | 涌浪獭 | 水 | SR | 草叶海岸 / 普通 | 普通 | 27 | 2 / 4 / 5 | 水·SR·回春 | [源图](../../assets/resources/art/otter-evolution-v1.png) |
| otter-SSR | 沧澜海獭 | 水 | SSR | 草叶海岸 / 普通 | 普通 | 29 | 2 / 4 / 5 | 水·SSR·蓄能 | [源图](../../assets/resources/art/otter-evolution-v1.png) |
| spark-normal | 蓄电貂 | 电 | R | 熔岩山径 / 普通 | 普通 | 21 | 1 / 4 / 7 | 电·R·改运 | [源图](../../assets/resources/art/spark-battle-v1.png) |
| spark-SR | 电弧貂 | 电 | SR | 熔岩山径 / 普通 | 普通 | 23 | 1 / 4 / 7 | 电·SR·力量回响 | [源图](../../assets/resources/art/spark-evolution-v1.png) |
| spark-SSR | 雷冠灵貂 | 电 | SSR | 熔岩山径 / 普通 | 普通 | 25 | 1 / 4 / 7 | 电·SSR·强击 | [源图](../../assets/resources/art/spark-evolution-v1.png) |
| seal-normal | 霜团海豹 | 冰 | R | 霜月雪原 / 普通 | 普通 | 27 | 2 / 3 / 5 | 冰·R·蓄能 | [源图](../../assets/resources/art/seal-battle-v1.png) |
| seal-SR | 霜鳍海豹 | 冰 | SR | 霜月雪原 / 普通 | 普通 | 29 | 2 / 3 / 5 | 冰·SR·屏障 | [源图](../../assets/resources/art/seal-evolution-v1.png) |
| seal-SSR | 冰冠海狮 | 冰 | SSR | 霜月雪原 / 普通 | 普通 | 31 | 2 / 3 / 5 | 冰·SSR·强击 | [源图](../../assets/resources/art/seal-evolution-v1.png) |
| ape-normal | 拳铠猿 | 格斗 | R | 熔岩山径 / 精英 | 精英 | 32 | 3 / 5 / 7 | 格斗·R·强击 | [源图](../../assets/resources/art/ape-battle-v1.png) |
| ape-SR | 破岩拳猿 | 格斗 | SR | 熔岩山径 / 精英 | 精英 | 34 | 3 / 5 / 7 | 格斗·SR·蓄能 | [源图](../../assets/resources/art/ape-evolution-v1.png) |
| ape-SSR | 金刚斗猿 | 格斗 | SSR | 熔岩山径 / 精英 | 精英 | 36 | 3 / 5 / 7 | 格斗·SSR·复苏 | [源图](../../assets/resources/art/ape-evolution-v1.png) |
| slug-normal | 毒泡蜗 | 毒 | R | 熔岩山径 / 普通 | 普通 | 23 | 2 / 4 / 5 | 毒·R·印记 | [源图](../../assets/resources/art/slug-battle-v1.png) |
| slug-SR | 棘壳蜗 | 毒 | SR | 熔岩山径 / 普通 | 普通 | 25 | 2 / 4 / 5 | 毒·SR·印记 | [源图](../../assets/resources/art/slug-evolution-v1.png) |
| slug-SSR | 毒冠巨蜗 | 毒 | SSR | 熔岩山径 / 普通 | 普通 | 27 | 2 / 4 / 5 | 毒·SSR·印记 | [源图](../../assets/resources/art/slug-evolution-v1.png) |
| mole-normal | 铲角鼹 | 地面 | R | 熔岩山径 / 普通 | 普通 | 28 | 2 / 3 / 5 | 地面·R·屏障 | [源图](../../assets/resources/art/mole-battle-v1.png) |
| mole-SR | 钻甲鼹 | 地面 | SR | 熔岩山径 / 普通 | 普通 | 30 | 2 / 3 / 5 | 地面·SR·强击 | [源图](../../assets/resources/art/mole-evolution-v1.png) |
| mole-SSR | 地脉巨鼹 | 地面 | SSR | 熔岩山径 / 普通 | 普通 | 32 | 2 / 3 / 5 | 地面·SSR·药剂回响 | [源图](../../assets/resources/art/mole-evolution-v1.png) |
| bird-normal | 云翎雀 | 飞行 | R | 草叶海岸 / 普通 | 普通 | 21 | 1 / 4 / 6 | 飞行·R·闪避 | [源图](../../assets/resources/art/bird-battle-v1.png) |
| bird-SR | 流云隼 | 飞行 | SR | 草叶海岸 / 普通 | 普通 | 23 | 1 / 4 / 6 | 飞行·SR·强击 | [源图](../../assets/resources/art/bird-evolution-v1.png) |
| bird-SSR | 天穹鹏 | 飞行 | SSR | 草叶海岸 / 普通 | 普通 | 25 | 1 / 4 / 6 | 飞行·SSR·屏障 | [源图](../../assets/resources/art/bird-evolution-v1.png) |
| owl-normal | 星环鸮 | 超能力 | R | 霜月雪原 / 普通 | 精英 | 28 | 2 / 6 / 8 | 超能力·R·屏障 | [源图](../../assets/resources/art/owl-battle-v1.png) |
| owl-SR | 月轮鸮 | 超能力 | SR | 霜月雪原 / 普通 | 精英 | 30 | 2 / 6 / 8 | 超能力·SR·蓄能 | [源图](../../assets/resources/art/owl-evolution-v1.png) |
| owl-SSR | 星冕贤鸮 | 超能力 | SSR | 霜月雪原 / 普通 | 精英 | 32 | 2 / 6 / 8 | 超能力·SSR·力量回响 | [源图](../../assets/resources/art/owl-evolution-v1.png) |
| beetle-normal | 芽角甲虫 | 虫 | R | 草叶海岸 / 精英 | 普通 | 26 | 2 / 3 / 5 | 虫·R·汲取 | [源图](../../assets/resources/art/beetle-battle-v1.png) |
| beetle-SR | 荆角甲虫 | 虫 | SR | 草叶海岸 / 精英 | 普通 | 28 | 2 / 3 / 5 | 虫·SR·屏障 | [源图](../../assets/resources/art/beetle-evolution-v1.png) |
| beetle-SSR | 翠刃甲皇 | 虫 | SSR | 草叶海岸 / 精英 | 普通 | 30 | 2 / 3 / 5 | 虫·SSR·回春 | [源图](../../assets/resources/art/beetle-evolution-v1.png) |
| ghost-normal | 灯芯幽灵 | 幽灵 | R | 霜月雪原 / 普通 | 普通 | 22 | 1 / 5 / 6 | 幽灵·R·闪避 | [源图](../../assets/resources/art/ghost-battle-v1.png) |
| ghost-SR | 引魂灯灵 | 幽灵 | SR | 霜月雪原 / 普通 | 普通 | 24 | 1 / 5 / 6 | 幽灵·SR·汲取 | [源图](../../assets/resources/art/ghost-evolution-v1.png) |
| ghost-SSR | 冥灯灵君 | 幽灵 | SSR | 霜月雪原 / 普通 | 普通 | 26 | 1 / 5 / 6 | 幽灵·SSR·强击 | [源图](../../assets/resources/art/ghost-evolution-v1.png) |
| dragon-normal | 霆冠龙 | 龙 | R | 霜月雪原 / BOSS | BOSS | 36 | 4 / 6 / 9 | 龙·R·强击 | [源图](../../assets/resources/art/dragon-battle-v1.png) |
| dragon-SR | 裂霆翼龙 | 龙 | SR | 霜月雪原 / BOSS | BOSS | 38 | 4 / 6 / 9 | 龙·SR·印记 | [源图](../../assets/resources/art/dragon-evolution-v1.png) |
| dragon-SSR | 苍霆龙皇 | 龙 | SSR | 霜月雪原 / BOSS | BOSS | 40 | 4 / 6 / 9 | 龙·SSR·强击 | [源图](../../assets/resources/art/dragon-evolution-v1.png) |
| lynx-normal | 暮影猞猁 | 恶 | R | 霜月雪原 / 普通 | 普通 | 23 | 1 / 4 / 7 | 恶·R·强击 | [源图](../../assets/resources/art/lynx-battle-v1.png) |
| lynx-SR | 夜刃猞猁 | 恶 | SR | 霜月雪原 / 普通 | 普通 | 25 | 1 / 4 / 7 | 恶·SR·回春 | [源图](../../assets/resources/art/lynx-evolution-v1.png) |
| lynx-SSR | 蚀月影王 | 恶 | SSR | 霜月雪原 / 普通 | 普通 | 27 | 1 / 4 / 7 | 恶·SSR·汲取 | [源图](../../assets/resources/art/lynx-evolution-v1.png) |
| rhino-normal | 铁垒犀 | 钢 | R | 熔岩山径 / BOSS | BOSS | 40 | 3 / 6 / 8 | 钢·R·坚守 | [源图](../../assets/resources/art/rhino-battle-v1.png) |
| rhino-SR | 钢棘战犀 | 钢 | SR | 熔岩山径 / BOSS | BOSS | 42 | 3 / 6 / 8 | 钢·SR·屏障 | [源图](../../assets/resources/art/rhino-evolution-v1.png) |
| rhino-SSR | 星钢巨犀 | 钢 | SSR | 熔岩山径 / BOSS | BOSS | 44 | 3 / 6 / 8 | 钢·SSR·坚守 | [源图](../../assets/resources/art/rhino-evolution-v1.png) |
| deer-normal | 铃芽鹿 | 妖精 | R | 霜月雪原 / 精英 | 普通 | 24 | 2 / 4 / 5 | 妖精·R·回春 | [源图](../../assets/resources/art/deer-battle-v1.png) |
| deer-SR | 花铃灵鹿 | 妖精 | SR | 霜月雪原 / 精英 | 普通 | 26 | 2 / 4 / 5 | 妖精·SR·复苏 | [源图](../../assets/resources/art/deer-evolution-v1.png) |
| deer-SSR | 圣铃仙鹿 | 妖精 | SSR | 霜月雪原 / 精英 | 普通 | 28 | 2 / 4 / 5 | 妖精·SSR·复苏 | [源图](../../assets/resources/art/deer-evolution-v1.png) |
| capy-normal | 绒果豚 | 一般 | R | 翠风群岛 / 普通 | 普通 | 34 | 4 / 7 / 10 | 一般·R·强击 | [源图](../../assets/resources/art/capy-forms-v1.png) |
| capy-SR | 果篮豚 | 一般 | SR | 翠风群岛 / 普通 | 普通 | 40 | 6 / 9 / 12 | 一般·SR·改运 | [源图](../../assets/resources/art/capy-forms-v1.png) |
| capy-SSR | 丰收山豚 | 一般 | SSR | 翠风群岛 / 普通 | 普通 | 46 | 8 / 11 / 14 | 一般·SSR·屏障 | [源图](../../assets/resources/art/capy-forms-v1.png) |
| lotus-normal | 荷芽蛙 | 草 | R | 翠风群岛 / 普通 | 普通 | 34 | 4 / 7 / 10 | 草·R·回春 | [源图](../../assets/resources/art/lotus-forms-v1.png) |
| lotus-SR | 莲蓬蛙 | 草 | SR | 翠风群岛 / 普通 | 普通 | 40 | 6 / 9 / 12 | 草·SR·复苏 | [源图](../../assets/resources/art/lotus-forms-v1.png) |
| lotus-SSR | 碧莲仙蛙 | 草 | SSR | 翠风群岛 / 普通 | 普通 | 46 | 8 / 11 / 14 | 草·SSR·屏障 | [源图](../../assets/resources/art/lotus-forms-v1.png) |
| manta-normal | 泡泡鳐 | 水 | R | 翠风群岛 / 普通 | 普通 | 34 | 4 / 7 / 10 | 水·R·坚守 | [源图](../../assets/resources/art/manta-forms-v1.png) |
| manta-SR | 潮纹鳐 | 水 | SR | 翠风群岛 / 普通 | 普通 | 40 | 6 / 9 / 12 | 水·SR·回春 | [源图](../../assets/resources/art/manta-forms-v1.png) |
| manta-SSR | 瀚海翼鳐 | 水 | SSR | 翠风群岛 / 普通 | 普通 | 46 | 8 / 11 / 14 | 水·SSR·蓄能 | [源图](../../assets/resources/art/manta-forms-v1.png) |
| crane-normal | 风铃鹤 | 飞行 | R | 翠风群岛 / 普通 | 普通 | 34 | 4 / 7 / 10 | 飞行·R·闪避 | [源图](../../assets/resources/art/crane-forms-v1.png) |
| crane-SR | 逐风鹤 | 飞行 | SR | 翠风群岛 / 普通 | 普通 | 40 | 6 / 9 / 12 | 飞行·SR·强击 | [源图](../../assets/resources/art/crane-forms-v1.png) |
| crane-SSR | 九霄灵鹤 | 飞行 | SSR | 翠风群岛 / 普通 | 普通 | 46 | 8 / 11 / 14 | 飞行·SSR·屏障 | [源图](../../assets/resources/art/crane-forms-v1.png) |
| mantis-normal | 叶镰螳 | 虫 | R | 翠风群岛 / 精英 | 精英 | 38 | 5 / 8 / 11 | 虫·R·汲取 | [源图](../../assets/resources/art/mantis-forms-v1.png) |
| mantis-SR | 双刃螳 | 虫 | SR | 翠风群岛 / 精英 | 精英 | 44 | 7 / 10 / 13 | 虫·SR·屏障 | [源图](../../assets/resources/art/mantis-forms-v1.png) |
| mantis-SSR | 翠甲刃皇 | 虫 | SSR | 翠风群岛 / 精英 | 精英 | 50 | 9 / 12 / 15 | 虫·SSR·回春 | [源图](../../assets/resources/art/mantis-forms-v1.png) |
| cragcrab-normal | 砂晶蟹 | 岩石 | R | 翠风群岛 / BOSS | BOSS | 42 | 6 / 9 / 12 | 岩石·R·屏障 | [源图](../../assets/resources/art/cragcrab-forms-v1.png) |
| cragcrab-SR | 晶簇蟹 | 岩石 | SR | 翠风群岛 / BOSS | BOSS | 48 | 8 / 11 / 14 | 岩石·SR·屏障 | [源图](../../assets/resources/art/cragcrab-forms-v1.png) |
| cragcrab-SSR | 磐晶蟹王 | 岩石 | SSR | 翠风群岛 / BOSS | BOSS | 54 | 10 / 13 / 16 | 岩石·SSR·不屈 | [源图](../../assets/resources/art/cragcrab-forms-v1.png) |
| cinder-normal | 炭角羊 | 火 | R | 赤雷荒原 / 普通 | 普通 | 44 | 6 / 10 / 14 | 火·R·强击 | [源图](../../assets/resources/art/cinder-forms-v1.png) |
| cinder-SR | 炽鬃羊 | 火 | SR | 赤雷荒原 / 普通 | 普通 | 50 | 8 / 12 / 16 | 火·SR·屏障 | [源图](../../assets/resources/art/cinder-forms-v1.png) |
| cinder-SSR | 熔冠炎羊 | 火 | SSR | 赤雷荒原 / 普通 | 普通 | 56 | 10 / 14 / 18 | 火·SSR·印记 | [源图](../../assets/resources/art/cinder-forms-v1.png) |
| voltage-normal | 电绒鼠 | 电 | R | 赤雷荒原 / 普通 | 普通 | 44 | 6 / 10 / 14 | 电·R·改运 | [源图](../../assets/resources/art/voltage-forms-v1.png) |
| voltage-SR | 雷跃鼠 | 电 | SR | 赤雷荒原 / 普通 | 普通 | 50 | 8 / 12 / 16 | 电·SR·力量回响 | [源图](../../assets/resources/art/voltage-forms-v1.png) |
| voltage-SSR | 极电灵鼠 | 电 | SSR | 赤雷荒原 / 普通 | 普通 | 56 | 10 / 14 / 18 | 电·SSR·强击 | [源图](../../assets/resources/art/voltage-forms-v1.png) |
| venom-normal | 紫尾蝎 | 毒 | R | 赤雷荒原 / 普通 | 普通 | 44 | 6 / 10 / 14 | 毒·R·印记 | [源图](../../assets/resources/art/venom-forms-v1.png) |
| venom-SR | 荆毒蝎 | 毒 | SR | 赤雷荒原 / 普通 | 普通 | 50 | 8 / 12 / 16 | 毒·SR·印记 | [源图](../../assets/resources/art/venom-forms-v1.png) |
| venom-SSR | 蚀毒蝎王 | 毒 | SSR | 赤雷荒原 / 普通 | 普通 | 56 | 10 / 14 / 18 | 毒·SSR·印记 | [源图](../../assets/resources/art/venom-forms-v1.png) |
| dune-normal | 沙鳞兽 | 地面 | R | 赤雷荒原 / 普通 | 普通 | 44 | 6 / 10 / 14 | 地面·R·屏障 | [源图](../../assets/resources/art/dune-forms-v1.png) |
| dune-SR | 流砂穿山兽 | 地面 | SR | 赤雷荒原 / 普通 | 普通 | 50 | 8 / 12 / 16 | 地面·SR·强击 | [源图](../../assets/resources/art/dune-forms-v1.png) |
| dune-SSR | 地脉甲尊 | 地面 | SSR | 赤雷荒原 / 普通 | 普通 | 56 | 10 / 14 / 18 | 地面·SSR·药剂回响 | [源图](../../assets/resources/art/dune-forms-v1.png) |
| monk-normal | 拳袋鼠 | 格斗 | R | 赤雷荒原 / 精英 | 精英 | 48 | 7 / 11 / 15 | 格斗·R·强击 | [源图](../../assets/resources/art/monk-forms-v1.png) |
| monk-SR | 斗篷袋鼠 | 格斗 | SR | 赤雷荒原 / 精英 | 精英 | 54 | 9 / 13 / 17 | 格斗·SR·蓄能 | [源图](../../assets/resources/art/monk-forms-v1.png) |
| monk-SSR | 震岳斗王 | 格斗 | SSR | 赤雷荒原 / 精英 | 精英 | 60 | 11 / 15 / 19 | 格斗·SSR·复苏 | [源图](../../assets/resources/art/monk-forms-v1.png) |
| ironboar-normal | 铁鼻豕 | 钢 | R | 赤雷荒原 / BOSS | BOSS | 52 | 8 / 12 / 16 | 钢·R·坚守 | [源图](../../assets/resources/art/ironboar-forms-v1.png) |
| ironboar-SR | 钢鬃战豕 | 钢 | SR | 赤雷荒原 / BOSS | BOSS | 58 | 10 / 14 / 18 | 钢·SR·屏障 | [源图](../../assets/resources/art/ironboar-forms-v1.png) |
| ironboar-SSR | 陨铁巨牙 | 钢 | SSR | 赤雷荒原 / BOSS | BOSS | 64 | 12 / 16 / 20 | 钢·SSR·坚守 | [源图](../../assets/resources/art/ironboar-forms-v1.png) |
| frost-normal | 雪耳兔 | 冰 | R | 星渊圣域 / 普通 | 普通 | 56 | 9 / 13 / 18 | 冰·R·蓄能 | [源图](../../assets/resources/art/frost-forms-v1.png) |
| frost-SR | 冰棱兔 | 冰 | SR | 星渊圣域 / 普通 | 普通 | 62 | 11 / 15 / 20 | 冰·SR·屏障 | [源图](../../assets/resources/art/frost-forms-v1.png) |
| frost-SSR | 霜冠灵兔 | 冰 | SSR | 星渊圣域 / 普通 | 普通 | 68 | 13 / 17 / 22 | 冰·SSR·强击 | [源图](../../assets/resources/art/frost-forms-v1.png) |
| spirit-normal | 幽泡灵 | 幽灵 | R | 星渊圣域 / 普通 | 普通 | 56 | 9 / 13 / 18 | 幽灵·R·闪避 | [源图](../../assets/resources/art/spirit-forms-v1.png) |
| spirit-SR | 夜灯水母 | 幽灵 | SR | 星渊圣域 / 普通 | 普通 | 62 | 11 / 15 / 20 | 幽灵·SR·汲取 | [源图](../../assets/resources/art/spirit-forms-v1.png) |
| spirit-SSR | 冥幕灯母 | 幽灵 | SSR | 星渊圣域 / 普通 | 普通 | 68 | 13 / 17 / 22 | 幽灵·SSR·强击 | [源图](../../assets/resources/art/spirit-forms-v1.png) |
| dream-normal | 梦芽貘 | 超能力 | R | 星渊圣域 / 普通 | 普通 | 56 | 9 / 13 / 18 | 超能力·R·屏障 | [源图](../../assets/resources/art/dream-forms-v1.png) |
| dream-SR | 星枕貘 | 超能力 | SR | 星渊圣域 / 普通 | 普通 | 62 | 11 / 15 / 20 | 超能力·SR·蓄能 | [源图](../../assets/resources/art/dream-forms-v1.png) |
| dream-SSR | 梦境贤貘 | 超能力 | SSR | 星渊圣域 / 普通 | 普通 | 68 | 13 / 17 / 22 | 超能力·SSR·力量回响 | [源图](../../assets/resources/art/dream-forms-v1.png) |
| shade-normal | 墨羽鸦 | 恶 | R | 星渊圣域 / 普通 | 普通 | 56 | 9 / 13 / 18 | 恶·R·强击 | [源图](../../assets/resources/art/shade-forms-v1.png) |
| shade-SR | 暮刃鸦 | 恶 | SR | 星渊圣域 / 普通 | 普通 | 62 | 11 / 15 / 20 | 恶·SR·回春 | [源图](../../assets/resources/art/shade-forms-v1.png) |
| shade-SSR | 蚀星鸦王 | 恶 | SSR | 星渊圣域 / 普通 | 普通 | 68 | 13 / 17 / 22 | 恶·SSR·汲取 | [源图](../../assets/resources/art/shade-forms-v1.png) |
| aurora-normal | 彩翎雏 | 妖精 | R | 星渊圣域 / 精英 | 精英 | 60 | 10 / 14 / 19 | 妖精·R·回春 | [源图](../../assets/resources/art/aurora-forms-v1.png) |
| aurora-SR | 幻彩孔雀 | 妖精 | SR | 星渊圣域 / 精英 | 精英 | 66 | 12 / 16 / 21 | 妖精·SR·复苏 | [源图](../../assets/resources/art/aurora-forms-v1.png) |
| aurora-SSR | 极光仙凰 | 妖精 | SSR | 星渊圣域 / 精英 | 精英 | 72 | 14 / 18 / 23 | 妖精·SSR·复苏 | [源图](../../assets/resources/art/aurora-forms-v1.png) |
| starwyrm-normal | 星鳞幼龙 | 龙 | R | 星渊圣域 / BOSS | BOSS | 64 | 11 / 15 / 20 | 龙·R·强击 | [源图](../../assets/resources/art/starwyrm-forms-v1.png) |
| starwyrm-SR | 星环游龙 | 龙 | SR | 星渊圣域 / BOSS | BOSS | 70 | 13 / 17 / 22 | 龙·SR·印记 | [源图](../../assets/resources/art/starwyrm-forms-v1.png) |
| starwyrm-SSR | 星渊龙君 | 龙 | SSR | 星渊圣域 / BOSS | BOSS | 76 | 15 / 19 / 24 | 龙·SSR·强击 | [源图](../../assets/resources/art/starwyrm-forms-v1.png) |
| nectar-normal | 蜜团睡鼠 | 一般 | R | 琉璃雨林 / 普通 | 普通 | 68 | 12 / 17 / 23 | 一般·R·强击 | [源图](../../assets/resources/art/nectar-forms-v1.png) |
| nectar-SR | 蜜袋睡鼠 | 一般 | SR | 琉璃雨林 / 普通 | 普通 | 74 | 14 / 19 / 25 | 一般·SR·改运 | [源图](../../assets/resources/art/nectar-forms-v1.png) |
| nectar-SSR | 花蜜守望鼠 | 一般 | SSR | 琉璃雨林 / 普通 | 普通 | 80 | 16 / 21 / 27 | 一般·SSR·屏障 | [源图](../../assets/resources/art/nectar-forms-v1.png) |
| orchid-normal | 兰芽壁虎 | 草 | R | 琉璃雨林 / 普通 | 普通 | 68 | 12 / 17 / 23 | 草·R·回春 | [源图](../../assets/resources/art/orchid-forms-v1.png) |
| orchid-SR | 花冠壁虎 | 草 | SR | 琉璃雨林 / 普通 | 普通 | 74 | 14 / 19 / 25 | 草·SR·复苏 | [源图](../../assets/resources/art/orchid-forms-v1.png) |
| orchid-SSR | 翠兰花龙 | 草 | SSR | 琉璃雨林 / 普通 | 普通 | 80 | 16 / 21 / 27 | 草·SSR·屏障 | [源图](../../assets/resources/art/orchid-forms-v1.png) |
| axolotl-normal | 露鳃螈 | 水 | R | 琉璃雨林 / 普通 | 普通 | 68 | 12 / 17 / 23 | 水·R·坚守 | [源图](../../assets/resources/art/axolotl-forms-v1.png) |
| axolotl-SR | 涟波螈 | 水 | SR | 琉璃雨林 / 普通 | 普通 | 74 | 14 / 19 / 25 | 水·SR·回春 | [源图](../../assets/resources/art/axolotl-forms-v1.png) |
| axolotl-SSR | 瀑冠灵螈 | 水 | SSR | 琉璃雨林 / 普通 | 普通 | 80 | 16 / 21 / 27 | 水·SSR·蓄能 | [源图](../../assets/resources/art/axolotl-forms-v1.png) |
| lantern-normal | 灯豆萤 | 虫 | R | 琉璃雨林 / 普通 | 普通 | 68 | 12 / 17 / 23 | 虫·R·汲取 | [源图](../../assets/resources/art/lantern-forms-v1.png) |
| lantern-SR | 琥灯萤 | 虫 | SR | 琉璃雨林 / 普通 | 普通 | 74 | 14 / 19 / 25 | 虫·SR·屏障 | [源图](../../assets/resources/art/lantern-forms-v1.png) |
| lantern-SSR | 曦灯萤后 | 虫 | SSR | 琉璃雨林 / 普通 | 普通 | 80 | 16 / 21 / 27 | 虫·SSR·回春 | [源图](../../assets/resources/art/lantern-forms-v1.png) |
| cobra-normal | 紫芽蛇 | 毒 | R | 琉璃雨林 / 精英 | 精英 | 72 | 13 / 18 / 24 | 毒·R·印记 | [源图](../../assets/resources/art/cobra-forms-v1.png) |
| cobra-SR | 棘冠眼镜蛇 | 毒 | SR | 琉璃雨林 / 精英 | 精英 | 78 | 15 / 20 / 26 | 毒·SR·印记 | [源图](../../assets/resources/art/cobra-forms-v1.png) |
| cobra-SSR | 蚀花蛇君 | 毒 | SSR | 琉璃雨林 / 精英 | 精英 | 84 | 17 / 22 / 28 | 毒·SSR·印记 | [源图](../../assets/resources/art/cobra-forms-v1.png) |
| hornbill-normal | 冠喙雏 | 飞行 | R | 琉璃雨林 / BOSS | BOSS | 76 | 14 / 19 / 25 | 飞行·R·闪避 | [源图](../../assets/resources/art/hornbill-forms-v1.png) |
| hornbill-SR | 风冠犀鸟 | 飞行 | SR | 琉璃雨林 / BOSS | BOSS | 82 | 16 / 21 / 27 | 飞行·SR·强击 | [源图](../../assets/resources/art/hornbill-forms-v1.png) |
| hornbill-SSR | 苍穹冠皇 | 飞行 | SSR | 琉璃雨林 / BOSS | BOSS | 88 | 18 / 23 / 29 | 飞行·SSR·屏障 | [源图](../../assets/resources/art/hornbill-forms-v1.png) |
| embercamel-normal | 炭团驼 | 火 | R | 赤曜沙海 / 普通 | 普通 | 80 | 16 / 22 / 29 | 火·R·强击 | [源图](../../assets/resources/art/embercamel-forms-v1.png) |
| embercamel-SR | 熔峰驼 | 火 | SR | 赤曜沙海 / 普通 | 普通 | 86 | 18 / 24 / 31 | 火·SR·屏障 | [源图](../../assets/resources/art/embercamel-forms-v1.png) |
| embercamel-SSR | 赤曜焰驼 | 火 | SSR | 赤曜沙海 / 普通 | 普通 | 92 | 20 / 26 / 33 | 火·SSR·印记 | [源图](../../assets/resources/art/embercamel-forms-v1.png) |
| frill-normal | 电扇蜥 | 电 | R | 赤曜沙海 / 普通 | 普通 | 80 | 16 / 22 / 29 | 电·R·改运 | [源图](../../assets/resources/art/frill-forms-v1.png) |
| frill-SR | 雷冠蜥 | 电 | SR | 赤曜沙海 / 普通 | 普通 | 86 | 18 / 24 / 31 | 电·SR·力量回响 | [源图](../../assets/resources/art/frill-forms-v1.png) |
| frill-SSR | 霆环伞蜥 | 电 | SSR | 赤曜沙海 / 普通 | 普通 | 92 | 20 / 26 / 33 | 电·SSR·强击 | [源图](../../assets/resources/art/frill-forms-v1.png) |
| wombat-normal | 砂团熊 | 地面 | R | 赤曜沙海 / 普通 | 普通 | 80 | 16 / 22 / 29 | 地面·R·屏障 | [源图](../../assets/resources/art/wombat-forms-v1.png) |
| wombat-SR | 掘岩袋熊 | 地面 | SR | 赤曜沙海 / 普通 | 普通 | 86 | 18 / 24 / 31 | 地面·SR·强击 | [源图](../../assets/resources/art/wombat-forms-v1.png) |
| wombat-SSR | 地脉堡熊 | 地面 | SSR | 赤曜沙海 / 普通 | 普通 | 92 | 20 / 26 / 33 | 地面·SSR·药剂回响 | [源图](../../assets/resources/art/wombat-forms-v1.png) |
| trilobite-normal | 砾甲虫 | 岩石 | R | 赤曜沙海 / 普通 | 普通 | 80 | 16 / 22 / 29 | 岩石·R·屏障 | [源图](../../assets/resources/art/trilobite-forms-v1.png) |
| trilobite-SR | 晶脊古虫 | 岩石 | SR | 赤曜沙海 / 普通 | 普通 | 86 | 18 / 24 / 31 | 岩石·SR·屏障 | [源图](../../assets/resources/art/trilobite-forms-v1.png) |
| trilobite-SSR | 磐古甲尊 | 岩石 | SSR | 赤曜沙海 / 普通 | 普通 | 92 | 20 / 26 / 33 | 岩石·SSR·不屈 | [源图](../../assets/resources/art/trilobite-forms-v1.png) |
| wolverine-normal | 拳爪獾 | 格斗 | R | 赤曜沙海 / 精英 | 精英 | 84 | 17 / 23 / 30 | 格斗·R·强击 | [源图](../../assets/resources/art/wolverine-forms-v1.png) |
| wolverine-SR | 赤拳战獾 | 格斗 | SR | 赤曜沙海 / 精英 | 精英 | 90 | 19 / 25 / 32 | 格斗·SR·蓄能 | [源图](../../assets/resources/art/wolverine-forms-v1.png) |
| wolverine-SSR | 震岳斗獾 | 格斗 | SSR | 赤曜沙海 / 精英 | 精英 | 96 | 21 / 27 / 34 | 格斗·SSR·复苏 | [源图](../../assets/resources/art/wolverine-forms-v1.png) |
| bison-normal | 铁角犊 | 钢 | R | 赤曜沙海 / BOSS | BOSS | 88 | 18 / 24 / 31 | 钢·R·坚守 | [源图](../../assets/resources/art/bison-forms-v1.png) |
| bison-SR | 铠峰野牛 | 钢 | SR | 赤曜沙海 / BOSS | BOSS | 94 | 20 / 26 / 33 | 钢·SR·屏障 | [源图](../../assets/resources/art/bison-forms-v1.png) |
| bison-SSR | 天铸钢牛 | 钢 | SSR | 赤曜沙海 / BOSS | BOSS | 100 | 22 / 28 / 35 | 钢·SSR·坚守 | [源图](../../assets/resources/art/bison-forms-v1.png) |
| narwhal-normal | 雪角鲸 | 冰 | R | 冥辉天穹 / 普通 | 普通 | 94 | 21 / 28 / 36 | 冰·R·蓄能 | [源图](../../assets/resources/art/narwhal-forms-v1.png) |
| narwhal-SR | 冰帆鲸 | 冰 | SR | 冥辉天穹 / 普通 | 普通 | 100 | 23 / 30 / 38 | 冰·SR·屏障 | [源图](../../assets/resources/art/narwhal-forms-v1.png) |
| narwhal-SSR | 霜冕角鲸 | 冰 | SSR | 冥辉天穹 / 普通 | 普通 | 106 | 25 / 32 / 40 | 冰·SSR·强击 | [源图](../../assets/resources/art/narwhal-forms-v1.png) |
| raccoon-normal | 幽面狸 | 幽灵 | R | 冥辉天穹 / 普通 | 普通 | 94 | 21 / 28 / 36 | 幽灵·R·闪避 | [源图](../../assets/resources/art/raccoon-forms-v1.png) |
| raccoon-SR | 夜灯灵狸 | 幽灵 | SR | 冥辉天穹 / 普通 | 普通 | 100 | 23 / 30 / 38 | 幽灵·SR·汲取 | [源图](../../assets/resources/art/raccoon-forms-v1.png) |
| raccoon-SSR | 冥面幻狸 | 幽灵 | SSR | 冥辉天穹 / 普通 | 普通 | 106 | 25 / 32 / 40 | 幽灵·SSR·强击 | [源图](../../assets/resources/art/raccoon-forms-v1.png) |
| octopus-normal | 念泡章 | 超能力 | R | 冥辉天穹 / 普通 | 普通 | 94 | 21 / 28 / 36 | 超能力·R·屏障 | [源图](../../assets/resources/art/octopus-forms-v1.png) |
| octopus-SR | 星瞳章 | 超能力 | SR | 冥辉天穹 / 普通 | 普通 | 100 | 23 / 30 / 38 | 超能力·SR·蓄能 | [源图](../../assets/resources/art/octopus-forms-v1.png) |
| octopus-SSR | 星轨贤章 | 超能力 | SSR | 冥辉天穹 / 普通 | 普通 | 106 | 25 / 32 / 40 | 超能力·SSR·力量回响 | [源图](../../assets/resources/art/octopus-forms-v1.png) |
| moonbat-normal | 暮绒蝠 | 恶 | R | 冥辉天穹 / 普通 | 普通 | 94 | 21 / 28 / 36 | 恶·R·强击 | [源图](../../assets/resources/art/moonbat-forms-v1.png) |
| moonbat-SR | 月刃蝠 | 恶 | SR | 冥辉天穹 / 普通 | 普通 | 100 | 23 / 30 / 38 | 恶·SR·回春 | [源图](../../assets/resources/art/moonbat-forms-v1.png) |
| moonbat-SSR | 蚀夜翼蝠 | 恶 | SSR | 冥辉天穹 / 普通 | 普通 | 106 | 25 / 32 / 40 | 恶·SSR·汲取 | [源图](../../assets/resources/art/moonbat-forms-v1.png) |
| silkmoth-normal | 月绒蛾 | 妖精 | R | 冥辉天穹 / 精英 | 精英 | 98 | 22 / 29 / 37 | 妖精·R·回春 | [源图](../../assets/resources/art/silkmoth-forms-v1.png) |
| silkmoth-SR | 绫月蝶蛾 | 妖精 | SR | 冥辉天穹 / 精英 | 精英 | 104 | 24 / 31 / 39 | 妖精·SR·复苏 | [源图](../../assets/resources/art/silkmoth-forms-v1.png) |
| silkmoth-SSR | 月华织梦蛾 | 妖精 | SSR | 冥辉天穹 / 精英 | 精英 | 110 | 26 / 33 / 41 | 妖精·SSR·复苏 | [源图](../../assets/resources/art/silkmoth-forms-v1.png) |
| kirin-normal | 曜角驹 | 龙 | R | 冥辉天穹 / BOSS | BOSS | 102 | 23 / 30 / 38 | 龙·R·强击 | [源图](../../assets/resources/art/kirin-forms-v1.png) |
| kirin-SR | 星鬃麒麟 | 龙 | SR | 冥辉天穹 / BOSS | BOSS | 108 | 25 / 32 / 40 | 龙·SR·印记 | [源图](../../assets/resources/art/kirin-forms-v1.png) |
| kirin-SSR | 九曜龙麟 | 龙 | SSR | 冥辉天穹 / BOSS | BOSS | 114 | 27 / 34 / 42 | 龙·SSR·强击 | [源图](../../assets/resources/art/kirin-forms-v1.png) |
| postplat-normal | 信嘴鸭兽 | 一般 | R | 好友专属 / 好友赠蛋 | 普通 | 26 | 2 / 4 / 6 | 一般·R·强击 | [源图](../../assets/resources/art/postplat-forms-v1.png) |
| postplat-SR | 邮袋鸭兽 | 一般 | SR | 好友专属 / 好友赠蛋 | 普通 | 32 | 4 / 6 / 8 | 一般·SR·改运 | [源图](../../assets/resources/art/postplat-forms-v1.png) |
| postplat-SSR | 远邮鸭兽长 | 一般 | SSR | 好友专属 / 好友赠蛋 | 普通 | 38 | 6 / 8 / 10 | 一般·SSR·屏障 | [源图](../../assets/resources/art/postplat-forms-v1.png) |
| emberhorse-normal | 烛尾海马 | 火 | R | 好友专属 / 好友赠蛋 | 普通 | 28 | 3 / 4 / 6 | 火·R·强击 | [源图](../../assets/resources/art/emberhorse-forms-v1.png) |
| emberhorse-SR | 灯焰海马 | 火 | SR | 好友专属 / 好友赠蛋 | 普通 | 34 | 5 / 6 / 8 | 火·SR·屏障 | [源图](../../assets/resources/art/emberhorse-forms-v1.png) |
| emberhorse-SSR | 赤灯海龙 | 火 | SSR | 好友专属 / 好友赠蛋 | 普通 | 40 | 7 / 8 / 10 | 火·SSR·印记 | [源图](../../assets/resources/art/emberhorse-forms-v1.png) |
| leafsloth-normal | 叶兜懒 | 草 | R | 好友专属 / 好友赠蛋 | 普通 | 30 | 2 / 4 / 6 | 草·R·回春 | [源图](../../assets/resources/art/leafsloth-forms-v1.png) |
| leafsloth-SR | 藤臂树懒 | 草 | SR | 好友专属 / 好友赠蛋 | 普通 | 36 | 4 / 6 / 8 | 草·SR·复苏 | [源图](../../assets/resources/art/leafsloth-forms-v1.png) |
| leafsloth-SSR | 古藤守懒 | 草 | SSR | 好友专属 / 好友赠蛋 | 普通 | 42 | 6 / 8 / 10 | 草·SSR·屏障 | [源图](../../assets/resources/art/leafsloth-forms-v1.png) |
| bubpup-normal | 泡鳍犬 | 水 | R | 好友专属 / 好友赠蛋 | 普通 | 32 | 3 / 4 / 6 | 水·R·坚守 | [源图](../../assets/resources/art/bubpup-forms-v1.png) |
| bubpup-SR | 浪花灵犬 | 水 | SR | 好友专属 / 好友赠蛋 | 普通 | 38 | 5 / 6 / 8 | 水·SR·回春 | [源图](../../assets/resources/art/bubpup-forms-v1.png) |
| bubpup-SSR | 瀚潮犬王 | 水 | SSR | 好友专属 / 好友赠蛋 | 普通 | 44 | 7 / 8 / 10 | 水·SSR·蓄能 | [源图](../../assets/resources/art/bubpup-forms-v1.png) |
| arceel-normal | 弧尾鳗 | 电 | R | 好友专属 / 好友赠蛋 | 普通 | 26 | 2 / 4 / 6 | 电·R·改运 | [源图](../../assets/resources/art/arceel-forms-v1.png) |
| arceel-SR | 电环鳗 | 电 | SR | 好友专属 / 好友赠蛋 | 普通 | 32 | 4 / 6 / 8 | 电·SR·力量回响 | [源图](../../assets/resources/art/arceel-forms-v1.png) |
| arceel-SSR | 霆轮雷鳗 | 电 | SSR | 好友专属 / 好友赠蛋 | 普通 | 38 | 6 / 8 / 10 | 电·SSR·强击 | [源图](../../assets/resources/art/arceel-forms-v1.png) |
| snowpeng-normal | 雪绒企鹅 | 冰 | R | 好友专属 / 好友赠蛋 | 普通 | 28 | 3 / 4 / 6 | 冰·R·蓄能 | [源图](../../assets/resources/art/snowpeng-forms-v1.png) |
| snowpeng-SR | 霜披企鹅 | 冰 | SR | 好友专属 / 好友赠蛋 | 普通 | 34 | 5 / 6 / 8 | 冰·SR·屏障 | [源图](../../assets/resources/art/snowpeng-forms-v1.png) |
| snowpeng-SSR | 冰冕帝企鹅 | 冰 | SSR | 好友专属 / 好友赠蛋 | 普通 | 40 | 7 / 8 / 10 | 冰·SSR·强击 | [源图](../../assets/resources/art/snowpeng-forms-v1.png) |
| punchshrimp-normal | 拳钳虾 | 格斗 | R | 好友专属 / 好友赠蛋 | 普通 | 30 | 2 / 4 / 6 | 格斗·R·强击 | [源图](../../assets/resources/art/punchshrimp-forms-v1.png) |
| punchshrimp-SR | 裂潮拳虾 | 格斗 | SR | 好友专属 / 好友赠蛋 | 普通 | 36 | 4 / 6 / 8 | 格斗·SR·蓄能 | [源图](../../assets/resources/art/punchshrimp-forms-v1.png) |
| punchshrimp-SSR | 霸拳龙虾 | 格斗 | SSR | 好友专属 / 好友赠蛋 | 普通 | 42 | 6 / 8 / 10 | 格斗·SSR·复苏 | [源图](../../assets/resources/art/punchshrimp-forms-v1.png) |
| velvetslug-normal | 彩绒海蛞 | 毒 | R | 好友专属 / 好友赠蛋 | 普通 | 32 | 3 / 4 / 6 | 毒·R·印记 | [源图](../../assets/resources/art/velvetslug-forms-v1.png) |
| velvetslug-SR | 毒羽海蛞 | 毒 | SR | 好友专属 / 好友赠蛋 | 普通 | 38 | 5 / 6 / 8 | 毒·SR·印记 | [源图](../../assets/resources/art/velvetslug-forms-v1.png) |
| velvetslug-SSR | 鸩绒海蛞王 | 毒 | SSR | 好友专属 / 好友赠蛋 | 普通 | 44 | 7 / 8 / 10 | 毒·SSR·印记 | [源图](../../assets/resources/art/velvetslug-forms-v1.png) |
| sandlion-normal | 沙漏蚁狮 | 地面 | R | 好友专属 / 好友赠蛋 | 普通 | 26 | 2 / 4 / 6 | 地面·R·屏障 | [源图](../../assets/resources/art/sandlion-forms-v1.png) |
| sandlion-SR | 陷沙蚁狮 | 地面 | SR | 好友专属 / 好友赠蛋 | 普通 | 32 | 4 / 6 / 8 | 地面·SR·强击 | [源图](../../assets/resources/art/sandlion-forms-v1.png) |
| sandlion-SSR | 砂渊蚁狮皇 | 地面 | SSR | 好友专属 / 好友赠蛋 | 普通 | 38 | 6 / 8 / 10 | 地面·SSR·药剂回响 | [源图](../../assets/resources/art/sandlion-forms-v1.png) |
| sailfrigate-normal | 帆喉雏 | 飞行 | R | 好友专属 / 好友赠蛋 | 普通 | 28 | 3 / 4 / 6 | 飞行·R·闪避 | [源图](../../assets/resources/art/sailfrigate-forms-v1.png) |
| sailfrigate-SR | 巡风军舰鸟 | 飞行 | SR | 好友专属 / 好友赠蛋 | 普通 | 34 | 5 / 6 / 8 | 飞行·SR·强击 | [源图](../../assets/resources/art/sailfrigate-forms-v1.png) |
| sailfrigate-SSR | 长空帆翼王 | 飞行 | SSR | 好友专属 / 好友赠蛋 | 普通 | 40 | 7 / 8 / 10 | 飞行·SSR·屏障 | [源图](../../assets/resources/art/sailfrigate-forms-v1.png) |
| orbitphant-normal | 念鼻象 | 超能力 | R | 好友专属 / 好友赠蛋 | 普通 | 30 | 2 / 4 / 6 | 超能力·R·屏障 | [源图](../../assets/resources/art/orbitphant-forms-v1.png) |
| orbitphant-SR | 星轮灵象 | 超能力 | SR | 好友专属 / 好友赠蛋 | 普通 | 36 | 4 / 6 / 8 | 超能力·SR·蓄能 | [源图](../../assets/resources/art/orbitphant-forms-v1.png) |
| orbitphant-SSR | 天仪贤象 | 超能力 | SSR | 好友专属 / 好友赠蛋 | 普通 | 42 | 6 / 8 / 10 | 超能力·SSR·力量回响 | [源图](../../assets/resources/art/orbitphant-forms-v1.png) |
| twigbug-normal | 嫩枝竹节虫 | 虫 | R | 好友专属 / 好友赠蛋 | 普通 | 32 | 3 / 4 / 6 | 虫·R·汲取 | [源图](../../assets/resources/art/twigbug-forms-v1.png) |
| twigbug-SR | 叶刃竹节虫 | 虫 | SR | 好友专属 / 好友赠蛋 | 普通 | 38 | 5 / 6 / 8 | 虫·SR·屏障 | [源图](../../assets/resources/art/twigbug-forms-v1.png) |
| twigbug-SSR | 翠庭枝皇 | 虫 | SSR | 好友专属 / 好友赠蛋 | 普通 | 44 | 7 / 8 / 10 | 虫·SSR·回春 | [源图](../../assets/resources/art/twigbug-forms-v1.png) |
| gemnautilus-normal | 砾壳鹦螺 | 岩石 | R | 好友专属 / 好友赠蛋 | 普通 | 26 | 2 / 4 / 6 | 岩石·R·屏障 | [源图](../../assets/resources/art/gemnautilus-forms-v1.png) |
| gemnautilus-SR | 晶旋鹦螺 | 岩石 | SR | 好友专属 / 好友赠蛋 | 普通 | 32 | 4 / 6 / 8 | 岩石·SR·屏障 | [源图](../../assets/resources/art/gemnautilus-forms-v1.png) |
| gemnautilus-SSR | 磐轮古螺 | 岩石 | SSR | 好友专属 / 好友赠蛋 | 普通 | 38 | 6 / 8 / 10 | 岩石·SSR·不屈 | [源图](../../assets/resources/art/gemnautilus-forms-v1.png) |
| shroudsprite-normal | 纱灯灵 | 幽灵 | R | 好友专属 / 好友赠蛋 | 普通 | 28 | 3 / 4 / 6 | 幽灵·R·闪避 | [源图](../../assets/resources/art/shroudsprite-forms-v1.png) |
| shroudsprite-SR | 夜幕纱灵 | 幽灵 | SR | 好友专属 / 好友赠蛋 | 普通 | 34 | 5 / 6 / 8 | 幽灵·SR·汲取 | [源图](../../assets/resources/art/shroudsprite-forms-v1.png) |
| shroudsprite-SSR | 冥纱织主 | 幽灵 | SSR | 好友专属 / 好友赠蛋 | 普通 | 40 | 7 / 8 / 10 | 幽灵·SSR·强击 | [源图](../../assets/resources/art/shroudsprite-forms-v1.png) |
| quillwyvern-normal | 羽角幼龙 | 龙 | R | 好友专属 / 好友赠蛋 | 普通 | 30 | 2 / 4 / 6 | 龙·R·强击 | [源图](../../assets/resources/art/quillwyvern-forms-v1.png) |
| quillwyvern-SR | 棘羽翼龙 | 龙 | SR | 好友专属 / 好友赠蛋 | 普通 | 36 | 4 / 6 / 8 | 龙·SR·印记 | [源图](../../assets/resources/art/quillwyvern-forms-v1.png) |
| quillwyvern-SSR | 苍翎龙皇 | 龙 | SSR | 好友专属 / 好友赠蛋 | 普通 | 42 | 6 / 8 / 10 | 龙·SSR·强击 | [源图](../../assets/resources/art/quillwyvern-forms-v1.png) |
| nightmeerkat-normal | 夜哨獴 | 恶 | R | 好友专属 / 好友赠蛋 | 普通 | 32 | 3 / 4 / 6 | 恶·R·强击 | [源图](../../assets/resources/art/nightmeerkat-forms-v1.png) |
| nightmeerkat-SR | 影衣哨獴 | 恶 | SR | 好友专属 / 好友赠蛋 | 普通 | 38 | 5 / 6 / 8 | 恶·SR·回春 | [源图](../../assets/resources/art/nightmeerkat-forms-v1.png) |
| nightmeerkat-SSR | 暮巡哨獴王 | 恶 | SSR | 好友专属 / 好友赠蛋 | 普通 | 44 | 7 / 8 / 10 | 恶·SSR·汲取 | [源图](../../assets/resources/art/nightmeerkat-forms-v1.png) |
| railpede-normal | 铜节虫 | 钢 | R | 好友专属 / 好友赠蛋 | 普通 | 26 | 2 / 4 / 6 | 钢·R·坚守 | [源图](../../assets/resources/art/railpede-forms-v1.png) |
| railpede-SR | 铁轨百足 | 钢 | SR | 好友专属 / 好友赠蛋 | 普通 | 32 | 4 / 6 / 8 | 钢·SR·屏障 | [源图](../../assets/resources/art/railpede-forms-v1.png) |
| railpede-SSR | 铂城千足王 | 钢 | SSR | 好友专属 / 好友赠蛋 | 普通 | 38 | 6 / 8 / 10 | 钢·SSR·坚守 | [源图](../../assets/resources/art/railpede-forms-v1.png) |
| peachflamingo-normal | 桃绒鹭 | 妖精 | R | 好友专属 / 好友赠蛋 | 普通 | 28 | 3 / 4 / 6 | 妖精·R·回春 | [源图](../../assets/resources/art/peachflamingo-forms-v1.png) |
| peachflamingo-SR | 绯羽灵鹭 | 妖精 | SR | 好友专属 / 好友赠蛋 | 普通 | 34 | 5 / 6 / 8 | 妖精·SR·复苏 | [源图](../../assets/resources/art/peachflamingo-forms-v1.png) |
| peachflamingo-SSR | 花冕仙鹭 | 妖精 | SSR | 好友专属 / 好友赠蛋 | 普通 | 40 | 7 / 8 / 10 | 妖精·SSR·复苏 | [源图](../../assets/resources/art/peachflamingo-forms-v1.png) |
| oracleater-normal | 祈纹食蚁兽 | 一般 | R | 圣枝云庭 / 普通 | 普通 | 110 | 26 / 34 / 43 | 探梦长吻 | [源图](../../assets/resources/art/oracleater-forms-v1.png) |
| oracleater-SR | 梦庭守蚁兽 | 一般 | SR | 圣枝云庭 / 普通 | 普通 | 116 | 28 / 36 / 45 | 回药祷言 | [源图](../../assets/resources/art/oracleater-forms-v1.png) |
| oracleater-SSR | 天谕食蚁神 | 一般 | SSR | 圣枝云庭 / 普通 | 普通 | 122 | 30 / 38 / 47 | 周梦回生 | [源图](../../assets/resources/art/oracleater-forms-v1.png) |
| mandragrove-normal | 树咒芽灵 | 草 | R | 圣枝云庭 / 普通 | 普通 | 110 | 26 / 34 / 43 | 根饮 | [源图](../../assets/resources/art/mandragrove-forms-v1.png) |
| mandragrove-SR | 古根树卫 | 草 | SR | 圣枝云庭 / 普通 | 普通 | 116 | 28 / 36 / 45 | 棘露 | [源图](../../assets/resources/art/mandragrove-forms-v1.png) |
| mandragrove-SSR | 万枝森祖 | 草 | SSR | 圣枝云庭 / 普通 | 普通 | 122 | 30 / 38 / 47 | 古森庇荫 | [源图](../../assets/resources/art/mandragrove-forms-v1.png) |
| ribbonoar-normal | 绸冠带鱼 | 水 | R | 圣枝云庭 / 普通 | 普通 | 110 | 26 / 34 / 43 | 流光回潮 | [源图](../../assets/resources/art/ribbonoar-forms-v1.png) |
| ribbonoar-SR | 霓流皇带鱼 | 水 | SR | 圣枝云庭 / 普通 | 普通 | 116 | 28 / 36 / 45 | 潮赠 | [源图](../../assets/resources/art/ribbonoar-forms-v1.png) |
| ribbonoar-SSR | 沧穹绸龙 | 水 | SSR | 圣枝云庭 / 普通 | 普通 | 122 | 30 / 38 / 47 | 绸冠水幕 | [源图](../../assets/resources/art/ribbonoar-forms-v1.png) |
| sixwing-normal | 六翎信天雏 | 飞行 | R | 圣枝云庭 / 普通 | 普通 | 110 | 26 / 34 / 43 | 天羽叠屏 | [源图](../../assets/resources/art/sixwing-forms-v1.png) |
| sixwing-SR | 巡云六翼鸟 | 飞行 | SR | 圣枝云庭 / 普通 | 普通 | 116 | 28 / 36 / 45 | 顺风回旋 | [源图](../../assets/resources/art/sixwing-forms-v1.png) |
| sixwing-SSR | 苍空六翼神 | 飞行 | SSR | 圣枝云庭 / 普通 | 普通 | 122 | 30 / 38 / 47 | 六翼掠影 | [源图](../../assets/resources/art/sixwing-forms-v1.png) |
| glassdarner-normal | 琉翅蜻 | 虫 | R | 圣枝云庭 / 精英 | 精英 | 114 | 27 / 35 / 44 | 透镜毒针 | [源图](../../assets/resources/art/glassdarner-forms-v1.png) |
| glassdarner-SR | 镜翼蜓卫 | 虫 | SR | 圣枝云庭 / 精英 | 精英 | 120 | 29 / 37 / 46 | 碎光晶尘 | [源图](../../assets/resources/art/glassdarner-forms-v1.png) |
| glassdarner-SSR | 万镜神蜓 | 虫 | SSR | 圣枝云庭 / 精英 | 精英 | 126 | 31 / 39 / 48 | 千镜虹吸 | [源图](../../assets/resources/art/glassdarner-forms-v1.png) |
| cairnheart-normal | 叠石幼灵 | 岩石 | R | 圣枝云庭 / BOSS | BOSS | 118 | 28 / 36 / 45 | 满垒 | [源图](../../assets/resources/art/cairnheart-forms-v1.png) |
| cairnheart-SR | 重岩塔卫 | 岩石 | SR | 圣枝云庭 / BOSS | BOSS | 124 | 30 / 38 / 47 | 叠岩缓冲 | [源图](../../assets/resources/art/cairnheart-forms-v1.png) |
| cairnheart-SSR | 山岳碑神 | 岩石 | SSR | 圣枝云庭 / BOSS | BOSS | 130 | 32 / 40 / 49 | 镇岳不动 | [源图](../../assets/resources/art/cairnheart-forms-v1.png) |
| solion-normal | 日绒狮 | 火 | R | 万象神炉 / 普通 | 普通 | 128 | 32 / 41 / 51 | 温阳火种 | [源图](../../assets/resources/art/solion-forms-v1.png) |
| solion-SR | 曜鬃圣狮 | 火 | SR | 万象神炉 / 普通 | 普通 | 134 | 34 / 43 / 53 | 曜鬃灼印 | [源图](../../assets/resources/art/solion-forms-v1.png) |
| solion-SSR | 日冕狮神 | 火 | SSR | 万象神炉 / 普通 | 普通 | 140 | 36 / 45 / 55 | 日冕噬焰 | [源图](../../assets/resources/art/solion-forms-v1.png) |
| drumthunder-normal | 雷鼓灵 | 电 | R | 万象神炉 / 普通 | 普通 | 128 | 32 / 41 / 51 | 回声鼓障 | [源图](../../assets/resources/art/drumthunder-forms-v1.png) |
| drumthunder-SR | 震霆鼓卫 | 电 | SR | 万象神炉 / 普通 | 普通 | 134 | 34 / 43 / 53 | 雷雨鼓点 | [源图](../../assets/resources/art/drumthunder-forms-v1.png) |
| drumthunder-SSR | 万雷司鼓神 | 电 | SSR | 万象神炉 / 普通 | 普通 | 140 | 36 / 45 / 55 | 凯旋震鼓 | [源图](../../assets/resources/art/drumthunder-forms-v1.png) |
| crystalmedusa-normal | 毒晶浮母 | 毒 | R | 万象神炉 / 普通 | 普通 | 128 | 32 / 41 / 51 | 反棱毒刺 | [源图](../../assets/resources/art/crystalmedusa-forms-v1.png) |
| crystalmedusa-SR | 紫棱冥母 | 毒 | SR | 万象神炉 / 普通 | 普通 | 134 | 34 / 43 / 53 | 冥晶毒潮 | [源图](../../assets/resources/art/crystalmedusa-forms-v1.png) |
| crystalmedusa-SSR | 万毒晶后 | 毒 | SSR | 万象神炉 / 普通 | 普通 | 140 | 36 / 45 / 55 | 万毒汲流 | [源图](../../assets/resources/art/crystalmedusa-forms-v1.png) |
| ringolin-normal | 环甲小兽 | 地面 | R | 万象神炉 / 普通 | 普通 | 128 | 32 / 41 / 51 | 轮缘甲障 | [源图](../../assets/resources/art/ringolin-forms-v1.png) |
| ringolin-SR | 地轮甲卫 | 地面 | SR | 万象神炉 / 普通 | 普通 | 134 | 34 / 43 / 53 | 地轮蓄势 | [源图](../../assets/resources/art/ringolin-forms-v1.png) |
| ringolin-SSR | 环陆镇岳兽 | 地面 | SSR | 万象神炉 / 普通 | 普通 | 140 | 36 / 45 / 55 | 万环壁垒 | [源图](../../assets/resources/art/ringolin-forms-v1.png) |
| maskasura-normal | 双拳面灵 | 格斗 | R | 万象神炉 / 精英 | 精英 | 132 | 33 / 42 / 52 | 起手神印 | [源图](../../assets/resources/art/maskasura-forms-v1.png) |
| maskasura-SR | 四臂面卫 | 格斗 | SR | 万象神炉 / 精英 | 精英 | 138 | 35 / 44 / 54 | 破御擒拿 | [源图](../../assets/resources/art/maskasura-forms-v1.png) |
| maskasura-SSR | 六臂武神 | 格斗 | SSR | 万象神炉 / 精英 | 精英 | 144 | 37 / 46 / 56 | 六臂护法 | [源图](../../assets/resources/art/maskasura-forms-v1.png) |
| starhorseshoe-normal | 星甲鲎 | 钢 | R | 万象神炉 / BOSS | BOSS | 136 | 34 / 43 / 53 | 启航护场 | [源图](../../assets/resources/art/starhorseshoe-forms-v1.png) |
| starhorseshoe-SR | 舷盾重鲎 | 钢 | SR | 万象神炉 / BOSS | BOSS | 142 | 36 / 45 / 55 | 舷灯急修 | [源图](../../assets/resources/art/starhorseshoe-forms-v1.png) |
| starhorseshoe-SSR | 穹舰神鲎 | 钢 | SSR | 万象神炉 / BOSS | BOSS | 148 | 38 / 47 / 57 | 穹舰装甲 | [源图](../../assets/resources/art/starhorseshoe-forms-v1.png) |
| frostfan-normal | 雪屏雏 | 冰 | R | 太初星界 / 普通 | 普通 | 148 | 39 / 49 / 60 | 凝冰预兆 | [源图](../../assets/resources/art/frostfan-forms-v1.png) |
| frostfan-SR | 霜扇孔雀 | 冰 | SR | 太初星界 / 普通 | 普通 | 154 | 41 / 51 / 62 | 羽扇冰障 | [源图](../../assets/resources/art/frostfan-forms-v1.png) |
| frostfan-SSR | 冰阙屏王 | 冰 | SSR | 太初星界 / 普通 | 普通 | 160 | 43 / 53 / 64 | 霜心再生 | [源图](../../assets/resources/art/frostfan-forms-v1.png) |
| origamighost-normal | 折纸幽灵 | 幽灵 | R | 太初星界 / 普通 | 普通 | 148 | 39 / 49 / 60 | 纸隙遁影 | [源图](../../assets/resources/art/origamighost-forms-v1.png) |
| origamighost-SR | 千折纸使 | 幽灵 | SR | 太初星界 / 普通 | 普通 | 154 | 41 / 51 / 62 | 折页蓄愿 | [源图](../../assets/resources/art/origamighost-forms-v1.png) |
| origamighost-SSR | 冥卷纸神 | 幽灵 | SSR | 太初星界 / 普通 | 普通 | 160 | 43 / 53 / 64 | 返魂长卷 | [源图](../../assets/resources/art/origamighost-forms-v1.png) |
| orbeholder-normal | 星瞳球 | 超能力 | R | 太初星界 / 普通 | 普通 | 148 | 39 / 49 / 60 | 星瞳调息 | [源图](../../assets/resources/art/orbeholder-forms-v1.png) |
| orbeholder-SR | 悬环星仪 | 超能力 | SR | 太初星界 / 普通 | 普通 | 154 | 41 / 51 / 62 | 双环祝福 | [源图](../../assets/resources/art/orbeholder-forms-v1.png) |
| orbeholder-SSR | 天测独眼神 | 超能力 | SSR | 太初星界 / 普通 | 普通 | 160 | 43 / 53 / 64 | 天仪回转 | [源图](../../assets/resources/art/orbeholder-forms-v1.png) |
| eclipsehydra-normal | 双吻影蛇 | 恶 | R | 太初星界 / 普通 | 普通 | 148 | 39 / 49 / 60 | 伏影毒牙 | [源图](../../assets/resources/art/eclipsehydra-forms-v1.png) |
| eclipsehydra-SR | 噬月双首蛇 | 恶 | SR | 太初星界 / 普通 | 普通 | 154 | 41 / 51 / 62 | 双首蚀魂 | [源图](../../assets/resources/art/eclipsehydra-forms-v1.png) |
| eclipsehydra-SSR | 蚀天双首神蛇 | 恶 | SSR | 太初星界 / 普通 | 普通 | 160 | 43 / 53 / 64 | 吞月回生 | [源图](../../assets/resources/art/eclipsehydra-forms-v1.png) |
| bloomgiraffe-normal | 花角长颈兽 | 妖精 | R | 太初星界 / 精英 | 精英 | 152 | 40 / 50 / 61 | 花露补给 | [源图](../../assets/resources/art/bloomgiraffe-forms-v1.png) |
| bloomgiraffe-SR | 圣庭花冠兽 | 妖精 | SR | 太初星界 / 精英 | 精英 | 158 | 42 / 52 / 63 | 香冠回响 | [源图](../../assets/resources/art/bloomgiraffe-forms-v1.png) |
| bloomgiraffe-SSR | 天苑长颈神 | 妖精 | SSR | 太初星界 / 精英 | 精英 | 164 | 44 / 54 / 65 | 天苑恩泽 | [源图](../../assets/resources/art/bloomgiraffe-forms-v1.png) |
| triarchdrake-normal | 三角幼龙 | 龙 | R | 太初星界 / BOSS | BOSS | 156 | 41 / 51 / 62 | 幼龙棘息 | [源图](../../assets/resources/art/triarchdrake-forms-v1.png) |
| triarchdrake-SR | 双首翼龙 | 龙 | SR | 太初星界 / BOSS | BOSS | 162 | 43 / 53 / 64 | 双曜蓄守 | [源图](../../assets/resources/art/triarchdrake-forms-v1.png) |
| triarchdrake-SSR | 三曜太古龙 | 龙 | SSR | 太初星界 / BOSS | BOSS | 168 | 45 / 55 / 66 | 三首共噬 | [源图](../../assets/resources/art/triarchdrake-forms-v1.png) |

## 技能机制

| 代码 | 名称 | 效果 |
| --- | --- | --- |
| opening | 抢先一击 | 首次攻击额外造成 2 点伤害。 |
| armor | 硬壳 | 首次受击减少 2 点伤害，至少受到 1 点。 |
| healing | 草木祝福 | 首次使用生命药水额外恢复 2 点生命。 |
| steady | 稳定发挥 | 首次掷出最低攻击点数，自动变为中间点数。 |
| repeat | 连锁电流 | 首次连续两回合攻击点数相同，后一次变为最高点数。 |
| charged | 力量共鸣 | 首次使用力量药水，攻击点数变为最高，再计算药水倍率。 |
| focus | 蓄势反击 | 首次防御后，下回合攻击必定为最高点数。 |
| barrier | 坚垒 | 首次防御获得 6 点护盾，可跨回合抵消伤害。 |
| overflow | 泡泡护盾 | 首次生命药水产生溢出治疗时，溢出部分变为护盾，最多 6 点。 |
| refund | 药水回响 | 首次生命药水不消耗库存；每回合仍只能使用一次。 |
| emergency | 生命绽放 | 首次受击后存活且生命不超过 30%，自动恢复最大生命的 25%。 |
| venom | 毒素印记 | 首次攻击施毒，本次及随后两次行动结束时各造成 2 点伤害。 |
| heavy | 三连重击 | 第三次攻击额外造成 4 点伤害。 |
| slow | 霜羽压制 | 首次攻击令本次反击伤害减少 2，至少受到 1 点。 |
| evade | 幻影守护 | 首次敌方反击完全免伤。 |
| leech | 生命汲取 | 首次攻击恢复其实际直接伤害的 20%（向上取整），不超过最大生命的 25%。 |
| tm_healStrike | 回春击 | 攻击时：恢复生命 +4。每场一次。 |
| tm_guardHeal | 休整防御 | 防御时：恢复生命 +6。每场一次。 |
| tm_boostShield | 强化屏障 | 使用力量药水时：获得护盾 +5。每场一次。 |
| tm_healPower | 治愈蓄能 | 使用生命药水时：下回合攻击取最高点数。每场一次。 |
| tm_finisher | 追击招式 | 攻击时 · 敌人生命不超过50%：额外伤害 +5。每场一次。 |
| tm_lastStand | 不屈招式 | 受到反击时 · 将受到致命伤害：本次保留1点生命。每场一次。 |
| tm_firstShield | 开场护盾 | 掷骰时 · 本场首次掷骰：获得护盾 +4。每场一次。 |
| tm_combo | 连击恢复 | 攻击时 · 第三次攻击时：恢复生命 +5。每场一次。 |
| res_bloom | 共鸣·花盾 | 使用生命药水时：恢复生命及护盾各 +4。每场一次。 |
| res_venom | 共鸣·蚀魂 | 攻击时：汲取25%伤害并施毒3次，每次3点。每场一次。 |
| res_drive | 共鸣·蓄壁 | 防御时：获得护盾 +5，下回合最高点数。每场一次。 |
| trait_0_0 | 一般·R·强击 | 攻击时：额外伤害 +2。每场一次。 |
| trait_0_1 | 一般·SR·改运 | 掷骰时 · 点数与上回合相同：本次攻击取最高点数。每场一次。 |
| trait_0_2 | 一般·SSR·屏障 | 攻击时 · 第三次攻击时：获得护盾 +8。每场一次。 |
| trait_1_0 | 火·R·强击 | 攻击时 · 力量药水生效时：额外伤害 +3。每场一次。 |
| trait_1_1 | 火·SR·屏障 | 使用力量药水时：获得护盾 +6。每场一次。 |
| trait_1_2 | 火·SSR·印记 | 攻击时 · 第三次攻击时：施毒3次，每次伤害 4。每场一次。 |
| trait_2_0 | 水·R·坚守 | 受到反击时：本次伤害减少 2。每场一次。 |
| trait_2_1 | 水·SR·回春 | 防御时：恢复生命 +5。每场一次。 |
| trait_2_2 | 水·SSR·蓄能 | 使用生命药水时：下回合攻击取最高点数。每场一次。 |
| trait_3_0 | 电·R·改运 | 掷骰时 · 攻击点数为最低：本次攻击取最高点数。每场一次。 |
| trait_3_1 | 电·SR·力量回响 | 使用力量药水时：力量药水 +1。每场一次。 |
| trait_3_2 | 电·SSR·强击 | 攻击时 · 第三次攻击时：额外伤害 +8。每场一次。 |
| trait_4_0 | 草·R·回春 | 使用生命药水时：恢复生命 +3。每场一次。 |
| trait_4_1 | 草·SR·复苏 | 受到反击时 · 生命不超过50%：恢复最大生命 30%。每场一次。 |
| trait_4_2 | 草·SSR·屏障 | 攻击时 · 满血时：获得护盾 +7。每场一次。 |
| trait_5_0 | 冰·R·蓄能 | 攻击时：下回合攻击取最高点数。每场一次。 |
| trait_5_1 | 冰·SR·屏障 | 受到反击时 · 满血时：获得护盾 +6。每场一次。 |
| trait_5_2 | 冰·SSR·强击 | 攻击时 · 攻击点数为最低：额外伤害 +9。每场一次。 |
| trait_6_0 | 格斗·R·强击 | 攻击时 · 生命不超过50%：额外伤害 +4。每场一次。 |
| trait_6_1 | 格斗·SR·蓄能 | 防御时：下回合攻击取最高点数。每场一次。 |
| trait_6_2 | 格斗·SSR·复苏 | 攻击时 · 第三次攻击时：恢复最大生命 35%。每场一次。 |
| trait_7_0 | 毒·R·印记 | 攻击时：施毒3次，每次伤害 2。每场一次。 |
| trait_7_1 | 毒·SR·印记 | 攻击时 · 敌人生命不超过50%：施毒3次，每次伤害 4。每场一次。 |
| trait_7_2 | 毒·SSR·印记 | 受到反击时 · 生命不超过50%：施毒3次，每次伤害 6。每场一次。 |
| trait_8_0 | 地面·R·屏障 | 受到反击时 · 本次选择防御：获得护盾 +3。每场一次。 |
| trait_8_1 | 地面·SR·强击 | 攻击时 · 攻击点数为最低：额外伤害 +4。每场一次。 |
| trait_8_2 | 地面·SSR·药剂回响 | 防御时：生命药水 +1。每场一次。 |
| trait_9_0 | 飞行·R·闪避 | 受到反击时 · 满血时：免疫本次反击。每场一次。 |
| trait_9_1 | 飞行·SR·强击 | 攻击时 · 满血时：额外伤害 +3。每场一次。 |
| trait_9_2 | 飞行·SSR·屏障 | 掷骰时 · 本场首次掷骰：获得护盾 +10。每场一次。 |
| trait_10_0 | 超能力·R·屏障 | 掷骰时 · 攻击点数为最低：获得护盾 +3。每场一次。 |
| trait_10_1 | 超能力·SR·蓄能 | 使用力量药水时：下回合攻击取最高点数。每场一次。 |
| trait_10_2 | 超能力·SSR·力量回响 | 使用生命药水时：力量药水 +1。每场一次。 |
| trait_11_0 | 虫·R·汲取 | 攻击时：恢复实际伤害的 25%。每场一次。 |
| trait_11_1 | 虫·SR·屏障 | 使用生命药水时：获得护盾 +5。每场一次。 |
| trait_11_2 | 虫·SSR·回春 | 受到反击时 · 生命不超过50%：恢复生命 +8。每场一次。 |
| trait_12_0 | 岩石·R·屏障 | 受到反击时：获得护盾 +3。每场一次。 |
| trait_12_1 | 岩石·SR·屏障 | 防御时：获得护盾 +8。每场一次。 |
| trait_12_2 | 岩石·SSR·不屈 | 受到反击时 · 将受到致命伤害：本次保留1点生命。每场一次。 |
| trait_13_0 | 幽灵·R·闪避 | 受到反击时 · 生命不超过50%：免疫本次反击。每场一次。 |
| trait_13_1 | 幽灵·SR·汲取 | 攻击时 · 敌人生命不超过50%：恢复实际伤害的 60%。每场一次。 |
| trait_13_2 | 幽灵·SSR·强击 | 攻击时 · 本次攻击被抵抗：额外伤害 +7。每场一次。 |
| trait_14_0 | 龙·R·强击 | 攻击时 · 攻击点数为最高：额外伤害 +3。每场一次。 |
| trait_14_1 | 龙·SR·印记 | 攻击时 · 力量药水生效时：施毒3次，每次伤害 5。每场一次。 |
| trait_14_2 | 龙·SSR·强击 | 攻击时：额外伤害 +6。每场一次。 |
| trait_15_0 | 恶·R·强击 | 攻击时 · 敌人生命不超过50%：额外伤害 +3。每场一次。 |
| trait_15_1 | 恶·SR·回春 | 使用力量药水时：恢复生命 +5。每场一次。 |
| trait_15_2 | 恶·SSR·汲取 | 攻击时 · 攻击点数为最高：恢复实际伤害的 50%。每场一次。 |
| trait_16_0 | 钢·R·坚守 | 受到反击时 · 满血时：本次伤害减少 3。每场一次。 |
| trait_16_1 | 钢·SR·屏障 | 防御时：获得护盾 +10。每场一次。 |
| trait_16_2 | 钢·SSR·坚守 | 受到反击时：本次伤害减少 6。每场一次。 |
| trait_17_0 | 妖精·R·回春 | 掷骰时 · 本场首次掷骰：恢复生命 +3。每场一次。 |
| trait_17_1 | 妖精·SR·复苏 | 使用生命药水时 · 生命不超过50%：恢复最大生命 25%。每场一次。 |
| trait_17_2 | 妖精·SSR·复苏 | 防御时：恢复最大生命 40%。每场一次。 |
| trait_legendary_oracleater_0 | 探梦长吻 | 攻击时 · 攻击点数为最低：恢复实际伤害的 35%。每场一次。 |
| trait_legendary_oracleater_1 | 回药祷言 | 使用生命药水时：生命药水 +1。每场一次。 |
| trait_legendary_oracleater_2 | 周梦回生 | 掷骰时 · 点数与上回合相同：恢复最大生命 25%。每场一次。 |
| trait_legendary_mandragrove_0 | 根饮 | 防御时 · 生命不超过50%：恢复最大生命 20%。每场一次。 |
| trait_legendary_mandragrove_1 | 棘露 | 使用生命药水时：施毒3次，每次伤害 4。每场一次。 |
| trait_legendary_mandragrove_2 | 古森庇荫 | 受到反击时 · 本次选择防御：恢复最大生命 30%。每场一次。 |
| trait_legendary_ribbonoar_0 | 流光回潮 | 攻击时 · 攻击点数为最高：恢复生命 +12。每场一次。 |
| trait_legendary_ribbonoar_1 | 潮赠 | 防御时：力量药水 +1。每场一次。 |
| trait_legendary_ribbonoar_2 | 绸冠水幕 | 使用生命药水时 · 攻击点数为最高：获得护盾 +24。每场一次。 |
| trait_legendary_sixwing_0 | 天羽叠屏 | 掷骰时 · 攻击点数为最高：获得护盾 +9。每场一次。 |
| trait_legendary_sixwing_1 | 顺风回旋 | 攻击时 · 满血时：下回合攻击取最高点数。每场一次。 |
| trait_legendary_sixwing_2 | 六翼掠影 | 受到反击时 · 攻击点数为最高：免疫本次反击。每场一次。 |
| trait_legendary_glassdarner_0 | 透镜毒针 | 攻击时 · 本次攻击被抵抗：施毒3次，每次伤害 4。每场一次。 |
| trait_legendary_glassdarner_1 | 碎光晶尘 | 掷骰时 · 攻击点数为最低：施毒3次，每次伤害 5。每场一次。 |
| trait_legendary_glassdarner_2 | 千镜虹吸 | 攻击时 · 力量药水生效时：恢复实际伤害的 60%。每场一次。 |
| trait_legendary_cairnheart_0 | 满垒 | 防御时 · 满血时：获得护盾 +18。每场一次。 |
| trait_legendary_cairnheart_1 | 叠岩缓冲 | 受到反击时 · 攻击点数为最低：本次伤害减少 10。每场一次。 |
| trait_legendary_cairnheart_2 | 镇岳不动 | 受到反击时 · 生命不超过50%：本次伤害减少 16。每场一次。 |
| trait_legendary_solion_0 | 温阳火种 | 使用力量药水时 · 生命不超过50%：恢复最大生命 20%。每场一次。 |
| trait_legendary_solion_1 | 曜鬃灼印 | 攻击时 · 攻击点数为最高：施毒3次，每次伤害 6。每场一次。 |
| trait_legendary_solion_2 | 日冕噬焰 | 攻击时 · 生命不超过50%：恢复实际伤害的 80%。每场一次。 |
| trait_legendary_drumthunder_0 | 回声鼓障 | 掷骰时 · 点数与上回合相同：获得护盾 +14。每场一次。 |
| trait_legendary_drumthunder_1 | 雷雨鼓点 | 使用力量药水时：施毒3次，每次伤害 5。每场一次。 |
| trait_legendary_drumthunder_2 | 凯旋震鼓 | 攻击时 · 攻击点数为最高：力量药水 +1。每场一次。 |
| trait_legendary_crystalmedusa_0 | 反棱毒刺 | 受到反击时：施毒3次，每次伤害 3。每场一次。 |
| trait_legendary_crystalmedusa_1 | 冥晶毒潮 | 防御时 · 生命不超过50%：施毒3次，每次伤害 7。每场一次。 |
| trait_legendary_crystalmedusa_2 | 万毒汲流 | 攻击时 · 第三次攻击时：汲取25%伤害并施毒3次，每次3点。每场一次。 |
| trait_legendary_ringolin_0 | 轮缘甲障 | 受到反击时 · 攻击点数为最高：获得护盾 +14。每场一次。 |
| trait_legendary_ringolin_1 | 地轮蓄势 | 防御时 · 生命不超过50%：下回合攻击取最高点数。每场一次。 |
| trait_legendary_ringolin_2 | 万环壁垒 | 攻击时 · 攻击点数为最低：获得护盾 +26。每场一次。 |
| trait_legendary_maskasura_0 | 起手神印 | 防御时 · 满血时：下回合攻击取最高点数。每场一次。 |
| trait_legendary_maskasura_1 | 破御擒拿 | 攻击时 · 本次攻击被抵抗：恢复实际伤害的 70%。每场一次。 |
| trait_legendary_maskasura_2 | 六臂护法 | 使用力量药水时 · 生命不超过50%：获得护盾 +28。每场一次。 |
| trait_legendary_starhorseshoe_0 | 启航护场 | 掷骰时 · 本场首次掷骰：获得护盾 +5，下回合最高点数。每场一次。 |
| trait_legendary_starhorseshoe_1 | 舷灯急修 | 使用生命药水时 · 生命不超过50%：获得护盾 +24。每场一次。 |
| trait_legendary_starhorseshoe_2 | 穹舰装甲 | 受到反击时 · 力量药水生效时：本次伤害减少 20。每场一次。 |
| trait_legendary_frostfan_0 | 凝冰预兆 | 受到反击时：下回合攻击取最高点数。每场一次。 |
| trait_legendary_frostfan_1 | 羽扇冰障 | 攻击时 · 力量药水生效时：获得护盾 +18。每场一次。 |
| trait_legendary_frostfan_2 | 霜心再生 | 掷骰时 · 攻击点数为最低：恢复最大生命 30%。每场一次。 |
| trait_legendary_origamighost_0 | 纸隙遁影 | 受到反击时 · 攻击点数为最低：免疫本次反击。每场一次。 |
| trait_legendary_origamighost_1 | 折页蓄愿 | 使用生命药水时 · 生命不超过50%：下回合攻击取最高点数。每场一次。 |
| trait_legendary_origamighost_2 | 返魂长卷 | 受到反击时 · 将受到致命伤害：恢复最大生命 35%。每场一次。 |
| trait_legendary_orbeholder_0 | 星瞳调息 | 掷骰时 · 攻击点数为最高：恢复最大生命 15%。每场一次。 |
| trait_legendary_orbeholder_1 | 双环祝福 | 使用力量药水时：恢复生命及护盾各 +4。每场一次。 |
| trait_legendary_orbeholder_2 | 天仪回转 | 掷骰时 · 点数与上回合相同：获得护盾 +5，下回合最高点数。每场一次。 |
| trait_legendary_eclipsehydra_0 | 伏影毒牙 | 攻击时 · 生命不超过50%：施毒3次，每次伤害 7。每场一次。 |
| trait_legendary_eclipsehydra_1 | 双首蚀魂 | 攻击时 · 本次攻击被抵抗：汲取25%伤害并施毒3次，每次3点。每场一次。 |
| trait_legendary_eclipsehydra_2 | 吞月回生 | 攻击时 · 敌人生命不超过50%：恢复最大生命 30%。每场一次。 |
| trait_legendary_bloomgiraffe_0 | 花露补给 | 防御时 · 生命不超过50%：生命药水 +1。每场一次。 |
| trait_legendary_bloomgiraffe_1 | 香冠回响 | 使用生命药水时 · 生命不超过50%：力量药水 +1。每场一次。 |
| trait_legendary_bloomgiraffe_2 | 天苑恩泽 | 掷骰时 · 本场首次掷骰：恢复最大生命 40%。每场一次。 |
| trait_legendary_triarchdrake_0 | 幼龙棘息 | 攻击时 · 攻击点数为最低：施毒3次，每次伤害 5。每场一次。 |
| trait_legendary_triarchdrake_1 | 双曜蓄守 | 攻击时 · 第三次攻击时：获得护盾 +5，下回合最高点数。每场一次。 |
| trait_legendary_triarchdrake_2 | 三首共噬 | 攻击时 · 第三次攻击时：恢复实际伤害的 100%。每场一次。 |

各技能每场至多触发一次；持续效果仍按规则继续。多技能执行顺序和取整见 [数值规则](../BALANCE.md)。

## 全地图敌人数据

HP为本关敌人上限。攻击一栏列出普通池中每只的实际点数组；敌方不执行我方的技能。奖励阶为点数组奖励每项加值，BOSS不领取普通战利品。

| 地图 | 关 | 类别 | 品质 | HP | 可遇敌人：攻击数组 | 奖励阶 |
| --- | --- | --- | --- | --- | --- | --- |
| 草叶海岸 | 1 | 普通 | R | 5 | 绒团兔: 1/1/1；芽芽龙: 1/1/1；潮泡獭: 1/1/2；云翎雀: 1/1/2 | 0 |
| 草叶海岸 | 2 | 普通 | R | 6 | 绒团兔: 1/1/1；芽芽龙: 1/1/1；潮泡獭: 1/1/2；云翎雀: 1/1/2 | 0 |
| 草叶海岸 | 3 | 普通 | R | 8 | 绒团兔: 1/1/1；芽芽龙: 1/1/1；潮泡獭: 1/1/2；云翎雀: 1/1/2 | 0 |
| 草叶海岸 | 4 | 普通 | R | 10 | 绒团兔: 1/1/2；芽芽龙: 1/1/2；潮泡獭: 1/2/2；云翎雀: 1/1/3 | 2 |
| 草叶海岸 | 5 | 精英 | SR | 19 | 荆角甲虫: 1/2/2 | 2 |
| 草叶海岸 | 6 | 普通 | SR | 16 | 绒领兔: 1/2/2；蕨翼龙: 2/2/2；涌浪獭: 1/2/3；流云隼: 1/2/3 | 2 |
| 草叶海岸 | 7 | 普通 | SR | 18 | 绒领兔: 2/2/3；蕨翼龙: 2/2/3；涌浪獭: 2/3/3；流云隼: 2/2/4 | 4 |
| 草叶海岸 | 8 | 普通 | SR | 21 | 绒领兔: 2/2/3；蕨翼龙: 2/2/3；涌浪獭: 2/3/3；流云隼: 2/2/4 | 4 |
| 草叶海岸 | 9 | 普通 | SR | 23 | 绒领兔: 2/2/3；蕨翼龙: 2/2/3；涌浪獭: 2/3/3；流云隼: 2/2/4 | 4 |
| 草叶海岸 | 10 | BOSS | SSR | 42 | 山垒巨龟: 1/2/3 | 不发普通掉落 |
| 熔岩山径 | 1 | 普通 | R | 12 | 闪尾狐: 2/2/6；蓄电貂: 2/2/5；毒泡蜗: 2/3/4；铲角鼹: 2/2/4 | 2 |
| 熔岩山径 | 2 | 普通 | R | 14 | 闪尾狐: 2/2/6；蓄电貂: 2/2/5；毒泡蜗: 2/3/4；铲角鼹: 2/2/4 | 2 |
| 熔岩山径 | 3 | 普通 | R | 16 | 闪尾狐: 2/2/6；蓄电貂: 2/2/5；毒泡蜗: 2/3/4；铲角鼹: 2/2/4 | 2 |
| 熔岩山径 | 4 | 普通 | R | 19 | 闪尾狐: 2/2/6；蓄电貂: 2/3/6；毒泡蜗: 2/4/5；铲角鼹: 3/3/5 | 4 |
| 熔岩山径 | 5 | 精英 | SR | 31 | 破岩拳猿: 4/4/6 | 4 |
| 熔岩山径 | 6 | 普通 | SR | 27 | 焰鬃狐: 3/3/7；电弧貂: 3/4/6；棘壳蜗: 3/4/6；钻甲鼹: 4/4/6 | 4 |
| 熔岩山径 | 7 | 普通 | SR | 31 | 焰鬃狐: 4/4/7；电弧貂: 4/4/7；棘壳蜗: 4/5/6；钻甲鼹: 4/4/6 | 6 |
| 熔岩山径 | 8 | 普通 | SR | 34 | 焰鬃狐: 4/4/7；电弧貂: 4/4/7；棘壳蜗: 4/5/6；钻甲鼹: 4/4/6 | 6 |
| 熔岩山径 | 9 | 普通 | SR | 37 | 焰鬃狐: 4/4/7；电弧貂: 4/4/7；棘壳蜗: 4/5/6；钻甲鼹: 4/4/6 | 6 |
| 熔岩山径 | 10 | BOSS | SSR | 59 | 星钢巨犀: 4/6/7/9 | 不发普通掉落 |
| 霜月雪原 | 1 | 普通 | SR | 21 | 霜鳍海豹: 4/4/6；引魂灯灵: 4/4/7；月轮鸮: 4/6/8；夜刃猞猁: 4/4/7 | 4 |
| 霜月雪原 | 2 | 普通 | SR | 26 | 霜鳍海豹: 4/4/6；引魂灯灵: 4/4/7；月轮鸮: 4/6/8；夜刃猞猁: 4/4/7 | 4 |
| 霜月雪原 | 3 | 普通 | SR | 27 | 霜鳍海豹: 4/4/6；引魂灯灵: 4/4/7；月轮鸮: 4/6/8；夜刃猞猁: 4/4/7 | 4 |
| 霜月雪原 | 4 | 普通 | SR | 31 | 霜鳍海豹: 5/5/6；引魂灯灵: 4/4/8；月轮鸮: 5/7/9；夜刃猞猁: 4/5/8 | 6 |
| 霜月雪原 | 5 | 精英 | SR | 43 | 花铃灵鹿: 4/5/5 | 6 |
| 霜月雪原 | 6 | 普通 | SR | 39 | 霜鳍海豹: 5/5/6；引魂灯灵: 4/4/8；月轮鸮: 5/7/9；夜刃猞猁: 4/5/8 | 6 |
| 霜月雪原 | 7 | 普通 | SR | 44 | 霜鳍海豹: 6/6/7；引魂灯灵: 5/5/8；月轮鸮: 6/8/10；夜刃猞猁: 5/6/8 | 8 |
| 霜月雪原 | 8 | 普通 | SR | 47 | 霜鳍海豹: 6/6/7；引魂灯灵: 5/5/8；月轮鸮: 6/8/10；夜刃猞猁: 5/6/8 | 8 |
| 霜月雪原 | 9 | 普通 | SR | 52 | 霜鳍海豹: 6/6/7；引魂灯灵: 5/5/8；月轮鸮: 6/8/10；夜刃猞猁: 5/6/8 | 8 |
| 霜月雪原 | 10 | BOSS | SSR | 77 | 苍霆龙皇: 6/8/9/11 | 不发普通掉落 |
| 翠风群岛 | 1 | 普通 | SR | 31 | 果篮豚: 6/8/10；莲蓬蛙: 6/8/10；潮纹鳐: 6/8/10；逐风鹤: 6/8/10 | 6 |
| 翠风群岛 | 2 | 普通 | SR | 36 | 果篮豚: 6/8/10；莲蓬蛙: 6/8/10；潮纹鳐: 6/8/10；逐风鹤: 6/8/10 | 6 |
| 翠风群岛 | 3 | 普通 | SR | 38 | 果篮豚: 6/8/10；莲蓬蛙: 6/8/10；潮纹鳐: 6/8/10；逐风鹤: 6/8/10 | 6 |
| 翠风群岛 | 4 | 普通 | SR | 43 | 果篮豚: 7/9/11；莲蓬蛙: 7/9/11；潮纹鳐: 7/9/11；逐风鹤: 7/9/11 | 8 |
| 翠风群岛 | 5 | 精英 | SR | 57 | 双刃螳: 7/9/11 | 8 |
| 翠风群岛 | 6 | 普通 | SR | 52 | 果篮豚: 7/9/11；莲蓬蛙: 7/9/11；潮纹鳐: 7/9/11；逐风鹤: 7/9/11 | 8 |
| 翠风群岛 | 7 | 普通 | SR | 59 | 果篮豚: 7/10/12；莲蓬蛙: 7/10/12；潮纹鳐: 7/10/12；逐风鹤: 7/10/12 | 10 |
| 翠风群岛 | 8 | 普通 | SR | 61 | 果篮豚: 7/10/12；莲蓬蛙: 7/10/12；潮纹鳐: 7/10/12；逐风鹤: 7/10/12 | 10 |
| 翠风群岛 | 9 | 普通 | SR | 68 | 果篮豚: 7/10/12；莲蓬蛙: 7/10/12；潮纹鳐: 7/10/12；逐风鹤: 7/10/12 | 10 |
| 翠风群岛 | 10 | BOSS | SSR | 97 | 磐晶蟹王: 8/10/12 | 不发普通掉落 |
| 赤雷荒原 | 1 | 普通 | SR | 41 | 炽鬃羊: 9/12/15；雷跃鼠: 9/12/15；荆毒蝎: 9/12/15；流砂穿山兽: 9/12/15 | 8 |
| 赤雷荒原 | 2 | 普通 | SR | 48 | 炽鬃羊: 9/12/15；雷跃鼠: 9/12/15；荆毒蝎: 9/12/15；流砂穿山兽: 9/12/15 | 8 |
| 赤雷荒原 | 3 | 普通 | SR | 49 | 炽鬃羊: 9/12/15；雷跃鼠: 9/12/15；荆毒蝎: 9/12/15；流砂穿山兽: 9/12/15 | 8 |
| 赤雷荒原 | 4 | 普通 | SR | 56 | 炽鬃羊: 10/13/15；雷跃鼠: 10/13/15；荆毒蝎: 10/13/15；流砂穿山兽: 10/13/15 | 10 |
| 赤雷荒原 | 5 | 精英 | SR | 71 | 斗篷袋鼠: 10/13/15 | 10 |
| 赤雷荒原 | 6 | 普通 | SR | 67 | 炽鬃羊: 10/13/15；雷跃鼠: 10/13/15；荆毒蝎: 10/13/15；流砂穿山兽: 10/13/15 | 10 |
| 赤雷荒原 | 7 | 普通 | SR | 74 | 炽鬃羊: 11/13/16；雷跃鼠: 11/13/16；荆毒蝎: 11/13/16；流砂穿山兽: 11/13/16 | 12 |
| 赤雷荒原 | 8 | 普通 | SR | 77 | 炽鬃羊: 11/13/16；雷跃鼠: 11/13/16；荆毒蝎: 11/13/16；流砂穿山兽: 11/13/16 | 12 |
| 赤雷荒原 | 9 | 普通 | SR | 85 | 炽鬃羊: 11/13/16；雷跃鼠: 11/13/16；荆毒蝎: 11/13/16；流砂穿山兽: 11/13/16 | 12 |
| 赤雷荒原 | 10 | BOSS | SSR | 119 | 陨铁巨牙: 11/14/17 | 不发普通掉落 |
| 星渊圣域 | 1 | 普通 | SR | 52 | 冰棱兔: 14/17/21；夜灯水母: 14/17/21；星枕貘: 14/17/21；暮刃鸦: 14/17/21 | 10 |
| 星渊圣域 | 2 | 普通 | SR | 59 | 冰棱兔: 14/17/21；夜灯水母: 14/17/21；星枕貘: 14/17/21；暮刃鸦: 14/17/21 | 10 |
| 星渊圣域 | 3 | 普通 | SR | 62 | 冰棱兔: 14/17/21；夜灯水母: 14/17/21；星枕貘: 14/17/21；暮刃鸦: 14/17/21 | 10 |
| 星渊圣域 | 4 | 普通 | SR | 70 | 冰棱兔: 14/17/21；夜灯水母: 14/17/21；星枕貘: 14/17/21；暮刃鸦: 14/17/21 | 12 |
| 星渊圣域 | 5 | 精英 | SR | 87 | 幻彩孔雀: 14/17/21 | 12 |
| 星渊圣域 | 6 | 普通 | SR | 83 | 冰棱兔: 14/17/21；夜灯水母: 14/17/21；星枕貘: 14/17/21；暮刃鸦: 14/17/21 | 12 |
| 星渊圣域 | 7 | 普通 | SR | 91 | 冰棱兔: 15/18/22；夜灯水母: 15/18/22；星枕貘: 15/18/22；暮刃鸦: 15/18/22 | 14 |
| 星渊圣域 | 8 | 普通 | SR | 95 | 冰棱兔: 15/18/22；夜灯水母: 15/18/22；星枕貘: 15/18/22；暮刃鸦: 15/18/22 | 14 |
| 星渊圣域 | 9 | 普通 | SR | 103 | 冰棱兔: 15/18/22；夜灯水母: 15/18/22；星枕貘: 15/18/22；暮刃鸦: 15/18/22 | 14 |
| 星渊圣域 | 10 | BOSS | SSR | 142 | 星渊龙君: 16/19/23 | 不发普通掉落 |
| 琉璃雨林 | 1 | 普通 | SR | 61 | 蜜袋睡鼠: 18/22/27；花冠壁虎: 18/22/27；涟波螈: 18/22/27；琥灯萤: 18/22/27 | 12 |
| 琉璃雨林 | 2 | 普通 | SR | 69 | 蜜袋睡鼠: 18/22/27；花冠壁虎: 18/22/27；涟波螈: 18/22/27；琥灯萤: 18/22/27 | 12 |
| 琉璃雨林 | 3 | 普通 | SR | 72 | 蜜袋睡鼠: 18/22/27；花冠壁虎: 18/22/27；涟波螈: 18/22/27；琥灯萤: 18/22/27 | 12 |
| 琉璃雨林 | 4 | 普通 | SR | 81 | 蜜袋睡鼠: 19/23/27；花冠壁虎: 19/23/27；涟波螈: 19/23/27；琥灯萤: 19/23/27 | 14 |
| 琉璃雨林 | 5 | 精英 | SR | 99 | 棘冠眼镜蛇: 19/23/27 | 14 |
| 琉璃雨林 | 6 | 普通 | SR | 95 | 蜜袋睡鼠: 19/23/27；花冠壁虎: 19/23/27；涟波螈: 19/23/27；琥灯萤: 19/23/27 | 14 |
| 琉璃雨林 | 7 | 普通 | SR | 105 | 蜜袋睡鼠: 20/23/28；花冠壁虎: 20/23/28；涟波螈: 20/23/28；琥灯萤: 20/23/28 | 16 |
| 琉璃雨林 | 8 | 普通 | SR | 108 | 蜜袋睡鼠: 20/23/28；花冠壁虎: 20/23/28；涟波螈: 20/23/28；琥灯萤: 20/23/28 | 16 |
| 琉璃雨林 | 9 | 普通 | SR | 118 | 蜜袋睡鼠: 20/23/28；花冠壁虎: 20/23/28；涟波螈: 20/23/28；琥灯萤: 20/23/28 | 16 |
| 琉璃雨林 | 10 | BOSS | SSR | 158 | 苍穹冠皇: 20/24/29 | 不发普通掉落 |
| 赤曜沙海 | 1 | 普通 | SR | 69 | 熔峰驼: 24/29/35；雷冠蜥: 24/29/35；掘岩袋熊: 24/29/35；晶脊古虫: 24/29/35 | 14 |
| 赤曜沙海 | 2 | 普通 | SR | 79 | 熔峰驼: 24/29/35；雷冠蜥: 24/29/35；掘岩袋熊: 24/29/35；晶脊古虫: 24/29/35 | 14 |
| 赤曜沙海 | 3 | 普通 | SR | 81 | 熔峰驼: 24/29/35；雷冠蜥: 24/29/35；掘岩袋熊: 24/29/35；晶脊古虫: 24/29/35 | 14 |
| 赤曜沙海 | 4 | 普通 | SR | 92 | 熔峰驼: 25/30/36；雷冠蜥: 25/30/36；掘岩袋熊: 25/30/36；晶脊古虫: 25/30/36 | 16 |
| 赤曜沙海 | 5 | 精英 | SR | 111 | 赤拳战獾: 25/30/36 | 16 |
| 赤曜沙海 | 6 | 普通 | SR | 107 | 熔峰驼: 25/30/36；雷冠蜥: 25/30/36；掘岩袋熊: 25/30/36；晶脊古虫: 25/30/36 | 16 |
| 赤曜沙海 | 7 | 普通 | SR | 118 | 熔峰驼: 26/31/37；雷冠蜥: 26/31/37；掘岩袋熊: 26/31/37；晶脊古虫: 26/31/37 | 18 |
| 赤曜沙海 | 8 | 普通 | SR | 121 | 熔峰驼: 26/31/37；雷冠蜥: 26/31/37；掘岩袋熊: 26/31/37；晶脊古虫: 26/31/37 | 18 |
| 赤曜沙海 | 9 | 普通 | SR | 132 | 熔峰驼: 26/31/37；雷冠蜥: 26/31/37；掘岩袋熊: 26/31/37；晶脊古虫: 26/31/37 | 18 |
| 赤曜沙海 | 10 | BOSS | SSR | 175 | 天铸钢牛: 27/32/38 | 不发普通掉落 |
| 冥辉天穹 | 1 | 普通 | SR | 78 | 冰帆鲸: 32/38/45；夜灯灵狸: 32/38/45；星瞳章: 32/38/45；月刃蝠: 32/38/45 | 16 |
| 冥辉天穹 | 2 | 普通 | SR | 89 | 冰帆鲸: 32/38/45；夜灯灵狸: 32/38/45；星瞳章: 32/38/45；月刃蝠: 32/38/45 | 16 |
| 冥辉天穹 | 3 | 普通 | SR | 91 | 冰帆鲸: 32/38/45；夜灯灵狸: 32/38/45；星瞳章: 32/38/45；月刃蝠: 32/38/45 | 16 |
| 冥辉天穹 | 4 | 普通 | SR | 103 | 冰帆鲸: 33/39/46；夜灯灵狸: 33/39/46；星瞳章: 33/39/46；月刃蝠: 33/39/46 | 18 |
| 冥辉天穹 | 5 | 精英 | SR | 123 | 绫月蝶蛾: 33/39/46 | 18 |
| 冥辉天穹 | 6 | 普通 | SR | 119 | 冰帆鲸: 33/39/46；夜灯灵狸: 33/39/46；星瞳章: 33/39/46；月刃蝠: 33/39/46 | 18 |
| 冥辉天穹 | 7 | 普通 | SR | 131 | 冰帆鲸: 33/40/47；夜灯灵狸: 33/40/47；星瞳章: 33/40/47；月刃蝠: 33/40/47 | 20 |
| 冥辉天穹 | 8 | 普通 | SR | 134 | 冰帆鲸: 33/40/47；夜灯灵狸: 33/40/47；星瞳章: 33/40/47；月刃蝠: 33/40/47 | 20 |
| 冥辉天穹 | 9 | 普通 | SR | 146 | 冰帆鲸: 33/40/47；夜灯灵狸: 33/40/47；星瞳章: 33/40/47；月刃蝠: 33/40/47 | 20 |
| 冥辉天穹 | 10 | BOSS | SSR | 192 | 九曜龙麟: 34/40/48 | 不发普通掉落 |
| 圣枝云庭 | 1 | 普通 | SR | 87 | 梦庭守蚁兽: 40/48/56；古根树卫: 40/48/56；霓流皇带鱼: 40/48/56；巡云六翼鸟: 40/48/56 | 18 |
| 圣枝云庭 | 2 | 普通 | SR | 99 | 梦庭守蚁兽: 40/48/56；古根树卫: 40/48/56；霓流皇带鱼: 40/48/56；巡云六翼鸟: 40/48/56 | 18 |
| 圣枝云庭 | 3 | 普通 | SR | 101 | 梦庭守蚁兽: 40/48/56；古根树卫: 40/48/56；霓流皇带鱼: 40/48/56；巡云六翼鸟: 40/48/56 | 18 |
| 圣枝云庭 | 4 | 普通 | SR | 114 | 梦庭守蚁兽: 41/49/57；古根树卫: 41/49/57；霓流皇带鱼: 41/49/57；巡云六翼鸟: 41/49/57 | 20 |
| 圣枝云庭 | 5 | 精英 | SR | 135 | 镜翼蜓卫: 41/49/57 | 20 |
| 圣枝云庭 | 6 | 普通 | SR | 131 | 梦庭守蚁兽: 41/49/57；古根树卫: 41/49/57；霓流皇带鱼: 41/49/57；巡云六翼鸟: 41/49/57 | 20 |
| 圣枝云庭 | 7 | 普通 | SR | 144 | 梦庭守蚁兽: 42/50/58；古根树卫: 42/50/58；霓流皇带鱼: 42/50/58；巡云六翼鸟: 42/50/58 | 22 |
| 圣枝云庭 | 8 | 普通 | SR | 147 | 梦庭守蚁兽: 42/50/58；古根树卫: 42/50/58；霓流皇带鱼: 42/50/58；巡云六翼鸟: 42/50/58 | 22 |
| 圣枝云庭 | 9 | 普通 | SR | 161 | 梦庭守蚁兽: 42/50/58；古根树卫: 42/50/58；霓流皇带鱼: 42/50/58；巡云六翼鸟: 42/50/58 | 22 |
| 圣枝云庭 | 10 | BOSS | SSR | 209 | 山岳碑神: 43/51/59 | 不发普通掉落 |
| 万象神炉 | 1 | 普通 | SR | 96 | 曜鬃圣狮: 51/60/70；震霆鼓卫: 51/60/70；紫棱冥母: 51/60/70；地轮甲卫: 51/60/70 | 20 |
| 万象神炉 | 2 | 普通 | SR | 109 | 曜鬃圣狮: 51/60/70；震霆鼓卫: 51/60/70；紫棱冥母: 51/60/70；地轮甲卫: 51/60/70 | 20 |
| 万象神炉 | 3 | 普通 | SR | 111 | 曜鬃圣狮: 51/60/70；震霆鼓卫: 51/60/70；紫棱冥母: 51/60/70；地轮甲卫: 51/60/70 | 20 |
| 万象神炉 | 4 | 普通 | SR | 125 | 曜鬃圣狮: 52/61/71；震霆鼓卫: 52/61/71；紫棱冥母: 52/61/71；地轮甲卫: 52/61/71 | 22 |
| 万象神炉 | 5 | 精英 | SR | 147 | 四臂面卫: 52/61/71 | 22 |
| 万象神炉 | 6 | 普通 | SR | 143 | 曜鬃圣狮: 52/61/71；震霆鼓卫: 52/61/71；紫棱冥母: 52/61/71；地轮甲卫: 52/61/71 | 22 |
| 万象神炉 | 7 | 普通 | SR | 157 | 曜鬃圣狮: 53/62/72；震霆鼓卫: 53/62/72；紫棱冥母: 53/62/72；地轮甲卫: 53/62/72 | 24 |
| 万象神炉 | 8 | 普通 | SR | 161 | 曜鬃圣狮: 53/62/72；震霆鼓卫: 53/62/72；紫棱冥母: 53/62/72；地轮甲卫: 53/62/72 | 24 |
| 万象神炉 | 9 | 普通 | SR | 175 | 曜鬃圣狮: 53/62/72；震霆鼓卫: 53/62/72；紫棱冥母: 53/62/72；地轮甲卫: 53/62/72 | 24 |
| 万象神炉 | 10 | BOSS | SSR | 226 | 穹舰神鲎: 54/63/73 | 不发普通掉落 |
| 太初星界 | 1 | 普通 | SR | 105 | 霜扇孔雀: 62/73/84；千折纸使: 62/73/84；悬环星仪: 62/73/84；噬月双首蛇: 62/73/84 | 22 |
| 太初星界 | 2 | 普通 | SR | 119 | 霜扇孔雀: 62/73/84；千折纸使: 62/73/84；悬环星仪: 62/73/84；噬月双首蛇: 62/73/84 | 22 |
| 太初星界 | 3 | 普通 | SR | 121 | 霜扇孔雀: 62/73/84；千折纸使: 62/73/84；悬环星仪: 62/73/84；噬月双首蛇: 62/73/84 | 22 |
| 太初星界 | 4 | 普通 | SR | 136 | 霜扇孔雀: 63/74/85；千折纸使: 63/74/85；悬环星仪: 63/74/85；噬月双首蛇: 63/74/85 | 24 |
| 太初星界 | 5 | 精英 | SR | 160 | 圣庭花冠兽: 63/74/85 | 24 |
| 太初星界 | 6 | 普通 | SR | 155 | 霜扇孔雀: 63/74/85；千折纸使: 63/74/85；悬环星仪: 63/74/85；噬月双首蛇: 63/74/85 | 24 |
| 太初星界 | 7 | 普通 | SR | 171 | 霜扇孔雀: 64/75/86；千折纸使: 64/75/86；悬环星仪: 64/75/86；噬月双首蛇: 64/75/86 | 26 |
| 太初星界 | 8 | 普通 | SR | 174 | 霜扇孔雀: 64/75/86；千折纸使: 64/75/86；悬环星仪: 64/75/86；噬月双首蛇: 64/75/86 | 26 |
| 太初星界 | 9 | 普通 | SR | 189 | 霜扇孔雀: 64/75/86；千折纸使: 64/75/86；悬环星仪: 64/75/86；噬月双首蛇: 64/75/86 | 26 |
| 太初星界 | 10 | BOSS | SSR | 242 | 三曜太古龙: 66/76/87 | 不发普通掉落 |

## 寻蛋概率

单次概率与“用尽翻找次数后至少找到一个SSR”的概率分列；后者不含孵化升品质。系列从该地图全部6个等概率抽。

| 地图 | 关 | 次数 | R | SR | SSR | 用尽次数至少一个SSR |
| --- | --- | --- | --- | --- | --- | --- |
| 草叶海岸 | 5 | 2 | 95% | 5% | 0% | 0% |
| 草叶海岸 | 10 | 3 | 90% | 9% | 1% | 2.9701% |
| 熔岩山径 | 5 | 2 | 90% | 10% | 0% | 0% |
| 熔岩山径 | 10 | 3 | 75% | 20% | 5% | 14.2625% |
| 霜月雪原 | 5 | 2 | 84% | 15% | 1% | 1.99% |
| 霜月雪原 | 10 | 3 | 70% | 20% | 10% | 27.1% |
| 翠风群岛 | 5 | 2 | 80% | 18% | 2% | 3.96% |
| 翠风群岛 | 10 | 3 | 60% | 25% | 15% | 38.5875% |
| 赤雷荒原 | 5 | 2 | 75% | 22% | 3% | 5.91% |
| 赤雷荒原 | 10 | 3 | 50% | 30% | 20% | 48.8% |
| 星渊圣域 | 5 | 2 | 70% | 26% | 4% | 7.84% |
| 星渊圣域 | 10 | 3 | 40% | 35% | 25% | 57.8125% |
| 琉璃雨林 | 5 | 2 | 65% | 29% | 6% | 11.64% |
| 琉璃雨林 | 10 | 3 | 35% | 35% | 30% | 65.7% |
| 赤曜沙海 | 5 | 2 | 60% | 32% | 8% | 15.36% |
| 赤曜沙海 | 10 | 3 | 30% | 35% | 35% | 72.5375% |
| 冥辉天穹 | 5 | 2 | 55% | 35% | 10% | 19% |
| 冥辉天穹 | 10 | 3 | 25% | 35% | 40% | 78.4% |
| 圣枝云庭 | 5 | 2 | 50% | 38% | 12% | 22.56% |
| 圣枝云庭 | 10 | 3 | 20% | 35% | 45% | 83.3625% |
| 万象神炉 | 5 | 2 | 45% | 41% | 14% | 26.04% |
| 万象神炉 | 10 | 3 | 15% | 35% | 50% | 87.5% |
| 太初星界 | 5 | 2 | 40% | 44% | 16% | 29.44% |
| 太初星界 | 10 | 3 | 10% | 35% | 55% | 90.8875% |

## 普通孵化品质概率

| 蛋 | R宠物 | SR宠物 | SSR宠物 |
| --- | --- | --- | --- |
| R | 90% | 9% | 1% |
| SR | 0% | 95% | 5% |
| SSR | 0% | 0% | 100% |

孵化按蛋品质 R/SR/SSR 分别为 10/20/30 分钟，小晴缩短20%；完整观看激励视频立即完成当前孵化或交配（无能量消耗）。交配 30 分钟产蛋后再孵化。交配蛋与结缘蛋品质固定。

## 药水倍率

| 物品 | 抽样数组 | 含义 |
| --- | --- | --- |
| 治疗 | 1/1/1/1/1/2/2/2/2/3 | ×1 50% / ×2 40% / ×3 10% |
| 力量 | 2/2/2/2/2/3/3/3/3/4 | ×2 50% / ×3 40% / ×4 10% |

资源矩形、脚底、肖像映射、原始敌方数组及初始状态见 [机器可读数据](design-data.json)。
