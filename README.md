# novel-gacha

LLMによる小説ガチャシステム。プロンプトを入力し、Ollamaを使って小説を自動生成するWebアプリ。

同一のプロンプト・設定から多数（1〜100回）の小説を一括生成し、ガチャ感覚で楽しめる。

## 機能

- プロンプト・モデル・各種パラメータを指定して小説を生成
- 同一条件から複数の小説を一括生成（バックグラウンドで逐次処理）
- 生成条件ごとにグループ化して一覧表示
- 小説に星評価（1〜5）・コメントを付与
- 既存の条件から追加生成 / 条件を引き継いで新規生成
- Ollamaからモデル一覧を自動取得

## 技術構成

| レイヤー | 技術 |
|----------|------|
| フロントエンド | React 18, TypeScript, Vite, Mantine v7, TanStack Query v5 |
| バックエンド | Hono (Node.js), TypeScript |
| データベース | SQLite (better-sqlite3) |
| LLM | Ollama |
| モノレポ | npm workspaces |

```
packages/
├── shared/   # 共有TypeScript型定義
├── server/   # バックエンドAPI
└── web/      # フロントエンドSPA
```

## 前提条件

- Node.js 20以上
- Ollamaが起動済みであること（デフォルト: `http://localhost:11434`）

## セットアップ

```bash
npm install
```

## 起動

バックエンドとフロントエンドをそれぞれ起動する:

```bash
# ターミナル1: バックエンド（ポート3001）
npm run dev:server

# ターミナル2: フロントエンド（ポート5173）
npm run dev:web
```

ブラウザで http://localhost:5173 を開く。

## 使い方

1. 設定ページ (`/settings`) でOllamaのURLを確認・変更
2. 「+」ボタンから新規生成ページへ
3. モデルを選択し、プロンプトを入力、生成数を指定して「生成開始」
4. トップページで生成状況を確認（生成中はバナーが表示される）
5. グループをクリックして小説一覧を表示、各小説をクリックして本文を閲覧
6. 小説ページで星評価・コメントを付与

## API

| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/groups` | グループ一覧 |
| GET | `/api/groups/:id` | グループ詳細＋小説一覧 |
| GET | `/api/novels/:id` | 小説詳細 |
| PATCH | `/api/novels/:id` | 評価・コメント更新 |
| DELETE | `/api/novels/:id` | 小説削除 |
| POST | `/api/generate` | 生成開始 |
| GET | `/api/generate/status` | 生成状況 |
| GET | `/api/ollama/models` | Ollamaモデル一覧 |
| GET | `/api/settings` | 設定取得 |
| PUT | `/api/settings` | 設定更新 |
