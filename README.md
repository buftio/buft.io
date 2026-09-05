# buft.io

Igor Ostanin's portfolio. Scroll around the seated character, open a burning project flower, and explore its story in a smaller window with an interactive 3D illustration.

## Run locally

```sh
npm ci
npm run dev -- --port 3007
```

Use Node 26. The dependency refresh is a separate commit from the portfolio redesign. Direct dependencies were checked against npm's latest stable releases on September 5, 2026. ESLint was replaced with Oxlint because Next's current ESLint plugins fail with ESLint 10; TypeScript 7 remains the compiler.

```sh
npm run lint
npm run typecheck
npm run build:worker
npm run dev:worker
```

The last command serves the production Worker locally at http://localhost:8771 with local storage. The existing `deploy:worker` command publishes to buft.io.

## Content and assets

Project stories live in `src/lib/projects.ts`. Their factual basis and brand sources are recorded in [content-sources.md](docs/content-sources.md). The current copy uses the supplied résumé; LinkedIn requires sign-in. The vignettes illustrate the work and are not employer product screenshots. Glite's dialogue is an animated example, not a connected voice agent.

`src/components/three` contains the camera scene's objects, flowers, flames, and project illustrations. `scripts/generate-glite-room.mjs` recreates `public/glite-room.glb` with the existing Three.js dependency.

The original seated character and rock are retained with Meshopt and WebP compression, without mesh simplification. Together they are 1,360,040 bytes, down from 7,910,796 bytes. Their source versions remain in Git history. Original scene implementation was inspired by The Year of Greta.

Use the project numbers or previous/next buttons as an alternative to scrolling. The project windows use native dialogs with focus trapping and Escape to close. Motion follows the system preference and can also be paused. The stories remain usable if WebGL is unavailable.
