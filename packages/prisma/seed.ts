import { PrismaClient, AspType } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // 1. マスタ系
  const department = await prisma.department.upsert({
    where: { name: "マーケティング部" },
    update: {},
    create: { name: "マーケティング部" },
  });

  const client = await prisma.client.upsert({
    where: { name: "サンプルクライアント" },
    update: {},
    create: { name: "サンプルクライアント" },
  });

  const project = await prisma.project.upsert({
    where: {
      name_client_id: { name: "サンプルプロジェクト", client_id: client.id },
    },
    update: {},
    create: { name: "サンプルプロジェクト", client_id: client.id },
  });

  const adPlatform = await prisma.adPlatform.upsert({
    where: { name: "TikTok" },
    update: {},
    create: { name: "TikTok" },
  });

  // 2. ユーザー
  const user = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      email: "test@example.com",
      firebase_uid: "test-uid-123",
      role: "admin",
      department_id: department.id,
    },
  });

  // 3. 広告アカウント
  const adAccount = await prisma.adAccount.upsert({
    where: {
      ad_platform_account_id_ad_platform_id: {
        ad_platform_account_id: "tiktok-acc-1",
        ad_platform_id: adPlatform.id,
      },
    },
    update: {},
    create: {
      name: "サンプルアカウント",
      ad_platform_account_id: "tiktok-acc-1",
      ad_platform_id: adPlatform.id,
      department_id: department.id,
      project_id: project.id,
    },
  });

  // 4. キャンペーン
  const campaign = await prisma.campaign.create({
    data: {
      ad_account_id: adAccount.id,
      platform_campaign_id: 10010000,
      platform_campaign_name: "サンプルキャンペーン",
    },
  });

  // 5. アドグループ
  const adGroup = await prisma.adGroup.create({
    data: {
      ad_account_id: adAccount.id,
      campaign_id: campaign.id,
      platform_adgroup_id: 20010000,
      platform_adgroup_name: "サンプルアドグループ",
    },
  });

  // 6. 広告
  const ad = await prisma.ad.create({
    data: {
      ad_account_id: adAccount.id,
      adgroup_id: adGroup.id,
      platform_ad_id: 30010000,
      ad_name: "サンプル広告",
    },
  });

  // 7. TikTokRawReportCampaign
  await prisma.tikTokRawReportCampaign.create({
    data: {
      ad_account_id: adAccount.id,
      stat_time_day: new Date("2024-06-01"),
      ad_platform_account_id: "tiktok-acc-1",
      platform_campaign_id: 10010000,
      budget: 10000,
      spend: 5000,
      impressions: 1000,
      clicks: 100,
      video_play_actions: 50,
      video_watched_2s: 40,
      video_watched_6s: 30,
      video_views_p100: 20,
      reach: 800,
      conversion: 10,
    },
  });

  // 8. TikTokRawReportAdGroup
  await prisma.tikTokRawReportAdGroup.create({
    data: {
      ad_account_id: adAccount.id,
      stat_time_day: new Date("2024-06-01"),
      ad_platform_account_id: "tiktok-acc-1",
      platform_adgroup_id: 20010000,
      budget: 5000,
      spend: 2500,
      impressions: 500,
      clicks: 50,
      video_play_actions: 25,
      video_watched_2s: 20,
      video_watched_6s: 15,
      video_views_p100: 10,
      reach: 400,
      conversion: 5,
    },
  });

  // 9. TikTokRawReportAd
  await prisma.tikTokRawReportAd.create({
    data: {
      ad_account_id: adAccount.id,
      stat_time_day: new Date("2024-06-01"),
      ad_platform_account_id: "tiktok-acc-1",
      platform_campaign_id: 10010000,
      platform_campaign_name: "サンプルキャンペーン",
      platform_adgroup_id: 20010000,
      platform_adgroup_name: "サンプルアドグループ",
      platform_ad_id: 30010000,
      platform_ad_name: "サンプル広告",
      ad_url: "https://example.com/ad",
      budget: 1000,
      spend: 500,
      impressions: 100,
      clicks: 10,
      video_play_actions: 5,
      video_watched_2s: 4,
      video_watched_6s: 3,
      video_views_p100: 2,
      reach: 80,
      conversion: 1,
    },
  });

  // 10. アフィリエイトリンク
  const affiliateLink = await prisma.affiliateLink.create({
    data: {
      ad_account_id: adAccount.id,
      asp_type: AspType.METRON,
      affiliate_name: "サンプルアフィリエイト",
    },
  });

  // 11. LinkMatcher
  await prisma.linkMatcher.create({
    data: {
      ad_account_id: adAccount.id,
      affiliate_link_id: affiliateLink.id,
      asp_type: AspType.METRON,
      match_type: "AFFILIATE_LINK",
      target_dim: "campaign_name",
      media_level: "Campaign",
      regex_pattern: ".*サンプル.*",
    },
  });

  // 12. ClickLogSnapshot
  await prisma.clickLogSnapshot.upsert({
    where: {
      asp_type_affiliateLinkName_snapshot_date: {
        asp_type: AspType.METRON,
        affiliateLinkName: "sample-affiliate",
        snapshot_date: new Date("2024-06-01"),
      },
    },
    update: {
      currentTotalClicks: 100,
      updated_at: new Date("2024-06-01"),
    },
    create: {
      affiliate_link_id: affiliateLink.id,
      asp_type: AspType.METRON,
      affiliateLinkName: "sample-affiliate",
      currentTotalClicks: 100,
      snapshot_date: new Date("2024-06-01"),
      created_at: new Date("2024-06-01"),
      updated_at: new Date("2024-06-01"),
    },
  });

  // 13. 権限・表示設定系（必要に応じて追加）
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
