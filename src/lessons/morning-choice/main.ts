import "../../style.css";
import { MorningChoiceGame } from "./game";

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

// Start game
const gameEl = document.getElementById("game")!;
const game = new MorningChoiceGame(gameEl);

// Restart on title tap
document.getElementById("restart-link")!.addEventListener("click", (e) => {
  e.preventDefault();
  game.restart();
});

// Debug scene buttons
if (window.location.search.includes("debug")) {
  const debugBar = document.createElement("div");
  debugBar.style.cssText = "max-width:600px;margin:12px auto;display:flex;gap:8px;flex-wrap:wrap;padding:0 16px";
  const scenes = [
    { label: "Bedroom", beat: "alarm" },
    { label: "Phone in bed", beat: "phoneScroll" },
    { label: "Easy Chair", beat: "easyChair" },
    { label: "Gym", beat: "atGym" },
    { label: "Coffee Shop", beat: "coffeeShop" },
  ];
  for (const s of scenes) {
    const btn = document.createElement("button");
    btn.textContent = s.label;
    btn.style.cssText = "padding:6px 12px;background:#333;color:#e0e0ff;border:1px solid #555;border-radius:4px;cursor:pointer;font-size:13px";
    btn.addEventListener("click", () => game.jumpToBeat(s.beat));
    debugBar.appendChild(btn);
  }
  gameEl.appendChild(debugBar);
}
