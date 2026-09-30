import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
for (const [w, h] of [[1440, 900], [1920, 1080], [2560, 1080], [1280, 720], [390, 844], [768, 1024], [1024, 1366]]) {
  const p = await b.newPage(); await p.setViewport({ width: w, height: h });
  await p.evaluateOnNewDocument(() => sessionStorage.setItem('mp_gate', '1'));
  await p.goto('http://localhost:4173/', { waitUntil: 'load' }); await new Promise((r) => setTimeout(r, 300));
  const r = await p.evaluate(() => {
    const hero = document.querySelector('.hero'), fb = document.querySelector('.hero-fallback');
    const W = hero.clientWidth, H = hero.clientHeight, tall = W / H < 0.92;
    const J = tall ? { fx: 0.5, fy: 0.525, ty: 0.635, iw: 1024, ih: 1536 } : { fx: 0.498, fy: 0.567, ty: 0.745, iw: 1672, ih: 941 };
    const base = 0.88 * H / J.ih, s = Math.min(Math.max(W / J.iw, base), base * 1.19), gw = J.iw * s, gh = J.ih * s;
    let left = 0.5 * W - J.fx * gw, top = J.ty * H - J.fy * gh;
    left = gw >= W ? Math.min(0, Math.max(W - gw, left)) : (W - gw) / 2; if (top + gh < H) top = H - gh;
    const r = fb.getBoundingClientRect(); const hr = hero.getBoundingClientRect();
    return { css: [r.left, r.top - hr.top, r.width, r.height].map((v) => Math.round(v)), js: [left, top, gw, gh].map((v) => Math.round(v)) };
  });
  const d = r.css.map((v, i) => Math.abs(v - r.js[i])); console.log(`${w}x${h}`.padEnd(10), 'css', JSON.stringify(r.css), 'js', JSON.stringify(r.js), 'max diff', Math.max(...d), 'px');
  await p.close();
}
await b.close();
