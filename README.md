# Turbo Racer DX-99

A nostalgic handheld highway racer built with React, Vite, Tailwind CSS, and inline SVG. Dodge oncoming traffic across three lanes, hold turbo to raise your score multiplier, and survive as the speed level climbs.

## Controls

| Action | Keys |
| --- | --- |
| Change lane | `←` / `→` or `A` / `D`, on-screen buttons, or swipe |
| Turbo (hold) | `Space`, `↑`, or `W` |
| Start / restart | `Enter`, `Space`, or `R` |
| Pause / resume | `P`, `Esc`, or the START/PAUSE button |
| Select difficulty (menus) | `1` / `2` / `3` |
| Switch car model | `C` |
| Mute audio and haptics | `M` |

High score, mute state, difficulty, and car model persist in `localStorage`.

## Scripts

```bash
npm install      # install dependencies
npm run dev      # dev server at http://localhost:3000
npm run build    # production build in dist/
npm run preview  # preview the production build
npm run typecheck
npm run test
npm run test:watch
```

## Deployment (GitHub Pages)

The site deploys from the **GitHub Actions** workflow in `.github/workflows/deploy.yml`. `deploy-pages` is the single source of truth; there is no `gh-pages` branch fallback.

One-time setup:

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. Ensure the repository is **public** (GitHub Pages on a free plan requires it).
3. Push to `main`. The workflow installs with `npm ci`, runs typecheck and tests, then publishes `dist/` at `https://<owner>.github.io/<repo>/`.

The workflow derives the Vite base path from the repository name:

```yaml
GITHUB_PAGES_BASE: /${{ github.event.repository.name }}/
```

For a local production check of the project-page build:

```bash
GITHUB_PAGES_BASE=/retro-turbo-racer/ npm run build
GITHUB_PAGES_BASE=/retro-turbo-racer/ npm run preview
```

## Project structure

```
src/
  game/
    rules.ts          pure game logic and tuning constants
    storage.ts        versioned settings persistence
    sound.ts          procedural Web Audio engine
    useGameLoop.ts    requestAnimationFrame fixed-timestep loop
  components/
    HandheldConsole.tsx  state, input, and console composition
    GridScreen.tsx       screen layout and overlays
    console/             shell controls and desktop wings
    screen/              highway viewport, telemetry, overlays
  hooks/              keyboard controls, focus trap, reduced motion
```

The game logic in `src/game/rules.ts` is DOM-free and unit tested with Vitest.
