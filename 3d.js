// =====================================================================
// Capa 3D del portfolio de Jesús Olguín
//  1. Escena WebGL: la cámara vuela por un recorrido 3D atado al scroll.
//     Cada sección tiene su "estación" con una pieza que se arma al llegar.
//  2. Secciones que entran y salen inclinándose en perspectiva.
//  3. Tarjetas con tilt 3D que siguen al puntero.
//  4. Fortaleza Roja: túnel de arcos 3D y warp hacia el juego.
// =====================================================================

const REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const GAME_URL = 'https://jesus1942.github.io/fortaleza-roja/';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------------------------------------------------------------------
   2. Secciones con inclinación 3D atada al scroll
   (usa offsetTop/offsetHeight: el layout sin transformar, así no hay
   realimentación entre la transformación y la medición)
   --------------------------------------------------------------------- */
const sections = [...document.querySelectorAll('main > section')];
let secBoxes = [];
function measureSections() {
  secBoxes = sections.map((s) => {
    let top = 0, el = s;
    while (el) { top += el.offsetTop; el = el.offsetParent; }
    return { top, h: s.offsetHeight };
  });
}
function updateSections() {
  if (REDUCE) return;
  const vh = window.innerHeight, y = window.scrollY;
  sections.forEach((s, i) => {
    const b = secBoxes[i]; if (!b) return;
    const top = b.top - y, bottom = top + b.h;
    if (bottom < -vh * 0.2 || top > vh * 1.2) { s.classList.add('is-idle'); return; }
    const e = clamp((top - vh * 0.62) / (vh * 0.38), 0, 1);       // entrando por abajo
    const x = i === sections.length - 1 ? 0
            : clamp((vh * 0.2 - bottom) / (vh * 0.2), 0, 1);       // saliendo por arriba
    s.style.setProperty('--e', e.toFixed(3));
    s.style.setProperty('--x', x.toFixed(3));
    s.classList.toggle('is-leaving', x > 0);
    s.classList.toggle('is-idle', e === 0 && x === 0);
  });
}
sections.forEach((s) => s.classList.add('s3d', 'is-idle'));

/* ---------------------------------------------------------------------
   3. Tilt 3D en tarjetas
   --------------------------------------------------------------------- */
if (!REDUCE) {
  document.querySelectorAll('.glass-hover, .fr-card').forEach((card) => {
    card.classList.add('tilt3d');
    card.addEventListener('pointermove', (ev) => {
      if (ev.pointerType === 'touch') return;
      const r = card.getBoundingClientRect();
      const px = (ev.clientX - r.left) / r.width, py = (ev.clientY - r.top) / r.height;
      const big = r.width > 600 ? 0.45 : 1; // las tarjetas grandes giran menos
      card.style.setProperty('--ry', ((px - 0.5) * 16 * big).toFixed(2) + 'deg');
      card.style.setProperty('--rx', (-(py - 0.5) * 12 * big).toFixed(2) + 'deg');
      card.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
      card.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      card.classList.add('is-tilting', 'was-tilted');
    });
    card.addEventListener('pointerleave', () => {
      card.classList.remove('is-tilting');
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });
}

/* ---------------------------------------------------------------------
   4. Fortaleza Roja: túnel 3D + warp al juego
   --------------------------------------------------------------------- */
function fillArches(host, n, dur) {
  if (!host) return;
  host.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const a = document.createElement('span');
    a.className = 'fr-arch';
    a.style.animationDelay = (-(dur / n) * i).toFixed(2) + 's';
    host.appendChild(a);
  }
}
fillArches(document.getElementById('fr-tunnel'), 9, 6);

const overlay = document.getElementById('fr-overlay');
const frame = document.getElementById('fr-frame');
const playBtn = document.getElementById('fr-play');
const closeBtn = document.getElementById('fr-close');
let gameOpen = false;

function openGame() {
  if (!overlay || gameOpen) return;
  gameOpen = true;
  fillArches(document.getElementById('fr-warp'), 10, 1.1);
  overlay.classList.remove('is-in');
  overlay.hidden = false;
  document.body.classList.add('fr-lock');
  frame.src = GAME_URL;
  const enter = () => { overlay.classList.add('is-in'); try { frame.focus(); } catch (e) {} };
  if (REDUCE) enter(); else setTimeout(enter, 1000);
  closeBtn && closeBtn.focus();
}
function closeGame() {
  if (!overlay || !gameOpen) return;
  gameOpen = false;
  overlay.classList.remove('is-in');
  overlay.hidden = true;
  frame.src = 'about:blank'; // corta el audio y libera la GPU
  document.body.classList.remove('fr-lock');
  playBtn && playBtn.focus();
}
playBtn && playBtn.addEventListener('click', openGame);
closeBtn && closeBtn.addEventListener('click', closeGame);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && gameOpen) closeGame(); });
if (location.hash === '#jugar') window.addEventListener('load', openGame);

/* ---------------------------------------------------------------------
   1. Escena WebGL con recorrido de cámara
   --------------------------------------------------------------------- */
let scene3d = null;

async function initScene() {
  if (REDUCE) return;
  let THREE;
  try {
    THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');
  } catch (e) { return; } // sin red → el sitio sigue funcionando en 2D

  const host = document.getElementById('scene3d');
  if (!host) return;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { return; }
  const small = window.innerWidth < 720;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const BG = new THREE.Color(0x030508), BG_RED = new THREE.Color(0x0d0403);
  scene.fog = new THREE.FogExp2(BG.clone(), 0.022);
  const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 400);

  const CYAN = 0x22d3ee, CYAN_SOFT = 0x67e8f9, BLUE = 0x3b82f6, AMBER = 0xfbbf24,
        VIOLET = 0xa78bfa, RUST = 0xb8361e, EMBER = 0xff8a2a;
  const lineMat = (c, o = 0.55) => new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: o, fog: true });
  // textura circular suave para que los puntos sean redondos (no cuadrados)
  const dotTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.45, 'rgba(255,255,255,.9)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();
  const pointMat = (c, s, o = 0.8) => new THREE.PointsMaterial({ color: c, size: s * 1.6, map: dotTex, alphaTest: 0.02, transparent: true, opacity: o, sizeAttenuation: true, depthWrite: false, fog: true });
  const edges = (geo, c, o) => new THREE.LineSegments(new THREE.EdgesGeometry(geo), lineMat(c, o));

  // ---- Estaciones: una por sección, en orden de página ----
  const ids = sections.map((s, i) => s.id || (i === 0 ? 'hero' : 's' + i));
  const N = ids.length, GAP = 64;
  const stationPos = ids.map((_, i) => new THREE.Vector3(Math.sin(i * 1.25) * 12, Math.cos(i * 0.85) * 4, -i * GAP));
  const sideOf = (i) => (i % 2 === 0 ? 1 : -1); // la pieza se ubica a un costado, alternando

  const builders = {
    hero() {
      const g = new THREE.Group();
      g.add(edges(new THREE.IcosahedronGeometry(6, 1), CYAN, 0.65));
      g.add(edges(new THREE.IcosahedronGeometry(3.2, 0), CYAN_SOFT, 0.5));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(9, 0.04, 6, 120), new THREE.MeshBasicMaterial({ color: BLUE, transparent: true, opacity: 0.5 }));
      ring.rotation.x = Math.PI / 2.4; g.add(ring);
      const pts = []; for (let i = 0; i < 240; i++) { const v = new THREE.Vector3().randomDirection().multiplyScalar(6.2); pts.push(v.x, v.y, v.z); }
      const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      g.add(new THREE.Points(pg, pointMat(CYAN_SOFT, 0.14)));
      g.userData.spin = [0.12, 0.2, 0];
      return g;
    },
    'sobre-mi'() { // red de nodos (IoT)
      const g = new THREE.Group(), nodes = [];
      for (let i = 0; i < 34; i++) nodes.push(new THREE.Vector3().randomDirection().multiplyScalar(3 + Math.random() * 4));
      const seg = [];
      nodes.forEach((a, i) => nodes.forEach((b, j) => { if (j > i && a.distanceTo(b) < 3.6) seg.push(a.x, a.y, a.z, b.x, b.y, b.z); }));
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(seg, 3));
      g.add(new THREE.LineSegments(lg, lineMat(BLUE, 0.45)));
      const pg = new THREE.BufferGeometry(); pg.setFromPoints(nodes);
      g.add(new THREE.Points(pg, pointMat(CYAN_SOFT, 0.35, 0.95)));
      g.userData.spin = [0.05, 0.16, 0];
      return g;
    },
    recorrido() { // engranaje del taller
      const s = new THREE.Shape(), T = 14, R1 = 5.2, R2 = 6.4;
      for (let i = 0; i <= T * 4; i++) {
        const a = (i / (T * 4)) * Math.PI * 2, r = (Math.floor(i / 2) % 2 === 0) ? R2 : R1;
        i === 0 ? s.moveTo(Math.cos(a) * r, Math.sin(a) * r) : s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      const hole = new THREE.Path(); hole.absarc(0, 0, 1.8, 0, Math.PI * 2, true); s.holes.push(hole);
      const geo = new THREE.ExtrudeGeometry(s, { depth: 1.4, bevelEnabled: false, curveSegments: 24 });
      geo.center();
      const g = new THREE.Group();
      g.add(edges(geo, AMBER, 0.6));
      const g2 = edges(geo, AMBER, 0.3); g2.scale.setScalar(0.45); g2.position.set(6.4, 4.8, -1); g.add(g2);
      g.userData.spin = [0, 0, 0.25]; g.userData.child = g2;
      return g;
    },
    skills() { // bloque de cubos (el stack)
      const g = new THREE.Group(), box = new THREE.BoxGeometry(1, 1, 1), n = 4;
      for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) for (let z = 0; z < n; z++) {
        if (Math.random() < 0.35) continue;
        const c = edges(box, [CYAN, VIOLET, BLUE][(x + y + z) % 3], 0.55);
        c.position.set((x - 1.5) * 1.9, (y - 1.5) * 1.9, (z - 1.5) * 1.9);
        c.userData.base = c.position.clone();
        g.add(c);
      }
      g.userData.spin = [0.1, 0.18, 0]; g.userData.wave = true;
      return g;
    },
    proyectos() { // carrusel de tarjetas orbitando
      const g = new THREE.Group(), card = new THREE.PlaneGeometry(3.4, 2.2), k = 10;
      for (let i = 0; i < k; i++) {
        const a = (i / k) * Math.PI * 2, c = edges(card, i % 3 ? CYAN : CYAN_SOFT, 0.6);
        c.position.set(Math.cos(a) * 7, Math.sin(i * 1.7) * 0.8, Math.sin(a) * 7);
        c.lookAt(0, c.position.y, 0);
        g.add(c);
      }
      g.add(edges(new THREE.CylinderGeometry(0.6, 0.6, 5, 12, 1, true), BLUE, 0.35));
      g.rotation.x = 0.25; g.userData.spin = [0, 0.22, 0];
      return g;
    },
    juego() { // la fortaleza roja
      const g = new THREE.Group(), towers = 8, R = 7;
      const tower = new THREE.CylinderGeometry(1.1, 1.3, 5, 8), merlon = new THREE.BoxGeometry(0.6, 0.6, 0.6), wall = new THREE.BoxGeometry(1, 2.6, 0.6);
      for (let i = 0; i < towers; i++) {
        const a = (i / towers) * Math.PI * 2, t = edges(tower, RUST, 0.8);
        t.position.set(Math.cos(a) * R, 0, Math.sin(a) * R); g.add(t);
        for (let m = 0; m < 4; m++) { const mm = edges(merlon, EMBER, 0.7), b = (m / 4) * Math.PI * 2; mm.position.set(t.position.x + Math.cos(b) * 0.9, 2.8, t.position.z + Math.sin(b) * 0.9); g.add(mm); }
        const a2 = ((i + 0.5) / towers) * Math.PI * 2, w = edges(wall, RUST, 0.55), len = 2 * R * Math.sin(Math.PI / towers) - 2;
        w.scale.x = len; w.position.set(Math.cos(a2) * R * Math.cos(Math.PI / towers), -1.2, Math.sin(a2) * R * Math.cos(Math.PI / towers));
        w.rotation.y = -a2 + Math.PI / 2; g.add(w);
      }
      const keep = edges(new THREE.ConeGeometry(2.4, 6, 4), EMBER, 0.7); keep.position.y = 0.6; g.add(keep);
      // brasas que suben
      const E = 220, ep = new Float32Array(E * 3);
      for (let i = 0; i < E; i++) { ep[i * 3] = (Math.random() - 0.5) * 18; ep[i * 3 + 1] = Math.random() * 12 - 3; ep[i * 3 + 2] = (Math.random() - 0.5) * 18; }
      const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.BufferAttribute(ep, 3));
      const embers = new THREE.Points(eg, pointMat(EMBER, 0.22, 0.9)); g.add(embers);
      g.rotation.x = 0.35; g.userData.spin = [0, 0.14, 0]; g.userData.embers = embers; g.userData.red = true;
      return g;
    },
    contacto() { // globo de puntos
      const g = new THREE.Group(), n = 700, pts = [], phi = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < n; i++) { const y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), t = phi * i; pts.push(Math.cos(t) * r * 6, y * 6, Math.sin(t) * r * 6); }
      const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      g.add(new THREE.Points(pg, pointMat(CYAN_SOFT, 0.12, 0.85)));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(7.6, 0.03, 6, 140), new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.45 }));
      ring.rotation.x = Math.PI / 2.1; g.add(ring);
      g.userData.spin = [0, 0.16, 0];
      return g;
    },
    fallback() {
      const g = new THREE.Group();
      g.add(edges(new THREE.TorusKnotGeometry(3.6, 0.9, 90, 10), VIOLET, 0.4));
      g.userData.spin = [0.08, 0.14, 0.04];
      return g;
    },
  };

  const stations = ids.map((id, i) => {
    const obj = (builders[id] || builders.fallback)();
    const p = stationPos[i].clone(); p.x += sideOf(i) * 11; p.z -= 6;
    obj.position.copy(p);
    obj.userData.home = p.clone();
    scene.add(obj);
    return obj;
  });

  // ---- Polvo / estrellas a lo largo del recorrido ----
  const D = small ? 900 : 1800, dp = new Float32Array(D * 3);
  for (let i = 0; i < D; i++) { dp[i * 3] = (Math.random() - 0.5) * 90; dp[i * 3 + 1] = (Math.random() - 0.5) * 50; dp[i * 3 + 2] = 30 - Math.random() * (N * GAP + 60); }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dust = new THREE.Points(dg, pointMat(0xbfe9f5, 0.09, 0.55)); scene.add(dust);

  // ---- Recorrido de cámara (curvas suaves entre estaciones) ----
  const camPts = stationPos.map((p, i) => new THREE.Vector3(p.x - sideOf(i) * 2, p.y + 1.5, p.z + 24));
  const camCurve = new THREE.CatmullRomCurve3(camPts, false, 'catmullrom', 0.4);
  // La cámara no mira la pieza de frente: mira un punto corrido hacia el centro,
  // así la pieza queda a un costado de la pantalla y no tapa el texto.
  // En pantallas angostas se acerca más al centro (detrás del contenido, tenue).
  let lookCurve;
  function buildLook() {
    const aspect = window.innerWidth / window.innerHeight;
    const f = aspect > 1 ? 0.76 : 0.6;                   // posición horizontal deseada (0..1)
    const halfW = 30 * Math.tan((58 / 2) * Math.PI / 180) * aspect;
    const pts = stations.map((s, i) => {
      const h = s.userData.home, side = sideOf(i);
      return new THREE.Vector3(h.x - side * (f - 0.5) * 2 * halfW, h.y, h.z);
    });
    lookCurve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.4);
  }
  buildLook();

  let uTarget = 0, u = 0, mx = 0, my = 0, smx = 0, smy = 0;
  function computeTarget() {
    const yc = window.scrollY + window.innerHeight * 0.5;
    const centers = secBoxes.map((b) => b.top + b.h * 0.5);
    let k = 0;
    if (yc <= centers[0]) { uTarget = 0; return; }
    if (yc >= centers[N - 1]) { uTarget = 1; return; }
    while (k < N - 2 && yc > centers[k + 1]) k++;
    const f = clamp((yc - centers[k]) / (centers[k + 1] - centers[k]), 0, 1);
    // ease: se "detiene" un poco en cada estación y acelera en el tránsito
    const ef = f < 0.5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2;
    uTarget = (k + ef) / (N - 1);
  }
  window.addEventListener('pointermove', (e) => {
    mx = (e.clientX / window.innerWidth) * 2 - 1; my = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  const tmpC = new THREE.Vector3(), tmpL = new THREE.Vector3(), fogCol = new THREE.Color();
  const juegoIdx = ids.indexOf('juego');
  let running = true, last = performance.now();

  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const t = now / 1000;
    u += (uTarget - u) * Math.min(1, dt * 3.2);
    smx += (mx - smx) * Math.min(1, dt * 2.5); smy += (my - smy) * Math.min(1, dt * 2.5);

    camCurve.getPoint(clamp(u, 0, 1), tmpC);
    lookCurve.getPoint(clamp(u + 0.012, 0, 1), tmpL);
    camera.position.set(tmpC.x + smx * 2.2, tmpC.y - smy * 1.4, tmpC.z);
    camera.lookAt(tmpL);
    // leve alabeo en los tránsitos: da sensación de vuelo
    camera.rotation.z += (uTarget - u) * 2.4;

    const su = u * (N - 1);
    stations.forEach((s, i) => {
      const near = 1 - clamp(Math.abs(su - i), 0, 1);  // 1 = estamos en esta estación
      const sp = s.userData.spin;
      s.rotation.x += sp[0] * dt * (0.4 + near); s.rotation.y += sp[1] * dt * (0.4 + near); s.rotation.z += sp[2] * dt * (0.4 + near);
      const sc = 0.55 + 0.45 * (near * near * (3 - 2 * near));
      s.scale.setScalar(sc);
      s.position.y = s.userData.home.y + Math.sin(t * 0.7 + i) * 0.5;
      if (s.userData.child) s.userData.child.rotation.z -= dt * 0.6;
      if (s.userData.wave) s.children.forEach((c, j) => { const b = c.userData.base; if (b) c.position.set(b.x * (1 + near * 0.25 + Math.sin(t * 1.6 + j) * 0.04), b.y * (1 + near * 0.25), b.z * (1 + near * 0.25)); });
      if (s.userData.embers) {
        const a = s.userData.embers.geometry.attributes.position;
        for (let j = 0; j < a.count; j++) { let y = a.getY(j) + dt * (1.2 + (j % 5) * 0.3); if (y > 10) y = -3; a.setY(j, y); }
        a.needsUpdate = true;
      }
    });

    // niebla: vira al rojo cerca de la fortaleza
    const red = juegoIdx >= 0 ? 1 - clamp(Math.abs(su - juegoIdx) * 1.4, 0, 1) : 0;
    fogCol.copy(BG).lerp(BG_RED, red); scene.fog.color.copy(fogCol);
    dust.material.color.setHex(red > 0.5 ? 0xffc39a : 0xbfe9f5);

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    buildLook();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', resize);

  scene3d = {
    computeTarget,
    pause() { running = false; },
    resume() { if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } },
  };
  computeTarget(); u = uTarget;
  requestAnimationFrame(frame);
  requestAnimationFrame(() => host.classList.add('is-ready'));
}

/* ---------------------------------------------------------------------
   Bucle de scroll compartido
   --------------------------------------------------------------------- */
let ticking = false;
function onScroll() {
  if (ticking) return; ticking = true;
  requestAnimationFrame(() => { ticking = false; updateSections(); scene3d && scene3d.computeTarget(); });
}
function remeasure() { measureSections(); onScroll(); }
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', remeasure);
window.addEventListener('load', remeasure);
if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe(document.querySelector('main'));
remeasure();

document.addEventListener('visibilitychange', () => {
  if (!scene3d) return;
  document.hidden || gameOpen ? scene3d.pause() : scene3d.resume();
});
// mientras se juega, la GPU es para el juego
if (playBtn) playBtn.addEventListener('click', () => scene3d && scene3d.pause());
if (closeBtn) closeBtn.addEventListener('click', () => scene3d && scene3d.resume());
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && scene3d && !gameOpen) scene3d.resume(); });

initScene();
