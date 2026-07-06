const COMBINING_DIACRITICAL_MARKS = new RegExp("[\\u0300-\\u036f]", "g");

export function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .normalize("NFKD")
    .replace(COMBINING_DIACRITICAL_MARKS, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || "article";
}
