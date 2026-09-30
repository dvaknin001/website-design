import puppeteer from 'puppeteer-core';
const url = process.argv[2] || 'http://localhost:4173/';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
for (const [label, skipGate] of [['first visit (gate plays)', false], ['repeat visit (no gate)', true]]) {
  const p = await b.newPage();
  await p.setViewport({ width: 412, height: 823, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  if (skipGate) await p.evaluateOnNewDocument(() => sessionStorage.setItem('mp_gate', '1'));
  await p.evaluateOnNewDocument(() => {
    window.__perf = { lcp: [], fcp: 0 };
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__perf.lcp.push([Math.round(e.startTime), e.element ? e.element.className || e.element.tagName : '?']); }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') window.__perf.fcp = Math.round(e.startTime); }).observe({ type: 'paint', buffered: true });
  });
  await p.goto(url, { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 4200));
  const r = await p.evaluate(() => window.__perf);
  console.log(label.padEnd(26), 'FCP', r.fcp, 'ms   LCP candidates:', JSON.stringify(r.lcp));
  await p.close();
}
await b.close();
