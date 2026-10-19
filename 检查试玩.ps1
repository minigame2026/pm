param(
  [ValidateSet('auto','ui','battle','social','rules','save','preview')][string]$Scope='auto',
  [string[]]$Files=@(),
  [switch]$Plan
)
$ErrorActionPreference='Stop'
$pmNode='C:/Users/k/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
if (-not (Test-Path -LiteralPath $pmNode)) { $pmNode=(Get-Command node -ErrorAction Stop).Source }
$pmArgs=@((Join-Path $PSScriptRoot 'tools/workflow.cjs'),'--scope',$Scope)
if ($Plan) { $pmArgs+='--plan' }
foreach ($pmFile in $Files) { $pmArgs+=@('--file',$pmFile) }
& $pmNode @pmArgs
if ($LASTEXITCODE -ne 0) { throw '检查未通过，请查看 checks/workflow/latest.json 中的失败步骤与日志。' }
