import type { INestApplication } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import request from "supertest";
import { App } from "supertest/types.js";
import { AppModule } from "../src/app.module.js";
import { PrismaService } from "../src/prisma/prisma.service.js";

describe("Authentication (e2e)", () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  it("registers a user with email and password", async () => {
    const registration = {
      email: "user@email.com",
      password: "user-password",
    };

    const { status, body } = await request(app.getHttpServer())
      .post("/auth/register")
      .send(registration);

    expect(status).toBe(201);
    expect(body).toEqual({
      id: expect.any(Number),
      email: registration.email,
    });

    const registered = await prisma.user.findUnique({
      where: { id: body.id },
      select: { id: true, email: true },
    });

    expect(body).toEqual(registered);
  });

  afterEach(async () => {
    await prisma.user.deleteMany();
    await app.close();
  });
});
