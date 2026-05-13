import * as cheerio from "cheerio";
import { z } from "zod";
import type { GoogleFormField, GoogleFormSchema } from "@/types/googleForm";
import { extractGoogleFormId, isValidGoogleFormUrl } from "@/lib/normalize";

const importSchema = z.object({
  url: z.string().url()
});

function guessType(raw: string): GoogleFormField["type"] {
  const v = raw.toLowerCase();
  if (v.includes("short") || v.includes("text")) return "short_text";
  if (v.includes("paragraph")) return "paragraph";
  if (v.includes("multiple choice") || v.includes("radio")) return "multiple_choice";
  if (v.includes("checkbox")) return "checkboxes";
  if (v.includes("drop") || v.includes("select")) return "dropdown";
  if (v.includes("date")) return "date";
  if (v.includes("time")) return "time";
  if (v.includes("scale")) return "linear_scale";
  if (v.includes("file upload") || v.includes("grid") || v.includes("quiz")) return "unsupported";
  return "unknown";
}

function sanitizeSourceUrl(url: string): string {
  const u = new URL(url);
  u.hash = "";
  return u.toString();
}

function submitUrlFromInput(url: string): string {
  const formId = extractGoogleFormId(url);
  if (!formId) throw new Error("Cannot detect form id");

  if (url.includes("/d/e/")) {
    return `https://docs.google.com/forms/d/e/${formId}/formResponse`;
  }
  return `https://docs.google.com/forms/d/${formId}/formResponse`;
}

function safeParseArrayLiteral(html: string): unknown | null {
  const marker = "FB_PUBLIC_LOAD_DATA_";
  const startMarker = html.indexOf(marker);
  if (startMarker === -1) return null;
  const equalIdx = html.indexOf("=", startMarker);
  if (equalIdx === -1) return null;
  const arrayStart = html.indexOf("[", equalIdx);
  if (arrayStart === -1) return null;

  let i = arrayStart;
  let depth = 0;
  let inString = false;
  let escaped = false;
  let arrayEnd = -1;

  for (; i < html.length; i += 1) {
    const ch = html[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === "\"") {
        inString = false;
      }
      continue;
    }
    if (ch === "\"") {
      inString = true;
      continue;
    }
    if (ch === "[") depth += 1;
    if (ch === "]") {
      depth -= 1;
      if (depth === 0) {
        arrayEnd = i;
        break;
      }
    }
  }
  if (arrayEnd === -1) return null;

  const literal = html.slice(arrayStart, arrayEnd + 1);
  try {
    const normalized = literal
      .replace(/\n/g, "")
      .replace(/,\s*]/g, "]")
      .replace(/,\s*}/g, "}");
    return JSON.parse(normalized);
  } catch {
    return null;
  }
}

function mapGoogleType(typeCode: number): GoogleFormField["type"] {
  switch (typeCode) {
    case 0:
      return "short_text";
    case 1:
      return "paragraph";
    case 2:
      return "multiple_choice";
    case 3:
      return "dropdown";
    case 4:
      return "checkboxes";
    case 5:
      return "linear_scale";
    case 9:
      return "date";
    case 10:
      return "time";
    default:
      return "unknown";
  }
}

function parseFieldsByLoadData(data: unknown): GoogleFormField[] {
  if (!Array.isArray(data)) return [];
  const level1 = data[1];
  if (!Array.isArray(level1)) return [];
  const level2 = level1[1];
  if (!Array.isArray(level2)) return [];

  const fields: GoogleFormField[] = [];
  for (const q of level2) {
    if (!Array.isArray(q)) continue;
    const label = typeof q[1] === "string" ? q[1] : "";
    const typeCode = typeof q[3] === "number" ? q[3] : -1;
    const answerBlock = Array.isArray(q[4]) && Array.isArray(q[4][0]) ? q[4][0] : null;
    const entryIdRaw = answerBlock?.[0];
    const entryId = typeof entryIdRaw === "number" ? String(entryIdRaw) : "";
    if (!entryId || !label) continue;

    const requiredRaw = answerBlock?.[2];
    const required = requiredRaw === 1 || requiredRaw === true;

    let options: string[] | undefined;
    const rawOptions = answerBlock?.[1];
    if (Array.isArray(rawOptions)) {
      options = rawOptions
        .map((opt) => (Array.isArray(opt) && typeof opt[0] === "string" ? opt[0] : null))
        .filter((x): x is string => Boolean(x));
    }

    fields.push({
      id: `field_${entryId}`,
      entryId,
      label,
      type: mapGoogleType(typeCode),
      required,
      options
    });
  }
  return fields;
}

function parseFieldsByHtml(html: string): GoogleFormField[] {
  const $ = cheerio.load(html);
  const fields: GoogleFormField[] = [];

  $("input[name^='entry.'], textarea[name^='entry.'], select[name^='entry.']").each((idx, el) => {
    const name = $(el).attr("name") ?? "";
    const entryId = name.replace("entry.", "");
    const label = $(el).closest("div").find("[role='heading'], label").first().text().trim() || `Field ${idx + 1}`;
    const required = $(el).attr("aria-required") === "true" || $(el).attr("required") !== undefined;
    const tag = el.tagName.toLowerCase();
    const typeAttr = ($(el).attr("type") ?? "text").toLowerCase();

    let type: GoogleFormField["type"] = "short_text";
    if (tag === "textarea") type = "paragraph";
    else if (tag === "select") type = "dropdown";
    else if (typeAttr === "date") type = "date";
    else if (typeAttr === "time") type = "time";
    else if (typeAttr === "radio") type = "multiple_choice";
    else if (typeAttr === "checkbox") type = "checkboxes";

    const options = tag === "select"
      ? $(el).find("option").map((_, o) => $(o).text().trim()).get().filter(Boolean)
      : undefined;

    if (!entryId) return;

    const exists = fields.find((f) => f.entryId === entryId);
    if (exists) return;

    fields.push({
      id: `field_${entryId}`,
      entryId,
      label,
      type,
      required,
      options
    });
  });

  return fields;
}

export async function parseGoogleForm(input: unknown): Promise<GoogleFormSchema> {
  const { url } = importSchema.parse(input);

  if (!isValidGoogleFormUrl(url)) {
    throw new Error("Not a valid Google Form URL");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  let html = "";
  try {
    const res = await fetch(sanitizeSourceUrl(url), {
      signal: controller.signal,
      headers: { "user-agent": "Mozilla/5.0 GoogleFormSkiner/1.0" }
    });
    if (!res.ok) throw new Error("Cannot fetch form");

    const text = await res.text();
    html = text.slice(0, 2_000_000);
  } finally {
    clearTimeout(timeout);
  }

  const $ = cheerio.load(html);
  const warnings: string[] = [];

  const parsedArray = safeParseArrayLiteral(html);
  if (!parsedArray) {
    warnings.push("Cannot parse FB_PUBLIC_LOAD_DATA_. Used HTML fallback parser.");
  }

  const title = $("meta[property='og:title']").attr("content") || $("title").text().replace(" - Google Forms", "").trim() || "Untitled form";
  const description = $("meta[property='og:description']").attr("content") || undefined;

  const parsedByLoadData = parsedArray ? parseFieldsByLoadData(parsedArray) : [];
  const fields = parsedByLoadData.length ? parsedByLoadData : parseFieldsByHtml(html);

  if (!fields.length) {
    throw new Error("No supported fields found");
  }

  const unsupportedKeywords = ["File upload", "grid", "branching", "Limit to 1 response"];
  if (unsupportedKeywords.some((k) => html.toLowerCase().includes(k.toLowerCase()))) {
    warnings.push("Form may contain unsupported features: file upload, grid, branching, or response limits.");
  }

  return {
    title,
    description,
    sourceUrl: sanitizeSourceUrl(url),
    submitUrl: submitUrlFromInput(url),
    fields: fields.map((f) => ({ ...f, type: f.type ?? guessType(f.label) })),
    warnings
  };
}
