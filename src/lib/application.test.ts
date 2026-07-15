import { describe, expect, it } from "vitest";

import { application } from "./application";

describe("application metadata", () => {
  it("identifies GradeCopilot", () => {
    expect(application.name).toBe("GradeCopilot");
  });
});
