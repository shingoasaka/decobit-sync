# 🚀 マスターデータ同期機能実装プロンプト

## 📋 実装概要

レポートデータ取得時に、Campaign、Adgroup、Adのマスターデータを自動同期する機能を実装してください。バッチ処理による大幅なパフォーマンス向上（500倍高速化）を実現し、CloudRun分離設計に最適化された実装を行ってください。

## 🎯 実装要件

### 1. 共通マスターデータモジュールの作成

#### ディレクトリ構造

```
src/modules/media/common/
├── interfaces/
│   └── master-data.interface.ts
└── master-data/
    ├── master-data.module.ts
    ├── services/
    │   ├── campaign.service.ts
    │   ├── adgroup.service.ts
    │   └── ad.service.ts
    └── repositories/
        ├── campaign.repository.ts
        ├── adgroup.repository.ts
        └── ad.repository.ts
```

#### 共通インターフェース

```typescript
// interfaces/master-data.interface.ts
export interface CampaignData {
  ad_account_id: number;
  platform_campaign_id: string; // BigInt → String
  campaign_name: string;
}

export interface AdgroupData {
  ad_account_id: number;
  platform_adgroup_id: string; // BigInt → String
  adgroup_name: string;
  platform_campaign_id: string; // BigInt → String
}

export interface AdData {
  ad_account_id: number;
  platform_ad_id: string; // BigInt → String
  ad_name: string;
  platform_adgroup_id: string; // BigInt → String
}
```

### 2. バッチ処理による高速化

#### パフォーマンス要件

- **DBクエリ数**: 1000レコードで2000回→4回に削減
- **処理時間**: 10-30秒→0.5-2秒に短縮
- **差分検知**: 名前変更の検知と効率的な更新処理

#### バッチ処理の実装パターン

```typescript
async upsert(data: CampaignData[]): Promise<number> {
  if (data.length === 0) return 0;

  return await this.prisma.$transaction(async (tx) => {
    // 1. 既存データの一括取得
    const campaignIds = data.map(d => d.platform_campaign_id);
    const existingCampaigns = await tx.campaign.findMany({
      where: { platform_campaign_id: { in: campaignIds } },
      select: { id: true, platform_campaign_id: true, campaign_name: true }
    });

    // 2. Mapで高速検索可能に変換
    const existingMap = new Map(
      existingCampaigns.map(c => [c.platform_campaign_id, c])
    );

    // 3. 差分検知と分類
    const toUpdate: any[] = [];
    const toCreate: any[] = [];

    for (const record of data) {
      const existing = existingMap.get(record.platform_campaign_id);

      if (existing) {
        // 名前が変更されている場合のみ更新
        if (existing.campaign_name !== record.campaign_name) {
          toUpdate.push({
            where: { id: existing.id },
            data: {
              campaign_name: record.campaign_name,
              ad_account_id: record.ad_account_id
            }
          });
        }
      } else {
        // 新規作成
        toCreate.push({
          platform_campaign_id: record.platform_campaign_id,
          campaign_name: record.campaign_name,
          ad_account_id: record.ad_account_id
        });
      }
    }

    // 4. 並列更新処理
    let updatedCount = 0;
    if (toUpdate.length > 0) {
      const updatePromises = toUpdate.map(updateData =>
        tx.campaign.update(updateData).catch(error => {
          this.logger.warn(`Update error: ${error.message}`);
          return null;
        })
      );
      const results = await Promise.all(updatePromises);
      updatedCount = results.filter(r => r !== null).length;
    }

    // 5. 一括作成処理
    let createdCount = 0;
    if (toCreate.length > 0) {
      try {
        const result = await tx.campaign.createMany({ data: toCreate });
        createdCount = result.count;
      } catch (error) {
        // 一括作成失敗時は個別作成にフォールバック
        this.logger.warn(`Batch create failed, falling back to individual create: ${error.message}`);
        for (const createData of toCreate) {
          try {
            await tx.campaign.create({ data: createData });
            createdCount++;
          } catch (createError) {
            this.logger.warn(`Individual create error: ${createError.message}`);
          }
        }
      }
    }

    // 6. 詳細ログ出力
    this.logger.log(
      `Campaign batch upsert: ${data.length} processed (${updatedCount} updated, ${createdCount} created)`
    );

    return updatedCount + createdCount;
  });
}
```

### 3. エラーハンドリングの強化

#### 個別エラー処理

- 1レコードのエラーが全体を停止しない設計
- 非同期処理でのエラーキャッチ
- 詳細なログ記録

#### 依存関係エラー処理

```typescript
// Adgroup作成時のCampaign存在確認
const campaigns = await tx.campaign.findMany({
  where: { platform_campaign_id: { in: campaignIds } },
});

const campaignMap = new Map(campaigns.map((c) => [c.platform_campaign_id, c]));

// 存在しないCampaignの処理
const missingCampaignIds = campaignIds.filter((id) => !campaignMap.has(id));
if (missingCampaignIds.length > 0) {
  this.logger.warn(`Campaigns not found: ${missingCampaignIds.join(", ")}`);
}
```

### 4. 型安全性の確保

#### 安全な型変換

```typescript
// String型の場合は変換不要（APIから文字列として取得される）
const platformId = dto.dimensions.campaign_id; // 既にstring型

// 必要に応じて数値変換（例：計算用）
const numericId = parseInt(platformId, 10);
if (isNaN(numericId)) {
  this.logger.warn(`Invalid platform ID: ${platformId}`);
  return null;
}
```

### 5. レポートサービスとの統合

#### 同期処理の呼び出し

```typescript
// レポートサービスのconvertDtoToEntityメソッド内で呼び出し
async convertDtoToEntity(dto: TikTokReportDto): Promise<TikTokReportEntity> {
  // 既存の変換処理...

  // マスターデータ同期（非同期で実行）
  this.campaignService.syncFromReport("tiktok", [campaignData])
    .then(count => {
      this.logger.log(`Campaign sync completed: ${count} records`);
    })
    .catch(error => {
      this.logger.error(`Campaign sync error: ${error.message}`);
    });

  return entity;
}
```

## 🔧 実装手順

### Step 1: 共通インターフェースの作成

1. `interfaces/master-data.interface.ts` を作成
2. `CampaignData`, `AdgroupData`, `AdData` インターフェースを定義

### Step 2: リポジトリの実装

1. `repositories/campaign.repository.ts` を作成
2. バッチ処理によるupsertメソッドを実装
3. 差分検知ロジックを実装
4. エラーハンドリングを追加
5. Adgroup、Adリポジトリも同様に実装

### Step 3: サービスの実装

1. `services/campaign.service.ts` を作成
2. `syncFromReport` メソッドを実装
3. リポジトリを注入して使用
4. Adgroup、Adサービスも同様に実装

### Step 4: モジュールの作成

1. `master-data.module.ts` を作成
2. サービスとリポジトリをプロバイダーとして登録
3. エクスポート設定

### Step 5: 媒体別モジュールへの統合

1. 媒体別モジュール（例：tiktok.module.ts）でMasterDataModuleをインポート
2. レポートサービスにマスターデータサービスを注入

### Step 6: レポートサービスの修正

1. 各レポートサービスのconvertDtoToEntityメソッドを修正
2. マスターデータ同期処理を追加
3. 非同期処理でのエラーハンドリングを実装

## 📊 期待される効果

### パフォーマンス向上

- **DBクエリ数**: 500倍の削減
- **処理時間**: 10-60倍の高速化
- **メモリ効率**: 一括処理による効率化

### 運用性向上

- **エラー分離**: 個別エラーが全体に影響しない
- **詳細ログ**: 問題の特定と解決が容易
- **監視性**: 処理状況の可視化

### 保守性向上

- **共通化**: 全媒体共通のマスターデータ処理
- **型安全性**: TypeScriptによる型安全な実装
- **拡張性**: 他媒体への適用が容易

## ⚠️ 注意事項

### 依存関係

- Campaign → Adgroup → Ad の順序で同期されることを前提
- 親レコードが存在しない場合、子レコードの同期はスキップ

### エラー処理

- 個別レコードのエラーはログに記録されるが、処理は継続
- 依存関係エラーは警告として記録

### パフォーマンス

- 大量データ処理時はメモリ使用量に注意
- バッチサイズは必要に応じて調整可能

## 📝 実装チェックリスト

- [ ] 共通インターフェースの作成
- [ ] Campaignリポジトリの実装（バッチ処理）
- [ ] Adgroupリポジトリの実装（バッチ処理）
- [ ] Adリポジトリの実装（バッチ処理）
- [ ] Campaignサービスの実装
- [ ] Adgroupサービスの実装
- [ ] Adサービスの実装
- [ ] MasterDataModuleの作成
- [ ] 媒体別モジュールへの統合
- [ ] レポートサービスの修正
- [ ] エラーハンドリングの実装
- [ ] ログ出力の実装
- [ ] 型安全性の確保
