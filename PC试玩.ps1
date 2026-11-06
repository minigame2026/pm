$ErrorActionPreference='Stop'
$pcRoot=$PSScriptRoot
$pcClient=Join-Path $pcRoot 'build/releases/Dicekin-Windows-x64/Dicekin.exe'
if (-not (Test-Path -LiteralPath $pcClient)) { throw '请先在项目目录运行 node tools/build-pc-windows.cjs 构建 Windows 客户端。' }
Start-Process -FilePath $pcClient -WorkingDirectory (Split-Path $pcClient)
