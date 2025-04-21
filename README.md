# Operate-ad: ASP & メディアデータ統合プラットフォーム

## 📊 プロジェクト概要

Operate-adは、ASPデータとメディア広告データを自動収集・統合し、広告運用のための分析プラットフォームを提供するシステムです。3分ごとのcronジョブでデータを収集し、リアルタイムに近い形で情報を提供します。

## 🏗️ システム構成

このシステムはモノレポ構造を採用しています：

```
operate-ad/
├── apps/
│   ├── nestjs/  # バックエンドAPI (NestJS)
│   └── web/     # フロントエンドUI (Next.js)
├── packages/
│   ├── prisma/  # データベーススキーマ・クライアント
│   └── ui/      # 共通UIコンポーネント
```

## 📊 データの流れ

### ASP側のデータ取得
- **Playwright**を使用して各ASP（Cats, Metron, SampleAffiliate等）からデータをスクレイピング
- 成果ログやクリックログを定期的に取得し、正規化して保存

### 広告媒体データの取得
- **TikTok**などの広告媒体から`report API`を使って広告データを取得
- 取得したデータを広告単位（Campaign, AdGroup, Ad）に正規化

### 突合処理
- **ASPログ**と**媒体データ**を`affiliate_link_name`や`referrer_url`で突合
- 突合できなかったデータは`unmatched_data`テーブルに保存し、後で手動対応

## ⚙️ 主要テーブル設計

| テーブル名               | 説明                             |
|-------------------------|----------------------------------|
| `tik_campaign`          | TikTokのキャンペーンデータ      |
| `tik_adgroup`           | TikTokの広告グループデータ      |
| `tik_ads`               | TikTokの広告データ              |
| `asp_*_log`             | 各ASPから取得したデータ          |
| `unmatched_data`        | 突合できなかったデータのリスト    |

## 🧑‍💻 開発フロー

プロジェクトはPrismaを使用したスキーマファーストの開発を採用しています：

1. **スキーマ変更**
   ```bash
   # packages/prisma/schema.prismaを編集
   cd packages/prisma
   pnpm prisma db push  # 開発環境での素早い変更反映
   
   # 本番環境用のマイグレーション作成
   pnpm prisma migrate dev --name "変更の説明"
   ```

2. **コード開発**
   ```bash
   pnpm dev  # すべてのアプリを同時に開発モードで起動
   ```

3. **コンテナビルド**
   ```bash
   docker build -t operate-ad .  # 本番用コンテナの作成
   ```

## 📈 cron処理の仕組み

システムの中核となるデータ収集は以下のcronジョブで実行されます：

- **ASPデータ収集**: 3分ごとに実行 (`AspCronService`)
- **メディアデータ収集**: 3分ごとに実行 (`MediaCronService`)

これらのサービスは以下の機能を備えています：
- **同時実行制御**: Semaphoreによる並列処理の最適化
- **タイムアウト処理**: 長時間実行される処理の制御
- **自動リトライ**: 一時的なエラーに対する再試行ロジック

## 🔧 開発ガイドライン

### Prismaの使用

```typescript
// リポジトリパターンを採用
@Injectable()
export class SomeRepository {
  constructor(private readonly prisma: PrismaService) {}
  
  async save(data: SomeDto[]): Promise<number> {
    const result = await this.prisma.someModel.createMany({
      data,
      skipDuplicates: true,
    });
    return result.count;
  }
}
```

### エラーハンドリング

```typescript
// Prismaエラーの安全な処理
try {
  // データベース操作
} catch (error: unknown) {
  if (error instanceof Error && 'code' in error && 
      typeof error.code === 'string') {
    // Prismaエラー処理
  }
  // その他のエラー処理
}
```

## 📚 今後の展望

- **追加データソースの統合**: Facebook Ads、Google Ads等
- **高度な分析機能**: コホート分析、LTV予測等
- **UI/UX改善**: ダッシュボードの拡充

## 📌 補足情報

- GitHub Actions CIによる自動テスト・デプロイ設定済み
- Docker化されたアプリケーションはFly.ioで実行
- PostgreSQLをバックエンドデータベースとして使用

---
