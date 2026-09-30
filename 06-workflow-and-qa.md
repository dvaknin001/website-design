# 06: Working with an AI on a site: process, QA, traps

## Process that worked

1. **Research before building.** Read the brand assets, the reference kits and any similar past projects, and check the tools you need actually run on this machine before promising anything.
2. **Pitch, then build.** One page: the concept, the sections, what reuses what, the risks and what you don't know. Ask only the questions that change the build, and give a default for each.
3. **Get the riskiest, most visual thing on screen early** (here: generated art and the hero). Everything else is easier once the world looks right.
4. **Build on a content layer.** All words and facts in JSON and Markdown; templates and CSS separate; a tiny zero-dependency build. A non-developer can then change content by talking to an AI.
5. **Mark every unknown as a placeholder** and make the launch build refuse to ship placeholders.
6. **Look at it.** After every visual change take real screenshots at desktop, phone and reduced-motion. Never say "it works" from the code alone.
7. **Write the hand-off as files**, not chat (see the ICM layout: entry file, router, numbered stage contracts with Inputs / Process / Outputs, reference folder, per-stage hand-off notes) and add a validator that checks every link.
8. **Save session state** to a `status.md` (objective, done, in progress, next action, commands, dead ends, gotchas) before clearing context.

## QA scripts in `reference/tools/`

| Script | Does |
|---|---|
| `qa.mjs` | Loads every page at desktop, phone and reduced-motion in headless Chrome; reports console errors, failed requests, horizontal overflow, `h1` count, images missing alt; saves screenshots |
| `perf.mjs` | Real first-paint and largest-paint timing with and without the intro gate |
| `geomcheck.mjs` | Numerically compares the CSS framing of the hero image with the shader's at many screen sizes |

They need `npm i puppeteer-core` and a local Chrome. Edit the base URL, the page list and the Chrome path at the top. Lighthouse: `npx lighthouse <url> --chrome-path=<chrome> --chrome-flags="--headless=new" --output=json`.

## Traps we hit (so you can skip them)

| Trap | What happened | Fix |
|---|---|---|
| Building while the dev server runs | Both wipe `dist/`; half-built output; mysterious 404s (three times) | Never run a manual build next to the dev server; make the server hold requests during a rebuild |
| Cached templates in a long-running dev server | Template edits never appeared | Rebuild in a fresh child process each time |
| Screenshot during a crossfade | Looked like a layout bug | Wait for animations to finish; measure numbers, not vibes |
| Hidden preview pane | Animations throttled, promises timing out | Use headless Chrome for timing |
| Shell heredocs eating backslashes | Broke regexes and `\n` in generated JS | Write files with the editor tool, not shell heredocs |
| Extra files from an image tool | Duplicate images in the project | Run the tool from a temp directory |
| A `z-index` inherited from the desktop layout | A mobile gradient sat behind the image, invisible | Give the mobile override its own `z-index`; check the phone screenshot |
| Sample-only testing | Only saw the pretty path | Test the failure path too (kit fails to load; placeholders in live mode; wrong origin on the signup endpoint) |
| Generating with hidden assumptions | Model added drop shadows, wrong labels | Review every generated image by eye |

## Launch checklist for a small business site

1. Placeholders gone (the build enforces it).
2. Checkout links work (Stripe Payment Links are simplest); try a test purchase.
3. Email signup goes somewhere real.
4. Privacy, terms and shipping pages reviewed by someone qualified for the owner's location.
5. Domain on Cloudflare (nameservers), added in the Pages project **before** any manual DNS record; HTTPS on; www and bare domain redirect to one.
6. `noindex` removed by switching the site to live; sitemap submitted.
7. Test on a real phone.

## Hosting one-liner

A static site built to `dist/`, connected to a GitHub repo in Cloudflare Pages (build `npm run build`, output `dist`). Every push publishes; every branch gets a preview URL; every deploy can be rolled back.
