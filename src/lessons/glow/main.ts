interface Block {
  html: string;
}

// ── Blocks of content (one per "screen") ──
const BLOCKS: Block[] = [
  {
    html: `<p class="big">Energy, Not Time</p>
           <p><em style="color:#64748b">You already know this. You just haven't named it.</em></p>`,
  },
  {
    html: `<p>You and your most productive friend have the <span class="highlight">exact same 24 hours</span>.</p>
           <p>Same commute. Same meetings. Same dishes.</p>`,
  },
  {
    html: `<p>So why does their day feel like a win<br>and yours feel like surviving?</p>`,
  },
  {
    html: `<p class="big">It was never about time.<br>It's about energy.</p>`,
  },
  {
    html: `<p>An hour of deep work at <span class="bright">9am</span> costs almost nothing.</p>
           <p>The same hour at <span class="dim">4pm</span> costs everything you have left.</p>`,
  },
  {
    html: `<p>Answering emails takes 20 minutes either way.</p>
           <p>But after three hard conversations, those 20 minutes feel like <em>running underwater</em>.</p>`,
  },
  {
    html: `<p class="big">Time is the container.<br>Energy is what's inside.</p>
           <p>You can't manage what's inside by resizing the container.</p>`,
  },
  {
    html: `<p>Here's the same Tuesday, two ways:</p>
           <div class="comparison">
             <div class="col col-bad">
               <h3>Optimized for time</h3>
               <ul>
                 <li>Check email</li>
                 <li>Hard project</li>
                 <li>Meetings</li>
                 <li>More email</li>
                 <li>Admin tasks</li>
                 <li><span class="dim">Collapse on couch</span></li>
               </ul>
             </div>
             <div class="col col-good">
               <h3>Optimized for energy</h3>
               <ul>
                 <li>Walk + coffee</li>
                 <li>Hard project</li>
                 <li>Easy admin</li>
                 <li>Social lunch</li>
                 <li>Meetings</li>
                 <li><span class="bright">Cook dinner, feel human</span></li>
               </ul>
             </div>
           </div>`,
  },
  {
    html: `<p>Same six tasks. Same six hours.</p>
           <p>One person is destroyed.<br>The other has energy left to <em>live</em>.</p>
           <p>The difference isn't discipline. It isn't hustle.<br>It's <span class="highlight">sequence</span>.</p>`,
  },
  {
    html: `<p class="big">Three things you already know<br>but keep ignoring:</p>`,
  },
  {
    html: `<p><strong>1. Hard things go first.</strong></p>
           <p>Not because of discipline — because they're cheaper when you're full.<br>A $20 task at 9am becomes a $60 task at 4pm.</p>`,
  },
  {
    html: `<p><strong>2. Some tasks give energy back.</strong></p>
           <p>Exercise. Creative work. Good conversation.<br>These aren't breaks from productivity — they're <em>fuel</em> for it.</p>`,
  },
  {
    html: `<p><strong>3. Sequence is everything.</strong></p>
           <p>Three drains in a row isn't 3x the cost. It's 10x.<br>One generator between two drains cuts the total cost in half.</p>`,
  },
  {
    html: `<p>Stop asking <span class="strike">Do I have time for this?</span></p>
           <p>Start asking <span class="highlight">Do I have energy for this — right now?</span></p>`,
  },
  {
    html: `<p class="big" style="margin-bottom:0"><em>Same hours. Different day.</em></p>`,
  },
];

function init(): void {
  // ── State ──
  const stage = document.getElementById("stage")!;
  const hint = document.getElementById("continue-hint")!;
  const progressEl = document.getElementById("progress")!;
  let current = -1;
  let transitioning = false;
  let activeBlock: HTMLDivElement | null = null;

  // Build progress dots
  for (let i = 0; i < BLOCKS.length; i++) {
    const dot = document.createElement("div");
    dot.className = "dot";
    progressEl.appendChild(dot);
  }
  const dots = progressEl.querySelectorAll<HTMLDivElement>(".dot");

  function showBlock(index: number): void {
    if (transitioning || index < 0 || index >= BLOCKS.length) return;
    transitioning = true;
    hint.classList.remove("visible");
    const direction = index >= current ? 1 : -1;

    // Exit current
    if (activeBlock) {
      activeBlock.classList.remove("visible");
      activeBlock.classList.add(direction > 0 ? "exiting-up" : "exiting-down");
      const old = activeBlock;
      setTimeout(() => old.remove(), 600);
    }

    // Update dots
    dots.forEach((d, i) => {
      d.className =
        "dot" + (i < index ? " done" : i === index ? " active" : "");
    });

    // Create new block
    setTimeout(() => {
      const block = document.createElement("div");
      block.className =
        "block" +
        (direction > 0 ? " entering-from-below" : " entering-from-above");
      block.innerHTML = BLOCKS[index].html;
      stage.appendChild(block);
      activeBlock = block;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          block.classList.add("visible");
        });
      });

      setTimeout(() => {
        transitioning = false;
        if (index < BLOCKS.length - 1) {
          hint.classList.add("visible");
        }
      }, 900);
    }, 400);

    current = index;
  }

  // Navigation: forward and back
  function advance(): void {
    if (transitioning) return;
    showBlock(current + 1);
  }
  function goBack(): void {
    if (transitioning || current <= 0) return;
    showBlock(current - 1);
  }

  // Click/tap: left third goes back, rest goes forward
  stage.addEventListener("click", (e: MouseEvent) => {
    const x = e.clientX / window.innerWidth;
    if (x < 0.33 && current > 0) {
      goBack();
    } else {
      advance();
    }
  });

  // Keyboard: arrows, space, enter
  document.addEventListener("keydown", (e: KeyboardEvent) => {
    if (
      e.key === " " ||
      e.key === "ArrowRight" ||
      e.key === "ArrowDown" ||
      e.key === "Enter"
    ) {
      e.preventDefault();
      advance();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      goBack();
    }
  });

  // Swipe: left swipe = forward, right swipe = back
  let touchStartX = 0;
  stage.addEventListener(
    "touchstart",
    (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
    },
    { passive: true },
  );
  stage.addEventListener("touchend", (e: TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) {
      if (dx < 0) advance();
      else goBack();
    } else {
      // Tap: use left/right third
      const x = e.changedTouches[0].clientX / window.innerWidth;
      if (x < 0.33 && current > 0) goBack();
      else advance();
    }
  });

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

  // Start
  showBlock(0);
}

init();
