import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });
  
  // Listen on all network interfaces (0.0.0.0) for Docker compatibility
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
