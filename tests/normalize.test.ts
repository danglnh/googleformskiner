import { describe, expect, it } from "vitest";
import { detectHiddenKey, extractGoogleFormId, isValidGoogleFormUrl, normalizeLabel } from "@/lib/normalize";

describe("normalize", () => {
  it("normalizes labels", () => {
    expect(normalizeLabel("UTM Source")).toBe("utm_source");
    expect(normalizeLabel("utm-source")).toBe("utm_source");
  });

  it("detects hidden keys", () => {
    expect(detectHiddenKey("UTM Source")).toBe("utm_source");
    expect(detectHiddenKey("utm-source")).toBe("utm_source");
    expect(detectHiddenKey("utm source")).toBe("utm_source");
    expect(detectHiddenKey("UTM Medium")).toBe("utm_medium");
    expect(detectHiddenKey("utm_campaign")).toBe("utm_campaign");
    expect(detectHiddenKey("UTM Content")).toBe("utm_content");
    expect(detectHiddenKey("utm-term")).toBe("utm_term");
    expect(detectHiddenKey("Page URL")).toBe("page_url");
    expect(detectHiddenKey("page_url")).toBe("page_url");
    expect(detectHiddenKey("page url")).toBe("page_url");
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
