# Quiz Production Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 7.5 MB runtime-compiled quiz artifact with a production Vite build that preserves the approved experience and tracking while meeting explicit loading budgets.

**Architecture:** Extract the existing template into a normal React source tree, keep pure quiz and lead logic in testable modules, and compile JSX at build time. Move bundled resources into optimized static files, load only the active scene image, and keep the existing serverless lead API unchanged.

**Tech Stack:** React 18, Vite 5, Node test runner, Sharp, existing Vercel serverless API.

---

### Task 1: Establish the production project and regression contracts

**Files:**
- Create: `package.json`
- Create: `tests/quiz-contract.test.js`
- Create: `tests/production-build.test.js`
- Preserve: `api/lead.js`
- Preserve: `api/lead.test.js`

- [ ] Add package scripts for `dev`, `build`, `test`, and `test:build`, with React/Vite runtime dependencies and Sharp as the asset-build dependency.
- [ ] Write a failing contract test requiring 12 questions, five profile names, valid CRM labels, phone validation, and privacy-safe Pixel parameters.
- [ ] Run `npm test` and confirm failure because the source modules do not exist.
- [ ] Add minimal source modules exporting the required contracts.
- [ ] Run `npm test` and confirm the contract tests and existing lead API test pass.

### Task 2: Extract and optimize the current visual assets

**Files:**
- Create: `scripts/extract-assets.mjs`
- Create: `public/assets/images/*.webp`
- Create: `public/assets/fonts/*.woff2`
- Create: `src/assets.js`
- Delete after extraction: oversized root `erika-avatar.jpg` and `q3-atividade-fisica.png`

- [ ] Write a failing asset test that rejects Base64 images, files above 350 KB, missing scene assets, and missing Latin font files.
- [ ] Run the asset test and confirm it fails against the current artifact.
- [ ] Implement extraction of bundled JPEG/font resources and conversion to WebP at widths appropriate to the quiz viewport.
- [ ] Define stable scene-to-file mappings in `src/assets.js`.
- [ ] Run the asset test and confirm all generated resources satisfy the budgets.

### Task 3: Move the approved quiz into compiled React source

**Files:**
- Replace: `index.html`
- Create: `src/main.jsx`
- Create: `src/App.jsx`
- Create: `src/styles.css`
- Create: `src/quiz-data.js`
- Create: `src/quiz-core.js`
- Create: `src/tracking.js`
- Create: `src/lead.js`

- [ ] Extract the approved JSX and application CSS from the bundled template without changing display copy or structure.
- [ ] Replace `window.__resources` and blob URLs with imports from `src/assets.js`.
- [ ] Move scoring, CRM payload construction, validation, and tracking helpers into the tested modules.
- [ ] Replace runtime Babel scripts with the Vite module entry point.
- [ ] Run `npm test` and confirm all behavioral contracts pass.

### Task 4: Implement scene-aware loading and production metadata

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/assets.js`
- Modify: `src/styles.css`
- Modify: `index.html`
- Modify: `vercel.json`

- [ ] Preload the intro image and only the Latin font resources needed above the fold.
- [ ] Prefetch the next question image after quiz start and after each answer.
- [ ] Lazy-load the doctor portrait and result imagery.
- [ ] Add explicit image dimensions/stable aspect ratios and `font-display: swap`.
- [ ] Add immutable cache headers for hashed Vite assets and long-lived static image/font assets.
- [ ] Keep Meta Pixel asynchronous and preserve all validated event names.

### Task 5: Build-size and browser verification

**Files:**
- Modify: `tests/production-build.test.js`
- Create: `docs/performance-verification.md`

- [ ] Run `npm run build` and confirm Vite completes without warnings or errors.
- [ ] Run `npm run test:build` and confirm the HTML, script, stylesheet, image, and Base64 budgets pass.
- [ ] Run the local production preview and verify the hero, question 2, question 5, form, and all five localhost result previews at mobile and desktop widths.
- [ ] Verify no console errors and confirm initial requests exclude later question/result images.
- [ ] Exercise a non-submitting lead contract test against the local API module and verify Pixel payloads remain privacy-safe.
- [ ] Record before/after transfer sizes and Lighthouse metrics in `docs/performance-verification.md`.

### Task 6: Prepare deployment without changing production prematurely

**Files:**
- Modify only if required by verification: `vercel.json`

- [ ] Review `git diff` for unintended copy or design changes.
- [ ] Run the complete test suite and production build again.
- [ ] Commit the verified implementation on `perf/quiz-production-build`.
- [ ] Deploy a preview URL, verify it independently, and only then promote the approved build to production.
