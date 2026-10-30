import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { type RegisterDto, registerSchema } from "./register.dto.js";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register")
  register(@Body({ schema: registerSchema }) registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
}
