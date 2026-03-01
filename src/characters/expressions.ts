export type ExpressionName =
  | "happy"
  | "neutral"
  | "tired"
  | "stressed"
  | "desperate"
  | "energized";

export interface ExpressionParams {
  mouthCurve: number; // -1 (frown) to 1 (smile), 0 = straight
  eyeScale: number; // 0.5 (squinting) to 1.5 (wide open)
  browOffset: number; // -3 (worried, brows down) to 3 (raised)
  bodyTint: number; // hex color tint for body
  bounce: number; // 0 (still) to 1 (bouncy)
}

export const EXPRESSIONS: Record<ExpressionName, ExpressionParams> = {
  happy: {
    mouthCurve: 0.8,
    eyeScale: 1.2,
    browOffset: 1,
    bodyTint: 0x4ade80,
    bounce: 0.8,
  },
  neutral: {
    mouthCurve: 0,
    eyeScale: 1.0,
    browOffset: 0,
    bodyTint: 0xe0e0e0,
    bounce: 0.2,
  },
  tired: {
    mouthCurve: -0.3,
    eyeScale: 0.6,
    browOffset: -1,
    bodyTint: 0x94a3b8,
    bounce: 0,
  },
  stressed: {
    mouthCurve: -0.5,
    eyeScale: 1.3,
    browOffset: -2,
    bodyTint: 0xfbbf24,
    bounce: 0.1,
  },
  desperate: {
    mouthCurve: -0.8,
    eyeScale: 1.5,
    browOffset: -3,
    bodyTint: 0xef4444,
    bounce: 0,
  },
  energized: {
    mouthCurve: 1.0,
    eyeScale: 1.3,
    browOffset: 2,
    bodyTint: 0x22d3ee,
    bounce: 1.0,
  },
};
