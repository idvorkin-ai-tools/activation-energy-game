import { Application } from "pixi.js";
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

  // Game will be initialized here once engine is ready
  console.log("Activation Energy: The Game — canvas ready");
}

init();
