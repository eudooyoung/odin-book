import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { App } from "supertest/types.js";
import { AppModule } from "../src/app.module.js";

describe("CSRF", () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule.withConfig()],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableCsrfProtection();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it("protects requests from a malicious site", () => {
    return request(app.getHttpServer())
      .post("/auth/logout")
      .set("Origin", "https://evil.example")
      .expect(403);
  });

  it("accepts request from same-origin", () => {
    return request(app.getHttpServer())
      .post("/auth/logout")
      .set("Sec-Fetch-Site", "same-origin")
      .expect(204);
  });
});
