import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { UsersModule } from "../users/users.module.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { LocalStrategy } from "./local.strategy.js";
import { PrismaModule } from "../prisma/prisma.module.js";

@Module({
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy],
  imports: [UsersModule, PassportModule, PrismaModule],
})
export class AuthModule {}
