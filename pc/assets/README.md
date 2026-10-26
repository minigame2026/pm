# PC 专用美术资产

本目录仅存放 PC 新增营地与战斗背景：1 张营地、12 个主线地区、1 个多人副本。运行时 UI、角色、骰子和数字由客户端独立渲染，不烘焙进背景。

真实源图约 1672×940/941；详细尺寸及 SHA256 见 [资产清单](../ASSET-INVENTORY.json)。这些图不是原生 4K，不能根据生成提示词中的请求尺寸标注画质。

手机原有资源仍位于根目录 `assets/resources/`；PC 只读复用的共享高清原画位于 `art-source/runtime-masters-v1/`。不将手机压缩图移入本目录，也不反向覆盖手机资源。

Steam 商店图、五语实机截图和宣传片在 [pc/store](../store/README.md)，成就原始 SVG、PNG 与定义在 `pc/steam/achievements/`。本次 Git 同步为资产备份，不是完整可独立构建的 PC 源码提交，也不包含运行包、Steam SDK 或玩家存档。
