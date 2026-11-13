import { type CookieOptions } from "express";

export const getAuthCookieOptions = (nodeEnv: string | undefined) => {
  return {
    accessToken: {
      httpOnly: true,
      secure: nodeEnv === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60 * 1000,
    } satisfies CookieOptions,
    refreshToken: {
      httpOnly: true,
      secure: nodeEnv === "production",
      sameSite: "lax",
      path: "/auth",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    } satisfies CookieOptions,
  };
};
