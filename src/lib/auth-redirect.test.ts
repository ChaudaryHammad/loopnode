import { describe, expect, it } from "vitest";
import { getSafeRedirectPath } from "./auth-redirect";

describe("getSafeRedirectPath", () => {
  it("allows relative app paths", () => {
    expect(getSafeRedirectPath("/dashboard")).toBe("/dashboard");
    expect(getSafeRedirectPath("/dashboard/settings?tab=1")).toBe(
      "/dashboard/settings?tab=1"
    );
  });

  it("rejects open redirects", () => {
    expect(getSafeRedirectPath("https://evil.com")).toBe("/dashboard");
    expect(getSafeRedirectPath("//evil.com")).toBe("/dashboard");
    expect(getSafeRedirectPath("/\\evil.com")).toBe("/dashboard");
    expect(getSafeRedirectPath("javascript:alert(1)")).toBe("/dashboard");
  });

  it("falls back for empty values", () => {
    expect(getSafeRedirectPath(undefined)).toBe("/dashboard");
    expect(getSafeRedirectPath("")).toBe("/dashboard");
    expect(getSafeRedirectPath(null, "/login")).toBe("/login");
  });
});
