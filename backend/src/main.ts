import { StandardSchemaValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule.withConfig());
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  app.enableCsrfProtection();
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
