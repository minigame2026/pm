# 按模块检查与交付

基线：2026-10-20。统一入口为项目根的检查试玩.ps1，支持逗号组合模块。只运行本次相关模块。

| 范围 | 用途 |
|---|---|
| onboarding | 开局、主角、初始伙伴 |
| battle / types | 战斗基础 / 属性克制 |
| maps / rules | 六地图内容 / 综合纯规则 |
| party | 个体、交配限制、候补、立绘裁切 |
| hatch / time | 孵化广告 / 可信时间与体力 |
| social / dex | 好友结缘 / 图鉴 |
| scenery / touch | 地图与营地表现 / 横滑及移动操作 |
| audio | 音乐、音效、开关及后台 |
| resume / save | 崩溃续战 / 个体与崩溃存档 |
| ui / preview | 全屏功能页 / 浏览器基本流程 |
| docs / tools | 最新文档与资源引用 / 自动化工具自身；均不构建游戏 |

## 常用入口

~~~powershell
./检查试玩.ps1 -Scope types,party -Plan
./检查试玩.ps1 -Scope types,party
./检查试玩.ps1 -Scope resume
./检查试玩.ps1 -Scope docs,tools
./检查试玩.ps1 -Scope preview -ForceBuild
~~~

auto仅根据本次明确提供的Files选择，不扫描所有未提交文件。PMGame承担多个模块，最好直接选择功能组；不能因改了一个文案跑全项目。

多个组共享一次类型检查、一次构建，去重重复脚本。构建成功后保存源文件与产物内容指纹；完全匹配才复用，源文件/资产/meta/settings/构建配置/产物变化都重建。ForceBuild用于显式重建；构建中源码变化停止验收。文档/工具组不要求启动Creator。

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
