import { Button } from "./Button";

/**
 * Creates a "Skip ->" button that fades in after a delay, positioned at bottom-left.
 * Returns a cleanup function.
 */
export function createSkipButton(
  container: HTMLElement,
  _width: number,
  height: number,
  resolve: () => void,
): () => void {
  let timerHandle: ReturnType<typeof setTimeout> | null = null;
  let button: Button | null = null;
  let cleaned = false;

  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    if (timerHandle !== null) {
      clearTimeout(timerHandle);
      timerHandle = null;
    }
    if (button) {
      button.el.remove();
      button = null;
    }
  };

  timerHandle = setTimeout(() => {
    if (cleaned) return;

    button = new Button({
      text: "Skip \u2192",
      x: 40,
      y: height - 80,
      width: 120,
      height: 40,
      onClick: () => {
        if (button) button.setEnabled(false);
        cleanup();
        resolve();
      },
    });

    button.el.style.opacity = "0";
    button.el.style.transition = "opacity 500ms ease";
    container.appendChild(button.el);

    // Trigger fade-in to 0.6
    requestAnimationFrame(() => {
      if (button) button.el.style.opacity = "0.6";
    });
  }, 8000);

  return cleanup;
}
