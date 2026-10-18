$ErrorActionPreference = 'Stop'
$pmNode = 'C:/Users/k/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
if (-not (Test-Path -LiteralPath $pmNode)) { $pmNode = (Get-Command node -ErrorAction Stop).Source }
$pmRoot = $PSScriptRoot
if (-not (Test-Path -LiteralPath (Join-Path $pmRoot 'build/web-mobile/index.html'))) { throw '请先运行 构建试玩.ps1。' }
$pmListener = Get-NetTCPConnection -LocalPort 8780 -State Listen -ErrorAction SilentlyContinue
if (-not $pmListener) {
    Start-Process -FilePath $pmNode -ArgumentList ('"' + (Join-Path $pmRoot 'tools/serve.cjs') + '"') -WindowStyle Hidden
}
Start-Process 'http://127.0.0.1:8780/'
