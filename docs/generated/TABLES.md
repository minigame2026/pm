# 当前游戏完整数据表

> 自动生成；不要手改。来源：PMModel、PMGame、BattleArt、EvolutionArt、RegionArt、HeroArt；精确 SHA-256 见 [design-data.json](design-data.json)。运行 `node tools/export-design-data.cjs` 更新，`--check` 检查过期。

## 内容规模

54 个系列，162 种自然形态，90 关，81 种技能机制。个体遗传后数值以存档为准。

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

各技能每场至多触发一次；持续效果仍按规则继续。多技能执行顺序和取整见 [数值规则](../BALANCE.md)。

## 全地图敌人数据

HP为本关敌人上限。攻击一栏列出普通池中每只的实际点数组；敌方不执行我方的技能。奖励阶为点数组奖励每项加值，BOSS不领取普通战利品。

| 地图 | 关 | 类别 | 品质 | HP | 可遇敌人：攻击数组 | 奖励阶 |
| --- | --- | --- | --- | --- | --- | --- |
| 草叶海岸 | 1 | 普通 | R | 7 | 绒团兔: 1/2/3；芽芽龙: 2/2/3；潮泡獭: 1/3/4；云翎雀: 1/2/5 | 0 |
| 草叶海岸 | 2 | 普通 | R | 9 | 绒团兔: 1/2/3；芽芽龙: 2/2/3；潮泡獭: 1/3/4；云翎雀: 1/2/5 | 0 |
| 草叶海岸 | 3 | 普通 | R | 11 | 绒团兔: 1/2/3；芽芽龙: 2/2/3；潮泡獭: 1/3/4；云翎雀: 1/2/5 | 0 |
| 草叶海岸 | 4 | 普通 | R | 14 | 绒团兔: 2/3/4；芽芽龙: 3/3/4；潮泡獭: 2/4/5；云翎雀: 2/3/6 | 2 |
| 草叶海岸 | 5 | 精英 | SR | 26 | 荆角甲虫: 2/4/5 | 2 |
| 草叶海岸 | 6 | 普通 | SR | 22 | 绒领兔: 3/4/5；蕨翼龙: 4/4/5；涌浪獭: 3/5/6；流云隼: 3/4/7 | 2 |
| 草叶海岸 | 7 | 普通 | SR | 25 | 绒领兔: 4/5/6；蕨翼龙: 5/5/6；涌浪獭: 4/6/7；流云隼: 4/5/8 | 4 |
| 草叶海岸 | 8 | 普通 | SR | 29 | 绒领兔: 4/5/6；蕨翼龙: 5/5/6；涌浪獭: 4/6/7；流云隼: 4/5/8 | 4 |
| 草叶海岸 | 9 | 普通 | SR | 32 | 绒领兔: 4/5/6；蕨翼龙: 5/5/6；涌浪獭: 4/6/7；流云隼: 4/5/8 | 4 |
| 草叶海岸 | 10 | BOSS | SSR | 58 | 山垒巨龟: 3/5/7 | 不发普通掉落 |
| 熔岩山径 | 1 | 普通 | R | 15 | 闪尾狐: 3/3/9；蓄电貂: 3/4/8；毒泡蜗: 3/5/7；铲角鼹: 4/4/7 | 2 |
| 熔岩山径 | 2 | 普通 | R | 18 | 闪尾狐: 3/3/9；蓄电貂: 3/4/8；毒泡蜗: 3/5/7；铲角鼹: 4/4/7 | 2 |
| 熔岩山径 | 3 | 普通 | R | 20 | 闪尾狐: 3/3/9；蓄电貂: 3/4/8；毒泡蜗: 3/5/7；铲角鼹: 4/4/7 | 2 |
| 熔岩山径 | 4 | 普通 | R | 24 | 闪尾狐: 4/4/10；蓄电貂: 4/5/9；毒泡蜗: 4/6/8；铲角鼹: 5/5/8 | 4 |
| 熔岩山径 | 5 | 精英 | SR | 39 | 破岩拳猿: 6/7/10 | 4 |
| 熔岩山径 | 6 | 普通 | SR | 34 | 焰鬃狐: 5/5/11；电弧貂: 5/6/10；棘壳蜗: 5/7/9；钻甲鼹: 6/6/9 | 4 |
| 熔岩山径 | 7 | 普通 | SR | 39 | 焰鬃狐: 6/6/12；电弧貂: 6/7/11；棘壳蜗: 6/8/10；钻甲鼹: 7/7/10 | 6 |
| 熔岩山径 | 8 | 普通 | SR | 42 | 焰鬃狐: 6/6/12；电弧貂: 6/7/11；棘壳蜗: 6/8/10；钻甲鼹: 7/7/10 | 6 |
| 熔岩山径 | 9 | 普通 | SR | 46 | 焰鬃狐: 6/6/12；电弧貂: 6/7/11；棘壳蜗: 6/8/10；钻甲鼹: 7/7/10 | 6 |
| 熔岩山径 | 10 | BOSS | SSR | 74 | 星钢巨犀: 7/9/12/14 | 不发普通掉落 |
| 霜月雪原 | 1 | 普通 | SR | 25 | 霜鳍海豹: 7/7/9；引魂灯灵: 6/6/11；月轮鸮: 7/10/13；夜刃猞猁: 6/7/11 | 4 |
| 霜月雪原 | 2 | 普通 | SR | 30 | 霜鳍海豹: 7/7/9；引魂灯灵: 6/6/11；月轮鸮: 7/10/13；夜刃猞猁: 6/7/11 | 4 |
| 霜月雪原 | 3 | 普通 | SR | 32 | 霜鳍海豹: 7/7/9；引魂灯灵: 6/6/11；月轮鸮: 7/10/13；夜刃猞猁: 6/7/11 | 4 |
| 霜月雪原 | 4 | 普通 | SR | 37 | 霜鳍海豹: 8/8/10；引魂灯灵: 7/7/12；月轮鸮: 8/11/14；夜刃猞猁: 7/8/12 | 6 |
| 霜月雪原 | 5 | 精英 | SR | 51 | 花铃灵鹿: 7/8/8 | 6 |
| 霜月雪原 | 6 | 普通 | SR | 46 | 霜鳍海豹: 8/8/10；引魂灯灵: 7/7/12；月轮鸮: 8/11/14；夜刃猞猁: 7/8/12 | 6 |
| 霜月雪原 | 7 | 普通 | SR | 52 | 霜鳍海豹: 9/9/11；引魂灯灵: 8/8/13；月轮鸮: 9/12/15；夜刃猞猁: 8/9/13 | 8 |
| 霜月雪原 | 8 | 普通 | SR | 55 | 霜鳍海豹: 9/9/11；引魂灯灵: 8/8/13；月轮鸮: 9/12/15；夜刃猞猁: 8/9/13 | 8 |
| 霜月雪原 | 9 | 普通 | SR | 61 | 霜鳍海豹: 9/9/11；引魂灯灵: 8/8/13；月轮鸮: 9/12/15；夜刃猞猁: 8/9/13 | 8 |
| 霜月雪原 | 10 | BOSS | SSR | 91 | 苍霆龙皇: 10/12/14/17 | 不发普通掉落 |
| 翠风群岛 | 1 | 普通 | SR | 34 | 果篮豚: 9/12/15；莲蓬蛙: 9/12/15；潮纹鳐: 9/12/15；逐风鹤: 9/12/15 | 6 |
| 翠风群岛 | 2 | 普通 | SR | 40 | 果篮豚: 9/12/15；莲蓬蛙: 9/12/15；潮纹鳐: 9/12/15；逐风鹤: 9/12/15 | 6 |
| 翠风群岛 | 3 | 普通 | SR | 42 | 果篮豚: 9/12/15；莲蓬蛙: 9/12/15；潮纹鳐: 9/12/15；逐风鹤: 9/12/15 | 6 |
| 翠风群岛 | 4 | 普通 | SR | 48 | 果篮豚: 10/13/16；莲蓬蛙: 10/13/16；潮纹鳐: 10/13/16；逐风鹤: 10/13/16 | 8 |
| 翠风群岛 | 5 | 精英 | SR | 63 | 双刃螳: 10/13/16 | 8 |
| 翠风群岛 | 6 | 普通 | SR | 58 | 果篮豚: 10/13/16；莲蓬蛙: 10/13/16；潮纹鳐: 10/13/16；逐风鹤: 10/13/16 | 8 |
| 翠风群岛 | 7 | 普通 | SR | 65 | 果篮豚: 11/14/17；莲蓬蛙: 11/14/17；潮纹鳐: 11/14/17；逐风鹤: 11/14/17 | 10 |
| 翠风群岛 | 8 | 普通 | SR | 68 | 果篮豚: 11/14/17；莲蓬蛙: 11/14/17；潮纹鳐: 11/14/17；逐风鹤: 11/14/17 | 10 |
| 翠风群岛 | 9 | 普通 | SR | 75 | 果篮豚: 11/14/17；莲蓬蛙: 11/14/17；潮纹鳐: 11/14/17；逐风鹤: 11/14/17 | 10 |
| 翠风群岛 | 10 | BOSS | SSR | 108 | 磐晶蟹王: 12/15/18 | 不发普通掉落 |
| 赤雷荒原 | 1 | 普通 | SR | 43 | 炽鬃羊: 13/17/21；雷跃鼠: 13/17/21；荆毒蝎: 13/17/21；流砂穿山兽: 13/17/21 | 8 |
| 赤雷荒原 | 2 | 普通 | SR | 50 | 炽鬃羊: 13/17/21；雷跃鼠: 13/17/21；荆毒蝎: 13/17/21；流砂穿山兽: 13/17/21 | 8 |
| 赤雷荒原 | 3 | 普通 | SR | 52 | 炽鬃羊: 13/17/21；雷跃鼠: 13/17/21；荆毒蝎: 13/17/21；流砂穿山兽: 13/17/21 | 8 |
| 赤雷荒原 | 4 | 普通 | SR | 59 | 炽鬃羊: 14/18/22；雷跃鼠: 14/18/22；荆毒蝎: 14/18/22；流砂穿山兽: 14/18/22 | 10 |
| 赤雷荒原 | 5 | 精英 | SR | 75 | 斗篷袋鼠: 14/18/22 | 10 |
| 赤雷荒原 | 6 | 普通 | SR | 70 | 炽鬃羊: 14/18/22；雷跃鼠: 14/18/22；荆毒蝎: 14/18/22；流砂穿山兽: 14/18/22 | 10 |
| 赤雷荒原 | 7 | 普通 | SR | 78 | 炽鬃羊: 15/19/23；雷跃鼠: 15/19/23；荆毒蝎: 15/19/23；流砂穿山兽: 15/19/23 | 12 |
| 赤雷荒原 | 8 | 普通 | SR | 81 | 炽鬃羊: 15/19/23；雷跃鼠: 15/19/23；荆毒蝎: 15/19/23；流砂穿山兽: 15/19/23 | 12 |
| 赤雷荒原 | 9 | 普通 | SR | 89 | 炽鬃羊: 15/19/23；雷跃鼠: 15/19/23；荆毒蝎: 15/19/23；流砂穿山兽: 15/19/23 | 12 |
| 赤雷荒原 | 10 | BOSS | SSR | 125 | 陨铁巨牙: 16/20/24 | 不发普通掉落 |
| 星渊圣域 | 1 | 普通 | SR | 52 | 冰棱兔: 18/22/27；夜灯水母: 18/22/27；星枕貘: 18/22/27；暮刃鸦: 18/22/27 | 10 |
| 星渊圣域 | 2 | 普通 | SR | 59 | 冰棱兔: 18/22/27；夜灯水母: 18/22/27；星枕貘: 18/22/27；暮刃鸦: 18/22/27 | 10 |
| 星渊圣域 | 3 | 普通 | SR | 62 | 冰棱兔: 18/22/27；夜灯水母: 18/22/27；星枕貘: 18/22/27；暮刃鸦: 18/22/27 | 10 |
| 星渊圣域 | 4 | 普通 | SR | 70 | 冰棱兔: 19/23/28；夜灯水母: 19/23/28；星枕貘: 19/23/28；暮刃鸦: 19/23/28 | 12 |
| 星渊圣域 | 5 | 精英 | SR | 87 | 幻彩孔雀: 19/23/28 | 12 |
| 星渊圣域 | 6 | 普通 | SR | 83 | 冰棱兔: 19/23/28；夜灯水母: 19/23/28；星枕貘: 19/23/28；暮刃鸦: 19/23/28 | 12 |
| 星渊圣域 | 7 | 普通 | SR | 91 | 冰棱兔: 20/24/29；夜灯水母: 20/24/29；星枕貘: 20/24/29；暮刃鸦: 20/24/29 | 14 |
| 星渊圣域 | 8 | 普通 | SR | 95 | 冰棱兔: 20/24/29；夜灯水母: 20/24/29；星枕貘: 20/24/29；暮刃鸦: 20/24/29 | 14 |
| 星渊圣域 | 9 | 普通 | SR | 103 | 冰棱兔: 20/24/29；夜灯水母: 20/24/29；星枕貘: 20/24/29；暮刃鸦: 20/24/29 | 14 |
| 星渊圣域 | 10 | BOSS | SSR | 142 | 星渊龙君: 21/25/30 | 不发普通掉落 |
| 琉璃雨林 | 1 | 普通 | SR | 61 | 蜜袋睡鼠: 23/28/34；花冠壁虎: 23/28/34；涟波螈: 23/28/34；琥灯萤: 23/28/34 | 12 |
| 琉璃雨林 | 2 | 普通 | SR | 69 | 蜜袋睡鼠: 23/28/34；花冠壁虎: 23/28/34；涟波螈: 23/28/34；琥灯萤: 23/28/34 | 12 |
| 琉璃雨林 | 3 | 普通 | SR | 72 | 蜜袋睡鼠: 23/28/34；花冠壁虎: 23/28/34；涟波螈: 23/28/34；琥灯萤: 23/28/34 | 12 |
| 琉璃雨林 | 4 | 普通 | SR | 81 | 蜜袋睡鼠: 24/29/35；花冠壁虎: 24/29/35；涟波螈: 24/29/35；琥灯萤: 24/29/35 | 14 |
| 琉璃雨林 | 5 | 精英 | SR | 99 | 棘冠眼镜蛇: 24/29/35 | 14 |
| 琉璃雨林 | 6 | 普通 | SR | 95 | 蜜袋睡鼠: 24/29/35；花冠壁虎: 24/29/35；涟波螈: 24/29/35；琥灯萤: 24/29/35 | 14 |
| 琉璃雨林 | 7 | 普通 | SR | 105 | 蜜袋睡鼠: 25/30/36；花冠壁虎: 25/30/36；涟波螈: 25/30/36；琥灯萤: 25/30/36 | 16 |
| 琉璃雨林 | 8 | 普通 | SR | 108 | 蜜袋睡鼠: 25/30/36；花冠壁虎: 25/30/36；涟波螈: 25/30/36；琥灯萤: 25/30/36 | 16 |
| 琉璃雨林 | 9 | 普通 | SR | 118 | 蜜袋睡鼠: 25/30/36；花冠壁虎: 25/30/36；涟波螈: 25/30/36；琥灯萤: 25/30/36 | 16 |
| 琉璃雨林 | 10 | BOSS | SSR | 158 | 苍穹冠皇: 26/31/37 | 不发普通掉落 |
| 赤曜沙海 | 1 | 普通 | SR | 69 | 熔峰驼: 29/35/42；雷冠蜥: 29/35/42；掘岩袋熊: 29/35/42；晶脊古虫: 29/35/42 | 14 |
| 赤曜沙海 | 2 | 普通 | SR | 79 | 熔峰驼: 29/35/42；雷冠蜥: 29/35/42；掘岩袋熊: 29/35/42；晶脊古虫: 29/35/42 | 14 |
| 赤曜沙海 | 3 | 普通 | SR | 81 | 熔峰驼: 29/35/42；雷冠蜥: 29/35/42；掘岩袋熊: 29/35/42；晶脊古虫: 29/35/42 | 14 |
| 赤曜沙海 | 4 | 普通 | SR | 92 | 熔峰驼: 30/36/43；雷冠蜥: 30/36/43；掘岩袋熊: 30/36/43；晶脊古虫: 30/36/43 | 16 |
| 赤曜沙海 | 5 | 精英 | SR | 111 | 赤拳战獾: 30/36/43 | 16 |
| 赤曜沙海 | 6 | 普通 | SR | 107 | 熔峰驼: 30/36/43；雷冠蜥: 30/36/43；掘岩袋熊: 30/36/43；晶脊古虫: 30/36/43 | 16 |
| 赤曜沙海 | 7 | 普通 | SR | 118 | 熔峰驼: 31/37/44；雷冠蜥: 31/37/44；掘岩袋熊: 31/37/44；晶脊古虫: 31/37/44 | 18 |
| 赤曜沙海 | 8 | 普通 | SR | 121 | 熔峰驼: 31/37/44；雷冠蜥: 31/37/44；掘岩袋熊: 31/37/44；晶脊古虫: 31/37/44 | 18 |
| 赤曜沙海 | 9 | 普通 | SR | 132 | 熔峰驼: 31/37/44；雷冠蜥: 31/37/44；掘岩袋熊: 31/37/44；晶脊古虫: 31/37/44 | 18 |
| 赤曜沙海 | 10 | BOSS | SSR | 175 | 天铸钢牛: 32/38/45 | 不发普通掉落 |
| 冥辉天穹 | 1 | 普通 | SR | 78 | 冰帆鲸: 36/43/51；夜灯灵狸: 36/43/51；星瞳章: 36/43/51；月刃蝠: 36/43/51 | 16 |
| 冥辉天穹 | 2 | 普通 | SR | 89 | 冰帆鲸: 36/43/51；夜灯灵狸: 36/43/51；星瞳章: 36/43/51；月刃蝠: 36/43/51 | 16 |
| 冥辉天穹 | 3 | 普通 | SR | 91 | 冰帆鲸: 36/43/51；夜灯灵狸: 36/43/51；星瞳章: 36/43/51；月刃蝠: 36/43/51 | 16 |
| 冥辉天穹 | 4 | 普通 | SR | 103 | 冰帆鲸: 37/44/52；夜灯灵狸: 37/44/52；星瞳章: 37/44/52；月刃蝠: 37/44/52 | 18 |
| 冥辉天穹 | 5 | 精英 | SR | 123 | 绫月蝶蛾: 37/44/52 | 18 |
| 冥辉天穹 | 6 | 普通 | SR | 119 | 冰帆鲸: 37/44/52；夜灯灵狸: 37/44/52；星瞳章: 37/44/52；月刃蝠: 37/44/52 | 18 |
| 冥辉天穹 | 7 | 普通 | SR | 131 | 冰帆鲸: 38/45/53；夜灯灵狸: 38/45/53；星瞳章: 38/45/53；月刃蝠: 38/45/53 | 20 |
| 冥辉天穹 | 8 | 普通 | SR | 134 | 冰帆鲸: 38/45/53；夜灯灵狸: 38/45/53；星瞳章: 38/45/53；月刃蝠: 38/45/53 | 20 |
| 冥辉天穹 | 9 | 普通 | SR | 146 | 冰帆鲸: 38/45/53；夜灯灵狸: 38/45/53；星瞳章: 38/45/53；月刃蝠: 38/45/53 | 20 |
| 冥辉天穹 | 10 | BOSS | SSR | 192 | 九曜龙麟: 39/46/54 | 不发普通掉落 |

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

## 普通孵化品质概率

| 蛋 | R宠物 | SR宠物 | SSR宠物 |
| --- | --- | --- | --- |
| R | 90% | 9% | 1% |
| SR | 0% | 95% | 5% |
| SSR | 0% | 0% | 100% |

孵化基础 30 分钟，小晴24分钟；完整观看激励视频减少 30 分钟（无能量消耗）。交配 30 分钟产蛋后再孵化。交配蛋与结缘蛋品质固定。

## 药水倍率

| 物品 | 抽样数组 | 含义 |
| --- | --- | --- |
| 治疗 | 1/1/1/1/1/2/2/2/2/3 | ×1 50% / ×2 40% / ×3 10% |
| 力量 | 2/2/2/2/2/3/3/3/3/4 | ×2 50% / ×3 40% / ×4 10% |

资源矩形、脚底、肖像映射、原始敌方数组及初始状态见 [机器可读数据](design-data.json)。
