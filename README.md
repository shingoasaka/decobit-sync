# README

## 概要
本アプリケーションは、ASP（アフィリエイトサービスプロバイダ）および各広告媒体から定期的にログを取得し、リンクマッチングと差分スナップショットを経て指標を集計・分析することを目的としています。

### 主な機能
- **定期ジョブ（Cron）**  
  - 3分ごとにASPスクレイピング／媒体API取得ジョブを実行
- **ログ収集**  
  - ASP生ログ（クリック／コンバージョン）  
  - 媒体生ログ（Campaign／AdGroup／Ad のレポート）
- **リンクマッチング**  
  - 正規表現ベースで ASP ログと広告媒体のエンティティを紐付け  
  - `LinkMatcher` テーブルでルールを管理
- **差分スナップショット**  
  - 前回取得時点までの合計値との差分を計算  
  - 時系列追跡用の `ClickLogSnapshot` テーブルに記録
- **指標集計**  
  - クリック数・コンバージョン数・CPA・ROAS などの算出

---

## アーキテクチャ
/apps
/nestjs # バックエンド API + Cron
/src
/cron # Cron モジュール（asp, media, discrepancy）
/asp # ASP 用スクレイピング実装
/media # 媒体API取得実装
/prisma # PrismaService
/web # Next.js フロントエンド

/packages
/prisma # Prisma schema & client
├─ schema.prisma # メイン include 呼び出し
└─ models/ # ドメイン別モデル定義
├─ asp.prisma
└─ media.prisma


---

## データフロー

1. **Cron 起動**  
   NestJS の `ScheduleModule` で 3 分ごとにジョブをトリガー  
2. **ログ取得**  
   - ASP：Puppeteer/Playwright で画面スクレイピング  
   - 媒体：REST API で生レポート取得  
3. **生ログ保存**  
   - `AspActionLog` / `AspClickLog`  
   - `TikTokRawReportCampaign` / `…AdGroup` / `…Ad`  
4. **リンクマッチング**  
   - `LinkMatcher` の正規表現ルールに従い、  
     `affiliateLinkName` や `referrerUrl` → `AffiliateLink` を特定  
5. **差分スナップショット**  
   - 前回の `ClickLogSnapshot` をもとに差分を計算  
   - 現在値との増分を新規レコードに記録  
6. **集計・分析**  
   - 日次・時間帯別指標を SQL や BI ツールで算出  

---

## マッチングロジック

1. `LinkMatcher` テーブルに以下を定義  
   - `ad_account_id`：対象の広告アカウント  
   - `asp_type`：ASP の種類  
   - `match_type`：`AFFILIATE_LINK` か `REFERRER_URL`  
   - `regex_pattern`：スクレイピング文字列マッチ用  
2. ASP ログ処理時  
   - `AspActionLog`／`AspClickLog` の文字列を正規表現テスト  
   - 一致した場合、対応する `AffiliateLink.id` を保存  

---

## 集計方法

- **クリック差分**  
  - `ClickLogSnapshot.currentTotalClicks` の増分を算出  
  - タイムスタンプ付きでクリックログとして再出力  
- **CVR・CPA・ROAS**  
  - 同一タイムウィンドウ内のクリック数・CV 数を紐付け  
  - 広告費用情報と結合して計算  

---

## Prisma スキーマ構成

- ドメインごとに `.prisma` ファイルを分割  
- メイン `schema.prisma` は各モデルを `@@include`  
- アプリ起動時に共通クライアントを生成・利用  

---

## ローカル開発・起動手順

1. リポジトリをクローン  
2. 環境変数 `.env` をルートに作成  
3. データベースマイグレーション  
   ```bash
   pnpm prisma migrate dev
  ```