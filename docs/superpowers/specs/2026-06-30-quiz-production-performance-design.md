# Quiz Production Performance Design

## Objective

Reduce the mobile loading cost of the Erika Damas quiz without changing its approved visual design, question flow, profile calculation, lead capture, spreadsheet delivery, or Meta Pixel events.

## Current Problem

The deployed page is a 7.5 MB self-contained HTML document. It embeds 16 JPEG images as Base64 resources and compiles JSX in the browser through a bundled Babel runtime. PageSpeed Insights consequently reports a 28.5 second First Contentful Paint, a 28.5 second Largest Contentful Paint, 1,330 ms of Total Blocking Time, and approximately 5.6 MB transferred on its mobile profile.

Two additional standalone images are also oversized: `erika-avatar.jpg` is 2.05 MB and `q3-atividade-fisica.png` is 1.81 MB.

## Approved Architecture

The quiz will become a conventional Vite production build using React. The current template remains the behavioral and visual reference, but JSX will be compiled at build time and emitted as minified, hashed JavaScript and CSS assets.

Bundled images will be extracted to real files, resized for the largest rendered mobile and desktop dimensions, and encoded as WebP. The first-screen image will be requested immediately. Question images will load on demand, with only the next likely image prefetched after interaction. Result and doctor images will not be requested during the opening screen.

## Behavioral Invariants

- Preserve all 12 questions, answer labels, scoring, and five result profiles.
- Preserve the approved cream and terra result design.
- Preserve the lead endpoint and append behavior already validated in Google Sheets.
- Preserve `PageView`, `Lead`, `Contact`, `QuizResultViewed`, `QuizBridgeStarted`, `QuizDoctorSectionViewed`, and `QuizWhatsAppClick`.
- Preserve the production restriction that result preview query parameters only work on localhost.
- Preserve the current WhatsApp destination and profile-aware message.
- Do not expose profile or medical-response details in Pixel payloads.

## Loading Strategy

1. Serve a minimal HTML shell and one compiled application entry point.
2. Preload the opening hero image and the two locally hosted font files required above the fold.
3. Use responsive image sources where the image is rendered as content.
4. Use explicit dimensions or stable containers to avoid layout shifts.
5. Prefetch the next question image only after the user begins the quiz or answers a question.
6. Lazy-load the doctor portrait and result-page imagery.
7. Keep Meta Pixel asynchronous; it must not block React rendering.

## Testing

Automated tests will cover question count, scoring outcomes, profile labels sent to the CRM, phone validation, lead payload shape, Pixel event names and privacy constraints, asset references, and production-build size budgets.

Browser verification will cover the hero, representative short and long questions, lead capture, all five result previews on localhost, responsive layouts, console errors, and network requests. A final Lighthouse/PageSpeed-style mobile run will compare transfer size, FCP, LCP, TBT, and layout shift with the recorded baseline.

## Performance Budgets

- Initial HTML below 100 KB uncompressed.
- Initial JavaScript and CSS together below 350 KB compressed.
- Opening hero image below 300 KB.
- No Base64 image payloads in HTML, CSS, or JavaScript.
- No Babel runtime or `text/babel` scripts in production.
- Initial same-origin transfer target below 700 KB before third-party tracking.

## Deployment Safety

Implementation happens on branch `perf/quiz-production-build`. The production URL will not change until automated tests, visual browser checks, lead submission checks against the existing API contract, and performance verification pass. Deployment remains a separate explicit step after verification.
