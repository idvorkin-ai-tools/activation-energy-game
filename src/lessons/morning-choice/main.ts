import "../../style.css";

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
gameEl.innerHTML = "<p style='color:#e0e0ff;text-align:center;margin-top:4rem'>Morning Choice — coming soon</p>";
