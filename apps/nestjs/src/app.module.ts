import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { MetronActionLogsModule } from "./modules/metron-action-logs/action-logs.modules";
import { MetronClickLogsModule } from "./modules/metron-click-logs/click-logs.module";
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env"],
    }),
    PrismaModule,
    MetronActionLogsModule,
    MetronClickLogsModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
