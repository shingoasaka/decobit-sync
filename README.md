# プロジェクトセットアップガイド

## 開発環境のセットアップ

### 1. 依存関係のインストール

```bash
pnpm install --frozen-lockfile
```

### 2. データベースの準備

Docker Composeを使用してPostgresを起動します：

```bash
docker-compose up -d
```

### 3. 環境変数の設定

1. `.env` を作成
2. 必要な環境変数を設定
   ```
   DATABASE_URL=""
   ```

### 4. 開発サーバーの起動

```bash
pnpm dev
```

サーバーが起動すると、以下のURLでアクセスできます：

- http://localhost:3000
- http://localhost:8080

## データベースマイグレーション

### マイグレーションの作成と適用

1. `packages/prisma/schema.prisma` を編集

2. マイグレーションを作成する前に、スキーマを適用：
   ```bash
   cd packages/
   pnpm prisma db push
   ```
3. スキーマが確定したらマイグレーションを作成：
   ```bash
   pnpm prisma migrate dev --name "add-something"
   ```

### データベース管理

Prisma Studioを使用してデータベースを視覚的に確認できます：

```bash
pnpm prisma studio
```

ブラウザで http://localhost:5555 が開き、テーブルの内容を確認・編集できます。
