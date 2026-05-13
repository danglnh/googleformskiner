const HIDDEN_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "page_url",
  "referrer"
] as const;

export type HiddenKey = (typeof HIDDEN_KEYS)[number];

export function normalizeLabel(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_");
}

export function detectHiddenKey(label: string): HiddenKey | null {
  const normalized = normalizeLabel(label);
  return (HIDDEN_KEYS as readonly string[]).includes(normalized)
    ? (normalized as HiddenKey)
    : null;
}

export function extractGoogleFormId(input: string): string | null {
  try {
    const url = new URL(input);
    if (url.hostname !== "docs.google.com") return null;
    if (!url.pathname.startsWith("/forms/")) return null;

    const match = url.pathname.match(/\/forms\/d\/(e\/)?([^/]+)/);
    return match?.[2] ?? null;
  } catch {
    return null;
  }
}

export function isValidGoogleFormUrl(input: string): boolean {
  try {
    const url = new URL(input);
    return (
      url.protocol === "https:" &&
      url.hostname === "docs.google.com" &&
      /\/forms\/d\/(e\/)?[^/]+\//.test(url.pathname)
    );
  } catch {
    return false;
  }
}
