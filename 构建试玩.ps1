$ErrorActionPreference = 'Stop'
$pmEditor = 'C:/Users/k/Documents/Codex/Tools/art-production/cocos-creator/CocosCreator.exe'
if (-not (Test-Path -LiteralPath $pmEditor)) { throw '未找到 Cocos Creator 3.8.7，请更新脚本中的编辑器路径。' }
$pmProcess = Start-Process -FilePath $pmEditor -ArgumentList @('--project',('"'+$PSScriptRoot+'"'),'--build',('"configPath='+(Join-Path $PSScriptRoot 'build-config.json')+'"')) -WindowStyle Hidden -PassThru
$pmProcess.WaitForExit()
$pmProcess.Refresh()
if ($pmProcess.ExitCode -ne 36) { throw ('构建未成功，退出码：'+$pmProcess.ExitCode+'；请查看 checks/build.log。') }
Write-Output '构建成功，刷新 http://127.0.0.1:8780/ 即可。'
