import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create({ email, passwordHash }: { email: string; passwordHash: string }) {
    return await this.prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true },
    });
  }

  async findByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true },
    });
  }
}
