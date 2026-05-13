import { describe, expect, it } from "vitest";
import { generateCombined } from "@/lib/generateEmbedCode";
import type { GoogleFormSchema } from "@/types/googleForm";

const schema: GoogleFormSchema = {
  title: "Test",
  sourceUrl: "https://docs.google.com/forms/d/e/123/viewform",
  submitUrl: "https://docs.google.com/forms/d/e/123/formResponse",
  warnings: [],
  fields: [
    {
      id: "1",
      entryId: "111",
      label: "Họ tên",
      type: "short_text",
      required: true
    },
    {
      id: "2",
      entryId: "222",
      label: "utm_source",
      type: "short_text",
      required: false
    }
  ]
};

describe("generateCombined", () => {
  it("renders hidden utm and submit url", () => {
    const out = generateCombined(schema);
    expect(out).toContain("formResponse");
    expect(out).toContain("data-gfs-hidden-key=\"utm_source\"");
  });
});
