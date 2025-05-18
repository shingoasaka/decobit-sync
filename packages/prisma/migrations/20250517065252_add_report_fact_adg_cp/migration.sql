-- CreateTable
CREATE TABLE "TikTokRawReportAdgroup" (
    "id" SERIAL NOT NULL,
    "stat_time_day" TEXT NOT NULL,
    "advertiser_id" TEXT NOT NULL,
    "adgroup_id" TEXT NOT NULL,
    "adgroup_name" TEXT NOT NULL,
    "budget" INTEGER NOT NULL,
    "spend" INTEGER NOT NULL,
    "impressions" INTEGER NOT NULL,
    "clicks" INTEGER NOT NULL,
    "video_play_actions" INTEGER NOT NULL,
    "video_watched_2s" INTEGER NOT NULL,
    "video_watched_6s" INTEGER NOT NULL,
    "video_views_p100" INTEGER NOT NULL,
    "reach" INTEGER NOT NULL,
    "conversion" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stat_time_day_dim" TEXT,

    CONSTRAINT "TikTokRawReportAdgroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TikTokRawReportCampaign" (
    "id" SERIAL NOT NULL,
    "stat_time_day" TEXT NOT NULL,
    "advertiser_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "campaign_name" TEXT NOT NULL,
    "spend" INTEGER NOT NULL,
    "impressions" INTEGER NOT NULL,
    "clicks" INTEGER NOT NULL,
    "video_play_actions" INTEGER NOT NULL,
    "video_watched_2s" INTEGER NOT NULL,
    "video_watched_6s" INTEGER NOT NULL,
    "video_views_p100" INTEGER NOT NULL,
    "reach" INTEGER NOT NULL,
    "conversion" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stat_time_day_dim" TEXT,

    CONSTRAINT "TikTokRawReportCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TiktokFactReportAdgroup" (
    "advertiser_id" TEXT NOT NULL,
    "adgroup_id" TEXT NOT NULL,
    "stat_time_day" TEXT NOT NULL,
    "budget" INTEGER,
    "spend" INTEGER,
    "impressions" INTEGER,
    "clicks" INTEGER,
    "video_play_actions" INTEGER,
    "video_watched_2s" INTEGER,
    "video_watched_6s" INTEGER,
    "video_views_p100" INTEGER,
    "reach" INTEGER,
    "adgroup_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TiktokFactReportAdgroup_pkey" PRIMARY KEY ("stat_time_day","adgroup_id")
);

-- CreateTable
CREATE TABLE "TiktokFactReportCampaign" (
    "advertiser_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "stat_time_day" TEXT NOT NULL,
    "spend" INTEGER,
    "impressions" INTEGER,
    "clicks" INTEGER,
    "video_play_actions" INTEGER,
    "video_watched_2s" INTEGER,
    "video_watched_6s" INTEGER,
    "video_views_p100" INTEGER,
    "reach" INTEGER,
    "campaign_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TiktokFactReportCampaign_pkey" PRIMARY KEY ("stat_time_day","campaign_id")
);
