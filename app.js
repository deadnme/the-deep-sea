import { FLOOR, zones, zoneAt, creatures, layout } from './journey.js?v=9';

const $ = selector => document.querySelector(selector);
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let motionPaused = reduced.matches, ocean = null;

// ---------- one scale for page and scene ----------
// ponytail: the height is only re-read when the width changes, so a mobile URL bar showing or hiding
// never re-scales an 80,000 px page under the reader. Rotating or resizing the width re-measures.
let view, viewH = 0, lastW = 0;
// Plain two-argument scrollTo: older Safari throws on behavior: 'instant', and the page never sets smooth scrolling.
const jump = y => scrollTo(0, y);
const depthToScroll = d => d * view.ppm + view.half - innerHeight / 2;
const depthNow = () => Math.min(FLOOR, Math.max(0, (scrollY + innerHeight / 2 - view.half) / view.ppm));
function measure() {
  if (innerWidth !== lastW) {
    const keep = view ? depthNow() : 0;
    lastW = innerWidth; viewH = innerHeight; view = layout(innerWidth, viewH);
    root.style.setProperty('--ppm', view.ppm);
    root.style.setProperty('--half', `${view.half}px`);
    if (keep) jump(depthToScroll(keep));
    renderGaugeZones();
  }
  ocean?.resize(view, viewH);
}
addEventListener('resize', measure);

// ---------- units ----------
let units = 'm';
try { if (localStorage.getItem('units') === 'ft') units = 'ft'; } catch {}
const inUnits = m => Math.round(units === 'ft' ? m * 3.28084 : m);
const fmt = m => `${inUnits(m).toLocaleString('en-US')} ${units}`;
function applyUnits(scope = document) {
  scope.querySelectorAll('[data-m]').forEach(el => { el.textContent = fmt(+el.dataset.m); });
}
function showUnits() {
  $('#units').textContent = units;
  $('#units').setAttribute('aria-label', units === 'm' ? 'Depth in metres. Switch to feet' : 'Depth in feet. Switch to metres');
  applyUnits(); renderGaugeZones(); lastShown = -1;
}
$('#units').onclick = () => {
  units = units === 'm' ? 'ft' : 'm';
  try { localStorage.setItem('units', units); } catch {}
  showUnits();
};

// ---------- depth gauge ----------
const gauge = $('#gauge'), gaugeEl = $('.gauge'), zoneList = $('.gauge-zones');
gaugeEl.querySelector('.gauge-ticks').innerHTML = creatures.filter(c => c.name && c.depth < FLOOR)
  .map(c => `<i style="top:${(c.depth / FLOOR * 100).toFixed(3)}%"></i>`).join('');
function renderGaugeZones() {
  // Labels sit at their true depth. The twilight band is only a few pixels tall at this scale,
  // so a label that would collide with the one above it is left out (its band and ticks remain).
  const h = gaugeEl.clientHeight; let prev = -Infinity;
  zoneList.innerHTML = [...zones.map(z => [z.name.replace(' zone', ''), z.start, z.id]), ['Challenger Deep', FLOOR, 'challenger']].map(([name, d, id]) => {
    const top = d / FLOOR * h;
    if (top - prev < 36) return '';
    prev = top;
    return `<li data-zone="${id}" style="top:${top}px"><b>${name}</b><small>${fmt(d)}</small></li>`;
  }).join('');
  lastZone = null;
}
gauge.addEventListener('input', () => { stop(); jump(depthToScroll(+gauge.value)); });
// Native steps are 1 m, far too fine for 10,935 m: arrows move 100 m, Page keys 1,000 m.
const STEP = { ArrowDown: 100, ArrowRight: 100, ArrowUp: -100, ArrowLeft: -100, PageDown: 1000, PageUp: -1000 };
gauge.addEventListener('keydown', e => {
  if (!(e.key in STEP)) return;
  e.preventDefault(); stop();
  jump(depthToScroll(Math.min(FLOOR, Math.max(0, depthNow() + STEP[e.key]))));
});

// ---------- glide (gauge, guide, ascend) and autopilot ----------
let glide = null, auto = false, autoY = 0;
function glideTo(depth) {
  setAuto(false);
  const to = depthToScroll(Math.min(FLOOR, Math.max(0, depth)));
  if (reduced.matches) { jump(to); return; }
  glide = { from: scrollY, to, start: performance.now(), dur: Math.min(6000, 700 + Math.abs(to - scrollY) / 15) };
}
function setAuto(on) {
  auto = on; autoY = scrollY;
  $('#autopilot').setAttribute('aria-pressed', String(on));
  $('#autopilot-label').textContent = on ? 'Autopilot on' : 'Autopilot off';
}
const stop = () => { glide = null; if (auto) setAuto(false); };
addEventListener('wheel', stop, { passive: true });
// Controls are exempt, or tapping Autopilot would stop it and then its click would start it again.
const onControl = e => e.target.closest?.('button, input, a, dialog');
addEventListener('touchstart', e => { if (!onControl(e)) stop(); }, { passive: true });
addEventListener('keydown', e => { if (!onControl(e) && ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(e.key)) stop(); });
$('#autopilot').onclick = () => { glide = null; setAuto(!auto); };
$('#hero-descend').onclick = () => { glide = null; setAuto(true); };
$('#ascend').onclick = () => glideTo(0);
const AUTO_SPEED = 32;   // metres per second: the whole descent in under six minutes
// Through empty water autopilot fast-forwards: 1× faster per RAMP metres of clear water, up to FAST×.
const RAMP = 30, FAST = 12;
// Everything worth slowing down for, as [depth, scale]. Only the z = -15 plane scrolls with the page;
// creatures further back stay on screen over a wider depth range, so their reach scales with distance.
const sights = [[0, 1], ...creatures.map(c => [c.depth, Math.max(1, -c.z / 15)]),
  ...[...document.querySelectorAll('main .at')].map(el => [+el.style.getPropertyValue('--d'), 1])];
// Autopilot speed at this depth, the clear water around the view, and the view depth at which
// the next sight below comes on screen.
function autopilot(depth) {
  const half = innerHeight / 2 / view.ppm;
  let clear = Infinity, next = FLOOR;
  for (const [d, scale] of sights) {
    const reach = half * scale + 20;   // the margin covers model and text height
    clear = Math.min(clear, Math.abs(d - depth) - reach);
    if (d - reach > depth) next = Math.min(next, d - reach);
  }
  clear = Math.max(0, clear);
  return [AUTO_SPEED * Math.min(FAST, 1 + clear / RAMP), clear, next];
}

// ---------- frame loop ----------
let lastShown = -1, lastZone = null, lastFrame = performance.now(), lastSoundDepth = -1;
function paint(now) {
  const dt = Math.min((now - lastFrame) / 1000, .1); lastFrame = now;
  if (glide) {
    const t = Math.min(1, (now - glide.start) / glide.dur), e = t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
    jump(glide.from + (glide.to - glide.from) * e);
    if (t === 1) glide = null;
  } else if (auto) {
    if (Math.abs(scrollY - autoY) > 4) autoY = scrollY;   // the reader dragged the scrollbar
    const [speed, clear, next] = autopilot(depthNow());
    // Reduced motion: cut across empty water. (> 1 m, so scroll rounding after a cut can't trigger another.)
    if (reduced.matches && clear > 1) autoY = depthToScroll(next);
    else autoY += speed * view.ppm * dt;
    jump(autoY);
    if (depthNow() >= FLOOR - .5) setAuto(false);
  }
  const depth = depthNow(), shown = Math.round(depth), zone = zoneAt(depth);
  if (shown !== lastShown) {
    $('#depth-number').textContent = inUnits(shown).toLocaleString('en-US');
    $('#pressure-value').textContent = Math.round(1 + depth / 10).toLocaleString('en-US');
    gauge.value = shown;
    gauge.setAttribute('aria-valuetext', `${fmt(shown)}, ${zone.name}`);
    lastShown = shown;
  }
  if (zone !== lastZone) {
    $('#current-zone').textContent = zone.name;
    $('#light-value').textContent = zone.light;
    zoneList.querySelectorAll('li').forEach(li => li.classList.toggle('now', li.dataset.zone === zone.id));
    lastZone = zone;
  }
  if (Math.abs(depth - lastSoundDepth) > 20) { setSoundDepth(depth); lastSoundDepth = depth; }
  $('.rays').style.opacity = Math.max(0, .3 * (1 - depth / 220)).toFixed(3);
  gaugeEl.style.setProperty('--p', (depth / FLOOR).toFixed(5));
  ocean?.update(depth, motionPaused);
  requestAnimationFrame(paint);
}

function updateMotionButton() { $('#motion').setAttribute('aria-pressed', String(motionPaused)); $('#motion').textContent = motionPaused ? 'Resume motion' : 'Pause motion'; }
$('#motion').onclick = () => { motionPaused = !motionPaused; updateMotionButton(); };
reduced.addEventListener('change', event => { motionPaused = event.matches; updateMotionButton(); });

// ---------- field guide ----------
const known = creatures.filter(c => c.name), byId = Object.fromEntries(known.map(c => [c.id, c]));
$('.guide-index').innerHTML = zones.map(z => {
  const list = known.filter(c => zoneAt(c.depth) === z);
  return `<h3>${z.name}</h3><ul>${list.map(c => `<li><button data-select="${c.id}"><span>${c.name}</span><small data-m="${c.depth}"></small></button></li>`).join('')}</ul>`;
}).join('');
let selected = known[0].id;
function showCreature(id, open = true) {
  selected = id;
  const c = byId[id], detail = $('#guide-detail');
  detail.innerHTML = `<p class="guide-depth">Shown at <span data-m="${c.depth}"></span></p><h2>${c.name}</h2><p class="guide-latin">${c.latin}</p>`
    + `<p class="guide-fact">${c.fact}</p><p class="guide-range">${c.range}</p>`
    + `<div class="guide-actions"><button class="primary" data-go="${c.depth}">Go to this depth</button>${c.source ? `<a href="${c.source}" target="_blank" rel="noopener">Read more about it</a>` : ''}</div>`;
  applyUnits(detail);
  $('.guide-index').querySelectorAll('[data-select]').forEach(b => b.setAttribute('aria-current', String(b.dataset.select === id)));
  if (open && !$('#guide').open) {
    $('#guide').showModal();
    $('.guide-index').querySelector(`[data-select="${id}"]`).scrollIntoView({ block: 'nearest' });
  }
}
$('#guide-open').onclick = () => showCreature(selected);
document.addEventListener('click', event => {
  const t = event.target;
  const label = t.closest('[data-creature]'); if (label) return showCreature(label.dataset.creature);
  const pick = t.closest('[data-select]'); if (pick) return showCreature(pick.dataset.select, false);
  const go = t.closest('[data-go]'); if (go) { $('#guide').close(); glideTo(+go.dataset.go); }
});
$('#sources-open').onclick = () => $('#sources').showModal();
// The seafloor bars at the floor fill once, when they come into view.
new IntersectionObserver(([e], io) => { if (e.isIntersecting) { e.target.classList.add('shown'); io.disconnect(); } }, { threshold: .5 }).observe($('.known'));
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('.dialog-close').onclick = () => dialog.close();
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
});

// ---------- sound: brown-noise water and a low drone, both darkening with depth ----------
let audioContext, gain, filter, drone, soundOn = false;
function setSoundDepth(depth) {
  if (!soundOn) return;
  filter.frequency.setTargetAtTime(260 - 170 * Math.min(1, depth / 4000), audioContext.currentTime, .4);
  drone.frequency.setTargetAtTime(55 - 14 * depth / FLOOR, audioContext.currentTime, .4);
}
$('#sound').onclick = async () => {
  try {
    if (!audioContext) {
      audioContext = new AudioContext();
      gain = audioContext.createGain(); gain.gain.value = 0;
      filter = audioContext.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 260;
      const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 4, audioContext.sampleRate);
      const channel = buffer.getChannelData(0);
      let brown = 0; for (let i = 0; i < channel.length; i++) { brown = (brown + (Math.random() * 2 - 1) * .02) / 1.02; channel[i] = brown * 3.5; }
      const noise = audioContext.createBufferSource(); noise.buffer = buffer; noise.loop = true; noise.connect(filter); filter.connect(gain); gain.connect(audioContext.destination); noise.start();
      drone = audioContext.createOscillator(); drone.frequency.value = 55;
      const droneGain = audioContext.createGain(); droneGain.gain.value = .025; drone.connect(droneGain); droneGain.connect(gain); drone.start();
    }
    await audioContext.resume(); soundOn = !soundOn;
    gain.gain.setTargetAtTime(soundOn ? .3 : 0, audioContext.currentTime, .5);
    setSoundDepth(depthNow());
    $('#sound').setAttribute('aria-pressed', String(soundOn)); $('#sound-label').textContent = soundOn ? 'Sound on' : 'Sound off';
  } catch { $('#sound-label').textContent = 'Sound unavailable'; $('#sound').disabled = true; }
};
document.addEventListener('visibilitychange', () => { if (audioContext) document.hidden ? audioContext.suspend() : soundOn && audioContext.resume(); });

// ---------- start ----------
measure();
showUnits();
updateMotionButton();
requestAnimationFrame(paint);
try {
  const { createOcean } = await import('./ocean.js?v=9');
  ocean = createOcean($('#ocean'));
  ocean.resize(view, viewH);
} catch (error) {
  console.error('Ocean renderer unavailable:', error);
  $('#render-error').hidden = false;
}
$('#loading').classList.add('loaded');
setTimeout(() => $('#loading').remove(), 800);
