import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

let renderer, scene, camera, heart, material, host, active = false, frame, drag, currentSticker = null;
let targetRotation = -.13, rotationX = -.07, reduced, announce, stickerObjects = [];
let config = { color: '#e9d5b1', material: 'pearl', stickers: [] };
const palette = ['#e9d5b1','#efceca','#a9c7d0','#faf5e9','#813f4b'];
const raycaster = new THREE.Raycaster(), mouse = new THREE.Vector2();
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
function store() { try { localStorage.setItem('wu-liu-heart', JSON.stringify(config)); } catch {} }
function syncMaterial() {
  material.color.set(config.color);
  const m = config.material;
  material.metalness = m === 'gold' ? .92 : m === 'pearl' ? .28 : .05;
  material.roughness = m === 'gold' ? .21 : m === 'pearl' ? .22 : .3;
  material.clearcoat = m === 'gold' ? .45 : 1;
  material.iridescence = m === 'pearl' ? .23 : 0;
  material.needsUpdate = true;
  $$('.swatch').forEach(el => { el.classList.toggle('selected', el.dataset.color === config.color); el.setAttribute('aria-pressed', String(el.dataset.color === config.color)); });
  $$('[data-material]').forEach(el => { el.classList.toggle('selected', el.dataset.material === config.material); el.setAttribute('aria-pressed', String(el.dataset.material === config.material)); });
  draw();
}
function addSticker(record) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = record.symbol === '22' ? '600 125px serif' : '160px serif';
  ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 3; ctx.fillStyle = '#947448'; ctx.fillText(record.symbol, 128, 137);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(.34,.34), new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, side: THREE.DoubleSide }));
  mesh.position.fromArray(record.position);
  const normal = new THREE.Vector3().fromArray(record.normal).normalize();
  mesh.position.addScaledVector(normal, .009);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1), normal);
  heart.add(mesh); stickerObjects.push(mesh);
}
function disposeSticker(mesh) { heart.remove(mesh); mesh.geometry.dispose(); mesh.material.map.dispose(); mesh.material.dispose(); }
function draw() {
  if (!renderer || !host.clientWidth || !host.clientHeight) return;
  heart.rotation.y = targetRotation; heart.rotation.x = rotationX;
  renderer.render(scene, camera);
}
function loop(time) {
  if (!active) return;
  if (!reduced && !drag) heart.position.y = Math.sin(time * .00075) * .035;
  draw();
  if (!reduced) frame = requestAnimationFrame(loop);
}
export function setActive(value) {
  active = value; cancelAnimationFrame(frame);
  if (active && renderer) { resize(); if (reduced) draw(); else frame = requestAnimationFrame(loop); }
}
function resize() {
  const width = host.clientWidth, height = host.clientHeight;
  if (!width || !height) return;
  renderer.setSize(width, height); camera.aspect = width / height;
  camera.position.z = camera.aspect < .9 ? 5.8 : 4.8;
  camera.updateProjectionMatrix(); draw();
}
export function initHeart({ toast, reduceMotion }) {
  if (renderer) return;
  announce = toast; reduced = reduceMotion; host = $('#heart-canvas');
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.25;
  host.appendChild(renderer.domElement);
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(37, 1, .1, 100); camera.position.set(0, .05, 4.8);
  const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .05); scene.environment = environment.texture; room.dispose(); pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb7a783, 2));
  const key = new THREE.DirectionalLight(0xfff4db, 4); key.position.set(-3,5,4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 3); rim.position.set(4,1,-3); scene.add(rim);
  const shape = new THREE.Shape();
  shape.moveTo(0,.58);
  shape.bezierCurveTo(-.23,1.05,-1.05,1.03,-1.05,.36);
  shape.bezierCurveTo(-1.05,-.18,-.52,-.59,0,-1.03);
  shape.bezierCurveTo(.52,-.59,1.05,-.18,1.05,.36);
  shape.bezierCurveTo(1.05,1.03,.23,1.05,0,.58);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth:.3, bevelEnabled:true, bevelSegments:12, steps:1, bevelSize:.18, bevelThickness:.23, curveSegments:60 });
  geometry.center(); geometry.computeVertexNormals();
  material = new THREE.MeshPhysicalMaterial({ color: config.color, metalness:.28, roughness:.22, clearcoat:1, clearcoatRoughness:.08, iridescence:.23, iridescenceIOR:1.3, envMapIntensity:1.3 });
  heart = new THREE.Mesh(geometry, material); scene.add(heart);
  try {
    const saved = JSON.parse(localStorage.getItem('wu-liu-heart'));
    if (saved && palette.includes(saved.color) && ['pearl','gold','porcelain'].includes(saved.material)) {
      config.color = saved.color; config.material = saved.material;
      config.stickers = Array.isArray(saved.stickers) ? saved.stickers.filter(s => ['✧','♡','22'].includes(s.symbol) && Array.isArray(s.position) && s.position.length === 3 && s.position.every(n => Number.isFinite(n) && Math.abs(n) < 2) && Array.isArray(s.normal) && s.normal.length === 3 && s.normal.every(n => Number.isFinite(n) && Math.abs(n) <= 1)).slice(0,22) : [];
    }
  } catch {}
  config.stickers.forEach(addSticker); syncMaterial();
  $$('.swatch').forEach(button => button.addEventListener('click', () => { config.color = button.dataset.color; syncMaterial(); store(); }));
  $$('[data-material]').forEach(button => button.addEventListener('click', () => { config.material = button.dataset.material; syncMaterial(); store(); }));
  $$('[data-sticker]').forEach(button => button.addEventListener('click', () => {
    currentSticker = currentSticker === button.dataset.sticker ? null : button.dataset.sticker;
    $$('[data-sticker]').forEach(el => { el.classList.toggle('selected', el.dataset.sticker === currentSticker); el.setAttribute('aria-pressed', String(el.dataset.sticker === currentSticker)); });
    $('#heart-hint').textContent = currentSticker ? '輕觸愛心表面，留下你的記號' : '拖曳旋轉 · 選擇記號後點擊愛心';
  }));
  $('#undo-sticker').addEventListener('click', () => { if (!stickerObjects.length) return; disposeSticker(stickerObjects.pop()); config.stickers.pop(); store(); draw(); });
  $('#clear-stickers').addEventListener('click', () => { stickerObjects.forEach(disposeSticker); stickerObjects = []; config.stickers = []; store(); draw(); announce('已清除點綴，心意依然如初'); });
  $('#heart-reset').addEventListener('click', () => { targetRotation = -.13; rotationX = -.07; draw(); });
  host.addEventListener('pointerdown', e => { drag = { x:e.clientX, y:e.clientY, startX:e.clientX, startY:e.clientY, moved:false }; host.setPointerCapture(e.pointerId); });
  host.addEventListener('pointermove', e => {
    if (!drag) return;
    if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 6) drag.moved = true;
    if (drag.moved) { targetRotation += (e.clientX - drag.x) * .008; rotationX = THREE.MathUtils.clamp(rotationX + (e.clientY - drag.y) * .006, -.75, .75); }
    drag.x = e.clientX; drag.y = e.clientY; draw();
  });
  host.addEventListener('pointerup', e => {
    if (drag && !drag.moved && currentSticker) {
      if (config.stickers.length >= 22) { announce('已收藏 22 個記號，請先復原或清除再加入'); drag = null; return; }
      const rect = host.getBoundingClientRect();
      mouse.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1);
      raycaster.setFromCamera(mouse, camera); heart.updateMatrixWorld();
      const hit = raycaster.intersectObject(heart, false)[0];
      if (hit) {
        const position = heart.worldToLocal(hit.point.clone());
        const record = { symbol:currentSticker, position:position.toArray(), normal:hit.face.normal.toArray() };
        config.stickers.push(record); addSticker(record); store(); draw();
      }
    }
    drag = null;
  });
  host.addEventListener('pointercancel', () => drag = null);
  host.tabIndex = 0;
  host.setAttribute('aria-label', '立體愛心：拖曳或使用方向鍵旋轉；選擇記號後點擊，或按 Enter 在正面加入');
  host.addEventListener('keydown', e => {
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
      e.preventDefault(); if (e.key === 'ArrowLeft') targetRotation -= .15; if (e.key === 'ArrowRight') targetRotation += .15;
      if (e.key === 'ArrowUp') rotationX = Math.max(-.75, rotationX - .1); if (e.key === 'ArrowDown') rotationX = Math.min(.75, rotationX + .1); draw();
    }
    if (e.key === 'Enter' && currentSticker && config.stickers.length < 22) {
      const record = { symbol:currentSticker, position:[0,-.1,.38], normal:[0,0,1] };
      config.stickers.push(record); addSticker(record); store(); draw(); announce('已在愛心正面加入記號');
    }
  });
  $('#save-heart').addEventListener('click', async () => {
    draw();
    const canvas = document.createElement('canvas'); canvas.width = 1400; canvas.height = 1400;
    const ctx = canvas.getContext('2d'); const gradient = ctx.createRadialGradient(700,580,40,700,700,900); gradient.addColorStop(0,'#fffdfa'); gradient.addColorStop(1,'#eee8dc'); ctx.fillStyle = gradient; ctx.fillRect(0,0,1400,1400);
    const source = renderer.domElement, scale = Math.min(1220 / source.width, 1000 / source.height), w = source.width * scale, h = source.height * scale;
    ctx.drawImage(source,(1400-w)/2,90+(1000-h)/2,w,h);
    await document.fonts.ready;
    ctx.fillStyle = '#9b8254'; ctx.textAlign = 'center'; ctx.font = '600 35px "Noto Serif TC", serif'; ctx.fillText('吳文勝 · 劉翊鈴',700,1160);
    ctx.font = '500 18px Cinzel, serif'; ctx.fillText('XXII · ALWAYS, AND ALL WAYS.',700,1210);
    ctx.strokeStyle = '#c8b891'; ctx.strokeRect(45,45,1310,1310);
    canvas.toBlob(blob => {
      if (!blob) { announce('下載未完成，請再試一次'); return; }
      const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'Wu-Liu-22nd-Eternal-Heart.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url),5000); announce('已珍藏專屬愛心，設計也會保留在此瀏覽器');
    },'image/png');
  });
  new ResizeObserver(resize).observe(host);
  resize();
}
