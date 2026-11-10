import { StandardSchemaValidationPipe, type INestApplication } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { createHash } from "node:crypto";
import { parseSetCookie } from "set-cookie-parser";
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

      it.each(registrations)("returns 400 for $case", async ({ registration }) => {
        await request(app.getHttpServer()).post("/auth/register").send(registration).expect(400);
      });
    });

    it("returns 409 for duplicate email", async () => {
      const registration = {
        email: "user@email.com",
        password: "user-password-123",
      };
      await request(app.getHttpServer()).post("/auth/register").send(registration);
      await request(app.getHttpServer()).post("/auth/register").send(registration).expect(409);
    });
  });

  describe("POST /auth/login", () => {
    it("issues token cookies with expected options and stores the RT hash", async () => {
      const registration = {
        email: "user@email.com",
        password: "user-password-123",
      };
      const {
        body: { id },
      } = await request(app.getHttpServer()).post("/auth/register").send(registration);

      let refreshToken: string | undefined;
      await request(app.getHttpServer())
        .post("/auth/login")
        .send(registration)
        .expect(204)
        .expect(
          request.cookies(null, (_, { cookies: resCookies }) => {
            const accessTokenCookie = resCookies.find((c) => c.name === "accessToken");
            if (!accessTokenCookie) {
              throw new Error("accessToken cookie was not set");
            }
            expect(accessTokenCookie.options).toMatchObject({
              httponly: true,
              samesite: "Lax",
              path: "/",
              "max-age": `${15 * 60}`,
            });
            expect(accessTokenCookie.options).not.toHaveProperty("secure");
            return true;
          }),
        )
        .expect(
          request.cookies(null, (_, { cookies: resCookies }) => {
            const refreshTokenCookie = resCookies.find((c) => c.name === "refreshToken");
            if (!refreshTokenCookie) {
              throw new Error("refreshToken cookie was not set");
            }
            refreshToken = refreshTokenCookie.value;
            expect(refreshTokenCookie.options).toMatchObject({
              httponly: true,
              samesite: "Lax",
              path: "/auth",
              "max-age": `${7 * 24 * 60 * 60}`,
            });
            expect(refreshTokenCookie.options).not.toHaveProperty("secure");
            return true;
          }),
        );

      if (!refreshToken) {
        throw new Error("Refresh token value was not set");
      }
      const tokenHash = createHash("sha256").update(refreshToken).digest("hex");
      const { tokenHash: stored } = await prisma.refreshSession.findFirstOrThrow({
        where: { userId: id },
        select: { tokenHash: true },
      });
      expect(tokenHash).toEqual(stored);
    });

    it.each([
      {
        case: "unknown email",
        credential: { email: "unknown@email.com", password: "user-password-123" },
      },
      {
        case: "invalid password",
        credential: { email: "user@email.com", password: "invalid-password-123" },
      },
    ])("returns 401 for $case", async ({ credential }) => {
      const registration = {
        email: "user@email.com",
        password: "user-password-123",
      };
      await request(app.getHttpServer()).post("/auth/register").send(registration);

      await request(app.getHttpServer())
        .post("/auth/login")
        .send(credential)
        .expect(401)
        .expect(({ headers }) => {
          expect(headers["set-cookie"]).toBeUndefined();
        });
    });
  });

  describe("POST /auth/refresh", () => {
    it("rotates RT", async () => {
      const registration = {
        email: "user@email.com",
        password: "user-password-123",
      };
      const {
        body: { id: userId },
      } = await request(app.getHttpServer()).post("/auth/register").send(registration);
      const loginResponse = await request(app.getHttpServer())
        .post("/auth/login")
        .send(registration);
      const cookies = parseSetCookie(loginResponse, {
        map: true,
      });

      const refreshResponse = await request(app.getHttpServer())
        .post("/auth/refresh")
        .set("Cookie", `refreshToken=${cookies.refreshToken.value}`)
        .expect(204);
      const newCookies = parseSetCookie(refreshResponse, {
        map: true,
      });
      const newTokenHash = createHash("sha256").update(newCookies.refreshToken.value).digest("hex");
      const { tokenHash: stored } = await prisma.refreshSession.findFirstOrThrow({
        where: { userId },
      });

      expect(newCookies.accessToken).toBeDefined();
      expect(newCookies.refreshToken).toBeDefined();
      expect(cookies.refreshToken.value).not.toEqual(newCookies.refreshToken.value);
      expect(newTokenHash).toBe(stored);
    });
  });

  afterEach(async () => {
    await prisma.user.deleteMany();
    await app.close();
  });
});
