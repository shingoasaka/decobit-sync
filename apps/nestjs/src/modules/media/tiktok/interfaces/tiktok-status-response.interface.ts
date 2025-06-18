export interface TikTokStatusResponse {
  data: {
    list: Array<{
      ad_id: string;
      status: string;
      opt_status: string;
      updated_time: string;
    }>;
    page_info: {
      total_number: number;
      page: number;
      page_size: number;
      total_page: number;
    };
  };
}
