export interface DragConfig {
  canvas: HTMLCanvasElement;
  startX: number;
  startY: number;
  thresholdX: number;
  springK: number;
  onProgress: (x: number, y: number) => void;
  onComplete: () => void;
  onSnapBack: () => void;
}

export function startDragInteraction(config: DragConfig): () => void {
  const { canvas, startX, startY, thresholdX, springK, onProgress, onComplete, onSnapBack } = config;

  let isDragging = false;
  let currentX = startX;
  let currentY = startY;
  let offsetX = 0;
  let offsetY = 0;
  let animId = 0;

  function getPos(e: MouseEvent | TouchEvent): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onPointerDown(e: MouseEvent | TouchEvent) {
    const pos = getPos(e);
    const raccoonSize = Math.min(canvas.getBoundingClientRect().width * 0.15, 100);
    const dist = Math.hypot(pos.x - currentX, pos.y - currentY);
    if (dist > raccoonSize) return;

    isDragging = true;
    offsetX = currentX - pos.x;
    offsetY = currentY - pos.y;
    e.preventDefault();
  }

  function onPointerMove(e: MouseEvent | TouchEvent) {
    if (!isDragging) return;
    const pos = getPos(e);
    currentX = pos.x + offsetX;
    currentY = pos.y + offsetY;
    onProgress(currentX, currentY);
    e.preventDefault();
  }

  function onPointerUp() {
    if (!isDragging) return;
    isDragging = false;

    if (currentX >= thresholdX) {
      onComplete();
    } else {
      springBack();
    }
  }

  function springBack() {
    const targetX = startX;
    const targetY = startY;
    let vx = 0;
    const damping = 0.85;

    function animate() {
      const dx = currentX - targetX;
      const force = -springK * dx;
      vx += force;
      vx *= damping;
      currentX += vx;
      currentY += (targetY - currentY) * 0.1;

      onProgress(currentX, currentY);

      if (Math.abs(dx) < 1 && Math.abs(vx) < 0.5) {
        currentX = targetX;
        currentY = targetY;
        onProgress(currentX, currentY);
        onSnapBack();
        return;
      }
      animId = requestAnimationFrame(animate);
    }
    animate();
  }

  const hint = document.createElement("div");
  hint.className = "mc-drag-hint";
  hint.textContent = "Drag the raccoon to get up";
  hint.style.cssText = `
    text-align: center;
    color: #aaa;
    font-size: 14px;
    margin-top: 8px;
    animation: mc-pulse 1.5s ease-in-out infinite;
  `;
  canvas.parentElement?.insertBefore(hint, canvas.nextSibling);

  const pulseStyle = document.createElement("style");
  pulseStyle.textContent = `
    @keyframes mc-pulse {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }
  `;
  canvas.parentElement?.appendChild(pulseStyle);

  canvas.addEventListener("mousedown", onPointerDown);
  canvas.addEventListener("mousemove", onPointerMove);
  window.addEventListener("mouseup", onPointerUp);
  canvas.addEventListener("touchstart", onPointerDown, { passive: false });
  canvas.addEventListener("touchmove", onPointerMove, { passive: false });
  window.addEventListener("touchend", onPointerUp);

  canvas.style.cursor = "grab";

  return () => {
    cancelAnimationFrame(animId);
    canvas.removeEventListener("mousedown", onPointerDown);
    canvas.removeEventListener("mousemove", onPointerMove);
    window.removeEventListener("mouseup", onPointerUp);
    canvas.removeEventListener("touchstart", onPointerDown);
    canvas.removeEventListener("touchmove", onPointerMove);
    window.removeEventListener("touchend", onPointerUp);
    canvas.style.cursor = "";
    hint.remove();
    pulseStyle.remove();
  };
}
