# 按模块检查与交付

基线：2026-10-21。统一入口为项目根的检查试玩.ps1，支持逗号组合模块。只运行本次相关模块。

| 范围 | 用途 |
|---|---|
| onboarding | 开局、主角、初始伙伴 |
| locale | 十二语言、系统语言与英文回退、手动选择持久化、页面文字与存档不变 |
| logos | 十二语言封面LOGO、按需加载、比例与390/320宽、开始按钮 |
| battle / types | 战斗基础 / 属性克制 |
| app-battle | APP草叶海岸样板、三初始宠物姿态/攻防、两种屏幕、临时存档隔离 |
| map-layout | 九地图预览图/名称/说明不重叠；三种屏幕与英文/德文长文本 |
| maps / rules | 九地图内容 / 综合纯规则 |
| party | 个体、交配限制、候补、立绘裁切 |
| party-combat | 独立生命/成长、阵亡替补、克制预览与查看、交配得蛋提示、战斗续存 |
| run-events | 异品质合成、54常驻＋8临时技能、20%奇遇、复活/巨化/续玩及390/320宽界面 |
| surprises | 金色骰子、神秘敌人、异色/蛋中蛋、秘密配方/共鸣、概率保底及存档幂等、390/320宽显示 |
| team-rewards | 全队HP/最低攻击/最高攻击奖励、并列点数、阵亡候补、存档与390/320宽领奖界面 |
| hatch / time | 孵化广告 / 可信时间与体力 |
| social / dex | 好友结缘 / 图鉴 |
| postcards | 离线明信片/心愿/一次掷骰/回信合影、PMV1/V2兼容、真实PNG二维码导入、390/320宽与英文页面 |
| scenery / touch | 地图与营地表现 / 横滑及移动操作 |
| app-pages | APP有界缓存/邻页加载、原生短滑与网页按钮翻页 |
| iteration-oct20 | 10层地图、初始技能、独立图鉴、扣血动画时机、倒计时与旧存档兼容 |
| audio | 音乐、音效、开关及后台 |
| resume / save | 崩溃续战 / 个体与崩溃存档 |
| ui / preview | 全屏功能页 / 浏览器基本流程 |
| docs / tools | 最新文档与资源引用 / 自动化工具自身；均不构建游戏 |
| assets | 原图裁切换算、可见页加载、324视图、缓存回收、首屏测量和Trace |
| release | 用户要求全面测试时使用：全部模块＋按当前配置遍历长流程＋首屏负担与Trace；不是手机平台验收 |

## 常用入口

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
