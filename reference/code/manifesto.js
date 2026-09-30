/* manifesto: words light up one by one as you scroll through the statement (native scroll handler, no library) */
(function () {
  'use strict';
  const { $, $$, reduce } = window.MP;
  const el = $('[data-words]');
  if (!el) return;

  // wrap every word in a span, keeping <em> intact
  const wrap = (node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(' '));
          else { const s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.appendChild(s); }
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === 1) wrap(child);
    }
  };
  wrap(el);
  const words = $$('.w', el);
  let lit = -1;
  const setLit = (n) => { if (n === lit) return; lit = n; words.forEach((w, i) => w.classList.toggle('lit', i < n)); };

  if (reduce) { setLit(words.length); return; }
  // progress 0 when the statement's top reaches 82% of the window, 1 when its bottom reaches 48%
  window.MP.onScroll(() => {
    const r = el.getBoundingClientRect(), vh = innerHeight;
    const p = Math.min(1, Math.max(0, (0.82 * vh - r.top) / (r.height + 0.34 * vh)));
    setLit(Math.round(p * words.length * 1.04));
  });
})();
