import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { hash, verify } from "argon2";
import { UsersService } from "../users/users.service.js";
import { AuthService } from "./auth.service.js";
import { type RegisterDto } from "./register.dto.js";

vi.mock("argon2", async (importOriginal) => {
  const original = await importOriginal<typeof import("argon2")>();
  return { ...original, hash: vi.fn(), verify: vi.fn() };
});

describe("AuthService (unit)", () => {
  let service: AuthService;
  const usersService = {
    create: vi.fn(),
    findByEmail: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, { provide: UsersService, useValue: usersService }],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe(".register", () => {
    it("hashes password and invokes users service create", async () => {
      const registerDto: RegisterDto = {
        email: "user@email.com",
        password: "user-password-123",
      };
      vi.mocked(hash).mockResolvedValue("hashed-password");
      usersService.create.mockResolvedValue({ id: 1, email: registerDto.email });

      const result = await service.register(registerDto);

      expect(hash).toHaveBeenCalledWith(registerDto.password);
      expect(usersService.create).toHaveBeenCalledWith({
        email: registerDto.email,
        passwordHash: "hashed-password",
      });
      expect(result).toEqual({ id: 1, email: registerDto.email });
    });

    it("converts P2002 error to ConflictException", async () => {
      const registerDto: RegisterDto = {
        email: "user@email.com",
        password: "password",
      };
      usersService.create.mockRejectedValue(
        new PrismaClientKnownRequestError("violates unique constraint", {
          code: "P2002",
          clientVersion: "test",
        }),
      );

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe(".validateUser", () => {
    it("invokes user service findByEmail and verifies password", async () => {
      const loginDto = {
        email: "user@email.com",
        password: "user-password-123",
      };
      usersService.findByEmail.mockResolvedValue({
        id: 1,
        email: "user@email.com",
        passwordHash: "hashed-password",
      });
      vi.mocked(verify).mockResolvedValue(true);

      const result = await service.validateUser(loginDto);
      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(verify).toHaveBeenCalledWith("hashed-password", loginDto.password);
      expect(result).toEqual({ id: 1, email: "user@email.com" });
    });

    it("throws UnauthorizedException when user doesn't exist", async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.validateUser({ email: "unknown-user@email.com", password: "user-password-123" }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("throws UnauthroziedException when password isn't verified", async () => {
      vi.mocked(verify).mockRejectedValue(false);

      await expect(
        service.validateUser({ email: "user@email.com", password: "invalid-password-123" }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
