# 03: UI polish checklist

Two parts: **rules** to check any interface against, and an **honest audit of our own site** against them. The animation rules are a summary of Emil Kowalski's design engineering philosophy (the `emil-design-eng` skill, <https://animations.dev/>), written in our own words. Use the skill itself for the full detail and examples.

## Part 1: rules

### Should it animate at all?

| How often will people see it? | Decision |
|---|---|
| Hundreds of times a day (keyboard shortcuts, command palettes) | Never animate |
| Dozens of times a day (hover states, list navigation) | Remove or make tiny |
| Occasionally (modals, drawers, toasts) | Normal animation |
| Rarely or once (onboarding, hero intros, celebrations) | Can be theatrical |

Every animation needs a purpose: spatial consistency, state change, feedback, explaining something, or avoiding an abrupt jump. "It looks cool" is only enough for rare moments.

### Easing and speed

- Things **entering or leaving** use **ease-out** (fast start feels instant). Things moving on screen use ease-in-out. Colour and hover changes use ease. Constant motion (tickers, progress) is linear.
- **Never ease-in for UI**: the slow start is exactly when the person is watching.
- Built-in CSS easings are weak. Use custom curves (for example `cubic-bezier(0.23, 1, 0.32, 1)` or stronger); browse easing.dev or easings.co rather than inventing.
- UI animations under about **300 ms**; buttons 100 to 160 ms; small popovers 125 to 200 ms; dropdowns 150 to 250 ms. A faster 180 ms feels more responsive than 400 ms even when it is not.
- Exit faster than enter. Slow where the user is deciding, fast where the system responds.

### Components

- **Buttons must feel pressed**: `transform: scale(0.97)` on `:active` (0.95 to 0.98), about 160 ms.
- **Never animate from `scale(0)`.** Start at 0.9 to 0.95 plus opacity 0.
- **Popovers grow from their trigger** (set `transform-origin` to the anchor). Modals stay centred.
- **Tooltips:** delay the first, then show neighbours instantly.
- **Use transitions, not keyframes, for anything that can be triggered quickly**: transitions retarget mid-flight; keyframes restart.
- Mask a crossfade that looks like "two objects swapping" with a touch of `filter: blur(2px)` (keep blur small).
- **Stagger** entering groups by 30 to 80 ms per item; never block interaction while it plays.
- Gate hover effects behind `@media (hover: hover) and (pointer: fine)`; touch devices fire hover on tap.

### Performance of motion

- Animate only `transform` and `opacity` (they skip layout and paint).
- Don't animate `width`, `height`, `margin`, `padding`.
- Changing a CSS variable on a parent restyles all children: for per-frame updates set `transform` on the element directly.
- CSS and Web Animations run off the main thread and keep going when the page is busy; JavaScript-driven animation drops frames under load.

### Accessibility

- `prefers-reduced-motion`: remove movement and position animation; keep gentle opacity or colour changes that aid understanding. "Reduced" is not "none".
- Keep focus rings visible, headings in order, one `h1`, real buttons and links, alt text on every image.

### Reviewing your own work

Watch it in slow motion (2 to 5 times longer) and frame by frame; look again the next day with fresh eyes; test touch gestures on a real device.

## Part 2: audit of the Mythical Pickles site

Checked by searching the site's CSS (`grep`) against the rules above. Written in the review format ("Before | After | Why") so an AI can act on it.

**Already correct**
- No `transition: all` anywhere; no `ease-in`; nothing scales from `scale(0)`.
- Strong custom ease-out curves are defined once as tokens and reused.
- Scroll reveals use `transition` (interruptible) on `opacity` and `translate` only.
- Reduced-motion path exists for every moving thing (gate, hero, film, reveals, marquee).
- The tilt effect only runs on fine-pointer hover devices (checked in JavaScript).

**Gaps found (not yet fixed)**

| Before | After | Why |
| --- | --- | --- |
| `.btn:active { transform: translateY(0); }` (no press scale) | `.btn:active { transform: scale(0.97); }` with a 160 ms transition | Buttons should visibly acknowledge a press |
| 19 `:hover` rules with no media query | wrap them in `@media (hover: hover) and (pointer: fine)` | Touch devices trigger hover on tap and leave states stuck |
| Nav underline, FAQ plus icon, breadcrumb arrow use `0.4s` transitions | 150 to 250 ms | Frequently touched controls should feel instant |
| Header background/blur transition `0.4s` | about 200 ms | Seen on every page scroll |
| Card image zoom `1.4s` on hover | keep for atmosphere, but consider 600 to 800 ms | Long tails feel sluggish when scanning a grid of cards |
| Exit and enter speeds are the same for the mobile menu | make closing about 150 ms | Exits should be faster than entrances |
| Reveals at 1.1 s | acceptable (brand atmosphere, seen once), but drop to about 700 ms on repeat sections | Very long reveals stack up when scrolling fast |
| The Oracle option buttons lift `translateY(-3px)` on hover but have no pressed state | add the `scale(0.97)` press | Same rule as buttons |

**Judgement calls (taste, not errors)**
- The intro gate is about 2 seconds every session. It is the brand moment; it is skippable and limited to the home page. Another team might make it once ever or shorten it.
- Slow, heavy motion suits a "mythical" brand. A dashboard or a shop checkout should be crisp and fast.

## Using this in a review

Ask your AI: "Audit these files against 03-ui-polish-checklist.md Part 1 and answer with a Before | After | Why table, one row per issue, ordered by how often users will notice it."
