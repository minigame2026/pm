# 架构、数据与存档

基线：2026-10-19。配套 [设计](GAME-DESIGN.md)、[数值](BALANCE.md)、[检查工作流](WORKFLOW.md)。

## 代码分工

| 文件 | 职责 |
|---|---|
| [PMModel.ts](../assets/scripts/PMModel.ts) | 纯 TypeScript 状态与规则；宠物、地图、回合、奖励、蛋、遗传、社交、校验和迁移 |
| [PMGame.ts](../assets/scripts/PMGame.ts) | Cocos 节点、页面、输入、动画、图片加载、存档与计时刷新 |
| [BattleArt.ts](../assets/scripts/BattleArt.ts) | R 形态双视图裁切矩形、脚底位置 |
| [EvolutionArt.ts](../assets/scripts/EvolutionArt.ts) | SR/SSR 双视图矩形、脚底位置 |
| [PMGame.scene](../assets/scenes/PMGame.scene) | 项目启动场景；UI 主要由代码生成 |
| [build-config.json](../build-config.json) | 当前 web-mobile 调试构建、竖屏、场景 UUID |
| [workflow.config.json](../tools/workflow.config.json) | 本机编辑器/编译器/浏览器工具路径、预览 URL 和测试组 |

规则函数通过返回新状态处理有效操作，无效操作一般返回原对象；页面用对象是否变化判断是否保存/刷新。`act` 处理探险动作，`assignPartySlot/startIncubation/startBreeding/startBondIncubation` 等处理对应系统。模型不依赖 Cocos，适合用独立脚本验证规则。

显示与状态不同步时，先检查模型结果、页面路由和节点刷新范围，避免通过改随机数掩盖 UI 问题。按钮与动作由 `busy/pressPending` 防重入；战斗结算先提交保存，再播放动画。不要把发奖延后到动画结束回调。

## 三层宠物身份

| 层级 | 键 | 用途 |
|---|---|---|
| 系列 | `PetId`，例如 `fox` | 属性、自然数值、地图池、美术资源根名 |
| 形态 | 系列＋品质，例如 `fox-SR` | 名称、外观和自然品质技能；图鉴查询另用 `fox:SR` |
| 个体 | `Pet.uid` | 实际收藏、编队、交配、独立遗传；相同形态可有很多 UID |

内部品质枚举仍为 `normal/SR/SSR`，`rarityName(normal)` 显示 R。不要批量把存档字符串 normal 换成 R。`owned` 是曾记录的系列目录，不能用于统计现有宠物数量；当前个体以 `pets` 为准，父母消耗后旧系列目录仍可存在。

## 数据字典

### 宠物、蛋与长期任务

| 对象 | 字段 | 语义 |
|---|---|---|
| Pet | `id, rarity, uid, sex` | 系列、品质、唯一身份、female/male |
| Pet | `baseHP, baseFaces, skills` | 可遗传的永久基因；1–6个去重技能；不是当前探险升级 |
| Pet | `faces` | 当前对象的攻击数组；active/runRoster 可携带本局升级 |
| Genes | `id, rarity, baseHP, baseFaces, skills` | 交配蛋固定遗传，无性别/UID；孵出时创建 |
| Egg | `id, rarity, affinity, stage, mapId?` | 唯一蛋、品质、系列、获得关卡、来源地图；交配蛋stage=0 |
| Egg | `genes?` | 有此项为遗传蛋，品质固定 |
| Egg | `bond?` | 结缘来源、目标系列及 `sourceAffinity` 原系列，品质固定 |
| Incubation | `eggId, startedAt, readyAt, result` | 槽位任务，result 在入槽确定；slot为null表示空 |
| Breeding | `id, mother, father, startedAt, readyAt, genes` | 实际代码字段是 mother/father UID；领取蛋前保留父母 |
| HatchResult | `eggId, petId, rarity, uid, duplicate, warmthGain` | 待确认揭晓；新个体当前duplicate=false，warmthGain=0 |
| FriendCard | `version, owner, petUid, species, rarity, sex, id` | 仅外观身份快照，不携带可复制的技能或数值 |
| FriendSocial | `version, owner, visitor?, bonds[]` | 本机身份、当前访客互动进度、已结缘系列 |

时间字段为 Unix 毫秒，使用本机 `Date.now()`；关闭期间通过当前时间与 readyAt 比较计算离线进度，无后台持续运行服务。系统时钟被调整会影响进度。

### State 根字段

| 分组 | 字段 |
|---|---|
| 版本与随机 | `version:1, contentVersion:2, individualVersion:1, mapVersion:1, revision, seed, hatchSeed` |
| 地图 | `mapId, step, clearedMaps, wins`；wins为累计地图终点BOSS胜利次数，清图标记在寻蛋后继续时写入 |
| 本局队伍 | `active, reserve, team[3], runRoster`；team存UID；runRoster按UID保存本局点数 |
| 生命与消耗 | `hpRatio, hpBonus, potions, boosts, healFaces` |
| 当前回合 | `phase, turn, attack, heal, enemyAttack, healMultiplier, boostMultiplier, usedHeal, doubled, skill` |
| 敌人与掉落 | `enemy, enemyRarity, enemyHP, enemyMax, swaps, reward, previousReward` |
| 收藏 | `pets, owned, qualities, preferredRarities`；后两项含历史兼容用途，不提供原地品质切换 |
| 孵化 | `eggs, eggHunt, incubators[2], warmth, hatchedEggIds, pendingHatch` |
| 交配 / 社交 | `breeding, breedingSerial, social` |
| 旧字段 | `roster, partySlots, recruit`；仅迁移兼容，新增功能不要继续依赖系列当个体键 |
| 文案 | `message`；不作为规则判定依据 |

`SkillState` 保存已触发代码 `usedCodes`、攻击次数、护盾、毒剩余次数、下次最高、上次点数、事件与最近实际伤害。`used` 为兼容汇总；技能是否可用以 `usedCodes` 为准。

## 保存、恢复与迁移

主键：`pm.creature-dice.v1`；通过 Cocos `sys.localStorage` 存 JSON。

启动先 `restore(主键)`，失败则 `restore(.backup)`，两者均无有效结果时 `fresh()`。保存前把上一份可通过 restore 的主档保存到 `.backup`；迁移首次分别保留 `.pre-individuals-v1`、`.pre-maps-v1`、`.pre-social-v1`。保存异常展示失败提示。备份都在同一个本地存储中，清浏览器数据会一起删除，不是异地备份。

`restore` 执行结构、范围、关联关系校验和兼容迁移：旧系列收藏变成个体；旧队伍绑定UID；已使用技能补代码；旧地图推断；旧招募界面推进到当前流程；遗传父母、蛋、槽位、已领取ID和结缘信息必须相互一致。读取失败返回null，不可把未校验的导入对象直接赋给state。

关键校验边界：HP加成0–150；个体基础HP1–100；基础点数组1–5项，每项整数1–100；技能1–6种且去重；药水0–9；能量0–9999；队伍恰好3槽且非空UID不重复、能定位到pets；孵化恰好2槽、不重复占用同一蛋；蛋来源关卡及地图系列合法。当前个别运行时增长未与校验上限共用定义，扩展数值必须一起改。

重开/开始地图重置关卡、药水、HP加成、治疗点数、本局攻击缓存和随机战斗状态；保留宠物、队伍、所有蛋和计时、已孵ID、能量、交配、地图通关与社交。返回营地只切路由，不重置。当前UI页签、选中卡、分页不是长期存档，重启进入营地。

## 离线来访码协议

格式：`PMV1.owner.speciesIndex.rarityIndex.F或M.petUid.checksum`，7段，ASCII身份，最多1024字符输入，可去掉空白。系列下标依据 **PETS 的键插入顺序**；品质顺序 normal/SR/SSR。checksum是FNV-1a 32位再转base36，只检测抄错，不认证玩家。

不可随意重排PET_IDS或增加第19种后就声称旧码兼容：解析器目前限定0–17。新项目应换协议前缀与存档命名；本项目扩系列需协议版本和旧码迁移策略。复制/粘贴分享，剪贴板不可用有手动途径；不是已接入微信好友、二维码扫描或联网互访。

## 测试和调试接口

`globalThis.__pm` 当前提供 `ready, version, snapshot(), controls(), animating()`，用于隔离浏览器测试；不作为正式玩家功能。package版本0.1.0、页面诊断版本0.11.0不是同一发布管理字段，以源码指纹区分本次资料基线。

按 [工作流](WORKFLOW.md) 选择相关组。规则变更至少核对输入合法性、状态转移、边界和读档；个体变化核对UID、队伍与消耗；概率变化校验候选池和分布，不能只断言单次抽到某值。旧检查中的旧20关、重复转能量、品质切换断言可能已失效，未审核前不要混入当前组。

本次文档导出只执行纯模型读取、资源校验与文档一致性检查，不启动/重建游戏、不操作玩家存档。资源加载与视觉验收另按需要执行。

## 按功能选择的验收场景

下表是修改对应功能时的检查范围，不要求每次小改都跑全表；脚本组是否覆盖本次细节仍需核对。

| 功能 | 必查场景 | 现有检查入口 |
|---|---|---|
| 点数与战斗 | 重复点数权重、9及多位数显示、两药水每回合限一次、99%防御取整、致命一击无反击、被动顺序 | model.test；workflow-smoke；数字显示需看画面 |
| 奖励 | 攻击/治疗整组替换与保留、单项奖励、库存封顶、精英与BOSS不同路径 | model.test；需要时检查reward-choice历史脚本适用性 |
| 地图 | 10/20/30终点、普通/精英/BOSS池、三图解锁、换图重置、寻蛋率 | maps-breeding.test |
| 伙伴 | 重复形态UID不串、换队保持HP比例/本局攻击、拖放与取消、战斗锁定、空队伍 | individuals-breeding.test；对应拖队场景实际检查 |
| 孵化 | 两槽互斥、离线/加速、蛋品质下限、揭晓重载、重复领取、性别 | individuals-breeding.test；fullscreen-runtime |
| 交配 | 雌雄限制、去重技能概率、遗传排除临时升级、领取删除父母、全空后孵化恢复 | individuals-breeding.test；maps-breeding.test；fullscreen-runtime |
| 来访结缘 | 双独立存档、本人码/错码、三次互动、锁区R、品质固定、遗传保留、重载 | friend-visit.test；friend-visit-runtime |
| 存档 | 主档有效/损坏、备份恢复、旧版迁移、已领取和计时保持 | save组；必要时补本次新增字段的迁移样例 |
| UI | 390×844与320×568、文字/图标不挤压、按钮反馈、返回链、局部刷新 | ui组＋本次实际截图检查 |

检查记录应写“本次执行哪些、结果、未覆盖什么”，不能将本表全部视为已执行。真实玩家存档只读取或备份，不用调试状态覆盖。
