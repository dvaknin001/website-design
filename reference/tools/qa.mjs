// Systematic QA: every page x (desktop, phone, reduced-motion). Collects console errors, failed requests, overflow, screenshots.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.argv[2] || 'http://localhost:4173';
const OUT = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\//, '')), 'shots');
fs.mkdirSync(OUT, { recursive: true });
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
if (!CHROME) throw new Error('no chrome');
const pages = ['/', '/flavors/', '/flavors/cosmic-dill/', '/flavors/witchs-amethyst/', '/oracle/', '/about/', '/wholesale/', '/faq/', '/contact/', '/shipping/', '/privacy/', '/terms/', '/nope'];
const profiles = [
  { name: 'desktop', vp: { width: 1440, height: 900, deviceScaleFactor: 1 }, reduce: false },
  { name: 'phone', vp: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, reduce: false },
  { name: 'reduced', vp: { width: 1440, height: 900, deviceScaleFactor: 1 }, reduce: true },
];
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const report = [];
for (const prof of profiles) {
  for (const url of pages) {
    const page = await browser.newPage();
    await page.setViewport(prof.vp);
    if (prof.reduce) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    const errs = [], failed = [];
    page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    page.on('requestfailed', (r) => failed.push(r.url().replace(BASE, '') + ' ' + (r.failure()?.errorText || '')));
    page.on('response', (r) => { if (r.status() >= 400 && !/nope/.test(r.url()) ) failed.push(r.status() + ' ' + r.url().replace(BASE, '')); });
    let status = 0;
    try {
      const res = await page.goto(BASE + url, { waitUntil: 'networkidle2', timeout: 30000 });
      status = res.status();
    } catch (e) { errs.push('goto: ' + e.message); }
    await new Promise((r) => setTimeout(r, url === '/' && !prof.reduce ? 3800 : 1200));
    const m = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth,
      h1: document.querySelectorAll('h1').length, imgNoAlt: [...document.images].filter((i) => !i.hasAttribute('alt')).length,
      title: document.title, gate: document.documentElement.classList.contains('gate'),
      hero: document.querySelector('.hero') ? document.querySelector('.hero').classList.contains('gl-on') : null,
    }));
    const file = `${prof.name}-${(url === '/' ? 'home' : url.replace(/\//g, '_')).replace(/^_|_$/g, '')}.jpg`;
    await page.screenshot({ path: path.join(OUT, file), type: 'jpeg', quality: 70 });
    report.push({ prof: prof.name, url, status, overflow: m.sw > m.cw + 1, h1: m.h1, imgNoAlt: m.imgNoAlt, gate: m.gate, gl: m.hero, errs, failed });
    await page.close();
  }
}
await browser.close();
let bad = 0;
for (const r of report) {
  const issues = [];
  if (r.status !== (r.url === '/nope' ? 404 : 200)) issues.push('status ' + r.status);
  if (r.overflow) issues.push('horizontal overflow');
  if (r.h1 !== 1) issues.push('h1 count ' + r.h1);
  if (r.imgNoAlt) issues.push(r.imgNoAlt + ' img without alt');
  if (r.gate) issues.push('gate stuck');
  if (r.errs.length) issues.push('errors: ' + r.errs.join(' | '));
  if (r.failed.length) issues.push('failed: ' + r.failed.join(' | '));
  if (issues.length) { bad++; console.log(`[${r.prof}] ${r.url}: ${issues.join('; ')}`); }
}
console.log(`\n${report.length} page loads, ${bad} with issues. Screenshots: ${OUT}`);
console.log('home hero WebGL on (desktop/phone/reduced):', report.filter((r) => r.url === '/').map((r) => `${r.prof}=${r.gl}`).join(' '));
