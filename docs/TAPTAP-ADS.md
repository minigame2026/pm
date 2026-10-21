# TapTap 激励广告接入

更新：2026-10-21。SDK 与测试广告参数已配置；不代表正式广告已开通或真机播放成功。

本次后台核对：APP 媒体 `1112381`（后台名称“宠物骰子精灵”）与竖屏激励位 `1071610`；小游戏媒体 `1112379` 与竖屏激励位 `1071615`。两个广告位均为测试中，各平台的三个奖励入口共用各自广告位。APP 密钥仅保存在被 Git 忽略的 `config/tapads.local.json`，小游戏 ID 在 `TapAdConfig.ts`。

APP 可安装包：`build/releases/骰子宠物精灵-Tap广告测试-20261021.apk`，139286746字节，1.0.7/code8，正式玩法数值（5体力/30分钟），沿用测试签名。Creator 导出、原生编译/R8、TypeScript、广告回调检查、生成 BuildConfig 参数与本机配置一致、APK v1/v2签名通过；未安装设备或实际播放。测试设备仍需在后台登记。

用户确认采用Tap小游戏。最新包：build/releases/骰子宠物精灵-Tap小游戏广告校时测试-20261021.zip（125856169字节），官方Cocos插件1.2.2/转换器2.0.4-ts生成，本地资源完整打入。Creator导出、21个JS转换、包内广告与校时参数核对通过；未上传/发布或Tap宿主真机运行。

小游戏request域名已后台保存并重新打开核对：https://api.bilibili.com、https://vv.video.qq.com；其他网络类型留空。原worldtimeapi.org被拒绝（未经过ICP核准）。TrustedClock仅Tap宿主使用国内双来源，固定JSONP仅解析JSON、不执行代码、不保存附带的IP等字段，其他平台保留原来源。主备真实HTTPS（与当前时间差小于60秒）、来源切换/非法响应、防手机改时/离线/重启/回退/锚点过期检查通过。公共接口没有本项目可保证的SLA，后台保存不等于Tap真机网络验收。

更新的小游戏开发者协议（2026-09-17）已获用户明确授权并接受。隐私草稿披露宿主TapADN及提供方，不申请未使用的定位/麦克风/好友等权限，采用最短必要保存期限；公开客服邮箱support@doridori.studio已按用户提供填写，隐私指引已提交，后台显示审核中；未审核通过。证据：checks/tap-mini-privacy-submitted-20261021.png。APP隐私政策不由小游戏指引替代。

## 当前接入范围

| 游戏入口 | placement | 完整观看的奖励 |
|---|---|---|
| 体力条视频按钮 | stamina_10 | +10体力，遵循原有上限/可信时间规则 |
| 孵化屋加速 | hatch_reduce_30m | 指定蛋减少30分钟，遵循原有蛋ID核验 |
| 敌人刷新 | encounter_reroll | 额外刷新一次，BOSS不适用 |

APP 使用官方 **TapADN Android 5.3.0.4 非聚合 SDK**，仅 TapADN 广告源；没有额外接穿山甲/优量汇 SDK。Tap 小游戏使用宿主 `tap.createRewardedVideoAd`，宿主侧的聚合由平台管理。H5 小游戏是另一种发布形态，须确认所提交类型后另核对其宿主接口，不能把 Tap 小游戏接口当作已完成 H5 适配。

未添加开屏、插屏或横幅广告。SDK 未配置/失败/取消/超时均不发奖励，没有模拟观看成功的正式回退。

## APP 配置

复制 `config/tapads.example.json` 为 `config/tapads.local.json`，在本机填写：

- Dirichlet 后台对应此 APP 的媒体ID、媒体名称、媒体Key。
- 三个激励视频广告位 ID。允许后台批准的同一广告位配置到多个入口。
- 包名为 `com.minigame2026.dicepet`，应与后台一致。

`tapads.local.json` 已加入 Git 忽略；不要把媒体Key写入文档或日志。Gradle 将必要客户端参数编译进 BuildConfig。客户端Key会随APK发布，不能当作服务端秘密或防破解凭据。

原生文件：`native/engine/android/app/src/com/cocos/game/PMTapAds.java`。
首次请求广告前显示 SDK 隐私说明与同意/拒绝；本版每次观看均询问，拒绝不影响正常游戏。初始化仅在玩家同意后执行。定位、电话状态、应用列表、Wi-Fi标识、传感器、存储、AndroidID、OAID可选采集开关均关闭，摇一摇关闭；清单移除QUERY_ALL_PACKAGES。广告网络与安装广告组件随官方AAR自动合并。

本次只实现 SDK 同意提示；正式商店游戏隐私政策仍需按开发者主体和实际 SDK 情况披露。本次没有创建开发者身份信息或代提交商店审核。

## Tap 小游戏配置

后台创建“小游戏”媒体及激励视频广告位，在 `assets/scripts/TapAdConfig.ts` 填对应 adUnitId，不能混用APP广告位。

游戏启动由 `PMRewardedAds.ts` 自动检测 Android 或 Tap 宿主，注册既有 `pmRewardedAd.show({placement})` 接口。普通浏览器/微信不会冒充 Tap 宿主。Tap 运行时须由真正的 Tap 小游戏工程提供；本仓库已有微信本地导出不能视为 Tap 小游戏已适配/已测试。

## 回调与检查

- Android 仅 `onRewardVerify(true)` 与关闭事件共同确认成功；视频完成、广告曝光不作为奖励依据。回调切回 Cocos 游戏线程。
- Tap 小游戏仅 `onClose({isEnded:true})` 成功；每次隔离实例，清理回调，拒绝并发请求。
- 请求ID绑定、超时与一次性结算防止重复/过期回调误发；缺失账号参数返回失败。
- 原有三入口负责奖励和存档，可信校时/目标蛋校验/音频暂停恢复保持原逻辑。
- 已通过：TypeScript检查、`checks/tapads.test.cjs`（模拟平台事件的路由、完成/取消/错误/超时、并发与过期回调）、原生Java编译、合并Manifest、R8混淆。
- 未验证：后台广告位真实性、正式广告填充、真实广告观看/关闭、真实收益报表、Tap小游戏宿主运行。
- 本次已交付上述广告测试APK；此前v4不含SDK。实际广告播放仍待真机验证。

## 官方依据与资源

- [TapADN Android 接入](https://ssp.dirichlet.cn/docs/dirichlet-sdk/sdk-guide/)
- [官方资源下载](https://ssp.dirichlet.cn/docs/resource-download/)
- [Tap小游戏广告接入](https://ssp.dirichlet.cn/docs/mini-program-guide/)
- [Tap激励视频API](https://developer.taptap.cn/minigameapidoc/dev/api/ad/tap.createRewardedVideoAd/)
- [H5与Tap小游戏广告适用范围](https://developer.taptap.cn/minigameapidoc/quick-start/mcp-guide/ad-integration-guide/)
- [SDK隐私政策](https://ssp.dirichlet.cn/docs/agreement/)

AAR来源：`https://tapad-platform.tapimg.com/sdk/dirichlet_ad/dirichlet_ad_5.3.0.4.aar`。
本地 `native/engine/android/app/libs/dirichlet_ad_5.3.0.4.aar` MD5：`B423C723F58CAB2FCAF23CA9510E8943`，与官方公布值一致。SDK额外依赖OkHttp 3.12.1；无需为此SDK引入额外AndroidX或Glide。
