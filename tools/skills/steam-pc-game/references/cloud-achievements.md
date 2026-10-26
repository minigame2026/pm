# Steam Cloud 与成就

## 云档的责任边界

单机＋Steam API 不等于没有任何云服务：使用的是 Steam 托管能力，不是自行搭建服务器。Cloud 是个人存档同步，不是多人战斗数据库。

Auto-Cloud 与 Remote Storage API 依据现有存档格式选择；不要无意让两套系统写同一文件。后台配额保存并发布、游戏写入本地 Steam 缓存、Steam 完成服务端同步、另一台电脑恢复，分别验收。

本项目采用 Remote Storage：账号命名文件、格式版本、校验、大小上限、原子本地保存，设置/窗口偏好不混入跨机进度。配额 100MiB/100文件、单档上限1MiB只是该项目配置，不是通用值。

- 本地档与 SteamID 绑定；本地试玩档不自动冒充当前 Steam 玩家档。导入需明确目标，原文保留。
- 以最后共同快照判断双方是否变化；不能比较两台机器各自递增序号或系统时间来猜谁更新。
- 新电脑或本机未改动时可恢复可信云档；本地和云端都变了就提供两份进度选择，恢复前备份。运行中的战斗不被后台云结果突然覆盖。
- 断网、损坏、账号不符、超限、配额不足及写入失败均保留本地进度和待同步状态。退出前完成自身文件写入，不能声称远端已收到。
- 保留旧格式迁移和备份，避免云中较旧档覆盖新版本正在使用的有效进度。

最小实测包含：本机创建→Steam cloud_log/真实同步完成→另一台电脑下载恢复；另验双端冲突、离线继续、换账号、损坏和超限。不通过删除真实玩家档制造测试条件。

官方：[Steam Cloud](https://partner.steamgames.com/doc/features/cloud)、[ISteamRemoteStorage](https://partner.steamgames.com/doc/api/ISteamRemoteStorage)。

## 成就设计与实现

从已经存在、存档可证明的行为设计：初始伙伴、主线里程碑、不同物种收集、孵化、稀有/闪光、道馆、烹饪、真实合作胜利。条件精确到不同地区/物种还是累计次数，避免 UI 宣称与统计口径不同。

API ID 一旦发布尽量稳定，显示文案可以本地化。定义、图标、各语言、游戏触发代码必须对应。旧档仅补发可证明的目标；没有记录的历史行为不能凭空补算。

达成账本与账号存档一起持久化，离线记录重连提交，重复触发幂等。GetAchievement/SetAchievement/StoreStats 按当前 SDK 使用，收到成功回调后才确认服务器存储。失败退避，不每帧提交；生产版本不提供自动清空成就的测试按钮。

**SDK 版本陷阱：** 本项目 SDK 1.65 头文件已移除 RequestCurrentStats，而旧官方示例仍有调用。按所用 SDK 的头文件和更新说明处理初始化，不复制旧教程补一个不存在的方法，也不跳过统计就绪检查。

实测记录分层：规则判定→原生 API 返回→StoreStats 回调→Steam 社区解锁数量→Overlay 弹出。看到社区已解锁不代表 Overlay 弹窗也验证过。合作成就必须真实有另一名玩家，不能靠单人试炼替代。

官方：[成就接口](https://partner.steamgames.com/doc/api/ISteamUserStats)、[成就概述](https://partner.steamgames.com/doc/features/achievements)。
