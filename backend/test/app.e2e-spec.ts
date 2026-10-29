import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { App } from "supertest/types.js";
import { PrismaService } from "../src/prisma/prisma.service.js";
import { AppModule } from "./../src/app.module.js";

describe("Application setup (e2e)", () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it("/ (GET)", () => {
    return request(app.getHttpServer()).get("/").expect(200).expect("Hello World!");
  });

  it("executes a query through PrismaService", async () => {
    const prismaService: PrismaService = app.get(PrismaService);
    const [{ result }] = await prismaService.$queryRaw<{ result: number }[]>`SELECT 1 AS result`;

    expect(result).toBe(1);
  });

  afterEach(async () => {
    await app.close();
  });
});
