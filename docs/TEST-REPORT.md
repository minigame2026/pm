# 当前版本验证记录

更新：2026-10-23。90系列270形态、540普通/闪光图鉴、12图各10层。历史检查不冒充本轮全量验收。

## 本轮执行

| 范围 | 结果与证据 |
|---|---|
| TypeScript | 当前源码类型检查通过 |
| difficulty-curve | 120层HP、真实一宠开局、旧遭遇不突变、下一遭遇更新、九道馆原倍率、正式成本通过 |
| model / gyms | 模型规则、各系列骰子池、队伍/保存；道馆双属性30形态池和1.5倍率通过 |
| legendary / skill-diversity / egg-rates | 18新系列54形态、108自然技能、12图蛋概率通过 |
| legendary-art | 新图裁框、透明区域、文件路径、压缩尺寸检查通过 |
| legendary-runtime | 构建后真实加载108正背帧，三图战斗/技能/领奖/寻蛋、108新普通/闪光图鉴项、22语言覆盖及4语言小屏样例通过 |
| map-layout | 8组尺寸/语言，12地区2×6、图鉴独立全部入口，导航不改存档通过 |
| 平衡模拟 | 前后各1800次首关、各60档养成，见[结果](BALANCE-SIMULATION.md)，不是随机强制通关脚本 |

统一运行：node tools/workflow.cjs --scope difficulty-curve,legendary,legendary-art,legendary-runtime,map-layout。
本地报告checks/workflow和checks/legendary-runtime保留日志、源指纹与截图；不包含玩家存档。已经查看代表战斗及320宽泰米尔地图截图。

旧model断言曾期待未缩放攻击池，本轮按实际新增系数更新断言后整组通过；没有为通过测试删除战斗验证。旧检查脚本若依赖历史数量/流程，必须按现状重验，不能沿用过去的绿灯。

## 边界

- 10月22日已有home-layout/motion、ui-comfort、partners-layout、shiny、recipes、hatch-duration、audio等模块报告；这些不是本轮重新执行的全量结果。
- 本轮文档和工具检查在收尾统一运行，结果留checks/workflow/docs-latest.json及tools-latest.json。
- 未执行完整release全量组，未重打APK，未操作玩家存档或强退用户进程。
- 母语审校、物理手机性能、平台小游戏/广告与长期玩家平衡需另验。最新APK和iOS流程以[平台状态](RELEASE-STATUS.md)为准。
