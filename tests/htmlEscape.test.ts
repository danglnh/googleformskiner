import { describe, expect, it } from "vitest";
import { htmlEscape } from "@/lib/htmlEscape";

describe("htmlEscape", () => {
  it("escapes html entities", () => {
    expect(htmlEscape('<script>"x" & y</script>')).toBe("&lt;script&gt;&quot;x&quot; &amp; y&lt;/script&gt;");
  });
});
