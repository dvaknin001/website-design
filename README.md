# Web design and UI playbook

How a cinematic, high-polish business website was designed and built with an AI helper (the Mythical Pickles site), written up so another person and their AI can reuse the methods. It is a mix of **what we did**, **what worked**, **what went wrong**, and **rules to check your own work against**.

Everything here is plain Markdown plus a few code files. Put the folder on GitHub or Google Drive as it is.

## Read in this order

| File | What it gives you |
|---|---|
| [00-PASTE-THIS-PROMPT.md](00-PASTE-THIS-PROMPT.md) | A prompt to paste into your AI chat so it uses this playbook properly |
| [01-design-direction.md](01-design-direction.md) | How to get from "make it look mythical" to a concrete visual system |
| [02-motion-and-interaction.md](02-motion-and-interaction.md) | Every motion and interaction technique used, with the file to look at |
| [03-ui-polish-checklist.md](03-ui-polish-checklist.md) | A review checklist (Emil Kowalski's rules plus ours) and the honest audit of our own site |
| [04-performance-and-accessibility.md](04-performance-and-accessibility.md) | What made the site fast and accessible, with measured numbers and mistakes |
| [05-ai-images-with-codex.md](05-ai-images-with-codex.md) | Generating on-brand imagery with the Codex CLI and reference images |
| [06-workflow-and-qa.md](06-workflow-and-qa.md) | How to work with an AI on a site: process, testing scripts, traps |
| [reference/](reference/) | Real code from the project: hero shader, intro gate, tokens, image tool, QA scripts |

## Sources and credits

- **Motion Reel Kit** (code-only, GSAP-based motion graphics, MIT license): <https://github.com/dvaknin001/motion-reel-kit>. Two of its styles were forked into the site to run live in the browser.
- **Emil Kowalski's design engineering philosophy** (the `emil-design-eng` Claude skill): the animation decision framework and review rules in file 03 come from it. His course: <https://animations.dev/>. The summaries here are in our own words; get the skill itself for the full detail.
- **ICM (Interpretable Context Methodology)** by Jake Van Clief and David McDermott, used to structure the AI instructions in the project: <https://github.com/RinDig/Interpretable-Context-Methodology>.
- **GSAP** (free under its standard license): <https://gsap.com>. **Depth Anything V2** (used once to bake a depth map): <https://huggingface.co/onnx-community/depth-anything-v2-small>.

## The one-paragraph story

A friend's pickle brand had two images: a chartreuse-on-black logo with an all-seeing eye, and one cinematic product mock. From that we built a static site (no framework) with an eye-opening intro, a depth-parallax hero, a tarot-style flavor gallery, an "Oracle" quiz with a game-style card reveal, and per-flavor "legend" films. All artwork was generated with the Codex CLI from those two references. The whole thing builds to plain files and is hosted free on Cloudflare Pages. Lighthouse accessibility and best-practices scores are 100; the page loads its first paint in under a second on a real machine.

## What was and was not used

Honest scope: the motion kit was used heavily (Oracle reveal, legend film, engine). The Emil Kowalski skill was **not** used while building; it was applied afterwards as an audit, and file 03 lists what it found. Following it would make the finished site better, which is the point of sharing it.
