import { getAuthCookieOptions } from "./auth-cookie-options.js";

describe("Auth Cookie Options", () => {
  const nodeEnvs = [
    { env: "development", secure: false },
    { env: "production", secure: true },
  ];

  it.each(nodeEnvs)(
    "returns cookie secure option as $secure in $env environment",
    ({ env, secure }) => {
      const { accessToken, refreshToken } = getAuthCookieOptions(env);
      expect(accessToken).toHaveProperty("secure", secure);
      expect(refreshToken).toHaveProperty("secure", secure);
    },
  );
});
