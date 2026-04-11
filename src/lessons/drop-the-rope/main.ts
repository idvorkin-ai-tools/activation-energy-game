const container = document.getElementById("game-container");
if (!container) throw new Error("#game-container not found");

// About modal wiring (standard pattern — matches morning-choice/glow)
const aboutLink = document.getElementById("about-link")!;
const aboutModal = document.getElementById("about-modal")!;
const modalClose = document.getElementById("modal-close")!;
aboutLink.addEventListener("click", (e) => {
  e.preventDefault();
  aboutModal.classList.remove("modal-hidden");
});
modalClose.addEventListener("click", () => {
  aboutModal.classList.add("modal-hidden");
});
aboutModal.addEventListener("click", (e) => {
  if (e.target === aboutModal) aboutModal.classList.add("modal-hidden");
});

// Placeholder: game will be wired in Task 22
container.innerHTML = `<div class="placeholder-text">
  Drop the Rope — scaffolding in progress. Come back after Task 22.
</div>`;

// Restart link (placeholder — will call game.restart() after Task 22)
document.getElementById("restart-link")?.addEventListener("click", (e) => {
  e.preventDefault();
  location.reload();
});
