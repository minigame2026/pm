# 架构、存档与模块复用

基线：2026-10-20。Cocos Creator 3.8.7，TypeScript，web-mobile竖屏原型。

| 模块 | 入口 | 职责 |
|---|---|---|
| 纯规则 | PMModel.ts | 宠物、地图、状态机、战斗/遗传/奖励/迁移 |
| 宿主 | PMGame.ts | 页面、输入、资源、动画、保存、生命周期 |
| 崩溃检查点 | DurableCheckpoint.ts | 浏览器IndexedDB严格持久化镜像 |
| 时间 | TrustedClock.ts | HTTPS时间锚点、单调计时、离线收益校时后结算 |
| 声音 | PMAudio.ts | 音乐/音效、开关、前后台暂停 |
| 美术 | BattleArt/EvolutionArt/RegionArt/RegionPads/HeroArt | 前后视图、三形态、脚底、地台、主角矩形 |
| 营地时段 | HomeScenery.ts | 本机时间的纯画面切换 |
| 检查 | [workflow.config](../tools/workflow.config.json) | 模块选组、构建复用、截图及结果 |

规则函数有效操作返回新State，无效操作返回原对象。显示异常先核对模型结果、路由、刷新范围；不能改随机数掩盖UI问题。

## 身份与状态

- 系列PetId定义属性/自然规则；形态是系列＋R/SR/SSR；拥有个体以UID为键，不能用系列ID替代。
- pets为长期个体，team为3槽UID；active/reserve为本局副本，runRoster按UID保留本局攻击升级。
- phase、mapId、step、敌人/品质/血量、hpRatio、turn、seed、已掷点数/倍率、药水标记及skill完整保存。
- SkillState含usedCodes、攻击次数、护盾、毒次数、下次最高、上次点数和最近伤害，重开不能清除已触发技能。
- eggs、incubators、pendingHatch、breeding、social、journey、stamina、expedition及可信时间一并保留。

## 保存与恢复

1. 主键pm.creature-dice.v1，合法上一份为.backup，首次迁移保留.pre-*。
2. 浏览器IndexedDB库pm-checkpoints-v1、仓库saves、键current保存完整镜像。checkpointSequence单调增加，不按手机时间判断新旧。
3. 启动restore校验主档/备份/镜像，选最高序号合法档，再prepareJourney处理初始流程；全无效才创建新档。
4. 有效探险操作计算完整结果，同步写Cocos本地档并等待IndexedDB严格事务完成，再播放动画；后台和前台周期补存，不依赖强退回调。
5. 无IndexedDB的原生/小游戏宿主沿用Cocos同步存储，保留保存失败提示；其落盘和强退需平台实测。
6. 封面点开始时expedition为true直接恢复game及phase，不重复进地图、扣体力或掷骰。主动撤退结束探险并保留长期收藏。

[恢复检查](../checks/battle-resume-runtime.cjs)已验证动画刷新、药水锁定、奖励幂等、失败恢复、强制终止独立Edge进程再开、主动撤退。不能据此保证断电、清理存储或玩家改档后的恢复。

**用户明确要求清档时，同时清主档、所有备份及IndexedDB镜像。** 只删localStorage会恢复镜像。复制新项目必须更换以上命名、音频键pm.audio.v1和社交协议前缀。

## 时间、广告与好友

见 [可信时间](TRUSTED-TIME.md)、[体力与探险](STAMINA.md)。本地时间只切营地画面；收益无可信时间时暂缓。广告完成后才发奖；校时失败保存待发标记，避免重复发放。接口预留不等于平台SDK已接通。

来访码为PMV1.owner.speciesIndex.rarityIndex.F或M.petUid.checksum。系列索引使用PET_IDS顺序，当前36系列，扩展不重排旧ID。校验码只检测错误，不认证身份。

## 验收与来源

按 [工作流](WORKFLOW.md) 选模块；构建、断言、截图、玩家验收分别记录。测试只用独立上下文；调试接口__pm不是玩家功能。

参考：[Cocos存储](https://docs.cocos.com/creator/3.8/manual/en/advanced-topics/data-storage.html)、[移动端退出回调限制](https://docs.unity.com/en-us/engine/6000.6/script-reference/unityengine/monobehaviour/onapplicationquit)、[IndexedDB持久化](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction/durability)。
