# 小游戏性能优化

用于 Cocos 小游戏包体过大、冷启动慢、内存/FPS 不达标及平台准入复测。先读通用诊断和验收部分；仅在 Tap + Creator 3.8 的资源分包任务中采用对应配置。经验来自 2026-10-23 PM 项目的实际修改、构建和平台报告；平台限额、接口及工具行为在下一次使用时重新核实。

## 1. 先定位失败，再选择改动

- 记录引擎版本、目标平台、包体版本/编号、测试任务、设备型号/档位、系统、失败项，以及可获得的日志/截图。确认正在读本次包体的报告。
- 分开判断运行加载失败、冷启动、内存均值/峰值、FPS 和卡顿率。一个设备的醒目数值不等于失败原因；其他引擎专用的缺省指标也不能直接解释为本引擎故障。
- 按当前平台标准的引擎和设备档位解释阈值。不同轮次设备可能变化，不能直接用两台不同设备的秒数宣称提速比例。
- 拆出首屏依赖：下载/解包、引擎解析、首屏资源读取/解码、网络等待、脚本初始化、首帧绘制。优先消除实测阻塞；内存和 FPS 已通过时，不先全局降低画质或砍玩法。
- 借鉴成熟项目时先匹配引擎版本和运行环境。旧版案例可借鉴“最小首屏、按需资源、裁剪未用模块”的原则，配置/API 必须用本项目版本验证。

## 2. 缩短首屏关键路径

### 网络与就绪时机

将首屏不需要的校时、统计等请求移出首屏等待链，并处理超时/失败。登录、防沉迷和可信时间的业务门槛保留在真正需要它们的入口；不能为了提速绕过门槛。

PM 的首屏曾等待串行校时请求。改为后台校时后，可交互封面先显示；体力、孵化、交配、离线收益仍由 `requireTime` / `TrustedClock` 阻止未校时结算。用“请求一直 pending”的测试确认首屏能出现，同时时间收益仍不能领取。

Tap 的就绪上报放在实际可交互首屏绘制完成后。该项目使用 Cocos `director.once(Director.EVENT_AFTER_DRAW, ...)`，再通过适配器调用一次 `tap.reportScene({sceneId: 7})`。不是 `Game.EVENT_AFTER_DRAW`。先核实当前平台对 sceneId 的定义；不能在空白屏就绪、脚本开始或虚构耗时处上报来改善测试数值。

### 音频与资源

- 检查构造函数是否已经开始读取/解码全部音效和音乐；仅延迟播放不能减轻这些启动开销。非首屏必需音频可延至首次交互或实际使用。
- 音频准备操作应幂等；覆盖重复点击、后台恢复、静音、广告暂停/恢复、对象已销毁等路径。用户关闭音乐时保持偏好。
- 首屏只保留实际必需的图片、字体、材质及依赖。图鉴、区域美术和后续音乐按需加载；避免构造对象时顺带预载全目录。
- 合并同一资源/分包的并发加载；失败后允许重试。按所属 bundle 释放资源，加载期间收到释放请求时要保证所有等待回调消费资源前不被提前释放。

## 3. 包体、贴图与引擎

| 证据或问题 | 对应做法 | 必须区分的边界 |
|---|---|---|
| PNG/传输包较大 | 在目标导出物中压缩、去冗余，检查透明和可见质量 | PNG/ZIP 变小不等于解码后内存变小 |
| 大尺寸贴图实际只显示很小 | 依据显示尺寸/DPR 缩放，检查 atlas/SpriteFrame 裁切和文字 | RGBA8 的宽×高×4只是基础估算，不是实测峰值 |
| 大量资源启动即加载 | 分离首屏资源，按需加载和有界缓存 | 分包本身不会释放已加载的纹理 |
| 未使用引擎模块占包体/解析时间 | 用 Creator 官方模块配置按目标裁剪 | 保留实际用到的 UI、Mask、Graphics、材质、音频等依赖 |

保护原始资源和其他发行端：同项目同时出 APP/Web 时，用独立目标配置或隔离构建工程改导入设置、移动资源和压缩。保留 `.meta` / UUID，避免使其他目标失效。

Creator 3.8.7 案例使用 `engineModulesConfigKey: "tap2d"` 选择目标专用模块配置，未改变全局默认配置。根据实际引用去掉了 3D、物理、Spine 等未用模块；最终引擎 JS 约从 3 MB 降至 1.5 MB。该白名单只适用于当时的 2D 项目，不能复制到使用骨骼动画或物理的游戏。查看最终 includeModules/产物及实际遮罩、特效和音频表现，不能只看配置文本。

## 4. Tap + Creator 3.8 的真实资源分包

### 导出正确的分包

1. `resources` 若在启动时预载，将整目录变成一个大分包仍会阻塞首屏。保留小型首屏资源；把后续资源及其 `.meta` 移到 `resources` 外的同级 bundle 目录，避免嵌套 bundle。按进入场景、图集家族、音乐用途分组，避免首次点击下载一个巨包。
2. 通过路径到 bundle 的映射和标准 `assetManager.loadBundle` 按需加载。检查主包、首场景及公共依赖没有反向牵入全部内容；内容分包不应都在启动列表内。
3. **Creator 3.8.7 实测坑：**任务 JSON 的 `bundleConfigs` 数组没有使本次完整构建按所填方式分包。完整构建实际读取目录 `.meta` 的 `userData.bundleConfigID`，再解析项目 builder 的 bundle 预设。不能仅凭数组已写入就判定生效。
4. 本项目有效配置在 `settings/v2/packages/builder.json`：`bundleConfig.custom.<preset>.configs.miniGame.preferredOptions` 设置 `{ "isRemote": false, "compressionType": "subpackage" }`，内容目录 `.meta` 的 `userData.bundleConfigID` 指向该预设。新 Creator 版本应先核对配置结构。
5. 从未分包切换时清除相关构建缓存影响；该项目采用 `useBuildAssetCache: false` 和全新导出目录。核对实际 `subpackages/`、`src/settings.json` 的分包名单和启动列表，成功退出码不是分包生效证据。

### 转换与加载链

- Tap 清单使用 `game.json.subPackages`；Creator 输出可能是小写 `subpackages`。按当前 Tap 规范归一化；`src/settings.json.assets.subpackages` 仍是引擎字段，不能全局改名。
- 名单、名称和 root 路径必须与目录一致。检查每包入口 `game.js`，必要时转发已有 Creator `index.js`，保留原入口执行语义和依赖路径。
- 本次官方转换器未自动改写 `web-adapter.js` 内实际的 `wx.loadSubpackage` 调用。检查真实加载链；适配器应调用真实 Tap API，保留成功/失败和进度回调。不得用空回调假装加载成功。
- PM 针对已确认的调用点使用 `(/* PM_TAP_SUBPACKAGE_BRIDGE */typeof tap !== 'undefined' && tap ? tap : wx).loadSubpackage(...)`。此片段不是通用跨平台 SDK；Tap 存在但缺 API 时不能静默伪造成功，应按实际支持情况报错处理。
- `useSubpackage: true` 这个转换参数本身不能证明生成了资源分包。后台某列“不支持分包”在本次页面指 WASM 分包；WASM 代码分包与 Cocos 资源分包要分别核实。
- 在官方转换/打 ZIP **之前**完成适配和资源优化，并检查转换后文件；转换器可能重排空白，校验要针对语义，避免因纯格式变化误报。若之后改文件，必须重新生成 ZIP 并校验最终 ZIP。
- 检查转换器是否清空目标目录。使用已解析、位于预期构建区且与源码分离的专用输出路径，不能向源码或含其他交付物的目录转换。
- 按当前后台文档提交要求打包。转换工具某模式产出多个 ZIP，不代表商店必须按同样方式分开上传；本次后台接收含主包与资源分包的一个游戏 ZIP。

## 5. 验证、复测与停止条件

保持顺序：隔离目标工程 → Creator 实际导出 → 分包适配及目标资源优化 → 官方转换/打包 → 校验最终 ZIP → 授权范围内上传和读取测试结果。

- **构建层：**等待实际 Creator 进程结束，检查版本匹配的成功码、日志、输出时间和文件。Windows 构建方式见 [Platform builds](platform-builds.md)。构建期间避免并发修改相同源码/配置；新鲜且匹配的源与产物才能构成证据。
- **包体层：**校验 ZIP 可读性、版本、SDK 配置、清单、每包入口、资源路由和实际依赖。分别记录整体压缩包、主包压缩条目之和、主包解压字节、分包数量/大小。ZIP 条目统计是本地测算，不能当作平台实测下载量或冷启动时间。
- **行为层：**覆盖首屏、首次进入分包页面、图鉴/后期地图/战斗、资源失败重试和释放、音频静音/后台/广告恢复、多语言标题裁切。新增检查围绕本次改动；不默认跑全部历史测试。浏览器可发现画面/路径问题，但不能代替 Tap 真机兼容、登录或广告实播验收。
- **平台层：**记录本轮版本、包号、任务和原始结果。具体“未通过”按失败项定位下一轮；“测试异常”先检查任务状态/日志，平台提供重测时可在既有授权内重试。持续相同异常或无新证据时停止盲传，明确阻碍；不要重传同包碰运气。
- 用户已授权反复优化时，有新证据就修改、验证、再提交；没有上传授权时，交付可测试包。目标已通过即停止。平台通过只说明可见测试结论，不自动代表备案、正式审核或人工真机验收完成。
- 成功行没有逐台报告时，只报告平台显示的“测试通过”。不能补写设备全通过比例、帧率、耗时或广告成功率。

## 6. PM 的已验证案例与复用入口

以下是 **2026-10-23 的历史证据**，不是后续任意新包的状态。项目根当时为 `D:/game/PM`；路径均相对此根，迁移后需重新定位。

| 版本 / 包号 / 任务 | 主要变化 | 当轮观察 |
|---|---|---|
| 1.0.14 / 354731 / 34458 | 起始对照 | 运行检查通过；3 台冷启动未过：9.12 / 17.89 / 9.59 秒；内存/FPS/卡顿率通过 |
| 1.0.15 / 355701 / 34552 | 首屏不等待校时，真实绘制后上报 | 仍有 9.50 秒冷启动失败，另有设备加载失败 |
| 1.0.16 / 356090 / 34580 | Tap 专用引擎裁剪、音频首次交互加载 | 仍有 9.61 秒冷启动失败，另有设备加载失败 |
| 1.0.17 / 356572 / 成功行无逐台入口 | 真实资源分包、按需路由、过大首屏标题缩放 | 初次任务异常，后台重测后显示“测试通过” |

不同轮次设备不同，以上不是单变量/同设备性能对比。不能给每项优化分配未经测量的提速比例，也不能从最终通过推定前几轮所有加载失败的独立根因已确认。

最终包 `build/releases/骰子宠物精灵-Tap小游戏-1.0.17.zip`：51,603,793 字节；本地主包压缩条目之和 3,085,777 字节，未压缩 5,580,559 字节，21 个资源分包。这些是该项目的结果，不是推荐的固定分包数或平台限额。

证据：`checks/tap-performance-rounds.json`、`checks/tap-v17-zip-check.json`、`checks/tap-v17-final-layout.json`、`checks/tap-v17-startup-optimization.json`、`checks/tap-mini-v17-passed.png`。

已有工具先复用，不重新实现；调用前检查当前接口和路径约束：

| 工具/代码 | 已有用途 |
|---|---|
| `tools/prepare-tap-project.cjs` | 隔离工程、保留 UUID、分组及路由、真实 builder 预设；12 MiB 源资源分组预算是项目启发式，不是平台上限 |
| `tools/prepare-tap-subpackages.cjs` | 清单/入口/真实 API 桥；`--check` 只检查；大小上限参数仅填当前已核实的限制 |
| `tools/optimize-tap-images.cjs` | 仅压缩导出 PNG，检查尺寸/透明；源图不变 |
| `tools/optimize-tap-startup.cjs` | 本项目标题按 UUID 定位，过大标题缩至最大 1024 宽并验证裁切；其他项目按实际显示需求选择尺寸 |
| `PMGame.ts` / `PMTapServices.ts` / `PMAudio.ts` | 非阻塞首屏、绘制后就绪上报、幂等延迟音频准备；文件位于 `assets/scripts/` |
| `checks/prepare-tap-project.test.cjs` / `checks/tap-subpackages.test.cjs` | 分组、配置、路由/重试/释放、入口/API 桥及转换格式回归 |
| `checks/tap-services.test.cjs` / `checks/audio-routing.test.cjs` | 等待校时期间首屏/收益边界、就绪上报、音频行为 |

这些工具包含 PM 资产布局假设，迁往其他游戏前检查输入约束；不能只复制脚本并假定兼容。无代码变化的 Skill 文档更新只检查格式、引用和实际可用性，不启动游戏构建。

## 官方参考：按任务核实当前版本

- [Tap 性能标准](https://developer.taptap.cn/minigameapidoc/dev/tutorial/performance/performance-standards/)、[启动优化](https://developer.taptap.cn/minigameapidoc/dev/tutorial/performance/launch/launch-speed/)、[reportScene](https://developer.taptap.cn/minigameapidoc/dev/api/data-analysis/tap.reportScene/)
- [Tap 资源分包](https://developer.taptap.cn/minigameapidoc/dev/tutorial/basic/subpackage/)、[loadSubpackage](https://developer.taptap.cn/minigameapidoc/dev/api/base/subpackage/tap.loadSubpackage/)、[Cocos 转换上传](https://developer.taptap.cn/minigameapidoc/dev/engine/Cocos-Laya-Egret/)、[WASM 分包](https://developer.taptap.cn/minigameapidoc/dev/tutorial/performance/launch/wasm-subpackage/)
- [Creator 3.8 Asset Bundle](https://docs.cocos.com/creator/3.8/manual/zh/asset/bundle.html)、[小游戏分包](https://docs.cocos.com/creator/3.8/manual/zh/editor/publish/subpackage.html)、[贴图压缩](https://docs.cocos.com/creator/3.8/manual/zh/asset/compress-texture.html)
- [Cocos 发布的《单挑篮球》开发案例](https://www.cocos.com/post/6182)：早期 Creator 案例，仅借鉴裁剪、最小首屏、按需加载的原则，不直接移植旧版配置。
