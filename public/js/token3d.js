// 🪙 token3d.js — a real 3D spinning token coin, rendered live with Three.js.
// Used in the cinematic "you got a token" cutscene: the coin spins in 3D
// space in the token's own colors, with the token's emoji on its face.
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

// Start a live 3D coin spinning in `canvas`. Returns a stop() function.
export function startToken3D(canvas, { emoji, color } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0.6, 5.2);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 5, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 0.9);
  rim.position.set(-4, -2, -3);
  scene.add(rim);

  const coinColor = new THREE.Color(color || '#ffd700');
  const faceTex = emojiTexture(emoji, '#' + coinColor.getHexString());
  const edgeMat = new THREE.MeshStandardMaterial({ color: coinColor, metalness: 0.85, roughness: 0.25 });
  const faceMat = new THREE.MeshStandardMaterial({ map: faceTex, metalness: 0.55, roughness: 0.35 });
  // Cylinder: [side, top, bottom] materials.
  const coin = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.28, 64), [edgeMat, faceMat, faceMat]);
  coin.rotation.x = Math.PI / 2 - 0.35;
  scene.add(coin);
  // A soft glow ring behind the coin.
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.1, 0.05, 12, 80),
    new THREE.MeshBasicMaterial({ color: coinColor, transparent: true, opacity: 0.65 })
  );
  scene.add(ring);

  let raf = 0; let alive = true; let t = 0;
  const resize = () => {
    const w = canvas.clientWidth || 300, h = canvas.clientHeight || 300;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  resize();
  const tick = () => {
    if (!alive) return;
    t += 0.016;
    coin.rotation.z += 0.045;
    coin.position.y = Math.sin(t * 2.2) * 0.12;
    ring.rotation.z -= 0.008;
    ring.rotation.x = Math.sin(t * 0.8) * 0.2;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };
  tick();
  window.addEventListener('resize', resize);
  return () => {
    alive = false; cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    coin.geometry.dispose(); faceTex.dispose();
    edgeMat.dispose(); faceMat.dispose(); ring.geometry.dispose(); ring.material.dispose();
    renderer.dispose();
  };
}
