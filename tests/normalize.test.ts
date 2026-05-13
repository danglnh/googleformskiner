import { describe, expect, it } from "vitest";
import { detectHiddenKey, extractGoogleFormId, isValidGoogleFormUrl, normalizeLabel } from "@/lib/normalize";

describe("normalize", () => {
  it("normalizes labels", () => {
    expect(normalizeLabel("UTM Source")).toBe("utm_source");
    expect(normalizeLabel("utm-source")).toBe("utm_source");
  });

  it("detects hidden keys", () => {
    expect(detectHiddenKey("UTM Source")).toBe("utm_source");
    expect(detectHiddenKey("referrer")).toBe("referrer");
    expect(detectHiddenKey("email")).toBeNull();
  });

  it("validates google form urls", () => {
    expect(isValidGoogleFormUrl("https://docs.google.com/forms/d/e/abc/viewform")).toBe(true);
    expect(isValidGoogleFormUrl("https://example.com/forms/d/e/abc/viewform")).toBe(false);
  });

  it("extracts form id", () => {
    expect(extractGoogleFormId("https://docs.google.com/forms/d/e/123/viewform")).toBe("123");
  });
});
