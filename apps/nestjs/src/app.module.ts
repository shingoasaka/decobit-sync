import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ActionLogsModule } from './modules/action-logs.modules';

@Module({
  imports: [PrismaModule, ActionLogsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}