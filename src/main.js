import './style.css';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = matchMedia('(max-width: 700px)');
let currentScene = 'cover', opening = false, heartModule, heartLoading;
const validScenes = ['cover', 'dolls', 'album', 'heart'];
const media = (name) => `${import.meta.env.BASE_URL}media/${name}`;
// Relative URLs also support a repository-name GitHub Pages deployment.
$$('.doll-image').forEach((img, i) => img.src = media(`doll-0${i + 1}.webp`));
function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => $('#toast').classList.remove('show'), 3200);
}
async function showScene(name, updateHash = true) {
  if (!validScenes.includes(name)) name = 'cover';
  currentScene = name;
  $$('.scene').forEach(el => { el.hidden = el.id !== name; el.classList.toggle('active', el.id === name); });
  $$('[data-scene]').forEach(el => { el.classList.toggle('active', el.dataset.scene === name); if (el.dataset.scene === name) el.setAttribute('aria-current', 'step'); else el.removeAttribute('aria-current'); });
  if (updateHash) history.replaceState(null, '', `#${name}`);
  if (name === 'album') renderPages();
  if (name !== 'heart') heartModule?.setActive(false);
  if (name === 'heart') {
    try {
      heartLoading ??= import('./heart.js').then(m => { heartModule = m; m.initHeart({ toast, reduceMotion }); return m; }).catch(error => { heartLoading = null; throw error; });
      const m = await heartLoading;
      m.setActive(currentScene === 'heart');
    } catch (error) {
      console.error(error);
      $('#heart-canvas').innerHTML = '<div class="heart-fallback">♡<small>此裝置無法啟用 3D，請使用支援 WebGL 的瀏覽器。</small></div>';
      toast('3D 愛心需要支援 WebGL 的瀏覽器');
    }
  }
}
$$('[data-scene]').forEach(b => b.addEventListener('click', () => { if (opening) return; showScene(b.dataset.scene); window.scrollTo({ top: 0, behavior: 'instant' }); }));
$('.identity').addEventListener('click', e => { e.preventDefault(); if (!opening) showScene('cover'); });
window.addEventListener('hashchange', () => showScene(location.hash.slice(1), false));
$$('.begin').forEach(b => b.addEventListener('click', () => {
  if (opening) return;
  opening = true;
  $('#closed-book').classList.add('opening');
  chime();
  setTimeout(() => {
    showScene('dolls');
    $('#closed-book').classList.remove('opening');
    opening = false;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, reduceMotion ? 0 : 1250);
}));
let pointer = { x: innerWidth / 2, y: innerHeight / 2 };
window.addEventListener('pointermove', e => {
  pointer = { x: e.clientX, y: e.clientY };
  if (reduceMotion) return;
  document.documentElement.style.setProperty('--mx', (e.clientX / innerWidth - .5) * 2);
  document.documentElement.style.setProperty('--my', (e.clientY / innerHeight - .5) * 2);
}, { passive: true });

let doll = 0;
function switchDoll() {
  doll = 1 - doll;
  $$('.doll-image').forEach((el, i) => el.classList.toggle('selected', i === doll));
  $('#doll-count').innerHTML = `0${doll + 1} <i>/ 02</i>`;
}
$('#doll-prev').addEventListener('click', switchDoll);
$('#doll-next').addEventListener('click', switchDoll);
let dollStart, dollSwiped = false;
$('#doll-switch').addEventListener('pointerdown', e => { dollStart = e.clientX; dollSwiped = false; });
$('#doll-switch').addEventListener('pointerup', e => { if (Math.abs(e.clientX - dollStart) > 30) { switchDoll(); dollSwiped = true; } });
$('#doll-switch').addEventListener('click', () => { if (!dollSwiped) switchDoll(); });

let page = 0, turning = false;
const cache = new Map();
const pageStep = () => mobile.matches ? 1 : 2;
function photoSrc(index) { return media(`wedding-${String(index + 1).padStart(2, '0')}.webp`); }
function preloadNearby() {
  const wanted = new Set();
  for (let i = Math.max(0, page - pageStep()); i < Math.min(20, page + pageStep() * 2); i++) {
    wanted.add(i);
    if (!cache.has(i)) { const image = new Image(); image.src = photoSrc(i); cache.set(i, image); }
  }
  for (const i of cache.keys()) if (!wanted.has(i)) cache.delete(i);
}
function renderPages() {
  page = Math.min(page, 20 - pageStep());
  if (!mobile.matches) page -= page % 2;
  $('#photo-left').src = photoSrc(page);
  $('#photo-left').alt = `吳文勝與劉翊鈴婚紗照，第 ${page + 1} 頁`;
  $('#number-left').textContent = String(page + 1).padStart(2, '0');
  if (!mobile.matches) {
    $('#photo-right').src = photoSrc(page + 1);
    $('#photo-right').alt = `吳文勝與劉翊鈴婚紗照，第 ${page + 2} 頁`;
    $('#number-right').textContent = String(page + 2).padStart(2, '0');
  } else { $('#photo-right').removeAttribute('src'); }
  $('#reading-label').textContent = `${String(page + 1).padStart(2, '0')}${mobile.matches ? '' : ` — ${String(page + 2).padStart(2, '0')}`} / 20`;
  $('#reading-bar').style.width = `${(page + pageStep()) * 5}%`;
  $('.album-prev').disabled = page === 0;
  $('.album-next').disabled = page >= 20 - pageStep();
  $('.album-tip').textContent = mobile.matches ? '左右滑動 · 輕觸箭頭翻閱' : '拖曳書頁 · 滾動翻閱';
  preloadNearby();
}
function turnPage(direction) {
  if (turning || page + direction * pageStep() < 0 || page + direction * pageStep() >= 20) return;
  turning = true;
  const el = $('#album-book');
  el.classList.add(direction > 0 ? 'turn-next' : 'turn-prev');
  setTimeout(() => { page += direction * pageStep(); renderPages(); chime(.25); }, reduceMotion ? 0 : 310);
  setTimeout(() => { el.classList.remove('turn-next', 'turn-prev'); turning = false; }, reduceMotion ? 30 : 680);
}
$('.album-prev').addEventListener('click', () => turnPage(-1));
$('.album-next').addEventListener('click', () => turnPage(1));
let dragStart;
$('#album-book').addEventListener('pointerdown', e => { dragStart = e.clientX; $('#album-book').setPointerCapture(e.pointerId); });
$('#album-book').addEventListener('pointerup', e => { if (dragStart !== undefined && Math.abs(e.clientX - dragStart) > 40) turnPage(e.clientX < dragStart ? 1 : -1); dragStart = undefined; });
$('#album-book').addEventListener('pointercancel', () => dragStart = undefined);
let wheelSum = 0, wheelTime = 0;
$('#album').addEventListener('wheel', e => {
  if (mobile.matches || e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
  e.preventDefault();
  if (turning || Date.now() - wheelTime < 900) return;
  wheelSum += e.deltaY;
  if (Math.abs(wheelSum) > 55) { turnPage(Math.sign(wheelSum)); wheelSum = 0; wheelTime = Date.now(); }
}, { passive: false });
window.addEventListener('keydown', e => {
  if (e.target.matches('input,textarea,select') || e.altKey || e.metaKey || e.ctrlKey) return;
  if (currentScene === 'album' && ['ArrowRight', 'ArrowLeft'].includes(e.key)) { e.preventDefault(); turnPage(e.key === 'ArrowRight' ? 1 : -1); }
  if (currentScene === 'dolls' && ['ArrowRight', 'ArrowLeft'].includes(e.key)) { e.preventDefault(); switchDoll(); }
});
mobile.addEventListener('change', () => { if (currentScene === 'album') renderPages(); });

// Original, quiet music-box tones: sound is strictly opt-in.
let audio, master, soundOn = false, soundTimer;
function chime(volume = 1) {
  if (!soundOn || !audio) return;
  [523.25, 659.25, 783.99, 1046.5].forEach((frequency, i) => {
    const oscillator = audio.createOscillator(), gain = audio.createGain();
    oscillator.type = 'sine'; oscillator.frequency.value = frequency;
    const t = audio.currentTime + i * .38;
    gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(.07 * volume, t + .018); gain.gain.exponentialRampToValueAtTime(.0001, t + 3.5);
    oscillator.connect(gain); gain.connect(master); oscillator.start(t); oscillator.stop(t + 3.6);
  });
}
$('#sound').addEventListener('click', async () => {
  try {
    if (!audio) { audio = new AudioContext(); master = audio.createGain(); master.gain.value = .5; master.connect(audio.destination); }
    await audio.resume();
    soundOn = !soundOn;
    master.gain.setTargetAtTime(soundOn ? .5 : 0, audio.currentTime, .3);
    $('#sound').setAttribute('aria-pressed', String(soundOn));
    $('#sound').setAttribute('aria-label', soundOn ? '關閉環境音' : '開啟環境音');
    $('#sound-label').textContent = soundOn ? '聲音開啟' : '聲音關閉';
    clearInterval(soundTimer);
    if (soundOn) { chime(); soundTimer = setInterval(() => { if (!document.hidden) chime(.6); }, 6500); }
  } catch { toast('此瀏覽器無法播放環境音'); }
});

const canvas = $('#dust'), ctx = canvas.getContext('2d');
let particles = [], dustFrame;
function resizeDust() {
  const ratio = Math.min(devicePixelRatio, 2);
  canvas.width = innerWidth * ratio; canvas.height = innerHeight * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  particles = Array.from({ length: innerWidth < 700 ? 18 : 36 }, () => ({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, r: .45 + Math.random(), vx: 0, vy: 0, speed: .06 + Math.random() * .12 }));
}
function drawDust() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  for (const p of particles) {
    if (!reduceMotion) {
      const dx = p.x - pointer.x, dy = p.y - pointer.y, d = Math.hypot(dx, dy);
      if (d < 90 && d > 1) { p.vx += dx / d * .035; p.vy += dy / d * .035; }
      p.vx *= .97; p.vy *= .97; p.x += p.vx + .025; p.y += p.vy - p.speed;
      if (p.y < -5) p.y = innerHeight + 5;
      if (p.x > innerWidth + 5) p.x = -5;
    }
    const glow = Math.max(.06, .32 - Math.abs(p.x - innerWidth * .62) / innerWidth * .4);
    ctx.fillStyle = `rgba(176,147,90,${glow})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
  }
  if (!reduceMotion && !document.hidden) dustFrame = requestAnimationFrame(drawDust);
}
window.addEventListener('resize', resizeDust);
document.addEventListener('visibilitychange', () => {
  cancelAnimationFrame(dustFrame);
  if (!document.hidden) drawDust();
  heartModule?.setActive(!document.hidden && currentScene === 'heart');
  if (audio) { if (document.hidden) audio.suspend(); else if (soundOn) audio.resume(); }
});
resizeDust(); drawDust();
showScene(location.hash.slice(1) || 'cover', false);
