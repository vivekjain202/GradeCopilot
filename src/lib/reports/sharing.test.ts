import { describe, expect, it } from "vitest";

import { createShareToken, hashShareToken } from "./sharing";

describe("report sharing tokens", () => {
  it("creates high-entropy tokens and stores deterministic hashes", () => {
    const token = createShareToken();
    expect(token.length).toBeGreaterThanOrEqual(43);
    expect(hashShareToken(token)).toBe(hashShareToken(token));
    expect(hashShareToken(token)).not.toBe(token);
  });
});
