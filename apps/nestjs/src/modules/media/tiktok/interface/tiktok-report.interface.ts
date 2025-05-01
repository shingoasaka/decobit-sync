export interface TikTokReport {
  advertiserId: string | null;
  adId: string | null;
  statTimeDay: string;
  budget: number;
  spend: number;
  impressions: number;
  clicks: number;
  videoPlayActions: number;
  videoWatched2s: number;
  videoWatched6s: number;
  videoViewsP100: number;
  reach: number;
  conversion: number;
  campaignId: string;
  campaignName: string;
  adgroupId: string;
  adgroupName: string;
  adName: string;
  adUrl: string;
  statTimeDayDimension: string;
  adIdDimension: string;
  createdAt:Date | null;
  updatedAt:Date | null;
}
