import {
  PrismaClient,
  AspType,
  MatchType,
  MediaLevel,
  Role,
  UserPermissionRequestStatus,
} from "@prisma/client";
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
      role: Role.admin,
      department_id: department.id,
    },
  });

  // 3. 広告アカウント
  const advertisers = [
    {
      advertiser_id: "6973531984614211585",
      advertiser_name: "メンズクリア_AD17_C",
    },
    {
      advertiser_id: "6967208550124814338",
      advertiser_name: "Spark Oripa_AD07",
    },
    { advertiser_id: "6972448195632693250", advertiser_name: "カーブス_AD05" },
    {
      advertiser_id: "6973534790473482241",
      advertiser_name: "ジグムアルファ_AD01",
    },
    {
      advertiser_id: "6974593601435074561",
      advertiser_name: "プルーストクリーム_AD01",
    },
    { advertiser_id: "6974669421914619905", advertiser_name: "モビット_AD01" },
    {
      advertiser_id: "6979152430441234434",
      advertiser_name: "メンズクリア_AD01",
    },
    { advertiser_id: "6980177926222249985", advertiser_name: "プロミス_AD01" },
    {
      advertiser_id: "7015125516134940674",
      advertiser_name: "ストラッシュ_YT01",
    },
    {
      advertiser_id: "7015418582490218498",
      advertiser_name: "メンズクリア_AD16_C",
    },
    { advertiser_id: "7025877076083245058", advertiser_name: "メンズTBC_AD01" },
    {
      advertiser_id: "7025877737856352257",
      advertiser_name: "エステティックTBC_AD01",
    },
    {
      advertiser_id: "7028091365879709698",
      advertiser_name: "メンズクリア_AD15_C",
    },
    {
      advertiser_id: "7042174123237277697",
      advertiser_name: "メンズクリア_AD14_C",
    },
    {
      advertiser_id: "7332738370675834882",
      advertiser_name: "AGAスキンクリニック_AD03",
    },
    {
      advertiser_id: "7332738644765245441",
      advertiser_name: "AGAスキンクリニック_AD04",
    },
    {
      advertiser_id: "7332739083128733697",
      advertiser_name: "ストラッシュ_AD07",
    },
    {
      advertiser_id: "7332739345386029058",
      advertiser_name: "ストラッシュ_AD08",
    },
    { advertiser_id: "7333070774435102722", advertiser_name: "ミュゼ_AD06" },
    {
      advertiser_id: "7336073881163153410",
      advertiser_name: "メンズクリア_AD05_C",
    },
    {
      advertiser_id: "7336074017101103106",
      advertiser_name: "メンズクリア_AD06_C",
    },
    { advertiser_id: "7342720034378104834", advertiser_name: "TBC_AD02" },
    {
      advertiser_id: "7342732576253181953",
      advertiser_name: "ETVOS_IF_あやさん",
    },
    {
      advertiser_id: "7343142846641356802",
      advertiser_name: "アリシアクリニック_AD02",
    },
    {
      advertiser_id: "7345316221878976513",
      advertiser_name: "弁護士法人オーガスタ_AD02",
    },
    {
      advertiser_id: "7345320304522313729",
      advertiser_name: "ユアエース_AD02",
    },
    {
      advertiser_id: "7346095859215450114",
      advertiser_name: "じぶんクリニック_AD03",
    },
    {
      advertiser_id: "7346114045415849986",
      advertiser_name: "アリシアクリニック_AD06",
    },
    {
      advertiser_id: "7350603435702239232",
      advertiser_name: "ナハト広告_AD01",
    },
    { advertiser_id: "7353893705747120145", advertiser_name: "DIO_AD02" },
    { advertiser_id: "7353897434474594321", advertiser_name: "DIO_AD03" },
    {
      advertiser_id: "7353938231030775824",
      advertiser_name: "メンズクリア_AD07_C",
    },
    {
      advertiser_id: "7353938706006310913",
      advertiser_name: "メンズクリア_AD08_C",
    },
    {
      advertiser_id: "7353939253488877584",
      advertiser_name: "メンズクリア_AD09_C",
    },
    {
      advertiser_id: "7356837996353847297",
      advertiser_name: "ストラッシュ_AD05_C",
    },
    {
      advertiser_id: "7356839098906263553",
      advertiser_name: "ストラッシュ_AD06_C",
    },
    {
      advertiser_id: "7358020357112070161",
      advertiser_name: "ユアエース_AD03",
    },
    {
      advertiser_id: "7361395324503719937",
      advertiser_name: "メンズクリア_AD10_C",
    },
    {
      advertiser_id: "7361397096378875921",
      advertiser_name: "メンズクリア_AD11_C",
    },
    {
      advertiser_id: "7361398329676152833",
      advertiser_name: "メンズクリア_AD12_C",
    },
    {
      advertiser_id: "7361398421359460368",
      advertiser_name: "メンズクリア02_AD01_C",
    },
    {
      advertiser_id: "7361399377933451280",
      advertiser_name: "メンズクリア_02_AD02_C",
    },
    {
      advertiser_id: "7361399741298655248",
      advertiser_name: "メンズクリア_02_AD03_C",
    },
    {
      advertiser_id: "7410275075309518864",
      advertiser_name: "ストラッシュ_AD22",
    },
    {
      advertiser_id: "7410275144033189905",
      advertiser_name: "ストラッシュ_AD13",
    },
    {
      advertiser_id: "7410275471843426321",
      advertiser_name: "ストラッシュ_AD14",
    },
    {
      advertiser_id: "7410275957912911873",
      advertiser_name: "ストラッシュ_AD15",
    },
    {
      advertiser_id: "7410276371567656977",
      advertiser_name: "ストラッシュ_AD16",
    },
    {
      advertiser_id: "7410276989619388432",
      advertiser_name: "ストラッシュ_AD17",
    },
    {
      advertiser_id: "7410277207584833553",
      advertiser_name: "ストラッシュ_AD21",
    },
    {
      advertiser_id: "7410282305278787600",
      advertiser_name: "ストラッシュ_AD20",
    },
    {
      advertiser_id: "7410282855433043984",
      advertiser_name: "ストラッシュ_AD18",
    },
    {
      advertiser_id: "7410283067090452481",
      advertiser_name: "ストラッシュ_AD19",
    },
    {
      advertiser_id: "7410337550243610625",
      advertiser_name: "レバテック_AD01",
    },
    {
      advertiser_id: "7410353117352673296",
      advertiser_name: "アリシアクリニック_AD07",
    },
    {
      advertiser_id: "7410353504944013328",
      advertiser_name: "アリシアクリニック_AD08",
    },
    {
      advertiser_id: "7410353970214043664",
      advertiser_name: "アリシアクリニック_AD09",
    },
    {
      advertiser_id: "7410354257083269121",
      advertiser_name: "アリシアクリニック_AD10",
    },
    {
      advertiser_id: "7410354765403652097",
      advertiser_name: "アリシアクリニック_AD11",
    },
    {
      advertiser_id: "7410714974697472017",
      advertiser_name: "メンズクリア_AD18_C",
    },
    {
      advertiser_id: "7410734275844407312",
      advertiser_name: "メンズクリア_AD19_C",
    },
    {
      advertiser_id: "7410734670142308369",
      advertiser_name: "メンズクリア_AD20_C",
    },
    {
      advertiser_id: "7410734954231169025",
      advertiser_name: "メンズクリア_AD21_C",
    },
    {
      advertiser_id: "7410735288823234576",
      advertiser_name: "メンズクリア_AD22_C",
    },
    { advertiser_id: "7472713646620229633", advertiser_name: "メンズTBC_AD04" },
    { advertiser_id: "7472715591619919888", advertiser_name: "メンズTBC_AD05" },
    { advertiser_id: "7472717437763567617", advertiser_name: "メンズTBC_AD06" },
    { advertiser_id: "7473822360383160337", advertiser_name: "ノモレ_ADS01" },
    { advertiser_id: "7473823123763265553", advertiser_name: "ノモレ_ADS02" },
    { advertiser_id: "7473823847993753616", advertiser_name: "ノモレ_ADS03" },
  ];

  await prisma.adAccount.createMany({
    data: advertisers.map((advertiser) => ({
      name: advertiser.advertiser_name,
      ad_platform_account_id: advertiser.advertiser_id,
      ad_platform_id: adPlatform.id,
      department_id: department.id,
      project_id: project.id,
    })),
    skipDuplicates: true,
  });

  // // 4. キャンペーン　cronで取得
  // const campaign = await prisma.campaign.create({
  //   data: {
  //     ad_account_id: adAccount.id,
  //     platform_campaign_id: BigInt(10010000),
  //     platform_campaign_name: "サンプルキャンペーン",
  //   },
  // });

  // // 5. アドグループ　cronで取得
  // const adGroup = await prisma.adGroup.create({
  //   data: {
  //     ad_account_id: adAccount.id,
  //     campaign_id: campaign.id,
  //     platform_adgroup_id: BigInt(20010000),
  //     platform_adgroup_name: "サンプルアドグループ",
  //   },
  // });

  // // 6. 広告　cronで取得
  // const ad = await prisma.ad.create({
  //   data: {
  //     ad_account_id: adAccount.id,
  //     adgroup_id: adGroup.id,
  //     platform_ad_id: BigInt(30010000),
  //     ad_name: "サンプル広告",
  //   },
  // });

  // // 7. TikTokRawReportCampaign　cronで取得
  // await prisma.tikTokRawReportCampaign.create({
  //   data: {
  //     ad_account_id: adAccount.id,
  //     stat_time_day: new Date("2024-06-01"),
  //     ad_platform_account_id: "tiktok-acc-1",
  //     platform_campaign_id: BigInt(10010000),
  //     budget: 10000,
  //     spend: 5000,
  //     impressions: 1000,
  //     clicks: 100,
  //     video_play_actions: 50,
  //     video_watched_2s: 40,
  //     video_watched_6s: 30,
  //     video_views_p100: 20,
  //     reach: 800,
  //     conversion: 10,
  //   },
  // });

  // // 8. TikTokRawReportAdGroup　cronで取得
  // await prisma.tikTokRawReportAdGroup.create({
  //   data: {
  //     ad_account_id: adAccount.id,
  //     stat_time_day: new Date("2024-06-01"),
  //     ad_platform_account_id: "tiktok-acc-1",
  //     platform_adgroup_id: BigInt(20010000),
  //     budget: 5000,
  //     spend: 2500,
  //     impressions: 500,
  //     clicks: 50,
  //     video_play_actions: 25,
  //     video_watched_2s: 20,
  //     video_watched_6s: 15,
  //     video_views_p100: 10,
  //     reach: 400,
  //     conversion: 5,
  //   },
  // });

  // // 9. TikTokRawReportAd cronで取得
  // await prisma.tikTokRawReportAd.create({
  //   data: {
  //     ad_account_id: adAccount.id,
  //     stat_time_day: new Date("2024-06-01"),
  //     ad_platform_account_id: "tiktok-acc-1",
  //     platform_campaign_id: BigInt(10010000),
  //     platform_campaign_name: "サンプルキャンペーン",
  //     platform_adgroup_id: BigInt(20010000),
  //     platform_adgroup_name: "サンプルアドグループ",
  //     platform_ad_id: BigInt(30010000),
  //     platform_ad_name: "サンプル広告",
  //     ad_url: "https://example.com/ad",
  //     budget: 1000,
  //     spend: 500,
  //     impressions: 100,
  //     clicks: 10,
  //     video_play_actions: 5,
  //     video_watched_2s: 4,
  //     video_watched_6s: 3,
  //     video_views_p100: 2,
  //     reach: 80,
  //     conversion: 1,
  //   },
  // });

  // // 10. アフィリエイトリンク　cronで取得
  // const affiliateLink = await prisma.affiliateLink.create({
  //   data: {
  //     ad_account_id: adAccount.id,
  //     asp_type: AspType.METRON,
  //     affiliate_link_name: "サンプルアフィリエイト",
  //   },
  // });

  // // 11. LinkMatcher cronで取得
  // await prisma.linkMatcher.create({
  //   data: {
  //     ad_account_id: adAccount.id,
  //     affiliate_link_id: affiliateLink.id,
  //     asp_type: AspType.METRON,
  //     match_type: MatchType.AFFILIATE_LINK,
  //     media_level: MediaLevel.Campaign,
  //     target_dim_id: 1, // 必要に応じて適切なIDを指定
  //     created_at: new Date(),
  //     updated_at: new Date(),
  //   },
  // });

  // // 12. ClickLogSnapshot cronで取得
  // await prisma.clickLogSnapshot.create({
  //   data: {
  //     affiliate_link_id: affiliateLink.id,
  //     asp_type: AspType.METRON,
  //     currentTotalClicks: 100,
  //     snapshot_date: new Date("2024-06-01"),
  //     created_at: new Date("2024-06-01"),
  //     updated_at: new Date("2024-06-01"),
  //   },
  // });

  // // 13. AspActionLog cronで取得
  // await prisma.aspActionLog.create({
  //   data: {
  //     affiliate_link_id: affiliateLink.id,
  //     asp_type: AspType.METRON,
  //     action_date_time: new Date("2024-06-01T12:00:00Z"),
  //     referrerUrl: "https://referrer.example.com",
  //     uid: "sample-uid",
  //     created_at: new Date("2024-06-01T12:00:00Z"),
  //     updated_at: new Date("2024-06-01T12:00:00Z"),
  //   },
  // });

  // // 14. AspClickLog cronで取得
  // await prisma.aspClickLog.create({
  //   data: {
  //     affiliate_link_id: affiliateLink.id,
  //     asp_type: AspType.METRON,
  //     click_date_time: new Date("2024-06-01T12:05:00Z"),
  //     referrerUrl: "https://referrer.example.com",
  //     created_at: new Date("2024-06-01T12:05:00Z"),
  //     updated_at: new Date("2024-06-01T12:05:00Z"),
  //   },
  // });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
