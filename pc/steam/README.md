# Steam Cloud 与成就

AppID：5500200。保持单机＋Steamworks API，无自建服务器。PC 独立实现，不改变手机端规则或存档。

## 云存档

- 每次本地成功保存后写入 Steam Remote Storage 缓存；Steam 客户端负责服务端同步。已配置每用户 100 MiB、100 文件，不开启动态云同步。
- 文件为 `save-<SteamID64>.json`，单文件上限 1 MiB，内容包括主线、宠物、蛋、烹饪、社交奖励及离线成就记录。显示、语言、音乐等本机设置不进入云档。
- 启动时，新电脑或未改动的本地档可自动载入云进度；先备份本地原件。对比上次共同快照，不用两台电脑各自的序号或系统时间猜测新旧。
- 双方都改变时停止自动覆盖，设置→Steam 云档案中明确选择备份本机或查看并恢复云档。会保留两端原档。游戏运行中不自动替换正在使用的进度。
- 离线、配额不足、写入失败、云档损坏、身份不符、本地档过大均保留本地游戏；可重连重试。Steam Remote Storage 写入成功不等于另一台电脑已经下载完成。

## 16 项成就

| 中文名称 | Steam API 名称 | 条件 |
|---|---|---|
| 初次结伴 | DK_PARTNER | 完成选择初始伙伴 |
| 营地之外 | DK_MAP_1 | 通关1个主线地区 |
| 地平线的另一半 | DK_MAP_6 | 通关6个不同主线地区 |
| 踏遍十二境 | DK_MAP_12 | 通关12个主线地区 |
| 伙伴成群 | DK_COLLECT_10 | 收集10种宠物 |
| 百般相遇 | DK_COLLECT_30 | 收集30种宠物 |
| 驯兽大师 | DK_COLLECT_60 | 收集60种宠物 |
| 破壳之喜 | DK_HATCH_1 | 孵化1枚宠物蛋 |
| 十次新生 | DK_HATCH_10 | 孵化10枚宠物蛋 |
| 非凡伙伴 | DK_SSR | 获得SSR宠物 |
| 闪耀相逢 | DK_SHINY | 获得闪光宠物 |
| 第一枚徽章 | DK_GYM_1 | 获得1枚道馆徽章 |
| 九馆冠军 | DK_GYM_9 | 获得9枚不同道馆徽章 |
| 营地掌勺人 | DK_COOK | 烹饪1份料理 |
| 珍馐时刻 | DK_FEAST | 烹饪品质3的料理 |
| 并肩破熔冠 | DK_RAID | 与至少1名其他玩家通关熔冠龙巢并结算奖励 |

旧档可证明已达成的目标会补发；旧版已吃完且无记录的料理不能凭空补算。新版本将达成记录随账号存档保存，离线达成后重连提交。重复宠物不算不同物种。Steam 成就保持永久解锁，不提供清空成就的生产接口。

SDK 1.65 在启动前加载当前玩家统计，不调用已删除的 RequestCurrentStats。原生使用 GetAchievement / SetAchievement / StoreStats，等待 UserStatsStored 回调，失败留待重试，按30秒限制重复提交。

`tools/prepare-steam-achievements.cjs` 生成 `achievements/` 中的定义、本地化 CSV、原始 SVG 和256像素 PNG。图标为本项目绘制的矢量徽章，Steam 自动生成未解锁灰度图。成就编辑器支持的15种语言已填写；其他游戏内语言使用 Steam 的英文回退。游戏内云提示覆盖原有全部22语。

最小检查：`node checks/pc-achievements.test.cjs`、`node checks/pc-cloud-auto.test.cjs`、`node checks/pc-cloud.test.cjs`、`node checks/pc-profile.test.cjs`、`node checks/pc-steam-native.test.cjs --with-steam`；PC构建后运行 `node checks/pc-cloud-runtime.cjs`。规则模拟、真实 Steam 同步和另一台电脑验证分别记录。
