import { DynamicModule, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { z } from "zod";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { AuthModule } from "./auth/auth.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { UsersModule } from "./users/users.module.js";

@Module({
  imports: [PrismaModule, AuthModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  static withConfig({ ignoreEnvFile } = { ignoreEnvFile: false }): DynamicModule {
    return {
      module: AppModule,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          validationSchema: z.object({
            DATABASE_URL: z.string().min(1),
            JWT_SECRET: z.string().min(1),
          }),
          envFilePath: process.env["NODE_ENV"] === "test" ? ".env.test" : ".env",
          ignoreEnvFile,
        }),
      ],
    };
  }
}
