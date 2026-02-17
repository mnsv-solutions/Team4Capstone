import { describe, expect, it } from "vitest";
import { validateSignIn } from "../signinValidation";

describe("signinValidation", () => {
  it("requires loginId and password", () => {
    const errors = validateSignIn("", "");
    expect(errors.loginId).toBeTruthy();
    expect(errors.password).toBeTruthy();
  });

  it("accepts valid email", () => {
    const errors = validateSignIn("test@example.com", "123456");
    expect(errors.loginId).toBeUndefined();
  });

  it("rejects invalid loginId", () => {
    const errors = validateSignIn("abc", "123456");
    expect(errors.loginId).toBeTruthy();
  });
});
