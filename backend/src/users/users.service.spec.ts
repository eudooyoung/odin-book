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
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe(".create", () => {
    it("creates user with hashed password", async () => {
      const createUserInput = {
        email: "user@email.com",
        passwordHash: "hashed-password",
      };

      await service.create(createUserInput);

      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: { email: createUserInput.email, passwordHash: createUserInput.passwordHash },
        select: { id: true, email: true },
      });
    });
  });

  describe(".findByEmail", () => {
    it("finds user data with email", async () => {
      const email = "user@email.com";

      await service.findByEmail(email);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email },
        select: { id: true, passwordHash: true },
      });
    });
  });
});
