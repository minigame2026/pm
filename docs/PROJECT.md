# PM 项目交接卡

更新：2026-10-23。开工只进入本次相关模块，遵循用户任务基准。D:/game/PM，Cocos Creator 3.8.7、TypeScript、手机竖屏。

## 当前交付

- 网页：[本机试玩](http://127.0.0.1:8780/?balance=learn-v1)，服务目录build/web-mobile。测试用独立浏览器，不覆盖玩家存档。
- 最近调整：首关先上手，中段减缓断崖，后段递增；老档当前遭遇保留原数值，下场生效，道馆不变。见[曲线与模拟](BALANCE-SIMULATION.md)。
- 最新已存在APK：build/releases/骰子宠物精灵-安卓测试版-20261022-v10.apk，133.5MiB、1.0.9/code10；不含其后网页更新。本轮未重打APK或上架。
- iOS/Google Play/广告见[平台状态](RELEASE-STATUS.md)，推送主分支不等于更新商店包。20日著作权资料按用户要求冻结。
- [文档目录](README.md)、[最新复盘](REVIEW-LATEST.md)、[验证边界](STATUS.md)、[测试记录](TEST-REPORT.md)。

## 模块定位

| 修改内容 | 入口/规则 | 最小检查范围 |
|---|---|---|
| 曲线/开局/养成 | PMModel.ADVENTURE_DIFFICULTY；[数值](BALANCE.md) | difficulty-curve；长模拟按需 |
| 战斗/队伍/替补 | PMModel、PMGame | party-combat / types |
| 全队成长奖励 | PMModel | team-rewards |
| 技能/奇遇/闪光/配方 | SKILL_SPECS、SURPRISE_RULES、ShinyVisuals | run-events / surprises / shiny / recipes |
| 九道馆 | PMModel.GYMS、PMGymsUI；[规则](GYMS.md) | gyms |
| 54新神兽/10–12图 | [批次](REGIONS-10-12.md)、RegionArt | legendary / legendary-art / legendary-runtime |
| 来信/好友专属蛋 | PMSharing；[通信](SOCIAL-POSTCARDS.md) | postcards / gyms中的好友规则 |
| 界面与布局 | [UI模板](UI-PATTERNS.md)、PMGame | map-layout / ui-comfort / partners-layout |
| 营地布局/动效 | homeUI、homeMotionUpdate | home-layout / home-motion |
| 22语言 | PMLocale、TSV、expanded/overrides、编译器 | locale / locale-expanded / language-menu |
| 音乐 | PMAudio、audio-user-v1/manifest | audio |
| 计时/续战/广告 | TrustedClock、DurableCheckpoint、PMRewardedAds | time / resume / hatch-duration；平台另验 |
| 文档/工具 | [工作流](WORKFLOW.md)、[模板](TEMPLATE-REUSE.md) | docs / tools，不构建 |

## 当前事实

- 18属性90系列270形态（地图72＋好友18），12图各10层，选关2行×6；图鉴先270普通后270闪光。初始三选一，此后新宠物只通过孵化；UID独立、可重复。
- 正式入场5体力，上限30，每120秒恢复1点，显示下一点倒计时；逐图解锁，撤退重打、不返还体力。
- 3队员HP/本局成长独立，阵亡顺序替补；HP上限/最低和最高攻击奖励全队得到，数组替换及战后20%治疗仅出战。普通层20%奇遇，临时效果仅本关。
- 108自然＋8临时＋3共鸣，兼容16旧技能；9配方覆盖18属性。5%孵化闪光，最高攻击+2。交配选中闪光亲本形态才继承，否则仍可自发闪光。
- 孵化R/SR/SSR为10/20/30分钟，小晴缩短20%；交配30分钟产蛋，领取消耗父母，交配中不能参战。两者视频立即完成，可信校时失败暂缓。
- 异品质遗传高品质形态，同品质50%随父母；HP和攻击数组独立遗传。技能去重后1→1；2→2；3→2/3各50%；4→2/3/4为25/50/25%；5→3/4/5同分布；≥6→4/5/6同分布。已生成任务/蛋不重抽。
- 9道馆通过对应1–9地图解锁，各双属性全部系列，10战无偷蛋、通关不可重打；徽章永久对应属性HP/攻击+10%，不写入遗传基础。
- 好友扫码＋回信双方各一次赠蛋；每好友可信24小时周期30%赠蛋。好友蛋只出54专属形态，品质70/25/5；无自动跨机通知。
- 22语言自动匹配、英文回退、手动选择；新增hi/ar/ru/ur/bn/tr/fil/mr/te/ta，使用英文LOGO和国际名字。母语审校/原生字体待验。
- 6首用户音乐（长短营地、普通/精英/BOSS、偷蛋），地区轻动效、营地6时段。运行图按需加载，原画保留在art-source不进包。

## 执行约定

相关组共享构建，新scope登记release；仅按任务范围检查。规则变化后导出generated只读快照。技术通过、截图、玩家验收、平台真机分开记录。
新项目按[模板指南](TEMPLATE-REUSE.md)更换存储身份/端口/平台配置。批量内容/语言和真实开局平衡经验见[仓库SKILL](../tools/skills/cocos-miniapp-game-dev/SKILL.md)。历史留Git，交接卡不再叠加旧版本日志。
