export interface TikTokReport {
  advertiserId: string;
  adId: string;
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
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface NormalizeTiktokReport {
  advertiserId: string;
  adId: string;
  adgroupId: string;
  campaignId: string;
  statTimeDay?: string;
  budget?: number;
  spend?: number;
  impressions?: number;
  clicks?: number;
  videoPlayActions?: number;
  videoWatched2s?: number;
  videoWatched6s?: number;
  videoViewsP100?: number;
  reach?: number;
  campaignName?: string;
  adgroupName?: string;
  adName?: string;
  adUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
