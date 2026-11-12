import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { hash, verify } from "argon2";
import { createHash, randomBytes } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service.js";
import { UsersService } from "../users/users.service.js";
import { AuthService } from "./auth.service.js";
import { type RegisterDto } from "./register.dto.js";

vi.mock("argon2", async (importOriginal) => {
  const original = await importOriginal<typeof import("argon2")>();
  return { ...original, hash: vi.fn(), verify: vi.fn() };
});

vi.mock("node:crypto", async (importOriginal) => {
  const original = await importOriginal<typeof import("node:crypto")>();
  return { ...original, randomBytes: vi.fn() };
});

describe("AuthService (unit)", () => {
  let service: AuthService;
  const usersService = {
    create: vi.fn(),
    findByEmail: vi.fn(),
  };
  const jwtService = {
    sign: vi.fn(),
  };
  const prismaService = {
    refreshSession: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: PrismaService, useValue: prismaService },
      ],
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
      usersService.create.mockResolvedValue({
        id: 1,
        email: registerDto.email,
      });

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
        service.validateUser({
          email: "unknown-user@email.com",
          password: "user-password-123",
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("throws UnauthroziedException when password isn't verified", async () => {
      usersService.findByEmail.mockResolvedValue({
        id: 1,
        passwordHash: "hashed-password",
      });
      vi.mocked(verify).mockResolvedValue(false);

      await expect(
        service.validateUser({
          email: "user@email.com",
          password: "invalid-password-123",
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe(".login", () => {
    it("returns JWT AT and Opaque RT, creating a refresh session with the RT hash", async () => {
      // arrange
      vi.useFakeTimers({ toFake: ["Date"] });
      const issuedAt = Date.now();
      vi.setSystemTime(issuedAt);

      const authUser = { id: 1, email: "user@email.com" };
      const accessToken = "access-token";
      jwtService.sign.mockReturnValue(accessToken);
      const refreshToken = "refresh-token";
      const buffer = Buffer.alloc(32);
      vi.spyOn(buffer, "toString").mockReturnValue(refreshToken);
      vi.mocked(randomBytes).mockImplementation(() => buffer);
      const tokenHash = createHash("sha256").update(refreshToken).digest("hex");

      // act
      const result = await service.login(authUser);

      // assert
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: authUser.email,
        sub: authUser.id,
      });
      expect(randomBytes).toHaveBeenCalledWith(32);
      expect(prismaService.refreshSession.create).toHaveBeenCalledWith({
        data: {
          userId: authUser.id,
          tokenHash,
          expiresAt: new Date(issuedAt + 7 * 24 * 60 * 60 * 1000),
          absoluteExpiresAt: new Date(issuedAt + 30 * 24 * 60 * 60 * 1000),
        },
      });
      expect(result).toEqual({ accessToken, refreshToken });

      vi.useRealTimers();
    });
  });

  describe(".refresh", () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["Date"] });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("rotates the refresh session with extended expiration and returns new AT & RT", async () => {
      // arrange
      const firstIssuedAt = Date.now();
      vi.setSystemTime(firstIssuedAt);

      const authUser = { id: 1, email: "user@email.com" };
      const refreshToken = "refresh-Token";
      const tokenHash = createHash("sha256").update(refreshToken).digest("hex");
      const newAccessToken = "new-access-token";
      jwtService.sign.mockReturnValue(newAccessToken);
      const newRefreshToken = "new-refresh-token";
      const buffer = Buffer.alloc(32);
      vi.spyOn(buffer, "toString").mockReturnValue(newRefreshToken);
      vi.mocked(randomBytes).mockImplementation(() => buffer);
      const newTokenHash = createHash("sha256").update(newRefreshToken).digest("hex");
      vi.mocked(prismaService.refreshSession.findUnique).mockResolvedValue({
        tokenHash,
        userId: authUser.id,
        user: authUser,
        expiresAt: new Date(firstIssuedAt + 7 * 24 * 60 * 60 * 1000),
        absoluteExpiresAt: new Date(firstIssuedAt + 30 * 24 * 60 * 60 * 1000),
      });

      // act
      const secondIssuedAt = new Date(firstIssuedAt + 6 * 24 * 60 * 60 * 1000).getTime();
      vi.setSystemTime(secondIssuedAt);
      const result = await service.refresh(refreshToken);

      // assert
      expect(prismaService.refreshSession.findUnique).toHaveBeenCalledWith({
        where: { tokenHash },
        include: { user: true },
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: authUser.email,
        sub: authUser.id,
      });
      expect(randomBytes).toHaveBeenCalledWith(32);
      expect(prismaService.refreshSession.update).toHaveBeenCalledWith({
        data: {
          tokenHash: newTokenHash,
          expiresAt: new Date(secondIssuedAt + 7 * 24 * 60 * 60 * 1000),
        },
        where: { tokenHash },
      });
      expect(result).toEqual({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    });

    it("throws UnauthorizedException for unknown RT", async () => {
      vi.mocked(prismaService.refreshSession.findUnique).mockResolvedValue(null);

      await expect(service.refresh("unknown-refresh-token")).rejects.toThrow(UnauthorizedException);
    });

    it("throws UnauthorizedException for RT older than regular-expiration", async () => {
      const issuedAt = Date.now();
      vi.setSystemTime(issuedAt);
      vi.mocked(prismaService.refreshSession.findUnique).mockResolvedValue({
        expiresAt: new Date(issuedAt + 7 * 24 * 60 * 60 * 1000),
      });
      vi.setSystemTime(new Date(issuedAt + 7 * 24 * 60 * 60 * 1000 + 1));

      await expect(service.refresh("expired-refresh-token")).rejects.toThrow(UnauthorizedException);
    });

    it("throws UnauthorizedException for RT older than absolute-expiraton", async () => {
      const issuedAt = Date.now();
      vi.setSystemTime(issuedAt);
      vi.mocked(prismaService.refreshSession.findUnique).mockResolvedValue({
        expiresAt: new Date(issuedAt + 31 * 24 * 60 * 60 * 1000),
        absoluteExpiresAt: new Date(issuedAt + 30 * 24 * 60 * 60 * 1000),
      });
      vi.setSystemTime(new Date(issuedAt + 30 * 24 * 60 * 60 * 1000 + 1));

      await expect(service.refresh("expired-refresh-token")).rejects.toThrow(UnauthorizedException);
    });
  });

  describe(".logout", () => {
    it("invokes refreshSession.delete with tokenHash", async () => {
      const refreshToken = "refresh-token";
      const tokenHash = createHash("sha256").update(refreshToken).digest("hex");

      await service.logout(refreshToken);

      expect(prismaService.refreshSession.delete).toHaveBeenCalledWith({ where: { tokenHash } });
    });

    it("ignores P2025 error thrown during refreshSession.delete query", async () => {
      const refreshToken = "unknown-refresh-token";
      prismaService.refreshSession.delete.mockRejectedValue(
        new PrismaClientKnownRequestError("record doesn't exist", {
          code: "P2025",
          clientVersion: "test",
        }),
      );

      await expect(service.logout(refreshToken)).resolves.toBeUndefined();
    });
  });
});
