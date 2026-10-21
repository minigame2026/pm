param(
    [string]$BuildDir = 'build/android',
    [switch]$Bundle,
    [string]$AppLabel = '骰子宠物精灵'
)
$ErrorActionPreference = 'Stop'
$pmRoot = Split-Path $PSScriptRoot -Parent
$pmTools = Get-Content "$env:USERPROFILE/Documents/Codex/Tools/android-development/installation.json" | ConvertFrom-Json
$env:JAVA_HOME = $pmTools.javaHome
$env:Path = "$($pmTools.javaHome)/bin;$env:Path"
# Java does not automatically follow the Windows proxy used by downloads.
$pmProxy = Get-ItemProperty 'HKCU:/Software/Microsoft/Windows/CurrentVersion/Internet Settings'
if ($pmProxy.ProxyEnable -eq 1 -and $pmProxy.ProxyServer -match '^([^:;=]+):(\d+)$') {
    $env:JAVA_TOOL_OPTIONS = "-Dhttps.proxyHost=$($Matches[1]) -Dhttps.proxyPort=$($Matches[2]) -Dhttp.proxyHost=$($Matches[1]) -Dhttp.proxyPort=$($Matches[2]) -Dsun.net.client.defaultConnectTimeout=30000 -Dsun.net.client.defaultReadTimeout=60000"
}
$pmBuildRoot = Join-Path $pmRoot $BuildDir
$pmEscapedLabel = [System.Security.SecurityElement]::Escape($AppLabel)
Set-Content -LiteralPath "$pmBuildRoot/proj/res/values/strings.xml" -Encoding utf8 -Value "<resources><string name=`"app_name`" translatable=`"false`">$pmEscapedLabel</string></resources>"
Push-Location "$pmBuildRoot/proj"
[string[]]$pmTasks = if ($Bundle) { @('bundleRelease', 'assembleRelease') } else { @('assembleRelease') }
try { & ./gradlew.bat @pmTasks --console=plain --max-workers=4; $pmCode=$LASTEXITCODE } finally { Pop-Location }
exit $pmCode
