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

  afterEach(async () => {
    await prisma.user.deleteMany();
    await app.close();
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
        credential: {
          email: "unknown@email.com",
          password: "user-password-123",
        },
      },
      {
        case: "invalid password",
        credential: {
          email: "user@email.com",
          password: "invalid-password-123",
        },
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
    it("rotates AT & RT", async () => {
      // register & login
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
      const { refreshToken: refreshTokenCookie } = parseSetCookie(loginResponse, {
        map: true,
      });

      // refresh
      const refreshResponse = await request(app.getHttpServer())
        .post("/auth/refresh")
        .set("Cookie", `refreshToken=${refreshTokenCookie.value}`)
        .expect(204);
      const { accessToken: newAccesTokenCookie, refreshToken: newRefreshTokenCookie } =
        parseSetCookie(refreshResponse, {
          map: true,
        });

      // cookies
      expect(newAccesTokenCookie).toBeDefined();
      expect(newRefreshTokenCookie).toBeDefined();
      const newTokenHash = createHash("sha256").update(newRefreshTokenCookie.value).digest("hex");
      const { tokenHash: stored } = await prisma.refreshSession.findFirstOrThrow({
        where: { userId },
      });
      expect(refreshTokenCookie.value).not.toEqual(newRefreshTokenCookie.value);
      expect(newTokenHash).toBe(stored);
    });

    it("returns 401 for unknown RT", async () => {
      const registration = {
        email: "user@email.com",
        password: "user-password-123",
      };
      await request(app.getHttpServer()).post("/auth/register").send(registration);
      await request(app.getHttpServer()).post("/auth/login").send(registration);

      await request(app.getHttpServer())
        .post("/auth/refresh")
        .set("Cookie", "refreshToken=unknown-refresh-token")
        .expect(401)
        .expect(({ headers }) => {
          expect(headers["set-cookie"]).toBeUndefined();
        });
    });

    it("returns 401 when RT isn't provided", async () => {
      const registration = {
        email: "user@email.com",
        password: "user-password-123",
      };
      await request(app.getHttpServer()).post("/auth/register").send(registration);
      await request(app.getHttpServer()).post("/auth/login").send(registration);

      await request(app.getHttpServer())
        .post("/auth/refresh")
        .expect(401)
        .expect(({ headers }) => {
          expect(headers["set-cookie"]).toBeUndefined();
        });
    });

    describe("RT expiration", () => {
      beforeEach(() => {
        vi.useFakeTimers({ toFake: ["Date"] });
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it("extends RT expiration by 7 days on refresh", async () => {
        const firstIssuedAt = Date.now();
        vi.setSystemTime(firstIssuedAt);

        // register
        const registration = {
          email: "user@email.com",
          password: "user-password-123",
        };
        await request(app.getHttpServer()).post("/auth/register").send(registration);

        // first issue
        const loginResponse = await request(app.getHttpServer())
          .post("/auth/login")
          .send(registration);
        const { refreshToken: refreshTokenCookie } = parseSetCookie(loginResponse, {
          map: true,
        });

        // second issue
        const secondIssuedAt = new Date(firstIssuedAt + 6 * 24 * 60 * 60 * 1000).getTime();
        vi.setSystemTime(secondIssuedAt);
        const refreshResponse = await request(app.getHttpServer())
          .post("/auth/refresh")
          .set("Cookie", `refreshToken=${refreshTokenCookie.value}`)
          .expect(204);
        const { refreshToken: secondRefreshTokenCookie } = parseSetCookie(refreshResponse, {
          map: true,
        });

        // third issue
        const thirdIssuedAt = new Date(secondIssuedAt + 2 * 24 * 60 * 60 * 1000).getTime();
        vi.setSystemTime(thirdIssuedAt);
        await request(app.getHttpServer())
          .post("/auth/refresh")
          .set("Cookie", `refreshToken=${secondRefreshTokenCookie.value}`)
          .expect(204);
      });

      it("returns 401 when RT has expired", async () => {
        const issuedAt = Date.now();
        vi.setSystemTime(issuedAt);

        const registration = {
          email: "user@email.com",
          password: "user-password-123",
        };
        await request(app.getHttpServer()).post("/auth/register").send(registration);
        const loginResponse = await request(app.getHttpServer())
          .post("/auth/login")
          .send(registration);
        const {
          refreshToken: { value: refreshToken },
        } = parseSetCookie(loginResponse, { map: true });
        vi.setSystemTime(new Date(issuedAt + 7 * 24 * 60 * 60 * 1000 + 1));

        await request(app.getHttpServer())
          .post("/auth/refresh")
          .set("Cookie", `refreshToken=${refreshToken}`)
          .expect(401)
          .expect(({ headers }) => {
            expect(headers["set-cookie"]).toBeUndefined();
          });
      });

      it("returns 401 after 30 days", async () => {
        const firstIssuedAt = Date.now();
        vi.setSystemTime(firstIssuedAt);

        // register
        const registration = {
          email: "user@email.com",
          password: "user-password-123",
        };
        await request(app.getHttpServer()).post("/auth/register").send(registration);

        // login
        const loginResponse = await request(app.getHttpServer())
          .post("/auth/login")
          .send(registration);
        const { refreshToken: refreshTokenCookie } = parseSetCookie(loginResponse, {
          map: true,
        });

        // refresh until 30 days passed
        let currentTime = new Date(firstIssuedAt + 6 * 24 * 60 * 60 * 1000).getTime();
        vi.setSystemTime(currentTime);
        let cookieLife = currentTime - firstIssuedAt;
        let refreshTokenValue = refreshTokenCookie.value;
        while (cookieLife < 30 * 24 * 60 * 60 * 1000) {
          const refreshResponse = await request(app.getHttpServer())
            .post("/auth/refresh")
            .set("Cookie", `refreshToken=${refreshTokenValue}`)
            .expect(204);
          const { refreshToken: refreshTokenCookie } = parseSetCookie(refreshResponse, {
            map: true,
          });
          currentTime = new Date(currentTime + 6 * 24 * 60 * 60 * 1000).getTime();
          vi.setSystemTime(currentTime);
          cookieLife = currentTime - firstIssuedAt;
          refreshTokenValue = refreshTokenCookie.value;
        }

        // expected to fail to refresh after 30 days
        await request(app.getHttpServer())
          .post("/auth/refresh")
          .set("Cookie", `refreshToken=${refreshTokenValue}`)
          .expect(401)
          .expect(({ headers }) => {
            expect(headers["set-cookie"]).toBeUndefined();
          });
      });
    });
  });

  describe.only("POST /auth/logout", () => {
    it("returns 204, clears cookies and removes the refresh session", async () => {
      // arrange
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
      const { refreshToken: refreshTokenCookie } = parseSetCookie(loginResponse, {
        map: true,
      });

      // act
      const logoutResponse = await request(app.getHttpServer())
        .post("/auth/logout")
        .set("Cookie", `refreshToken=${refreshTokenCookie.value}`)
        .expect(204);
      const cookiesAfterLogout = parseSetCookie(logoutResponse, {
        map: true,
      });

      // assert
      expect(cookiesAfterLogout.accessToken).toBeDefined();
      expect(cookiesAfterLogout.accessToken).toMatchObject({
        value: "",
        path: "/",
      });
      expect(cookiesAfterLogout.accessToken.expires!.getTime()).toBeLessThan(Date.now());
      expect(cookiesAfterLogout.refreshToken).toBeDefined();
      expect(cookiesAfterLogout.refreshToken).toMatchObject({
        value: "",
        path: "/auth",
      });
      expect(cookiesAfterLogout.refreshToken.expires!.getTime()).toBeLessThan(Date.now());
      const result = await prisma.refreshSession.findFirst({ where: { userId } });
      expect(result).toBeNull();
    });
  });
});
