# 01: Design direction

The biggest quality jump came before any code: deciding what the site *is*.

## 1. Write the concept in one sentence

Ours: **"The jar is a portal."** The brand's product image was a moonlit ruin with a waterfall, crystals and a nebula behind a stone arch, with a jar standing in the middle like a relic. So the site became a walk through that place: every section is a "chamber", and the jar is the relic at the centre.

A good concept sentence:
- names what the visitor is *inside of* (a portal, a workshop, a cockpit), not what the site sells
- decides dozens of small choices for you (the quiz is an "Oracle", flavors are "relics" with Roman numerals, buttons are "Enter the Vault")
- fits in the mouth of a non-designer

If a section does not fit the concept, cut it or rename it until it does.

## 2. Pull the system out of the brand assets

Do not invent a palette. Sample the logo.

| Decision | What we did |
|---|---|
| **One loud colour** | Chartreuse `#E9FA72`, sampled from the logo with a script (median of the bright pixels). Used sparingly, like a glowing sigil |
| **Neutrals** | Near-black `#050506`, bone `#EFE9D6` for text, mist grey for secondary text |
| **A quiet second accent** | Brass `#C9A24A` for small labels and borders |
| **Per-item accents** | Each product gets its own glow colour (ember orange, blood red, ice cyan...) used only on its own card and page, and never as a background fill |
| **Type** | Wide-tracked ancient serif capitals (Cinzel) for headings and buttons; an elegant italic (Cormorant Garamond) for the "voice" and accent words; a plain sans (Inter) for body text. Three families, three jobs |
| **Custom lettering** | The melted logo lettering exists **only** as the logo image. Never recreate it with a font. Big headlines get a faint SVG "molten" edge as an echo |

Tokens live in one file (`reference/code/tokens.css`). Change a value there and the whole site follows.

## 3. Voice is design

80% mystic, 20% dry humour. "Crunch is sacred." beside "The beets were not consulted." Rules that worked:
- short and theatrical; the joke undercuts the mysticism, never the other way round
- concrete taste words instead of "artisanal" or "elevated"
- fiction is allowed for legends and nicknames; **facts** (ingredients, prices, shipping) stay plain and come from the owner

## 4. Imagery decides 70% of the feeling

With flat stock photography this site would look like any other. The generated cinematic scenes carried it. See 05. Two layout tricks that mattered:
- **Leave negative space in the image for the words.** Every scene was generated with the jar on the right third and dark calm space on the left for the headline, and the hero has calm sky above the jar for the wordmark.
- **Different art for phones.** A wide scene cropped to a phone puts the subject behind the headline. On phones we swap to the tall portrait art as a banner and let the text flow underneath (`<picture>` with a media query).

## 5. Structure the page as a journey with one job per section

| Section | Job |
|---|---|
| Gate (intro) | Set the mood in 2 seconds; plays once per visit |
| Hero | Show the product and the brand; two clear buttons |
| Manifesto | Say the attitude in one big sentence and three short "laws" |
| The Vault | The product gallery, styled as a tarot spread |
| The Oracle | A memorable interaction that also helps undecided buyers choose |
| The Alchemist | A human story (placeholder until the owner supplies it) |
| The Coven | The email signup |

## 6. Test the concept with the "squint and screenshot" method

Screenshot the page at desktop and phone width. Squint. Can you still tell what it is, where the eye goes first, and what the one colour is? If the screenshot could be any brand's site, the concept is not doing its job.
