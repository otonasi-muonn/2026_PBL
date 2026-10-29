# 2026 PBL

プロジェクト型演習Ⅰ Team 1 の開発用リポジトリ。

目標をAIで小さなタスクに分割し、達成状況を記録・振り返るWebアプリを開発しています。

## 技術構成

| ディレクトリ | 技術 |
|---|---|
| `frontend/` | React / TypeScript / Vite / idb |
| `backend/` | Hono / TypeScript / Bun |

パッケージ管理にはBunを使用します。

## セットアップ

### 1. リポジトリの取得

事前にGitとGitHubへのアクセス権限が必要です。

```bash
git clone https://github.com/otonasi-muonn/2026_PBL.git
cd 2026_PBL
```

### 2. 開発環境の準備

**Windows**

```powershell
.\setup_scripts\setup_wrapper.bat
```

Git・Node.js・Bunが導入済みなら実行不要です。スクリプトはwingetを使用します。
オプションや詳細は [setup_scripts/README.md](setup_scripts/README.md) を参照してください。

**Linux / macOS（Nix利用者）**

```bash
nix develop
```

Nixを使用しない場合は、Node.jsとBunを各自インストールしてください。

### 3. 依存関係のインストール

リポジトリのルートから実行します。

```bash
cd frontend
bun install
cd ../backend
bun install
```

## 開発サーバーの起動

ルートディレクトリから、ターミナルを2つ使って実行します。

**フロントエンド**

```bash
cd frontend
bun run dev
```

http://localhost:5173

**バックエンド**

```bash
cd backend
bun run dev
```

http://localhost:3000

疎通確認：http://localhost:5173/api/health

`{"status":"ok"}` が返れば正常です。終了は `Ctrl+C`。

## 開発時の注意

- `frontend/` と `backend/` は独立して依存関係を管理しています。
- `lint`・`build` は `frontend/` で `bun run lint`・`bun run build` を実行してください。
- `node_modules/` やAPIキーなどの秘密情報はGitに追加しないでください。
- `bun.lock` はGitで管理してください。