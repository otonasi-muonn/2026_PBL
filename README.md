# 2026 PBL

プロジェクト型演習 Ⅰ Team 1 の開発用リポジトリ。

目標を AI で小さなタスクに分割し、達成状況を記録・振り返る Web アプリを開発しています。
Okamura-2026
Yusuke
sakata
potato

## 技術構成

| ディレクトリ | 技術                            |
| ------------ | ------------------------------- |
| `frontend/`  | React / TypeScript / Vite / idb |
| `backend/`   | Hono / TypeScript / Bun         |

パッケージ管理には Bun を使用します。

## セットアップ

### 1. リポジトリの取得

事前に Git と GitHub へのアクセス権限が必要です。

```bash
git clone https://github.com/otonasi-muonn/2026_PBL.git
cd 2026_PBL
```

### 2. 開発環境の準備

**Windows**

```powershell
.\setup_scripts\setup_wrapper.bat
```

Git・Node.js・Bun が導入済みなら実行不要です。スクリプトは winget を使用します。
オプションや詳細は [setup_scripts/README.md](setup_scripts/README.md) を参照してください。

**Linux / macOS（Nix 利用者）**

```bash
nix develop
```

Nix を使用しない場合は、Node.js と Bun を各自インストールしてください。

### 3. 依存関係のインストール

リポジトリのルートから実行します。

```bash
cd frontend
bun install
cd ../backend
bun install
```

## 開発サーバーの起動

ルートディレクトリから、ターミナルを 2 つ使って実行します。

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
- `node_modules/` や API キーなどの秘密情報は Git に追加しないでください。
- `bun.lock` は Git で管理してください。

## お試し

Yusuke_Abe398 です．よろしくお願いします．
