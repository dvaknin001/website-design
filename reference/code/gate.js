/* gate: the eye opens once per visit, then the page is revealed through it. Skippable; never blocks for long.
   Built with the Web Animations API (no library), so it plays before anything else has loaded. */
(function () {
  'use strict';
  const root = document.documentElement;
  const gate = document.querySelector('[data-gate]');
  if (!gate) return;
  if (!root.classList.contains('gate')) { gate.remove(); return; }

  let done = false;
  const finish = () => {
    if (done) return; done = true;
    try { sessionStorage.setItem('mp_gate', '1'); } catch (e) { /* private mode */ }
    root.classList.remove('gate'); gate.remove();
    window.dispatchEvent(new Event('mp:ready'));
  };

  const svg = gate.querySelector('.gate-svg');
  const at = (el, x, y) => { el.style.transformBox = 'view-box'; el.style.transformOrigin = `${x}px ${y}px`; };
  const play = (el, frames, o) => el.animate(frames, Object.assign({ fill: 'both', easing: 'cubic-bezier(.16,1,.3,1)' }, o));
  const anims = [];

  const lids = [...svg.querySelectorAll('.eye-lid')];
  lids.forEach((l) => { at(l, 120, 100); anims.push(play(l, [{ transform: 'scaleY(.03)' }, { transform: 'scaleY(1)' }], { duration: 900 })); });

  const iris = [...svg.querySelectorAll('.eye-pupil, .eye-iris-ring')];
  iris.forEach((el) => { at(el, 120, 100); anims.push(play(el, [{ transform: 'scale(.1)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 700, delay: 350, easing: 'cubic-bezier(.34,1.56,.64,1)' })); });

  const rays = [...svg.querySelectorAll('.eye-ray')];
  const mid = (rays.length - 1) / 2;
  rays.forEach((r, i) => {
    const [x, y] = r.dataset.o.split(' ');
    at(r, x, y);
    anims.push(play(r, [{ transform: 'scaleY(0)', opacity: 0 }, { transform: 'scaleY(1)', opacity: 1 }], { duration: 700, delay: 300 + Math.abs(i - mid) * 35 }));
  });

  [...svg.querySelectorAll('.eye-spark')].forEach((s, i) => {
    const [x, y] = s.dataset.o.split(' '); at(s, x, y);
    anims.push(play(s, [{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 500, delay: 600 + i * 60 }));
  });
  anims.push(play(svg, [{ opacity: 1 }, { opacity: 1, offset: 0.55 }, { opacity: 0 }], { duration: 1500, delay: 900, easing: 'ease-in' }));

  // the page appears through an opening iris: a hole in the overlay's mask grows from the centre
  const HOLE_AT = 1150, HOLE_MS = 800;
  const t0 = performance.now();
  const step = (now) => {
    if (done) return;
    const u = (now - t0 - HOLE_AT) / HOLE_MS;
    if (u > 0) gate.style.setProperty('--r', (150 * Math.pow(Math.min(u, 1), 3)).toFixed(2) + 'vmax');
    if (u >= 1) return finish();
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);

  const skip = () => { anims.forEach((a) => a.cancel()); finish(); };
  gate.addEventListener('click', skip);
  addEventListener('keydown', skip, { once: true });
  setTimeout(finish, 4000); // failsafe
})();
