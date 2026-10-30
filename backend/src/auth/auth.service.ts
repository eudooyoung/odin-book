import { Injectable } from "@nestjs/common";
import { hash } from "argon2";
import { PrismaService } from "../prisma/prisma.service.js";
import { type RegisterDto } from "./register.dto.js";

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(registerDto: RegisterDto) {
    const { email, password } = registerDto;
    const passwordHash = await hash(password);
    return await this.prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true },
    });
  }
}
