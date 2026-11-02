import {
  StandardSchemaValidationPipe,
  type INestApplication,
} from "@nestjs/common";
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
    app.useGlobalPipes(new StandardSchemaValidationPipe());
    await app.init();
    prisma = app.get(PrismaService);
  });

  it("registers a user with email and password", async () => {
    const registration = {
      email: "user@email.com",
      password: "valid-password-123",
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

  describe("Registration validation", () => {
    const registrations = [
      {
        case: "invalid email",
        registration: { email: "user-email", password: "valid-password-123" },
      },
      {
        case: "too long email",
        registration: {
          email: `a@${"b".repeat(249)}.com`,
          password: "valid-password-123",
        },
      },
      {
        case: "too short password",
        registration: {
          email: "user@email.com",
          password: "pw",
        },
      },
      {
        case: "too long password",
        registration: {
          email: "user@email.com",
          password: "p".repeat(129),
        },
      },
    ];

    it.each(registrations)(
      "returns 400 for $case",
      async ({ registration }) => {
        const { status } = await request(app.getHttpServer())
          .post("/auth/register")
          .send(registration);

        expect(status).toBe(400);
      },
    );
  });

  it("returns 409 for duplicate email", async () => {
    const registration = {
      email: "user@email.com",
      password: "valid-password-123",
    };

    await request(app.getHttpServer())
      .post("/auth/register")
      .send(registration);
    const { status } = await request(app.getHttpServer())
      .post("/auth/register")
      .send(registration);

    expect(status).toBe(409);
  });

  afterEach(async () => {
    await prisma.user.deleteMany();
    await app.close();
  });
});
