import { describe, expect, it } from "vitest";

import { studentSchema } from "./schema";

describe("student input", () => {
  it("normalizes a guardian email and accepts blank optional fields", () => {
    const result = studentSchema.parse({
      name: "Maya Singh",
      className: "Grade 6A",
      rollNumber: "",
      guardianEmail: "PARENT@EXAMPLE.COM ",
    });

    expect(result.guardianEmail).toBe("parent@example.com");
    expect(result.rollNumber).toBe("");
  });
});
