# 2026 PBL

プロジェクト型演習Ⅰ Team 1 の開発用リポジトリです。

## 技術構成

| ディレクトリ | 使用技術 | 役割 |
|---|---|---|
| `frontend/` | React / TypeScript / Vite | ユーザーが操作する画面 |
| `backend/` | Hono / TypeScript / Bun | APIの実装 |

今後、ブラウザ内データの保存にIndexedDB、AIによるタスク分割に外部AI APIを使用する予定です。

デプロイ方法は未決定です。

## 事前準備

開発には以下のソフトウェアが必要です。

- Git
- Bun
- Visual Studio Code（推奨）

Bunのインストール方法：[Bun公式サイト](https://bun.sh/docs/installation)

インストール確認：

```bash
git --version
bun --version
```

Windowsの場合、ターミナルにはGit Bashを推奨します。

## 初回セットアップ

**1. リポジトリを取得する**

```bash
git clone https://github.com/otonasi-muonn/2026_PBL.git
cd 2026_PBL
code .
```

**2. フロントエンドの依存関係をインストール**

```bash
cd frontend
bun install
```

**3. バックエンドの依存関係をインストール**

```bash
cd ../backend
bun install
```

これで初回のセットアップは完了です。

## 開発サーバーの起動

VS Codeでターミナルを2つ開き、それぞれ実行してください。

**ターミナル1：フロントエンド**

```bash
cd frontend
bun run dev
```

通常は http://localhost:5173 でアクセスできます。

**ターミナル2：バックエンド**

```bash
cd backend
bun run dev
```

通常は http://localhost:3000 でアクセスできます。

ターミナルに表示されたURLを確認してください。サーバーの停止は `Ctrl+C` です。

## 開発時の注意事項

- 原則としてBunを使用してパッケージを管理してください。
- `frontend/` と `backend/` は、それぞれ独立して依存関係を管理しています。
- `node_modules/` はGitに追加しないでください。
- `bun.lock` はGitで管理してください。
- APIキーやパスワードをソースコードに直接記載しないでください。
- 作業内容や担当については、チーム内で共有してください。

## 現在の実装状況

現在は開発環境の基盤構築段階です。

画面とAPIの接続、AI機能、IndexedDBへの保存などは今後実装します。

本番デプロイは保留中です。