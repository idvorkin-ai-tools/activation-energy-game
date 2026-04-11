import "../../style.css";
import { DropTheRopeGame } from "./game.ts";

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
aboutModal.querySelector(".modal-backdrop")!.addEventListener("click", () => {
  aboutModal.classList.add("modal-hidden");
});

const game = new DropTheRopeGame(container);
void game.start();

// Restart link in the header re-plays the whole lesson
document.getElementById("restart-link")?.addEventListener("click", (e) => {
  e.preventDefault();
  game.restart();
});

// Escape also restarts
window.addEventListener("keydown", (e) => {
  if (e.code === "Escape") {
    game.restart();
  }
});
