# 第7～9关与新增宠物

2026-10-20。新增18属性各1个系列，每系列R、SR、SSR三个独立形态，共54形态、108个正背战斗视图。本文仅记录第7～9关批次；当前总量见[总表](generated/TABLES.md)，不作为全游戏内容规模。

## 地图与蛋概率

|大关|地图|层数|精英 R / SR / SSR|BOSS R / SR / SSR|
|---|---|---|---|---|
|7|琉璃雨林|10|65% / 29% / 6%|35% / 35% / 30%|
|8|赤曜沙海|10|60% / 32% / 8%|30% / 35% / 35%|
|9|冥辉天穹|10|55% / 35% / 10%|25% / 35% / 40%|

沿用顺序解锁、整图进入消耗5体力、逢5精英/逢10BOSS的规则。每图独有6个系列：4普通、1精英、1BOSS。寻蛋独立抽蛋品质，再从本图系列等概率抽取；高品质蛋不会孵出更低品质宠物，孵化升阶概率沿用原规则。上表是寻蛋概率，不是孵化后的最终分布。

## 名录

|地图|属性|身份|R|SR|SSR|图集|
|---|---|---|---|---|---|---|
|琉璃雨林|一般|普通|蜜团睡鼠|蜜袋睡鼠|花蜜守望鼠|[nectar](../assets/resources/art/nectar-forms-v1.png)|
|琉璃雨林|草|普通|兰芽壁虎|花冠壁虎|翠兰花龙|[orchid](../assets/resources/art/orchid-forms-v1.png)|
|琉璃雨林|水|普通|露鳃螈|涟波螈|瀑冠灵螈|[axolotl](../assets/resources/art/axolotl-forms-v1.png)|
|琉璃雨林|虫|普通|灯豆萤|琥灯萤|曦灯萤后|[lantern](../assets/resources/art/lantern-forms-v1.png)|
|琉璃雨林|毒|精英|紫芽蛇|棘冠眼镜蛇|蚀花蛇君|[cobra](../assets/resources/art/cobra-forms-v1.png)|
|琉璃雨林|飞行|BOSS|冠喙雏|风冠犀鸟|苍穹冠皇|[hornbill](../assets/resources/art/hornbill-forms-v1.png)|
|赤曜沙海|火|普通|炭团驼|熔峰驼|赤曜焰驼|[embercamel](../assets/resources/art/embercamel-forms-v1.png)|
|赤曜沙海|电|普通|电扇蜥|雷冠蜥|霆环伞蜥|[frill](../assets/resources/art/frill-forms-v1.png)|
|赤曜沙海|地面|普通|砂团熊|掘岩袋熊|地脉堡熊|[wombat](../assets/resources/art/wombat-forms-v1.png)|
|赤曜沙海|岩石|普通|砾甲虫|晶脊古虫|磐古甲尊|[trilobite](../assets/resources/art/trilobite-forms-v1.png)|
|赤曜沙海|格斗|精英|拳爪獾|赤拳战獾|震岳斗獾|[wolverine](../assets/resources/art/wolverine-forms-v1.png)|
|赤曜沙海|钢|BOSS|铁角犊|铠峰野牛|天铸钢牛|[bison](../assets/resources/art/bison-forms-v1.png)|
|冥辉天穹|冰|普通|雪角鲸|冰帆鲸|霜冕角鲸|[narwhal](../assets/resources/art/narwhal-forms-v1.png)|
|冥辉天穹|幽灵|普通|幽面狸|夜灯灵狸|冥面幻狸|[raccoon](../assets/resources/art/raccoon-forms-v1.png)|
|冥辉天穹|超能力|普通|念泡章|星瞳章|星轨贤章|[octopus](../assets/resources/art/octopus-forms-v1.png)|
|冥辉天穹|恶|普通|暮绒蝠|月刃蝠|蚀夜翼蝠|[moonbat](../assets/resources/art/moonbat-forms-v1.png)|
|冥辉天穹|妖精|精英|月绒蛾|绫月蝶蛾|月华织梦蛾|[silkmoth](../assets/resources/art/silkmoth-forms-v1.png)|
|冥辉天穹|龙|BOSS|曜角驹|星鬃麒麟|九曜龙麟|[kirin](../assets/resources/art/kirin-forms-v1.png)|

## 数值与兼容

- 第7/8/9关R普通形态HP为68/80/94；精英+4，BOSS+8。普通攻击数组为12/17/23、16/22/29、21/28/36；精英各项+1，BOSS各项+2。
- SR再增加6HP、每项攻击+2；SSR再增加12HP、每项攻击+4。三个形态使用不同自动技能，沿用现有技能机制。
- 敌方沿用地图和层数成长公式；普通/精英/BOSS切换时不保证每层HP严格单调。各地图末层均为第10层BOSS。属于首版可测试曲线，尚待玩家平衡验收。
- 原有36系列顺序、名称、数值与已拥有个体保持；新ID追加，避免旧好友来访码的系列索引变化。
- 个体基础HP有效上限扩至200以容纳新SSR；探险HP奖励上限改为max(150,地图层数×5)，防止长探险合法奖励使存档无法恢复。攻击点数上限仍为100。
- 地图与图鉴地区标签固定为两行，支持320/390宽。第7/8/9关暂复用第4/5/6关同主题战斗、寻蛋及地台素材。

## 资产与自动检查

内置imagegen生成透明PNG，不使用换色代替进化。每个图集2列×3行，行依次R/SR/SSR，左背右正；正面复用于营地、头像和图鉴。保留完整像素与alpha，注册器只测量裁切与脚底锚点。

[设计与最终提示词](../art-source/regions-7-9/roster.json) · [生成记录](../art-source/regions-7-9/generation.json) · [几何索引](../art-source/regions-7-9/art-index.json) · [完整数值](generated/TABLES.md)。蜜团睡鼠图集另外经一次图片工具缩排，解决两个SSR轮廓接触。

验证入口：`检查试玩.ps1 -Scope maps,dex`，覆盖地图独立池、18属性、孵化/高层存档、蛋概率边界、顺序解锁、图集加载、地区标签两行选择和战斗/图鉴。平台真机与全程平衡验收单独进行。
