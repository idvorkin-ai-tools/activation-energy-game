import { Container } from "pixi.js";
import { Button } from "./Button";

/**
 * Creates a "Skip →" button that fades in after a delay, positioned at bottom-left.
 * When clicked, it resolves the provided promise callback and disables itself.
 *
 * @param container - The PixiJS container to add the button to
 * @param width - The scene/container width (used for positioning reference only)
 * @param height - The scene/container height (used for y positioning)
 * @param resolve - The resolve function of the blocking promise
 * @returns A cleanup function that removes the timer and button if the interaction
 *          completes naturally before the skip button is used.
 */
export function createSkipButton(
  container: Container,
  _width: number,
  height: number,
  resolve: () => void,
): () => void {
  let timerHandle: ReturnType<typeof setTimeout> | null = null;
  let button: Button | null = null;
  let fadeFrame: number | null = null;
  let cleaned = false;

  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    if (timerHandle !== null) {
      clearTimeout(timerHandle);
      timerHandle = null;
    }
    if (fadeFrame !== null) {
      cancelAnimationFrame(fadeFrame);
      fadeFrame = null;
    }
    if (button && button.parent) {
      button.parent.removeChild(button);
      button = null;
    }
  };

  timerHandle = setTimeout(() => {
    if (cleaned) return;

    button = new Button({
      text: "Skip →",
      x: 40,
      y: height - 80,
      width: 120,
      height: 40,
      onClick: () => {
        if (button) {
          button.setEnabled(false);
        }
        cleanup();
        resolve();
      },
    });

    // Start fully transparent for fade-in
    button.alpha = 0;
    container.addChild(button);

    // Fade in over 500ms
    const fadeStart = performance.now();
    const fadeDuration = 500;
    const targetAlpha = 0.6;

    const doFade = () => {
      if (cleaned || !button) return;
      const elapsed = performance.now() - fadeStart;
      const progress = Math.min(elapsed / fadeDuration, 1);
      button.alpha = progress * targetAlpha;
      if (progress < 1) {
        fadeFrame = requestAnimationFrame(doFade);
      } else {
        fadeFrame = null;
      }
    };
    fadeFrame = requestAnimationFrame(doFade);
  }, 8000);

  return cleanup;
}
