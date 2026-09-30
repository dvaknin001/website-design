# 02: Motion and interaction

Every technique used on the site, what it is for, and where to look. Code excerpts are in `reference/code/`.

## The rule that governs all of it

Motion is either **atmosphere** (seen once, slow, allowed to be theatrical) or **feedback** (seen constantly, fast, nearly invisible). Do not mix the budgets. Our brand pages are mostly atmosphere, so reveals take about a second. Anything the visitor touches repeatedly (menus, hover states, buttons) should be quick. File 03 lists where we broke this.

Always: no motion needed to understand the page, `prefers-reduced-motion` respected, sound off until asked, nothing flashing.

## Techniques

| Technique | What it does | How | File |
|---|---|---|---|
| **Intro gate** | An eye assembles, then the page appears through an iris-shaped hole. Once per visit, skippable, 4 s failsafe | Web Animations API on SVG parts (staggered by distance from centre), plus a CSS `mask-image: radial-gradient(...)` whose radius is driven by `requestAnimationFrame`. No library, so it plays before anything else loads | `reference/code/gate.js`, `motion.css` |
| **Depth-parallax hero** | The artwork shifts with the pointer, near things more than far ones, plus drifting mist, a breathing glow and twinkling stars | One small WebGL fragment shader: image + a grey **depth map** (made once with the open Depth Anything V2 model, see `reference/tools/depth.py`). Mouse is smoothed; idle drift on touch devices; paused when off-screen or tab hidden; falls back to a plain image | `reference/code/hero.js` |
| **Fallback that matches the shader** | No jump when the canvas fades in, no layout shift | The plain `<img>` is positioned in **pure CSS with the same maths** as the shader. `reference/tools/geomcheck.mjs` proves the two match to the pixel at 7 screen sizes | `sections.css` (`.hero-fallback`) |
| **Words light up on scroll** | The manifesto sentence brightens word by word | Wrap words in spans; one scroll handler maps scroll progress to how many are lit. No library | `reference/code/manifesto.js` |
| **Tilt cards** | Cards tilt toward the pointer with a glare that follows | `perspective(1000px) rotateX/rotateY` driven by CSS variables set from `pointermove`; only on `(hover: hover) and (pointer: fine)` devices | `core.js` |
| **Scroll reveals** | Elements fade and rise as they enter | IntersectionObserver adds a class; the CSS uses the individual `translate` and `opacity` properties (not `transform`) so it never fights other transforms such as tilt. Siblings stagger by about 90 ms | `core.js`, `motion.css` |
| **Filling meters** | Heat / Tang / Sweet / Crunch bars fill | `transform: scaleX(var(--fill))` (compositor-only), `--fill` flips from 0 to the value when the parent gets `.in` | `components.css` |
| **The eye watches you** | The iris in the nav and sigils follows the cursor | Limited translate of an SVG group toward the pointer | `core.js` |
| **Molten headings** | A faint wobble on big headlines echoing the melted logo | One static SVG `feTurbulence + feDisplacementMap` filter, applied only to large headings | `layout.mjs`, `.molten` |
| **Marquee band** | A slow ticker of words | Pure CSS keyframes, `translateX(-50%)` on a duplicated track | `components.css` |
| **The Oracle** | A quiz ends with a casino-style card reveal (drop, climbing suspense ladder, flip, name decodes, stats count up) | The **Motion Reel Kit** style `gaming-loot-reveal`, forked: fonts swapped to the site's, a new `image` icon that shows the product art on the card face, palette changed. Driven entirely by parameters | `src/motion/oracle-reveal.js` (project) |
| **Legend film** | Each product's legend unrolls on a dark scroll under a chartreuse beam and the camera lands on the punchline | Kit style `faith-scroll-reveal`, forked: `timeline:false`, beam colour is a parameter. Autoplays muted once when scrolled into view | `src/motion/legend-scroll.js` (project) |

## How the Motion Reel Kit was used well

1. **Load it lazily.** The kit engine and GSAP are about 250 KB. They load only when someone starts the Oracle or scrolls to a legend film. Ordinary pages ship no animation library at all.
2. **Change parameters before code.** Palette, text, stats, ladder names, fonts and timing are all params. We forked a style's code only for two real gaps.
3. **Keep a fork header comment** saying what differs from the original.
4. **The engine is a player.** `new Reel.Player(host, [{def: 'style-id', params}])` renders a fixed 1920x1080 stage; scale it with `transform: scale(container.clientWidth/1920)`. It exposes `seek(t)`, `play()`, `pause()`, and events, so you can scrub it with scroll too.
5. **Have a no-animation path.** If the kit fails to load within 9 s, or reduced motion is on, the Oracle shows the result card directly.

## Easing and timing we use

- `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)`: a strong ease-out for almost everything that enters.
- Reveals about 1.1 s; hero intro 1.6 s; iris gate about 2 s; stagger 60 to 90 ms. These are atmosphere, on pages seen once.
- Frequent interactions should be 150 to 250 ms (see 03).

## Techniques we did NOT need but would consider

- `@starting-style` for enter animations without JavaScript.
- `clip-path: inset(...)` reveals for images.
- Spring physics for draggable things (only if there is drag).
