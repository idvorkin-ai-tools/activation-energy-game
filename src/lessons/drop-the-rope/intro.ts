/**
 * 3 glow-style intro slides that frame the lesson:
 *   "Every hard feeling wants you to fight it."
 *   "Fighting it is the trap."
 *   "Here. Try."
 *
 * Each slide waits for Space / Enter / Click / ArrowRight before advancing.
 */
export async function runIntro(container: HTMLElement): Promise<void> {
  const slides = [
    "Every hard feeling wants you to fight it.",
    "Fighting it is the trap.",
    "Here. Try.",
  ];

  const intro = document.createElement("div");
  intro.className = "dtr-intro";
  container.appendChild(intro);

  try {
    for (const text of slides) {
      intro.textContent = text;
      // Force a reflow so the opacity transition plays on class toggle
      void intro.offsetHeight;
      intro.classList.add("dtr-intro-visible");
      await waitForAdvance(intro);
      intro.classList.remove("dtr-intro-visible");
      await delay(400);
    }
  } finally {
    if (intro.parentElement === container) {
      container.removeChild(intro);
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function waitForAdvance(el: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    const cleanup = (): void => {
      window.removeEventListener("keydown", onKey);
      el.removeEventListener("click", onClick);
    };
    const onKey = (e: KeyboardEvent): void => {
      if (
        e.code === "Space" ||
        e.code === "Enter" ||
        e.code === "ArrowRight" ||
        e.code === "ArrowDown"
      ) {
        e.preventDefault();
        cleanup();
        resolve();
      }
    };
    const onClick = (): void => {
      cleanup();
      resolve();
    };
    window.addEventListener("keydown", onKey);
    el.addEventListener("click", onClick);
  });
}
