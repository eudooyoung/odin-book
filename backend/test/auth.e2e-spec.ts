import {
  StandardSchemaValidationPipe,
  type INestApplication,
} from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import request from "supertest";
import { App } from "supertest/types.js";
import { AppModule } from "../src/app.module.js";
import { PrismaService } from "../src/prisma/prisma.service.js";

describe("AuthModule", () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule.withConfig()],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new StandardSchemaValidationPipe());
    await app.init();
    prisma = app.get(PrismaService);
  });

  describe("POST /auth/register", () => {
    it("registers a user with email and password", async () => {
      const registration = {
        email: "user@email.com",
        password: "user-password-123",
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

    describe("Validation", () => {
      const registrations = [
        {
          case: "invalid email",
          registration: { email: "user-email", password: "user-password-123" },
        },
        {
          case: "too long email",
          registration: {
            email: `a@${"b".repeat(249)}.com`,
            password: "user-password-123",
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
          await request(app.getHttpServer())
            .post("/auth/register")
            .send(registration)
            .expect(400);
        },
      );
    });

    it("returns 409 for duplicate email", async () => {
      const registration = {
        email: "user@email.com",
        password: "user-password-123",
      };
      await request(app.getHttpServer())
        .post("/auth/register")
        .send(registration);
      await request(app.getHttpServer())
        .post("/auth/register")
        .send(registration)
        .expect(409);
    });
  });

  describe("POST /auth/login", () => {
    it("sets AT and RT cookies with expected options", async () => {
      const { cookies } = request;
      const registration = {
        email: "user@email.com",
        password: "user-password-123",
      };
      await request(app.getHttpServer())
        .post("/auth/register")
        .send(registration);

      const loginInput = registration;
      await request(app.getHttpServer())
        .post("/auth/login")
        .send(loginInput)
        .expect(204)
        .expect(
          cookies(null, (_, { cookies }) => {
            const cookie = cookies.find((c) => c.name === "accessToken");
            if (!cookie) {
              throw new Error("accessToken cookie was not set");
            }
            expect(cookie.options).toMatchObject({
              httponly: true,
              samesite: "Lax",
              path: "/",
              "max-age": `${15 * 60}`,
            });
            expect(cookie.options).not.toHaveProperty("secure");
            return true;
          }),
        )
        .expect(
          cookies(null, (_, { cookies }) => {
            const cookie = cookies.find((c) => c.name === "refreshToken");
            if (!cookie) {
              throw new Error("refreshToken cookie was not set");
            }
            expect(cookie.options).toMatchObject({
              httponly: true,
              samesite: "Lax",
              path: "/auth",
              "max-age": `${7 * 24 * 60 * 60}`,
            });
            expect(cookie.options).not.toHaveProperty("secure");
            return true;
          }),
        );
    });
  });

  afterEach(async () => {
    await prisma.user.deleteMany();
    await app.close();
  });
});
