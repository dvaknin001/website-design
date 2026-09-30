# Paste this into your AI chat

Copy everything in the box, put this folder's files where your AI can read them (upload them, or open the folder in Claude Code / Codex), and send it. Replace the parts in [brackets].

```text
I want to improve the web design and UI of my site: [describe it, or paste its URL / folder].

Read the playbook first, in this order: README.md, 01-design-direction.md,
02-motion-and-interaction.md, 03-ui-polish-checklist.md, 04-performance-and-accessibility.md.
Only read 05 (AI images) and 06 (workflow) if the task needs them.

Then do this, and tell me each result before moving on:

1. Look at my site as it actually is (run it, screenshot desktop and phone widths). Do not
   judge from the code alone.
2. Write ONE sentence describing the design concept it should have, and say whether
   the site matches it. If it does not have a concept, propose two and recommend one.
3. Audit it with the checklist in 03. Use the "Before | After | Why" table format. Separate
   what is a real problem from what is taste.
4. Give me the 5 changes that would improve it most, ordered by impact per effort.
   For each, say what I will notice and what could go wrong.
5. Wait for me to pick, then make the changes one at a time, checking desktop, phone and
   reduced-motion after each. Do not add libraries without asking.

Rules: do not invent facts about my business; keep everything accessible
(alt text, reduced motion, keyboard, contrast); measure performance before and after
(see 04) and tell me if a change made it worse; tell me honestly what you could not verify.
```

## Optional add-ons for your chat

- Install the **Emil Kowalski design engineering skill** in Claude Code (`emil-design-eng`) and say "use the emil-design-eng skill for the audit".
- Give your AI the **Motion Reel Kit** repo (<https://github.com/dvaknin001/motion-reel-kit>) if you want video-grade animated pieces (reveals, counters, card flips) running live on the page. See 02 for how they were embedded.
