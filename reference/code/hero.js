/* hero: the artwork comes alive. A depth map (baked from the image) shifts near things more than far things as the
   pointer moves, mist drifts across it, the jar breathes light and stars twinkle. One small WebGL shader.
   Falls back to the plain <img> for reduced motion, no WebGL, or any failure. */
(function () {
  'use strict';
  const { $, reduce } = window.MP;
  const hero = $('[data-hero]');
  if (!hero) return;

  // Framing for the shader. The plain <img> uses the same numbers in CSS, so nothing jumps when the canvas fades in.
  // Art sits with the jar at a fixed spot on screen; there is dark sky above it for the wordmark.
  const JAR = { wide: { fx: 0.498, fy: 0.567, ty: 0.745, iw: 1672, ih: 941 }, tall: { fx: 0.5, fy: 0.525, ty: 0.635, iw: 1024, ih: 1536 } };
  const portrait = () => hero.clientWidth / hero.clientHeight < 0.92;
  function geom(mode, W, H) {
    const J = JAR[mode];
    const base = 0.88 * H / J.ih;
    const s = Math.min(Math.max(W / J.iw, base), base * 1.19); // ultrawide screens get dark side gutters instead of a cropped jar
    const w = J.iw * s, h = J.ih * s;
    let left = 0.5 * W - J.fx * w, top = J.ty * H - J.fy * h;
    left = w >= W ? Math.min(0, Math.max(W - w, left)) : (W - w) / 2;
    if (top + h < H) top = H - h;
    return { left, top, w, h, J };
  }
  // (the plain picture is framed by CSS with the same numbers: see .hero-fallback in sections.css)
  if (reduce) return;
  const canvas = $('.hero-gl', hero);
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) return;

  const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const FRAG = `
precision highp float;
uniform sampler2D uImg,uDepth;
uniform vec2 uRes,uMouse,uJar;
uniform vec4 uRect;          // image rect in css-pixels*dpr: x,y (top-left), w,h
uniform float uTime,uScroll,uAmp,uPortrait;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p*=2.03;a*=.5;}return v;}
void main(){
  vec2 frag=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y);
  vec2 uv=(frag-uRect.xy)/uRect.zw;
  float d=texture2D(uDepth,clamp(uv,0.,1.)).r;
  vec2 shift=uMouse*(d-.32)*uAmp/uRect.zw;
  shift.y*=.55;
  shift.y+=uScroll*(d-.2)*.05;
  vec2 suv=clamp(uv+shift,0.,1.);
  vec3 col=texture2D(uImg,suv).rgb;
  float t=uTime;
  // mist: layered noise drifting slowly, thickest low down and at the left edge
  vec2 mp=uv*vec2(3.4,2.3)+vec2(t*.016,-t*.007);
  float m=fbm(mp+fbm(mp*1.25+t*.02));
  float mask=smoothstep(.42,1.,uv.y)*.5+smoothstep(.32,0.,uv.x)*.75+smoothstep(.7,1.,uv.x)*.3;
  col+=vec3(.5,.68,.16)*m*mask*.34*(1.-col*.55);
  // the jar breathes
  vec2 jd=(uv-uJar)*vec2(uRect.z/uRect.w,1.);
  float pulse=.5+.5*sin(t*.85);
  col+=vec3(.91,.98,.45)*exp(-dot(jd,jd)*(uPortrait>.5?16.:24.))*(.05+.05*pulse);
  // stars, only where the picture is dark sky
  float lum=dot(col,vec3(.3,.59,.11));
  vec2 cell=floor(frag/2.6);
  float h=hash(cell);
  float star=step(.9972,h)*(1.-smoothstep(.06,.22,lum))*smoothstep(.55,.0,uv.y-.05)*(.45+.55*sin(t*(1.4+h*2.)+h*80.));
  col+=vec3(.92,1.,.72)*star*.85;
  // fade the picture into the page at its edges
  float fx=smoothstep(0.,.07,uv.x)*smoothstep(0.,.07,1.-uv.x);
  float fy=smoothstep(-.02,.12,uv.y)*smoothstep(0.,.03,1.-uv.y);
  float a=fx*fy;
  vec3 voidc=vec3(.0196,.0196,.0235);
  // vignette
  vec2 q=gl_FragCoord.xy/uRes-.5; col*=1.-dot(q,q)*.75;
  col=mix(voidc+vec3(.9,1.,.72)*star*.6,col,a);
  gl_FragColor=vec4(col,1.);
}`;

  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  let prog;
  try {
    prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (e) { console.warn('[hero] shader', e); return; }
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {}; for (const n of ['uImg', 'uDepth', 'uRes', 'uMouse', 'uJar', 'uRect', 'uTime', 'uScroll', 'uAmp', 'uPortrait']) U[n] = gl.getUniformLocation(prog, n);

  const load = (src) => new Promise((res, rej) => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = rej; i.src = src; });
  const tex = (unit, image) => {
    const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };

  // which artwork suits this screen: the widescreen plate, or the tall card on phones and portrait windows
  let mode = null;

  async function setMode(m) {
    if (m === mode) return;
    const D = hero.dataset;
    const [a, b] = m === 'tall' ? [D.portrait, D.portraitDepth] : [D.plate, D.depth];
    const [img, dep] = await Promise.all([load(a), load(b)]);
    tex(0, img); tex(1, dep);
    gl.uniform1i(U.uImg, 0); gl.uniform1i(U.uDepth, 1);
    mode = m;
    gl.uniform1f(U.uPortrait, m === 'tall' ? 1 : 0);
  }

  const dprCap = () => Math.min(devicePixelRatio || 1, matchMedia('(max-width: 720px)').matches ? 1.5 : 1.75);
  let W = 0, H = 0;
  function resize() {
    const dpr = dprCap();
    W = Math.round(hero.clientWidth * dpr); H = Math.round(hero.clientHeight * dpr);
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    gl.viewport(0, 0, W, H);
  }
  function layout() {
    const g = geom(mode, W, H);   // canvas pixels
    gl.uniform4f(U.uRect, g.left, g.top, g.w, g.h);
    gl.uniform2f(U.uJar, g.J.fx, g.J.fy);
    gl.uniform1f(U.uAmp, g.w * 0.014);
    gl.uniform2f(U.uRes, W, H);
  }

  let tx = 0, ty = 0, mx = 0, my = 0, lastMove = -1e9, t0 = performance.now(), raf = 0, visible = true, ready = false;
  addEventListener('pointermove', (e) => {
    lastMove = performance.now();
    tx = (e.clientX / innerWidth - 0.5) * 2; ty = (e.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });

  function frame(now) {
    raf = 0;
    if (!visible || document.hidden) return;
    const t = (now - t0) / 1000;
    const idle = now - lastMove > 2500;
    const gx = idle ? Math.sin(t * 0.21) * 0.55 : tx, gy = idle ? Math.cos(t * 0.17) * 0.35 : ty;
    mx += (gx - mx) * 0.045; my += (gy - my) * 0.045;
    const sc = Math.min(1, scrollY / hero.clientHeight);
    gl.uniform2f(U.uMouse, mx, my); gl.uniform1f(U.uTime, t); gl.uniform1f(U.uScroll, sc);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!ready) { ready = true; hero.classList.add('gl-on'); }
    raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf && ready !== null) raf = requestAnimationFrame(frame); };

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }, { threshold: 0.02 }).observe(hero);
  document.addEventListener('visibilitychange', kick);
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); ready = null; hero.classList.remove('gl-on'); cancelAnimationFrame(raf); raf = 0; });

  async function start() {
    resize();
    await setMode(portrait() ? 'tall' : 'wide');
    layout(); kick();
  }
  let rt;
  addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(async () => { resize(); const m = portrait() ? 'tall' : 'wide'; if (m !== mode) { try { await setMode(m); } catch (e) { return; } } layout(); }, 120);
  });
  // let the page paint and settle first; the picture is already on screen, the canvas fades in over it
  const go = () => start().catch((e) => { console.warn('[hero] could not start', e); });
  if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 1800 }); else setTimeout(go, 400);

  // as the page scrolls, the picture lags behind a little (depth) and the copy drifts up and fades
  const media = $('.hero-media', hero), copy = $('.hero-copy', hero);
  window.MP.onScroll(() => {
    const h = hero.clientHeight, y = scrollY;
    if (y > h * 1.1) return;
    const p = Math.min(1, y / h), q = Math.min(1, Math.max(0, (y - 0.12 * h) / (0.88 * h)));
    media.style.transform = `translate3d(0, ${(p * 12).toFixed(2)}%, 0)`;
    copy.style.transform = `translate3d(0, ${(-q * 10).toFixed(2)}%, 0)`;
    copy.style.opacity = (1 - 0.8 * q).toFixed(3);
  });
})();
