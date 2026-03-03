import { Application } from "pixi.js";
import { Game } from "./Game";
import "./style.css";

async function init() {
  const container = document.getElementById("game")!;

  const app = new Application();
  await app.init({
    background: "#1a1a2e",
    resizeTo: container,
    antialias: true,
  });

  container.appendChild(app.canvas);

  const game = new Game(app);
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
