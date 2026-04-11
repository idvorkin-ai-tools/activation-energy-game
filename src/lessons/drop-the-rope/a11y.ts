let liveRegion: HTMLDivElement | null = null;

export function initA11y(): void {
  if (liveRegion) return;
  liveRegion = document.createElement("div");
  liveRegion.setAttribute("aria-live", "polite");
  liveRegion.setAttribute("role", "status");
  liveRegion.style.position = "absolute";
  liveRegion.style.left = "-10000px";
  liveRegion.style.width = "1px";
  liveRegion.style.height = "1px";
  liveRegion.style.overflow = "hidden";
  document.body.appendChild(liveRegion);
}

export function announce(message: string): void {
  if (!liveRegion) initA11y();
  // Clear then set to force screen readers to re-announce
  liveRegion!.textContent = "";
  requestAnimationFrame(() => {
    liveRegion!.textContent = message;
  });
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
