import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TikTokCampaignRepository } from './repositories/report/report-campaign.repository';
import { TikTokAdgroupRepository } from './repositories/report/report-adgroup.repository';
import { TikTokAdRepository } from './repositories/report/report-ad.repository';
import { TikTokCampaignReportService } from './services/report/report-campaign.service';
import { TikTokAdgroupReportService } from './services/report/report-adgroup.service';
import { TikTokAdReportService } from './services/report/report-ad.service';
import { TikTokReportService } from './services/report/tiktok-report.service';
import { HttpModule } from '@nestjs/axios';
import { MediaModule } from '../media.module';
import { TikTokAccountService } from './services/account.service';

@Module({
  imports: [PrismaModule, HttpModule, forwardRef(() => MediaModule)],
  providers: [
    TikTokCampaignRepository,
    TikTokAdgroupRepository,
    TikTokAdRepository,
    TikTokCampaignReportService,
    TikTokAdgroupReportService,
    TikTokAdReportService,
    TikTokReportService,
    TikTokAccountService,
  ],
  exports: [
    TikTokCampaignReportService,
    TikTokAdgroupReportService,
    TikTokAdReportService,
    TikTokReportService,
  ],
})
export class TikTokModule {}
