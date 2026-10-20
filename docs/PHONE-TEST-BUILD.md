# 手机测试包与本地小游戏工程

当前最新APK为[APP战斗样板v5](APP-BATTLE-SAMPLE.md)，包含三初始宠物增强演出。以下v4记录保留为基础构建/原生修复说明；最新网页五语言LOGO尚未打入v5。微信仅准备本地工程，尚无正式AppID，不上传平台。

此前基础测试包：`build/releases/骰子宠物精灵-安卓测试版-20261020-v4.apk`，108959899字节（约104MiB），versionName 1.0.3 / versionCode 4。
本轮修复：来信 EditBox 的背景 Sprite 与 Graphics 拆到不同节点，避免原生 RenderEntity 冲突；分页先配置 PageView 再启用容器，随后移动绘制节点，避免 Graphics 禁用后丢失原生绘制数据。类型检查、构建、签名校验通过；MuMu Android12覆盖安装、来信输入/分享/结缘切页、探险与图鉴背景、地区横滑第二页均检查。未替代物理手机验证。
已验证：APK v1/v2签名，MuMu Android12安装启动、主角/初始宠物选择、联网校时后进入探险、一次实际攻防、强制停止再启动恢复第2回合（己方20/22、敌方3/7及骰子/药水倍率保持）。截图在 `checks/android-*.png`。这是模拟器验证，不代表物理手机或小游戏真机验收。
APP图标使用 `art-source/app-icon-v4/` 的幼年宠物抱骰子；安卓各密度启动图标已同步，打包后的640dpi图与源文件像素核对一致。

## 安卓

- Cocos Creator 3.8.7 原生 Android，包名 `com.minigame2026.dicepet`，竖屏，ARM64。
- 内置游戏资源，不依赖电脑的 8780 试玩服务；可信时间需要互联网，校时失败时暂缓时间收益结算。
- 内测使用 Cocos 测试签名。正式发布前需要专用签名及平台合规配置；更换签名通常无法覆盖安装此测试包。
- 当前源码已接TapTap广告接口与原生SDK，后台参数及真实广告待验证；未完成观看时不发放奖励。
- APK 与浏览器存档彼此独立；同签名覆盖安装保留 APK 存档，卸载会清除。

构建顺序：`node tools/build-platform.cjs android`，然后 `powershell -File tools/compile-android.ps1`。
编译工具位置记录在本机 `C:/Users/k/Documents/Codex/Tools/android-development/installation.json`；JDK17、NDK23.2.8568313、SDK34、CMake3.22.1。
首次构建需要下载 Gradle/Maven 依赖，后续复用缓存；编译脚本只为当前进程使用 Windows 已配置的代理。

## 微信本地工程

- 导入目录：`D:/game/PM/build/wechatgame`。
- 资源目录：`D:/game/PM/build/wechat-remote`。
- 运行 `node tools/serve-wechat-local.cjs`，资源监听 `http://127.0.0.1:8782/`。
- 开发者工具以游客 AppID `touristappid` 导入；本地配置关闭域名检查，仅供本机模拟器调试。CLI 服务端口当前关闭，未完成开发者工具自动启动验证。
- 再次导出：`node tools/build-platform.cjs wechatgame`；自动执行资源拆分，脚本留在代码包内，图片/音频按需请求。
- 手机不能通过自己的 `127.0.0.1` 访问电脑。后续真机体验需要正式 AppID、HTTPS 资源托管与合法域名配置；`timeapi.io`、`worldtimeapi.org` 校时请求也需配置合法 request 域名。
- 本地目录已导出不等于平台审核、包体限制或真机性能已通过；正式提交前仍需引擎裁剪、平台包体检查、广告接入和设备测试。

## 本轮必要适配

`TrustedClock.requestTimeJson` 根据运行环境使用微信/抖音 request、浏览器 fetch 或原生 XMLHttpRequest；继续保持校时失败暂缓结算。`checks/time-transport.test.cjs` 与 `checks/trusted-clock.test.cjs` 覆盖请求分支和失败处理，不以手机时间兜底。

## v4快速测试参数与恢复正式数值

使用 `node tools/build-test-apk.cjs`，只在导出测试APK期间启用测试值，结束后恢复源码。v4入场1体力、孵化/交配基础3秒，小晴仍有20%缩时；已有任务保留原完成时刻。`node tools/build-platform.cjs android` 为正式数值导出入口，检测到测试值会拒绝普通导出。此处“正式数值”不代表正式签名或商店审核完成，当前仍为同签名内测包。

APP：本地包内资源，当前/相邻页预建，滑动时不重建整页；纹理驻留预算96MiB/120秒，活跃资源保留。网页/小游戏：按钮翻页，按需加载32MiB/4秒闲置回收。此次APK实际包内参数与3秒孵化边界已检查；MuMu检查了独立图鉴、短滑、图片和体力显示，手机流畅度由测试者验收。
