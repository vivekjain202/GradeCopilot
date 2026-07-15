import { describe, expect, it } from "vitest";

import { assertTeacherOwnership, AuthorizationError } from "./ownership";

describe("teacher ownership", () => {
  it("returns a resource owned by the teacher", () => {
    const resource = { id: "student-1", teacherId: "teacher-1" };

    expect(assertTeacherOwnership(resource, "teacher-1")).toBe(resource);
  });

  it("rejects a resource owned by another teacher", () => {
    expect(() =>
      assertTeacherOwnership({ id: "student-1", teacherId: "teacher-1" }, "teacher-2"),
    ).toThrow(AuthorizationError);
  });
});
