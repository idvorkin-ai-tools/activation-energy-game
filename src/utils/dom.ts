/** Convert a numeric hex color (0x3b82f6) to CSS string (#3b82f6) */
export function hexToCSS(hex: number): string {
  return "#" + hex.toString(16).padStart(6, "0");
}
