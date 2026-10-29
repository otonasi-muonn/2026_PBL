# セットアップスクリプト (Windows)

wingetを使って，Windowsに開発環境を一括で構築するスクリプトです．

| ファイル            | 説明                                                    |
| ------------------- | ------------------------------------------------------- |
| `setup.ps1`         | 本体のスクリプト                                        |
| `setup_wrapper.bat` | 実行ポリシーを変更せずに `setup.ps1` を実行するラッパー |

## インストールされるツール

| ツール        | バージョン | wingetパッケージ    |
| ------------- | ---------- | ------------------- |
| Git(Git Bash) | 最新版     | `Git.Git`           |
| Node.js(npm)  | v24.22.1   | `OpenJS.NodeJS.LTS` |
| Bun           | 1.4.4      | `Oven-sh.Bun`       |

- コマンドが既に使える場合は，入手元に関係なくインストールをスキップします．
- Node.jsとBunのバージョンが指定と異なる場合は `[WARN]` を表示します(自動入れ替えは無し)．

## 使い方

リポジトリのルートから実行します．(必ず `.bat, .ps1` を同じ階層に配置してください)
オプションを使用しない場合，直接エクスプローラーなどから `setup_wrapper.bat` を管理者実行しても動作します．

```powershell
.\setup_scripts\setup_wrapper.bat
```

PowerShellから直接実行する場合は次のとおりです．

```powershell
powershell -ExecutionPolicy Bypass -File .\setup_scripts\setup.ps1
```

実行後は，開いているターミナルをすべて閉じてから開き直してください．

## オプション

| オプション       | 説明                                                    |
| ---------------- | ------------------------------------------------------- |
| `-SkipGitConfig` | Gitのユーザー名・メールアドレスの設定をスキップします． |

`setup_wrapper.bat` に渡したオプションは，そのまま `setup.ps1` に渡されます．

```powershell
.\setup_scripts\setup_wrapper.bat -SkipGitConfig
```

## スクリプトが行うこと

1. wingetの存在確認とソースの更新
2. Git for Windowsのインストール
3. Windows TerminalへのGit Bashプロファイルの追加 (既にある場合はスキップ)
4. Gitの設定(`core.longpaths = true`，未設定ならユーザー名・メールアドレス)
5. Node.js (npm同梱) のインストール
6. Bunのインストール
7. 各ツールのバージョン確認