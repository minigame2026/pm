# 多语言维护

游戏共12种语言：zh-CN、en、ja、ko、zh-TW、th、pt-BR、es-419、id、vi、de、fr。

TSV无表头，11列依次为：简中原文、英文、日文、韩文、泰文、巴西葡语、拉美西语、印尼语、越南语、德语、法语。繁体由OpenCC在编译时生成。保留原文及译文首尾空格；`\n`表示换行。执行 `tools/build-locales.py` 生成 `assets/scripts/PMTranslations.ts`，不要手改生成文件。编译依赖 `opencc-python-reimplemented`。

六种新增语言的宠物与主角采用已有英文版统一专名（例如Sparkfox、Aran），属性、技能、地图及玩法说明单独翻译。固定标记HP、R/SR/SSR和数值不改。译文已做代码覆盖检查，未经过各语言母语玩家审校。

系统语言按语言族匹配：pt-*使用巴西葡语，es-*使用拉美西语，旧安卓`in`映射为印尼语；其他未支持语言回退英文。手选偏好仍独立保存于`pm.language.v1`，不改游戏存档。

新增封面标题源图和完整提示词在 `art-source/login-localized-v2/`，运行图注册于 `LocalizedLogoArt.ts`；一次只加载当前语言。使用现有`locale,logos`检查组，包含系统识别、手动选择、保存不变、计时标签、窄屏和封面。

`store.json`提供六语言标题、短介绍草稿，未提交任何商店。
