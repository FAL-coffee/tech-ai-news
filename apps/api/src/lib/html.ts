const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  "#39": "'",
};

/** HTML属性値はエンティティエスケープされている(例: URLの & が &amp; になる)ため復号する。 */
export function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z0-9]+);/gi, (entity, code) => {
    if (code[0] === "#") {
      const codePoint = code[1]?.toLowerCase() === "x" ? Number.parseInt(code.slice(2), 16) : Number.parseInt(code.slice(1), 10);
      return Number.isNaN(codePoint) ? entity : String.fromCodePoint(codePoint);
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? entity;
  });
}
