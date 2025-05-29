---
config:
  theme: dark
---

erDiagram
%% マスタ系
Department {
int id PK
string name "UNIQUE"
datetime created_at
datetime updated_at
}
User {
int id PK
string email "UNIQUE"
string firebase_uid "UNIQUE"
string role "user | admin"
int department_id FK
datetime created_at
datetime updated_at
}
Client {
int id PK
string name "UNIQUE"
datetime created_at
datetime updated_at
}
Project {
int id PK
string name "UNIQUE(name, client_id)"
int client_id FK
datetime created_at
datetime updated_at
}
AdPlatform {
int id PK
string name "UNIQUE"
datetime created_at
datetime updated_at
}
AdAccount {
int id PK
string name "UNIQUE"
string ad_platform_account_id "UNIQUE(ad_platform_account_id, ad_platform_id)"
int ad_platform_id FK
int department_id FK
int project_id FK
datetime created_at
datetime updated_at
}
AdPlatformDisplaySetting {
int id PK
int ad_platform_id FK
string name
string key
datetime created_at
datetime updated_at
}

%% アクセス制御
UserDisplaySettingVisibility {
int id PK
int user_id FK "UNIQUE(user_id, ad_platform_display_setting_id)"
int ad_platform_display_setting_id FK
boolean is_visible
datetime created_at
datetime updated_at
}
UserPermission {
int id PK
int user_id FK "UNIQUE(user_id, ad_account_id)"
int ad_account_id FK
boolean can_manage_ad_account
datetime created_at
datetime updated_at
}
UserPermissionRequest {
int id PK
int user_id FK
int ad_account_id FK
boolean can_manage_ad_account
string status "pending | approved | rejected"
int approved_by FK
int rejected_by FK
datetime requested_at
datetime approved_at
datetime rejected_at
datetime created_at
datetime updated_at
}

%% 媒体 ディメンション＆生レポート
Campaign {
int id PK "アプリ内 PK"
int ad_account_id FK "AdAccount.id"
int platform_campaign_id "媒体側のcampaignId"
string platform_campaign_name
datetime created_at
}
AdGroup {
int id PK "アプリ内 PK"
int ad_account_id FK "AdAccount.id"
int campaign_id FK "Campaign.id"
int platform_adgroup_id "媒体側のadgroupId"
string platform_adgroup_name
datetime created_at
}
Ad {
int id PK
int ad_account_id FK "AdAccount.id"
int adgroup_id FK "AdGroup.id"
int platform_ad_id "媒体側のadId"
string ad_name
datetime created_at
}
TikTokRawReportCampaign {
int id PK
int ad_account_id FK "AdAccount.id | NULLABLE"
date stat_time_day
string ad_platform_account_id
int platform_campaign_id
int budget
int spend
int impressions
int clicks
int video_play_actions
int video_watched_2s
int video_watched_6s
int video_views_p100
int reach
int conversion
datetime created_at
}
TikTokRawReportAdGroup {
int id PK
int ad_account_id FK "AdAccount.id | NULLABLE"
date stat_time_day
string ad_platform_account_id
int platform_adgroup_id
int budget
int spend
int impressions
int clicks
int video_play_actions
int video_watched_2s
int video_watched_6s
int video_views_p100
int reach
int conversion
datetime created_at
}
TikTokRawReportAd {
int id PK
int ad_account_id FK "AdAccount.id | NULLABLE"
date stat_time_day
string ad_platform_account_id
int platform_campaign_id
string platform_campaign_name
int platform_adgroup_id
string platform_adgroup_name
int platform_ad_id
string platform_ad_name
string ad_url
int budget
int spend
int impressions
int clicks
int video_play_actions
int video_watched_2s
int video_watched_6s
int video_views_p100
int reach
int conversion
datetime created_at
}

%% ASP
AffiliateLink {
int id PK
int ad_account_id FK "再利用するよう"
string asp_type "METRON | CATS | LAD | ..."
string affiliate_name
datetime created_at
datetime updated_at
}
AspActionLog {
int id PK
int affiliate_link_id FK "NULLABLE"
enum asp_type "METRON | CATS | LAD | MONKEY | FINEBIRD | HANIKAMU | RENTRACKS | SAMPLE_AFFILIATE"
datetime action_date_time
string affiliateLinkName "スクレイピングでとってきた文字列"
string referrerUrl
string uid "METRONのみで必要"
datetime created_at
datetime updated_at
}
AspClickLog {
int id PK
int affiliate_link_id FK "NULLABLE"
enum asp_type "METRON | CATS | LAD | MONKEY | FINEBIRD | HANIKAMU | RENTRACKS | SAMPLE_AFFILIATE"
datetime click_date_time
string affiliateLinkName "スクレイピングでとってきた文字列"
string referrerUrl
datetime created_at
datetime updated_at
}
ClickLogSnapshot {
int id PK
int affiliate_link_id FK "あった方が楽"
enum asp_type "METRON | CATS | LAD | MONKEY | FINEBIRD | HANIKAMU | RENTRACKS | SAMPLE_AFFILIATE"
string affiliateLinkName
int currentTotalClicks
datetime snapshot_date
datetime created_at
datetime updated_at
}

LinkMatcher {
int id PK
int affiliate_link_id FK "ASP側の突合キー | AffiliateLink.id NULLable"
int ad_account_id FK "AdAccountごとに突合タイプが統一"
string asp_type "ENUM METRON | CATS | LAD | MONKEY | FINEBIRD | HANIKAMU | RENTRACKS | SAMPLE_AFFILIATE"
string match_type "AFFILIATE_LINK | REFERRER_URL"
string target_dim "campaign_name | adgroup_name | ad_name"
string media_level "Campaign | AdGroup | Ad"
text regex_pattern "スクレイピングで来る生の文字列にマッチさせる正規表現"
datetime created_at
datetime updated_at
}

%% リレーション
Department ||--|{ User : "has many"
Department ||--|{ AdAccount : "has many"
AdPlatform ||--|{ AdAccount : "has many"
AdAccount ||--|{ UserPermission : "has many"
AdAccount ||--|{ UserPermissionRequest : "has many"
AdAccount ||--|{ LinkMatcher : "ad_account_id FK"
AdAccount ||--|{ Campaign : "ad_account_id FK"
AdAccount ||--o{ AdGroup : "ad_account_id FK"
AdAccount ||--o{ Ad : "ad_account_id FK"
AdAccount ||--|{ TikTokRawReportCampaign : "ad_account_id FK"
AdAccount ||--|{ TikTokRawReportAdGroup : "ad_account_id FK"
AdAccount ||--|{ TikTokRawReportAd : "ad_account_id FK"

AdPlatform ||--|{ AdPlatformDisplaySetting : "has many"
AdPlatformDisplaySetting ||--|{ UserDisplaySettingVisibility : "has many"

User ||--|{ UserDisplaySettingVisibility : "has many"
User ||--|{ UserPermission : "has many"
User ||--|{ UserPermissionRequest : "has many"

Client ||--|{ Project : "has many"

Project ||--|{ AdAccount : "has many"

LinkMatcher }o--|| AffiliateLink : "affiliate_link_id FK"

ClickLogSnapshot }o--|| AffiliateLink : "affiliate_link_id FK"

AspActionLog }|..o{ LinkMatcher : "match on affiliateLinkName via regex_pattern"
AspClickLog }|..o{ LinkMatcher : "match on affiliateLinkName via regex_pattern"

Campaign ||--|{ AdGroup : "1 to many"
AdGroup ||--|{ Ad : "1 to many"
