const MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
};

export function htmlEscape(value: string): string {
  return value.replace(/[&<>"']/g, (m) => MAP[m]);
}
