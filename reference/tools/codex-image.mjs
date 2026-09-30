#!/usr/bin/env node
/*
  Image generation through the OpenAI Codex CLI (its built-in image_gen tool, run by a GPT model).
  The model is handed the brand references (logo + hero artwork) so every new image matches the brand.

    node tools/codex-image.mjs batch _config/art/shots.json [--only id,id] [--workers 6] [--force]
    node tools/codex-image.mjs one <out.png> "<what to draw>" [--ref file]... [--aspect portrait|wide|square]
    node tools/codex-image.mjs flavor --name "..." --slug ... --world "..." [--contents "..."] [--accent "#RRGGBB"]
    node tools/codex-image.mjs list                     (shot ids and whether they exist yet)

  Needs the Codex CLI installed and signed in (`npm i -g @openai/codex`, then `codex login`).
  Read stages/02-art/CONTEXT.md first. Codex is a cloud call, so several shots run in parallel.

  How it works (learned the hard way, do not "simplify"):
    * `codex exec` opens a NEW session per call and prints "session id: <uuid>"; that session's images land in
      <CODEX_HOME or ~/.codex>/generated_images/<uuid>/. We copy only from our own session folder, which makes
      parallel runs safe.
    * The prompt MUST come before the -i flags (-i is variadic and swallows trailing arguments).
    * Run node + codex.js directly. The npm .cmd shim on Windows drops -i paths that contain spaces.
    * stdin must be closed or codex waits on "Reading additional input from stdin".
*/
import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CODEX_HOME = process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
const GEN_DIR = path.join(CODEX_HOME, 'generated_images');
const MODEL = process.env.CODEX_IMG_MODEL || 'gpt-5.5';

/* ---------- args ---------- */
const argv = process.argv.slice(2);
const cmd = argv.shift();
const flags = { ref: [] };
const pos = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--ref') flags.ref.push(argv[++i]);
  else if (a.startsWith('--')) { const k = a.slice(2); const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; flags[k] = v; }
  else pos.push(a);
}

/* ---------- launcher ---------- */
function launcher() {
  try {
    const npmRoot = execSync('npm root -g', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    const js = path.join(npmRoot, '@openai', 'codex', 'bin', 'codex.js');
    if (fs.existsSync(js)) return [process.execPath, js];
  } catch { /* fall through */ }
  const winJs = path.join(os.homedir(), 'AppData', 'Roaming', 'npm', 'node_modules', '@openai', 'codex', 'bin', 'codex.js');
  if (fs.existsSync(winJs)) return [process.execPath, winJs];
  return [process.platform === 'win32' ? 'codex.cmd' : 'codex'];
}

const listPngs = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /\.png$/i.test(f)).map((f) => path.join(dir, f)) : []);

function runCodex(prompt, refs, timeoutMs = 15 * 60 * 1000) {
  return new Promise((resolve, reject) => {
    const [bin, ...pre] = launcher();
    const args = [...pre, 'exec', '--skip-git-repo-check', '-m', MODEL, prompt];
    for (const r of refs) args.push('-i', r);
    // run from a throwaway folder: the agent sometimes saves an extra copy of the image into its working directory
    const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'mp-codex-'));
    const child = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'], cwd: scratch });
    child.on('close', () => fs.rmSync(scratch, { recursive: true, force: true }));
    let log = '';
    child.stdout.on('data', (d) => (log += d));
    child.stderr.on('data', (d) => (log += d));
    const timer = setTimeout(() => { child.kill(); reject(new Error('codex timed out')); }, timeoutMs);
    child.on('error', (e) => { clearTimeout(timer); reject(e); });
    child.on('close', () => { clearTimeout(timer); resolve(log); });
  });
}

const STYLE_FILE = path.join(ROOT, '_config', 'art', 'style-lock.md');
const styleLock = () => fs.readFileSync(STYLE_FILE, 'utf8').replace(/^#.*\n/gm, '').trim();

const ASPECT = {
  portrait: 'Tall 2:3 portrait orientation (like a tarot card).',
  wide: 'Wide 16:9 landscape orientation, cinematic widescreen.',
  square: 'Square 1:1 orientation.',
  poster: '4:5 portrait orientation.',
};

function buildPrompt(shot, refs) {
  const list = refs.map((r, i) => `Reference image ${i + 1}: ${path.basename(r)}`).join('; ');
  return [
    styleLock(),
    '',
    'THIS IMAGE:',
    shot.prompt.trim(),
    '',
    'FORMAT: ' + (ASPECT[shot.aspect] || ASPECT.portrait),
    '',
    'Generate this image with your built-in image_gen tool NOW and save it. Pass these exact files, in this order, as ' +
      `referenced_image_paths: ${refs.join('; ')}. (${list}.) This is a non-interactive batch job: the same reference images are ` +
      'also attached to this message, so never ask a question or request attachments. Reference 1 is always the Mythical Pickles ' +
      'logo and reference 2 the hero artwork; treat them as brand authority and never replace or redraw the logo.',
  ].join('\n');
}

async function generate(shot, outAbs, refs, { quiet } = {}) {
  const prompt = buildPrompt(shot, refs);
  fs.mkdirSync(path.dirname(outAbs), { recursive: true });
  fs.writeFileSync(outAbs + '.request.txt', prompt + '\n');
  const t0 = Date.now();
  for (let attempt = 1; attempt <= 2; attempt++) {
    const log = await runCodex(prompt, refs);
    const sid = (log.match(/session id:\s*([0-9a-fA-F-]{20,})/) || [])[1];
    const pngs = sid ? listPngs(path.join(GEN_DIR, sid)) : [];
    if (pngs.length) {
      const pick = pngs.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
      fs.copyFileSync(pick, outAbs);
      fs.writeFileSync(outAbs + '.codexlog.txt', `picked: ${pick}\nsession: ${sid}\nattempt: ${attempt}\n`);
      fs.rmSync(outAbs + '.request.txt', { force: true });
      if (!quiet) console.log(`saved ${path.relative(ROOT, outAbs)} (${Math.round(fs.statSync(outAbs).size / 1024)} KB, ${Math.round((Date.now() - t0) / 1000)}s)`);
      return outAbs;
    }
    fs.writeFileSync(outAbs + `.attempt${attempt}.FAILED.txt`, log);
  }
  throw new Error(`codex produced no image for ${path.basename(outAbs)} (see ${path.basename(outAbs)}.attemptN.FAILED.txt)`);
}

const abs = (p) => (path.isAbsolute(p) ? p : path.join(ROOT, p));

async function batch(file) {
  const cfg = JSON.parse(fs.readFileSync(abs(file), 'utf8'));
  const base = (cfg.baseRefs || []).map(abs);
  const only = flags.only ? String(flags.only).split(',') : null;
  const workers = Number(flags.workers || process.env.CODEX_WORKERS || 6);
  let todo = cfg.shots.filter((s) => !only || only.includes(s.id));
  const skipped = todo.filter((s) => !flags.force && fs.existsSync(abs(s.out)));
  todo = todo.filter((s) => !skipped.includes(s));
  console.log(`codex batch: ${todo.length} to make, ${skipped.length} already exist, ${workers} workers, model ${MODEL}`);
  const ok = [], fail = [];
  let idx = 0;
  const worker = async () => {
    while (idx < todo.length) {
      const shot = todo[idx++];
      const refs = [...base, ...(shot.refs || []).map(abs)];
      try { await generate(shot, abs(shot.out), refs); ok.push(shot.id); }
      catch (e) { fail.push(shot.id); console.error(`FAIL ${shot.id}: ${e.message}`); }
    }
  };
  await Promise.all(Array.from({ length: Math.min(workers, todo.length) }, worker));
  console.log(`done. ok=${ok.length} failed=${fail.length}${fail.length ? ' -> ' + fail.join(', ') : ''}`);
  if (fail.length) process.exit(1);
}

async function one() {
  const [out, text] = pos;
  if (!out || !text) { console.error('usage: codex-image.mjs one <out.png> "<prompt>" [--ref file]... [--aspect portrait|wide|square]'); process.exit(2); }
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, '_config', 'art', 'shots.json'), 'utf8'));
  const refs = [...(cfg.baseRefs || []).map(abs), ...flags.ref.map(abs)];
  await generate({ prompt: text, aspect: flags.aspect || 'portrait' }, abs(out), refs);
}

function list() {
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, '_config', 'art', 'shots.json'), 'utf8'));
  for (const s of cfg.shots) console.log(`${fs.existsSync(abs(s.out)) ? 'have   ' : 'MISSING'}  ${s.id.padEnd(28)} ${s.aspect.padEnd(9)} ${s.out}`);
}

/* A new flavor: its tall card first, then its wide scene made from the card so the jar and label match. */
async function flavor() {
  const need = ['name', 'slug', 'world'];
  const missing = need.filter((k) => !flags[k] || flags[k] === true);
  if (missing.length || !/^[a-z0-9-]+$/.test(flags.slug || '')) {
    console.error('usage: codex-image.mjs flavor --name "Smoky Serpent" --slug smoky-serpent --world "a moonlit swamp with fireflies" [--contents "sliced pickles with smoked paprika"] [--accent "#88CC44"]');
    console.error(missing.length ? `missing: ${missing.join(', ')}` : 'slug must be lowercase letters, numbers and dashes');
    process.exit(2);
  }
  const name = String(flags.name), slug = flags.slug, world = String(flags.world);
  const contents = flags.contents && flags.contents !== true ? String(flags.contents) : '';
  const accent = flags.accent && flags.accent !== true ? String(flags.accent) : '#E9FA72';
  const label = name.toUpperCase();
  const cardOut = `assets/art/raw/card-${slug}.png`, sceneOut = `assets/art/raw/scene-${slug}.png`;
  const card = {
    id: `card-${slug}`, aspect: 'portrait', out: cardOut,
    prompt: `Flavour: ${label}. The jar stands dead centre, filling about 45 percent of the frame height, label reading exactly ${label}. ${contents ? `What is in the jar: ${contents}. ` : ''}Setting: ${world}. Accent glow colour: ${accent}, with a hint of chartreuse from the label. Vertical tarot-card composition with calm dark space at the top.`,
  };
  const scene = {
    id: `scene-${slug}`, aspect: 'wide', out: sceneOut, refs: [cardOut],
    prompt: `Reference image 3 is the portrait card art for this exact flavour. Make the WIDESCREEN (16:9) version of the same world: the identical jar with the identical label reading exactly ${label}, the same contents, the same setting (${world}). Recompose for a wide frame: the jar stands on the RIGHT third of the frame (its centre at about 68 percent of the width), filling about 60 percent of the frame height. The LEFT half is darker, calmer atmosphere with soft glow, deliberately low on detail and clutter, because a large headline will sit there. Keep the accent glow colour of the portrait card.`,
  };
  // remember the prompts so the images can be remade later
  const shotsPath = path.join(ROOT, '_config', 'art', 'shots.json');
  const cfg = JSON.parse(fs.readFileSync(shotsPath, 'utf8'));
  for (const s of [card, scene]) if (!cfg.shots.some((x) => x.id === s.id)) cfg.shots.push(s);
  fs.writeFileSync(shotsPath, JSON.stringify(cfg, null, 2) + '\n');
  const base = (cfg.baseRefs || []).map(abs);
  await generate(card, abs(cardOut), base);
  await generate(scene, abs(sceneOut), [...base, abs(cardOut)]);
  console.log('\nNow: LOOK at both images (label spelling, nothing cut off, no stray text). Then run: npm run images');
  console.log('And in content/flavors.json for this flavor set:\n  "images": { "card": "card-' + slug + '", "scene": "scene-' + slug + '" },\n  "accent": "' + accent + '"');
}

if (cmd === 'batch') await batch(pos[0] || '_config/art/shots.json');
else if (cmd === 'one') await one();
else if (cmd === 'flavor') await flavor();
else if (cmd === 'list') list();
else { console.log('commands: batch | one | flavor | list  (see the header of this file)'); process.exit(cmd ? 2 : 0); }
