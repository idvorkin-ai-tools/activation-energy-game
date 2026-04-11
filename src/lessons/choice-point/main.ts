import "../../style.css";
import { CatcherGame } from "./game";

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

const gameEl = document.getElementById("game")!;
const game = new CatcherGame(gameEl);

document.getElementById("restart-link")!.addEventListener("click", (e) => {
  e.preventDefault();
  game.restart();
});
