import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { hash, verify } from "argon2";
import { UsersService } from "../users/users.service.js";
import { type RegisterDto } from "./register.dto.js";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
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
    return { accessToken };
  }
}
