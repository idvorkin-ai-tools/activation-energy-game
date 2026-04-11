/**
 * Two palettes that the Catcher toggles between.
 * Arcade = falling phase. Reflection = paused phase.
 */

export const ARCADE_PALETTE = {
  background: "#1b1635",
  tileFill: "#2e2854",
  tileBorder: "#5d4fa8",
  tileText: "#e8e4ff",
  awayBinBorder: "#4a3050",
  awayBinText: "#d8a0c0",
  towardsBinBorder: "#3a5a4e",
  towardsBinText: "#7be0b0",
  accent: "#ffb86b",
  decisionLine: "#5d4fa8",
  hudText: "#8780b8",
  hudAccent: "#ffb86b",
} as const;

export const REFLECTION_PALETTE = {
  background: "#2a3240",
  tileFill: "#3a4558",
  tileBorder: "#5e6c80",
  tileText: "#f0efe8",
  buttonBorder: "#8a9aa8",
  buttonBorderPrimary: "#a8b5c2",
  buttonText: "#f0efe8",
  questionText: "#f0efe8",
  ghostOpacity: 0.25,
} as const;
