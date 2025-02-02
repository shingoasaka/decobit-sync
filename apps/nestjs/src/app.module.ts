import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { ActionLogsModule } from "./modules/action-logs.modules";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env"],
    }),
    PrismaModule,
    ActionLogsModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
