# MPA Restructure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure the repo from a single-page app into a multi-page app with a hub page, playgrounds section, and lessons section.

**Architecture:** Vite multi-page mode with separate HTML entry points. Hub page at root links to playground and lesson pages. Each page is independent with its own HTML/TS entry.

**Tech Stack:** Vite multi-page, HTML/CSS/Canvas, TypeScript

---

### Task 1: Move the activation energy game to lessons/energy/

**Files:**
- Move: `index.html` → `lessons/energy/index.html`
- Move: `src/main.ts` → `src/lessons/energy/main.ts`
- Modify: `lessons/energy/index.html` (fix script src path)
- Modify: `src/lessons/energy/main.ts` (fix import paths)

**Step 1: Create directory and move game HTML**

```bash
mkdir -p lessons/energy
```

Copy `index.html` to `lessons/energy/index.html`. Update the script src from `/src/main.ts` to `/src/lessons/energy/main.ts`. Update the CSS link from `/src/style.css` to `/src/style.css` (stays same, absolute path).

**Step 2: Move main.ts**

```bash
mkdir -p src/lessons/energy
mv src/main.ts src/lessons/energy/main.ts
```

Update imports in `src/lessons/energy/main.ts` — change `./Game` to `../../Game`, `./style.css` to `../../style.css`.

**Step 3: Verify it builds**

Run: `npx vite build`
Expected: Build succeeds (will fail until vite config is updated in Task 3, so just verify no TS errors with `npx tsc -b`)

**Step 4: Commit**

```bash
git add -A && git commit -m "refactor: move activation energy game to lessons/energy/"
```

---

### Task 2: Move raccoon playground to playground/raccoon-styles/

**Files:**
- Move: `raccoon-playground.html` → `playground/raccoon-styles/index.html`

**Step 1: Create directory and move file**

```bash
mkdir -p playground/raccoon-styles
mv raccoon-playground.html playground/raccoon-styles/index.html
```

**Step 2: Commit**

```bash
git add -A && git commit -m "refactor: move raccoon playground to playground/raccoon-styles/"
```

---

### Task 3: Create hub page at root

**Files:**
- Create: `index.html` (new hub page)
- Create: `src/hub.css` (hub styling)

**Step 1: Create hub index.html**

Simple card grid page linking to `/lessons/energy/` and `/playground/raccoon-styles/`. Clean, dark theme matching existing aesthetic. Include:
- Title: "Explorable Explanations"
- Subtitle describing the collection
- Card for each destination with title, short description, link

**Step 2: Create hub CSS**

Minimal styling for the card grid layout. Dark theme (#1a1a2e background) matching existing style.

**Step 3: Commit**

```bash
git add index.html src/hub.css && git commit -m "feat: add hub landing page"
```

---

### Task 4: Configure Vite multi-page build

**Files:**
- Modify: `vite.config.ts` (add multi-page rollup input config)

**Step 1: Update vite.config.ts**

Add `build.rollupOptions.input` listing all HTML entry points:
- `index.html` (hub)
- `lessons/energy/index.html` (game)
- `playground/raccoon-styles/index.html` (raccoon playground)

**Step 2: Run build and verify**

Run: `npm run build`
Expected: Build succeeds, `dist/` contains all three pages

**Step 3: Run dev server and verify all pages load**

Run: `npm run dev`
- `/` → hub page with links
- `/lessons/energy/` → activation energy game
- `/playground/raccoon-styles/` → raccoon playground

**Step 4: Commit**

```bash
git add vite.config.ts && git commit -m "feat: configure Vite multi-page build"
```

---

### Task 5: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update architecture section**

Add MPA structure description. Update file paths to reflect new locations.

**Step 2: Commit**

```bash
git add CLAUDE.md && git commit -m "docs: update CLAUDE.md for MPA structure"
```
