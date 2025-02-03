import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { ActionLogsModule } from "./modules/action-logs/action-logs.modules";
import { ClickLogsModule } from "./modules/click-logs/click-logs.module";
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env"],
    }),
    PrismaModule,
    ActionLogsModule,
    ClickLogsModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
