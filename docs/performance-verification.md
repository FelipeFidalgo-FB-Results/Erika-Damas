# Quiz Performance Verification

Date: 2026-06-30

## Baseline

Production URL tested: `https://erika-damas-quiz.vercel.app/`

PageSpeed Insights mobile report supplied by Felipe:

- Performance: 30
- First Contentful Paint: 28.5 s
- Largest Contentful Paint: 28.5 s
- Speed Index: 28.5 s
- Total Blocking Time: 1,330 ms
- Cumulative Layout Shift: 0
- Total network payload: approximately 5,606 KiB

The previous delivery consisted of a 7,510,699-byte HTML document. It embedded 16 JPEG resources, React, ReactDOM, Babel, font subsets, and application source in one runtime bundle.

## Optimized Build

Vite production output:

- HTML: 1.55 KiB, 0.82 KiB gzip
- CSS: 41.27 KiB, 8.59 KiB gzip
- JavaScript: 179.03 KiB, 58.70 KiB gzip
- Intro image: 82 KiB WebP
- Three Latin font files: approximately 122 KiB total
- Approximate initial same-origin transfer: below 300 KiB before protocol overhead

All later question and result images are external WebP files. The largest file is a result image at 338.5 KiB and is not requested on the opening screen.

## Automated Verification

- 8 behavioral/API/asset tests pass.
- 2 production-build budget tests pass.
- No Babel runtime or `text/babel` script remains.
- No Base64 image remains in production HTML, CSS, or JavaScript.
- `npm audit --audit-level=moderate` reports zero vulnerabilities.
- Vercel remote build completed successfully with Vite 8.1.2.

## Browser Verification

Verified at 390 x 844 and 1440 x 900:

- Opening hero matches the current production composition.
- Question 2 and question 5 retain the approved compact rose question band.
- All 12 questions advance correctly to lead capture.
- All five localhost result previews render their expected profile name and conclusion.
- Doctor heading, WhatsApp CTA, FAQ title, and result chapters remain present.
- Initial asset inspection shows only the intro scene image; later question and result images are not requested on first load.

## Remote Preview

Preview deployment:

`https://erika-damas-quiz-kpjmef4dy-felipebfidalgoo-5523s-projects.vercel.app`

The deployment is protected by Vercel authentication. Authenticated verification confirmed the optimized HTML and the live `/api/lead` function. Because PageSpeed cannot access protected previews, the final public Lighthouse/PageSpeed comparison must run immediately after production promotion.
