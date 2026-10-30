import { Test, TestingModule } from "@nestjs/testing";
import { hash } from "argon2";
import { PrismaService } from "../prisma/prisma.service.js";
import { AuthService } from "./auth.service.js";
import { type RegisterDto } from "./register.dto.js";

vi.mock("argon2", async (importOriginal) => {
  const original = await importOriginal<typeof import("argon2")>();
  return { ...original, hash: vi.fn() };
});

describe("AuthService", () => {
  let service: AuthService;
  const prismaMock = {
    user: {
      create: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("register", () => {
    it("should call prisma.user.create() with hashed password", async () => {
      const registerDto: RegisterDto = { email: "user@email.com", password: "password" };
      prismaMock.user.create.mockResolvedValue({ id: 1, email: registerDto.email });
      vi.mocked(hash).mockResolvedValue("hashed");

      const result = await service.register(registerDto);

      expect(hash).toHaveBeenCalledWith(registerDto.password);
      expect(prismaMock.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { email: registerDto.email, passwordHash: "hashed" },
        }),
      );
      expect(result).toEqual({ id: 1, email: registerDto.email });
    });
  });
});
