import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { hash, verify } from "argon2";
import { createHash, randomBytes } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service.js";
import { UsersService } from "../users/users.service.js";
import { type RegisterDto } from "./register.dto.js";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prismaService: PrismaService,
  ) {}

  async register({ email, password }: RegisterDto) {
    const passwordHash = await hash(password);
    try {
      return await this.usersService.create({ email, passwordHash });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("Email already exists");
      }
      throw error;
    }
  }

  async validateUser({ email, password }: { email: string; password: string }) {
    const user = await this.usersService.findByEmail(email);
    if (user === null) {
      throw new UnauthorizedException("Invalid email or password");
    }
    const { id, passwordHash } = user;
    const isVerified = await verify(passwordHash, password);
    if (!isVerified) {
      throw new UnauthorizedException("Invalid email or password");
    }
    return { id, email };
  }

  async login({ id, email }: { id: number; email: string }) {
    const payload = { email, sub: id };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(refreshToken).digest("hex");

    await this.prismaService.refreshSession.create({
      data: { userId: id, tokenHash },
    });

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    const tokenHash = createHash("sha256").update(refreshToken).digest("hex");
    const stored = await this.prismaService.refreshSession.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!stored) {
      throw new UnauthorizedException("Invalid refresh token");
    }
    const payload = { email: stored.user.email, sub: stored.userId };
    const newAccessToken = this.jwtService.sign(payload);
    const newRefreshToken = randomBytes(32).toString("base64url");
    const newTokenHash = createHash("sha256").update(newRefreshToken).digest("hex");

    await this.prismaService.refreshSession.update({
      data: { tokenHash: newTokenHash },
      where: { tokenHash },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }
}
