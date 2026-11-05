import { Body, Controller, HttpCode, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { type Request } from "express";
import { AuthService } from "./auth.service.js";
import { type RegisterDto, registerSchema } from "./register.dto.js";

type AuthUser = {
  id: number;
  email: string;
};

interface AuthRequest extends Request {
  user: AuthUser;
}

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register")
  register(@Body({ schema: registerSchema }) registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(AuthGuard("local"))
  @Post("login")
  @HttpCode(204)
  async login(@Req() req: AuthRequest) {
    return req.user;
  }
}
