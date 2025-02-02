import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Fly.ioのデフォルトポート8080を使用
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
  await app.listen(port, '0.0.0.0');
  
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
