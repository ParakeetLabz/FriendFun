// 🪙 token3d.js — a real 3D spinning token coin, rendered live with Three.js.
// Used in the cinematic "you got a token" cutscene: the coin spins in 3D
// space in the token's own colors, with the token's emoji on its face.
//
// The coin is a real modeled piece, not a flat cylinder: a lathe-built body
// with a beveled rim and a milled (ridged) edge, embossed beaded rims and a
// sunburst of raised rays around the emoji on both faces, richer metal
// materials, and a rarity-colored glow. It pops in, spins with tilt and
// wobble, and throws off sparkles. One coin, one canvas, no per-frame
// allocations.
import * as THREE from 'three';

function emojiTexture(emoji, bg) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = bg || '#ffd700';
  g.beginPath(); g.arc(128, 128, 126, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.85)';
  g.lineWidth = 10;
  g.beginPath(); g.arc(128, 128, 112, 0, Math.PI * 2); g.stroke();
  g.font = '150px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(emoji || '🪙', 128, 138);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Soft round dot, used for the glow sprite and the sparkle points.
function glowTexture(inner, outer) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, inner);
  grad.addColorStop(0.4, outer);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// A lighter/darker shade of a hex color, for the raised metal details.
function shade(hex, amt) {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, amt);
  return c;
}

// Build the coin body: a lathe profile (flat faces, beveled rim) with a
// milled edge — the outermost rim ring is rippled into ridges.
function coinBodyGeometry() {
  const pts = [
    new THREE.Vector2(0.0, -0.20),
    new THREE.Vector2(1.15, -0.20),
    new THREE.Vector2(1.42, -0.14),
    new THREE.Vector2(1.50, 0.0),
    new THREE.Vector2(1.42, 0.14),
    new THREE.Vector2(1.15, 0.20),
    new THREE.Vector2(0.0, 0.20),
  ];
  const geo = new THREE.LatheGeometry(pts, 96);
  // Mill the edge: ripple the outermost rim ring into 64 ridges.
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const r = Math.sqrt(x * x + z * z);
    if (r > 1.43) {
      const a = Math.atan2(z, x);
      const k = 1 + 0.022 * Math.sin(a * 64);
      pos.setX(i, x * k);
      pos.setZ(i, z * k);
    }
  }
  geo.computeVertexNormals();
  return geo;
}

// Start a live 3D coin spinning in `canvas`. Returns a stop() function.
export function startToken3D(canvas, { emoji, color } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0.6, 5.2);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const key = new THREE.DirectionalLight(0xffffff, 1.8);
  key.position.set(3, 5, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 0.9);
  rim.position.set(-4, -2, -3);
  scene.add(rim);

  const coinColor = new THREE.Color(color || '#ffd700');
  const coinHex = '#' + coinColor.getHexString();
  // Rarity-colored wash light so the metal picks up the token's color.
  const wash = new THREE.PointLight(coinColor, 5, 12);
  wash.position.set(0, 1.5, 2.5);
  scene.add(wash);

  const disposables = [];
  const track = (o) => { disposables.push(o); return o; };

  const faceTex = track(emojiTexture(emoji, coinHex));
  const metalMat = track(new THREE.MeshStandardMaterial({ color: coinColor, metalness: 0.9, roughness: 0.28 }));
  const brightMat = track(new THREE.MeshStandardMaterial({ color: shade(coinHex, 0.18), metalness: 0.95, roughness: 0.18 }));
  const faceMat = track(new THREE.MeshStandardMaterial({ map: faceTex, metalness: 0.6, roughness: 0.3 }));

  const coinGroup = new THREE.Group();
  scene.add(coinGroup);

  // Beveled, milled coin body.
  const body = new THREE.Mesh(track(coinBodyGeometry()), metalMat);
  coinGroup.add(body);

  // Emoji faces + raised beaded rim + sunburst rays, on both sides.
  const faceGeo = track(new THREE.CircleGeometry(1.16, 64));
  const rimGeo = track(new THREE.TorusGeometry(1.18, 0.045, 12, 80));
  const rayGeo = track(new THREE.BoxGeometry(0.09, 0.05, 0.34));
  const RAYS = 12;
  for (const side of [1, -1]) {
    const face = new THREE.Mesh(faceGeo, faceMat);
    face.rotation.x = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    face.position.y = side * 0.206;
    coinGroup.add(face);
    const bead = new THREE.Mesh(rimGeo, brightMat);
    bead.rotation.x = Math.PI / 2;
    bead.position.y = side * 0.21;
    coinGroup.add(bead);
    for (let i = 0; i < RAYS; i++) {
      const a = (i / RAYS) * Math.PI * 2;
      const ray = new THREE.Mesh(rayGeo, brightMat);
      ray.position.set(Math.sin(a) * 0.92, side * 0.215, Math.cos(a) * 0.92);
      ray.rotation.y = a;
      coinGroup.add(ray);
    }
  }

  // A soft glow ring behind the coin, in the token's color.
  const ring = new THREE.Mesh(
    track(new THREE.TorusGeometry(2.1, 0.05, 12, 80)),
    track(new THREE.MeshBasicMaterial({ color: coinColor, transparent: true, opacity: 0.65 }))
  );
  scene.add(ring);

  // Big soft halo behind the coin, pulsing with the token's color.
  const haloTex = track(glowTexture('rgba(255,255,255,0.85)', coinHex));
  const halo = new THREE.Sprite(track(new THREE.SpriteMaterial({
    map: haloTex, color: coinColor, transparent: true, opacity: 0.55, depthWrite: false,
  })));
  halo.position.z = -0.8;
  halo.scale.set(6.5, 6.5, 1);
  scene.add(halo);

  // Sparkles: a small cloud of glowing dots orbiting the coin.
  const SPARKS = 42;
  const sparkPos = new Float32Array(SPARKS * 3);
  const sparkBase = new Float32Array(SPARKS * 3);
  const sparkPhase = new Float32Array(SPARKS);
  for (let i = 0; i < SPARKS; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 1.7 + Math.random() * 1.0;
    const y = (Math.random() * 2 - 1) * 1.3;
    sparkBase[i * 3] = Math.cos(a) * r;
    sparkBase[i * 3 + 1] = y;
    sparkBase[i * 3 + 2] = Math.sin(a) * r;
    sparkPhase[i] = Math.random() * Math.PI * 2;
  }
  sparkPos.set(sparkBase);
  const sparkGeo = track(new THREE.BufferGeometry());
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
  const dotTex = track(glowTexture('rgba(255,255,255,1)', 'rgba(255,255,255,0.4)'));
  const sparkMat = track(new THREE.PointsMaterial({
    size: 0.16, map: dotTex, color: 0xffffff, transparent: true, opacity: 0.9,
    depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
  }));
  const sparks = new THREE.Points(sparkGeo, sparkMat);
  scene.add(sparks);

  let raf = 0; let alive = true; let t = 0;
  const resize = () => {
    const w = canvas.clientWidth || 300, h = canvas.clientHeight || 300;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  resize();
  const easeOutBack = (p) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
  };
  const tick = () => {
    if (!alive) return;
    t += 0.016;
    // Pop in with a little overshoot, then settle at full size.
    const pop = Math.min(t / 0.45, 1);
    const s = easeOutBack(pop);
    coinGroup.scale.setScalar(Math.max(s, 0.001));
    // Spin, easing up to full speed over the first second.
    const spin = 0.05 * Math.min(t * 1.5, 1);
    coinGroup.rotation.y += spin;
    // Tilt + wobble instead of a flat spin.
    coinGroup.rotation.x = 0.35 + Math.sin(t * 1.2) * 0.1;
    coinGroup.rotation.z = Math.sin(t * 0.8) * 0.08;
    coinGroup.position.y = Math.sin(t * 2.0) * 0.12;
    // Glow ring: slow turn + pulse.
    ring.rotation.z -= 0.008;
    ring.rotation.x = Math.sin(t * 0.8) * 0.2;
    ring.material.opacity = 0.45 + 0.25 * Math.sin(t * 2.2);
    // Halo breathes with the coin.
    halo.material.opacity = 0.4 + 0.22 * Math.sin(t * 2.2);
    const hs = 6.2 + 0.5 * Math.sin(t * 2.2);
    halo.scale.set(hs, hs, 1);
    // Sparkles drift up and down and orbit the coin.
    sparks.rotation.y += 0.004;
    for (let i = 0; i < SPARKS; i++) {
      sparkPos[i * 3 + 1] = sparkBase[i * 3 + 1] + Math.sin(t * 1.6 + sparkPhase[i]) * 0.18;
    }
    sparkGeo.attributes.position.needsUpdate = true;
    sparkMat.opacity = 0.65 + 0.3 * Math.sin(t * 3.1);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };
  tick();
  window.addEventListener('resize', resize);
  return () => {
    alive = false; cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    for (const d of disposables) d.dispose();
    renderer.dispose();
  };
}
