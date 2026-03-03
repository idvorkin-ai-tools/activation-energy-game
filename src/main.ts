import { Game } from "./Game";
import "./style.css";

function init() {
  const gameEl = document.getElementById("game")!;

  const game = new Game(gameEl);
  game.start();

  // About modal
  const modal = document.getElementById("about-modal")!;
  document.getElementById("about-link")!.addEventListener("click", (e) => {
    e.preventDefault();
    modal.classList.remove("modal-hidden");
  });
  document.getElementById("modal-close")!.addEventListener("click", () => {
    modal.classList.add("modal-hidden");
  });
  modal.querySelector(".modal-backdrop")!.addEventListener("click", () => {
    modal.classList.add("modal-hidden");
  });
}

init();
