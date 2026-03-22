/** Draw a single kettlebell with chunky handle and optional weight label */
export function drawKettlebell(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, size: number, color: string, label?: string
): void {
  const r = size / 2;

  // Handle — chunky
  ctx.strokeStyle = "#555";
  ctx.lineWidth = r * 0.4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(x, y - r * 0.7, r * 0.55, Math.PI * 0.18, Math.PI * 0.82);
  ctx.stroke();
  ctx.lineCap = "butt";

  // Body (ball)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Highlight
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.beginPath();
  ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Weight label
  if (label) {
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = `bold ${Math.max(7, r * 0.6)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(label, x, y + r * 0.25);
    ctx.textAlign = "start";
  }

  // Bottom shadow
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.9, r * 0.7, r * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
}
