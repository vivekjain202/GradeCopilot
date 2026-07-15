import { describe, expect, it } from "vitest";

import { signInSchema, signUpSchema } from "./credentials";

describe("teacher credentials", () => {
  it("normalizes a valid teacher email address", () => {
    const result = signUpSchema.parse({
      name: "Ada Lovelace",
      email: "ADA@EXAMPLE.COM ",
      password: "SecurePassword123",
    });

    expect(result.email).toBe("ada@example.com");
  });

  it("rejects weak sign-up passwords", () => {
    const result = signUpSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "password",
    });

    expect(result.success).toBe(false);
  });

  it("only requires a supplied password to validate a sign-in request", () => {
    expect(
      signInSchema.safeParse({
        email: "teacher@example.com",
        password: "password",
      }).success,
    ).toBe(true);
  });
});
