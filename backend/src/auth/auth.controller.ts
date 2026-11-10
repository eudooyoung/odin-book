import { Body, Controller, Cookies, HttpCode, Post, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { type Request, type Response } from "express";
import { getAuthCookieOptions } from "./auth-cookie-options.js";
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

  @Post("login")
  @UseGuards(AuthGuard("local"))
  @HttpCode(204)
  async login(@Req() req: AuthRequest, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken } = await this.authService.login(req.user);
    const options = getAuthCookieOptions(process.env.NODE_ENV);
    res.cookie("accessToken", accessToken, options.accessToken);
    res.cookie("refreshToken", refreshToken, options.refreshToken);
  }

  @Post("refresh")
  @HttpCode(204)
  async refresh(
    @Cookies() cookies: Record<string, string>,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.refresh(cookies.refreshToken);
    const options = getAuthCookieOptions(process.env.NODE_ENV);
    res.cookie("accessToken", accessToken, options.accessToken);
    res.cookie("refreshToken", refreshToken, options.refreshToken);
  }
}
