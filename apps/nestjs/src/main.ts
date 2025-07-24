import * as dotenv from 'dotenv';
import { join } from 'path';

// .env を明示的に読み込み（ルートにある場合）
dotenv.config({ path: join(__dirname, '../../../.env') });

import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
  await app.listen(port, "0.0.0.0");
}
bootstrap();
