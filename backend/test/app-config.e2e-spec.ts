import { Test } from "@nestjs/testing";

describe("Application configuration", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const envs = [{ name: "DATABASE_URL" }, { name: "JWT_SECRET" }];

  it.each(envs)(
    "fails run application when $name is not provided",
    async ({ name }) => {
      await expect(async () => {
        const { AppModule } = await import("../src/app.module.js");
        await Test.createTestingModule({
          imports: [AppModule.withConfig({ ignoreEnvFile: true })],
        }).compile();
      }).rejects.toThrow(new RegExp(`${name}`));
    },
  );

  it.each(envs)(
    "fails run application when $name is empty string",
    async ({ name }) => {
      vi.stubEnv(name, "");

      await expect(async () => {
        const { AppModule } = await import("../src/app.module.js");
        await Test.createTestingModule({
          imports: [AppModule.withConfig()],
        }).compile();
      }).rejects.toThrow(new RegExp(`${name}`));
    },
  );
});
