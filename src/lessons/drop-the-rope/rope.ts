export interface Point {
  x: number;
  y: number;
}

export type RopeState = "taut" | "sagging" | "flat";

/** Compute the midpoint of a bowed rope. tension in [-1, 1]: negative = raccoon winning, positive = monster winning. */
export function ropeMidpoint(from: Point, to: Point, tension: number): Point {
  const cx = (from.x + to.x) / 2;
  const cy = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  // Shift the midpoint toward the winning side (up to 15% of the span)
  const shift = tension * dx * 0.15;
  return { x: cx + shift, y: cy };
}

/**
 * Draw the rope as a quadratic bezier with per-frame jitter during struggle,
 * or as a sagging/flat line after drop.
 */
export function drawRope(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  tension: number,
  state: RopeState,
  flashFrame: boolean = false,
): void {
  ctx.strokeStyle = flashFrame ? "#ffffff" : "#6b5d4f";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";

  if (state === "taut") {
    const mid = ropeMidpoint(from, to, tension);
    // Subtle vertical jitter for strain feel
    const jitter = (Math.random() - 0.5) * 4;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.quadraticCurveTo(mid.x, mid.y + jitter, to.x, to.y);
    ctx.stroke();
  } else if (state === "sagging") {
    // Drooping catenary-ish: midpoint drops halfway to the ground
    const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 + 60 };
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.quadraticCurveTo(mid.x, mid.y, to.x, to.y);
    ctx.stroke();
  } else {
    // Flat on ground — straight line at the lower of the two y values + offset
    const groundY = Math.max(from.y, to.y) + 80;
    ctx.beginPath();
    ctx.moveTo(from.x, groundY);
    ctx.lineTo(to.x, groundY);
    ctx.stroke();
  }
}
