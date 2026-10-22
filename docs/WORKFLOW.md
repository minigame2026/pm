# 按模块检查与交付

基线：2026-10-21。统一入口为项目根的检查试玩.ps1，支持逗号组合模块。只运行本次相关模块。

| 范围 | 用途 |
|---|---|
| gyms | 对应地图解锁、九馆完整双属性池、50%难度提升、旧战斗续存与好友形态资源 |
| arena | 旧对战模块兼容检查；当前营地入口已由道馆替代，不作为现行功能验收 |
| onboarding | 开局、主角、初始伙伴 |
| locale | 22种语言、系统语言与英文回退、手动选择持久化、页面文字与存档不变；原有与新增语言分批避免单脚本超时 |
| locale-expanded | 新增10语言的320/390屏幕、技能实际渲染行宽及滚动、孵化动态翻译、圆形头像与滚动语言菜单 |
| logos | 十二语言封面LOGO、按需加载、比例与390/320宽、开始按钮 |
| enemy-visual | No.002普通/幻影/巨兽/护盾敌人单图显示、390/320宽及反复重绘 |
| battle / types | 战斗基础 / 属性克制 |
| app-battle | APP草叶海岸样板、三初始宠物姿态/攻防、两种屏幕、临时存档隔离 |
| map-layout | 12地区2行×6列、图鉴“全部”独立入口；地图图文不重叠，三种屏幕及多种长文本 |
| legendary | 10–12地图、54新形态与技能、递增蛋概率、闪光/遗传/旧数据兼容的纯规则检查 |
| legendary-art | 18张新图集、108正背视图完整裁切、透明边界与压缩映射 |
| legendary-runtime | 构建后新图实际加载、三地图战斗/技能/寻蛋、普通与闪光图鉴、22语言及小屏检查 |
| maps / rules | 历史地区检查 / 综合纯规则；新增10～12用legendary，固定旧数量脚本需先核对 |
| party | 个体、交配限制、候补、立绘裁切 |
| partners-layout | 伙伴页浏览器拉伸、图片与属性区隔离、缩放后的翻页和拖动换队 |
| party-combat | 独立生命/成长、阵亡替补、克制预览与查看、交配得蛋提示、战斗续存 |
| run-events | 异品质合成、54常驻＋8临时技能、20%奇遇、复活/巨化/续玩及390/320宽界面 |
| surprises | 金色骰子、神秘敌人、异色/蛋中蛋、秘密配方/共鸣、概率保底及存档幂等、390/320宽显示 |
| shiny | 闪光固定5%、形态来源遗传、不叠加最高攻击+2、当前图鉴普通/闪光分组、共享纹理异色、出场特效与体力广告图标 |
| recipes | 九配方覆盖18属性、双向组合/孵化保存、多语言及320宽APP模式配方册滑动 |
| team-rewards | 全队HP/最低攻击/最高攻击奖励、并列点数、阵亡候补、存档与390/320宽领奖界面 |
| breeding-ad | 交配视频立即完成、任务绑定、断网待发/重启、Tap双平台回调、390/320宽 |
| hatch / time | 孵化广告 / 可信时间与体力 |
| hatch-duration | R/SR/SSR孵化时长、小晴/测试模式、结缘蛋、孵化与交配广告立即完成及断网待发 |
| social / dex | 好友结缘 / 图鉴 |
| postcards | 离线明信片/心愿/一次掷骰/回信合影、PMV1/V2兼容、真实PNG二维码导入、390/320宽与英文页面 |
| battle-ambient | 原九地图战斗环境动态（新三图另由legendary-runtime覆盖）、390/320宽、层级与节点上限、反复刷新清理/减少动态 |
| scenery / touch | 地图与营地表现 / 横滑及移动操作 |
| app-pages | APP有界缓存/邻页加载、原生短滑与网页按钮翻页 |
| iteration-oct20 | 10层地图、初始技能、独立图鉴、扣血动画时机、倒计时与旧存档兼容 |
| audio | 音乐、音效、开关及后台 |
| resume / save | 崩溃续战 / 个体与崩溃存档 |
| ui / preview | 全屏功能页 / 浏览器基本流程 |
| ui-comfort | 单手触区/撤退确认、伙伴快捷换队与技能详情、交配技能池、来信三入口、好友图鉴与筛选、小屏长语言 |
| docs / tools | 最新文档与资源引用 / 自动化工具自身；均不构建游戏 |
| assets | 原图裁切换算、可见页加载、324视图、缓存回收、首屏测量和Trace |
| release | 用户要求全面测试时使用：全部模块＋按当前配置遍历长流程＋首屏负担与Trace；不是手机平台验收 |

## 常用入口

难度调整先运行 `difficulty-curve`（生产开局、120层、旧遭遇兼容、道馆不变）；需要平衡证据时另运行 `node tools/simulate-balance.cjs first 100` 与 `node tools/simulate-balance.cjs campaign 10`。模拟报告保存在checks，不读写玩家存档。长模拟不默认加入release，策略与限制见[BALANCE-SIMULATION](BALANCE-SIMULATION.md)。

~~~powershell
./检查试玩.ps1 -Scope types,party -Plan
./检查试玩.ps1 -Scope types,party
./检查试玩.ps1 -Scope resume
./检查试玩.ps1 -Scope docs,tools
./检查试玩.ps1 -Scope preview -ForceBuild
./检查试玩.ps1 -Scope release
~~~

`release`是全量检查清单，日常小修改仍使用相关模块。模块清单变化后用`node tools/register-release-check.cjs`更新；tools组会检查所有已注册脚本是否纳入release，漏项立即失败；最新测试结果与发布风险见[测试报告](TEST-REPORT.md)。

auto仅根据本次明确提供的Files选择，不扫描所有未提交文件。PMGame承担多个模块，最好直接选择功能组；不能因改了一个文案跑全项目。

`workflow.config.json` 的 `moduleRoutes` 提供新模块的精确路由：多语言文字及源翻译表→locale、语言LOGO→logos、APP表现→app-battle、加载缓存→assets、PMSharing/二维码库/Android分享桥→postcards。`--plan`可先查看范围；新模块补路由时同步检查`workflow.test.cjs`。

多个组共享一次类型检查、一次构建，去重重复脚本。构建成功后保存源文件与产物内容指纹；完全匹配才复用，源文件/资产/meta/settings/构建配置/产物变化都重建。ForceBuild用于显式重建；构建中源码变化停止验收。文档/工具组不要求启动Creator。

首次导入若仅为已有assets文件/目录新增.meta，自动再构建一次并单独保存`.import-retry.log`。已有文件改变/删除、已有.meta改变、无对应资产的新.meta均不走此重试；第二次仍变化或编译失败立即停止。不忽略UUID变化，也不无限重试。该分支已通过工具级模拟测试；后续真实新增资源时再核验实际命中。

## 文档与资源自动检查

~~~powershell
node tools/export-design-data.cjs
node tools/workflow.cjs --scope docs
~~~

导出脚本从当前规则与Art映射生成表格，记录源码SHA；广告减时通过实际函数探针取值，不使用旧能量常量。docs组检查快照过期、Markdown本地链接、废弃资料残留、模块脚本存在，以及关键内容规模。失败即停止，不能通过删断言让旧规则“通过”。

## 测试与结果

- 规则用纯模型；画面用独立浏览器存档；长计时用受控时钟。time组默认不依赖外部服务可用性，另设PM_LIVE_TIME=1才测试真实HTTPS校时。
- 修改异步动作后，检查脚本等待动作保存完成，再核对数据或截动画；不要同步调用后立即判断。
- resume使用独立持久化浏览器目录，强制结束其专属进程及子进程，不触碰玩家窗口。
- 每组当前报告：checks/workflow/<范围>-latest.json；最近运行另写latest.json。失败日志同目录。
- 退出码0还需通过输出；自动通过不等于截图验收。生成的截图须实际查看。
- 浏览器测试不等于微信/抖音或APP真机验证。新电脑先调整workflow.config.json工具路径。

## 上传前

先导出最新表→docs/tools检查→本次涉及的功能组→查看相关画面→核对文件与远端→提交推送。源码、运行资产、meta、生产来源、当前文档上传；构建缓存、测试日志/截图、浏览器profile、本机密钥不上传。旧资料从当前目录移除，Git历史可追溯；不强推抹除历史。
