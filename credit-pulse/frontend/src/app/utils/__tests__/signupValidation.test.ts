import { describe, expect, it } from "vitest";
import { sanitizePhone, validateSignUp } from "../signupValidation";

describe("signupValidation", () => {
  it("returns required errors for empty form", () => {
    const errors = validateSignUp({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
    });

    expect(errors.firstName).toBeTruthy();
    expect(errors.lastName).toBeTruthy();
    expect(errors.email).toBeTruthy();
    expect(errors.mobile).toBeTruthy();
    expect(errors.password).toBeTruthy();
  });

  it("returns no errors for valid input", () => {
    const errors = validateSignUp({
      firstName: "John",
      lastName: "Doe",
      email: "john@doe.com",
      phone: "1234567890",
      password: "Aa1!aaaa",
    });

    expect(Object.keys(errors).length).toBe(0);
  });

  it("sanitizeMobile removes non-digits", () => {
    expect(sanitizePhone("(123)-456-7890")).toBe("1234567890");
  });
});