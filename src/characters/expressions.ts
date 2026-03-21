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
}

export const EXPRESSIONS: Record<ExpressionName, ExpressionParams> = {
  happy: {
    mouthCurve: 0.8,
    eyeScale: 1.2,
  },
  neutral: {
    mouthCurve: 0,
    eyeScale: 1.0,
  },
  tired: {
    mouthCurve: -0.3,
    eyeScale: 0.6,
  },
  stressed: {
    mouthCurve: -0.5,
    eyeScale: 1.3,
  },
  desperate: {
    mouthCurve: -0.8,
    eyeScale: 1.5,
  },
  energized: {
    mouthCurve: 1.0,
    eyeScale: 1.3,
  },
};
