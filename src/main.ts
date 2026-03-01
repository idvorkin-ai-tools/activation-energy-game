import { Application } from "pixi.js";
import { Game } from "./Game";
import "./style.css";

async function init() {
  const app = new Application();
  await app.init({
    background: "#1a1a2e",
    resizeTo: window,
    antialias: true,
  });

  const container = document.getElementById("game")!;
  container.appendChild(app.canvas);

  const game = new Game(app);
  game.start();
}

init();
