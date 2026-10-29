<#
.SYNOPSIS
    PBL-2026 | Team1: Windows Web開発環境 (Git, Node.js, npm, Bun) をwingetで一括構築するスクリプト

.DESCRIPTION
    各ツールのコマンドが既に使える場合は，入手元 (winget，公式インストーラー，Scoop，nvm等) に関係なくスキップします．
    Node.jsとBunは，チーム内の環境差異をなくすためにバージョンを固定してインストールします．
    既にインストール済みのバージョンが異なる場合は，警告を表示します．

.PARAMETER SkipGitConfig
    指定すると，Gitのユーザー名・メールアドレスの設定をスキップします．

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\setup.ps1
#>

param(
    [switch]$SkipGitConfig
)

$ErrorActionPreference = 'Stop'

$NodeVersion = '24.22.1'
$BunVersion = '1.4.4'

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Ok($msg) { Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Skip($msg) { Write-Host "[SKIP] $msg" -ForegroundColor Yellow }
function Write-Warn($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg) { Write-Host "[ERROR] $msg" -ForegroundColor Red }

# レジストリから最新のPATHを読み込み，現在のセッションに反映
function Update-SessionPath {
    $machine = [Environment]::GetEnvironmentVariable('Path', 'Machine')
    $user = [Environment]::GetEnvironmentVariable('Path', 'User')
    $env:Path = "$machine;$user"
}

# コマンドが使えるか確認 (入手元を問わない)
function Get-ExistingCommand($cmd) {
    return Get-Command $cmd -ErrorAction SilentlyContinue | Select-Object -First 1
}

# wingetでインストール済みか確認
function Test-WingetInstalled($id) {
    winget list --id $id -e --accept-source-agreements *> $null
    return ($LASTEXITCODE -eq 0)
}

# 先頭の v を除いてバージョンを比較
function Test-VersionMatch($actual, $expected) {
    return ("$actual".Trim().TrimStart('v') -eq $expected)
}

# wingetでパッケージをインストール ($versionを指定した場合はそのバージョンに固定)
function Install-WingetPackage($id, $name, $version) {
    $versionArgs = @()
    if ($version) { $versionArgs = @('--version', $version) }

    winget install --id $id -e --source winget @versionArgs `
        --accept-package-agreements --accept-source-agreements | Out-Host

    if ($LASTEXITCODE -ne 0) {
        Write-Err "$name のインストールに失敗しました (終了コード: $LASTEXITCODE)．"
        exit 1
    }
    Write-Ok "$name をインストールしました．"
    Update-SessionPath
}

# コマンドが既にあればスキップし，なければwingetでインストール (既にあった場合は $true)
function Install-ToolIfMissing($cmd, $id, $name, $versionArg, $version) {
    Write-Step "$name を確認します"

    $existing = Get-ExistingCommand $cmd
    if ($existing) {
        $ver = & $cmd $versionArg 2>$null
        Write-Skip "$name は既にインストールされています: $ver"
        Write-Host "場所: $($existing.Source)"
        if ($version -and -not (Test-VersionMatch $ver $version)) {
            Write-Warn "指定バージョン ($version) と異なります．必要に応じて入れ替えてください．"
        }
        return $true
    }

    Write-Host "$name が見つからないため，インストールします ($("$id $version".Trim()))"
    Install-WingetPackage $id $name $version
    return $false
}

# Windows Terminalのfragmentとして，Git Bashのプロファイルを追加
function Add-GitBashTerminalProfile($gitRoot) {
    $fragDir = Join-Path $env:LOCALAPPDATA 'Microsoft\Windows Terminal\Fragments\Git'
    $fragFile = Join-Path $fragDir 'git-bash.json'

    if (Test-Path $fragFile) {
        Write-Skip "プロファイルは作成済みです ($fragFile)．"
        return
    }

    # 手動設定やGit for Windowsのインストーラーで作成済みの場合は重複させない
    $existing = @(
        "$env:LOCALAPPDATA\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json"
        "$env:LOCALAPPDATA\Packages\Microsoft.WindowsTerminalPreview_8wekyb3d8bbwe\LocalState\settings.json"
        "$env:LOCALAPPDATA\Microsoft\Windows Terminal\settings.json"
        "$env:LOCALAPPDATA\Microsoft\Windows Terminal\Fragments\*\*.json"
        "$env:ProgramData\Microsoft\Windows Terminal\Fragments\*\*.json"
    ) | Get-ChildItem -ErrorAction SilentlyContinue |
        Where-Object { (Get-Content $_.FullName -Raw) -match 'Git[\\/]+bin[\\/]+bash\.exe|"name"\s*:\s*"Git Bash"' } |
        Select-Object -First 1
    if ($existing) {
        Write-Skip "Git Bashのプロファイルは既に存在します ($($existing.FullName))．"
        return
    }

    $wtProfile = [ordered]@{
        name = 'Git Bash'
        commandline = "`"$(Join-Path $gitRoot 'bin\bash.exe')`" -i -l"
        startingDirectory = '%USERPROFILE%'
    }
    $icon = Join-Path $gitRoot 'mingw64\share\git\git-for-windows.ico'
    if (Test-Path $icon) { $wtProfile.icon = $icon }

    $json = @{ profiles = @($wtProfile) } | ConvertTo-Json -Depth 5
    New-Item -ItemType Directory -Force $fragDir | Out-Null
    # Windows TerminalはBOMなしUTF-8を前提とするため，Set-Content (PowerShell 5.1ではBOM付き) は使わない
    [IO.File]::WriteAllText($fragFile, $json, (New-Object Text.UTF8Encoding $false))

    Write-Ok "プロファイルを作成しました ($fragFile)．"
    Write-Host 'Windows Terminalを開き直すと，プロファイル一覧に「Git Bash」が表示されます．'
}

# 事前確認
Write-Step 'wingetを確認します'
if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    Write-Err 'wingetが見つかりません．Microsoft Storeから「アプリ インストーラー」を更新してください．'
    exit 1
}
Write-Ok "winget $(winget --version)"

winget source update *> $null

# ターミナルを開き直していない場合に備え，既存ツールの検出前にPATHを最新化
Update-SessionPath

# Git + Git Bash
$null = Install-ToolIfMissing 'git' 'Git.Git' 'Git for Windows (Git Bash)' '--version'

# git.exe は通常 <Gitのルート>\cmd\git.exe または <Gitのルート>\bin\git.exe に存在する
$gitRoot = Split-Path (Split-Path (Get-ExistingCommand 'git').Source -Parent) -Parent
if (Test-Path (Join-Path $gitRoot 'git-bash.exe')) {
    Write-Ok "Git Bash: $(Join-Path $gitRoot 'git-bash.exe')"

    Write-Step 'Windows TerminalにGit Bashのプロファイルを追加します'
    Add-GitBashTerminalProfile $gitRoot
}
else {
    Write-Warn 'Git Bashが見つかりません．Git for Windows以外のGit (Visual Studio同梱など) が使われている可能性があります．'
    Write-Warn 'Git Bashが必要な場合は winget install --id Git.Git -e を実行してください．'
}

Write-Step 'Gitを設定します'
git config --global core.longpaths true
Write-Ok 'core.longpaths = true'

if (-not $SkipGitConfig) {
    $currentName = git config --global user.name
    $currentEmail = git config --global user.email

    if ([string]::IsNullOrWhiteSpace($currentName)) {
        $name = Read-Host 'Gitのユーザー名を入力してください'
        if ($name) { git config --global user.name $name; Write-Ok "user.name = $name" }
    }
    else {
        Write-Skip "user.name は設定済みです ($currentName)．"
    }

    if ([string]::IsNullOrWhiteSpace($currentEmail)) {
        $email = Read-Host 'Gitのメールアドレスを入力してください'
        if ($email) { git config --global user.email $email; Write-Ok "user.email = $email" }
    }
    else {
        Write-Skip "user.email は設定済みです ($currentEmail)．"
    }
}

# Node.js + npm
Write-Step 'Node.js を確認します'
$existingNode = Get-ExistingCommand 'node'

if ($existingNode) {
    $nodeVer = node -v
    Write-Skip "Node.js は既にインストールされています: $nodeVer"
    Write-Host "場所: $($existingNode.Source)"
    if (-not (Test-VersionMatch $nodeVer $NodeVersion)) {
        Write-Warn "指定バージョン (v$NodeVersion) と異なります．必要に応じて入れ替えてください．"
    }
}
else {
    $nodeId = 'OpenJS.NodeJS.LTS'; $nodeName = "Node.js (v$NodeVersion)"; $otherId = 'OpenJS.NodeJS'

    # コマンドはないがwingetには登録されている (PATHが壊れている等) 場合の二重インストール防止
    if ((Test-WingetInstalled $nodeId) -or (Test-WingetInstalled $otherId)) {
        Write-Err 'Node.jsはwingetに登録されていますが，nodeコマンドが見つかりません．'
        Write-Err 'PCを再起動してから再実行するか，「アプリと機能」からNode.jsを一度アンインストールしてください．'
        exit 1
    }

    Write-Host "Node.js が見つからないため，インストールします ($nodeId $NodeVersion)"
    Install-WingetPackage $nodeId $nodeName $NodeVersion
}

# npmはNode.jsに同梱
if ((Get-ExistingCommand 'node') -and -not (Get-ExistingCommand 'npm')) {
    Write-Warn 'nodeはありますが，npmが見つかりません．Node.jsの再インストールを検討してください．'
}

# Bun
$null = Install-ToolIfMissing 'bun' 'Oven-sh.Bun' 'Bun' '--version' $BunVersion

# 確認
Write-Step 'インストール結果を確認します'

$tools = [ordered]@{
    'git'  = { git --version }
    'node' = { node -v }
    'npm'  = { npm -v }
    'bun'  = { bun -v }
}

# バージョンを固定しているツール
$expected = @{
    'node' = $NodeVersion
    'bun'  = $BunVersion
}

$failed = $false
foreach ($t in $tools.GetEnumerator()) {
    if (Get-ExistingCommand $t.Key) {
        $ver = & $t.Value
        if ($expected.ContainsKey($t.Key) -and -not (Test-VersionMatch $ver $expected[$t.Key])) {
            Write-Warn ("{0,-5}: {1} (指定: {2})" -f $t.Key, $ver, $expected[$t.Key])
        }
        else {
            Write-Ok ("{0,-5}: {1}" -f $t.Key, $ver)
        }
    }
    else {
        Write-Err "$($t.Key) が見つかりません．"
        $failed = $true
    }
}

Write-Host ''
if ($failed) {
    Write-Host '一部のコマンドが見つかりませんでした．ターミナルを開き直すか，PCを再起動してから再度確認してください．' -ForegroundColor Yellow
}
else {
    Write-Host 'セットアップが完了しました．PCを再起動することを推奨します．' -ForegroundColor Green
}
Write-Host '新しいPATHを反映するため，開いているターミナルはすべて閉じてから開き直してください．'