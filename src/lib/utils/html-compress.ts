export function compressHtml(html: string): string {
  // Use Node.js built-in zlib - NO external packages
  const { gzipSync } = require("zlib");
  if (!html || html.length === 0) return "";
  try {
    const compressed = gzipSync(Buffer.from(html, "utf8"));
    return compressed.toString("base64");
  } catch {
    return html; // fallback: store raw if compression fails
  }
}

export function decompressHtml(compressed: string): string {
  const { gunzipSync } = require("zlib");
  if (!compressed || compressed.length === 0) return "";
  try {
    // Detect if it's base64 compressed or raw HTML
    // Raw HTML always starts with < 
    if (compressed.startsWith("<") || compressed.startsWith(" ")) {
      return compressed; // already raw HTML, return as-is
    }
    const buffer = Buffer.from(compressed, "base64");
    return gunzipSync(buffer).toString("utf8");
  } catch {
    return compressed; // fallback: return as-is if decompression fails
  }
}
