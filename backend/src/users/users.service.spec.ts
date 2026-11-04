import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service.js";
import { UsersService } from "./users.service.js";

describe("UsersService", () => {
  let service: UsersService;
  const prismaMock = {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe(".create", () => {
    it("creates user with hashed password and returns the public user data", async () => {
      const createUserInput = {
        email: "user@email.com",
        passwordHash: "hashed-password",
      };
      prismaMock.user.create.mockResolvedValue({
        id: 1,
        email: createUserInput.email,
      });

      const result = await service.create(createUserInput);

      expect(prismaMock.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { email: createUserInput.email, passwordHash: createUserInput.passwordHash },
        }),
      );
      expect(result).toEqual({ id: 1, email: createUserInput.email });
    });
  });
});
