import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [PrismaModule],
})
export class AuthModule {}
