import { stages, creatures, sampleJourney, stops, depthToS } from './journey.js?v=3';

const $ = (selector) => document.querySelector(selector);
const chapters = [...document.querySelectorAll('.chapter')];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let tops = [], maxScroll = 1, motionPaused = reduced.matches, ocean = null, lastIndex = -1;
function measure() { tops = chapters.map(el => el.offsetTop); maxScroll = document.documentElement.scrollHeight - innerHeight; }
measure();
new ResizeObserver(measure).observe(document.body);
// Depth sounder: one line from surface to floor. Zone marks sit where each zone's scroll begins
// (Challenger Deep sits at the floor), ticks mark featured creatures, the carriage follows the dive.
const sounder = $('#sounder');
const at = s => `${(s / stages.length * 100).toFixed(3)}%`;
const zoneName = { surface: 'Sunlight', twilight: 'Twilight', midnight: 'Midnight', abyss: 'Abyssal', hadal: 'Hadal', fishlimit: 'Fish limit', challenger: 'Challenger Deep' };
sounder.innerHTML = `<div class="sounder-track" aria-hidden="true"><span class="sounder-fill"></span><span class="sounder-carriage"><span class="sounder-mark"></span></span><span class="sounder-ticks">${stops.map(([, d]) => `<i style="top:${at(depthToS(d))}"></i>`).join('')}</span></div>`
  + `<ol>${stages.map((s, i) => { const last = i === stages.length - 1, depth = last ? s.end : s.start;
    return `<li style="top:${at(last ? stages.length : i)}"><a href="#${s.id}" aria-label="${zoneName[s.id]}, ${depth.toLocaleString('en-US')} m"><span class="sz-name">${zoneName[s.id]}</span><span class="sz-depth">${depth.toLocaleString('en-US')} m</span></a></li>`; }).join('')}</ol>`;
const links = [...sounder.querySelectorAll('a')];
function paint() {
  const sample = sampleJourney(scrollY, tops, maxScroll);
  $('#depth-number').textContent = sample.depth.toLocaleString('en-US');
  $('#pressure-value').textContent = Math.round(1 + sample.depth / 10).toLocaleString('en-US');
  if (sample.index !== lastIndex) {
    const stage = stages[sample.index];
    $('#current-zone').textContent = stage.name;
    $('#light-value').textContent = stage.light;
    links.forEach((link, i) => link.setAttribute('aria-current', String(i === sample.index)));
    lastIndex = sample.index;
  }
  $('.rays').style.opacity = Math.max(0, .3 * (1 - (sample.index + sample.progress) / 1.8));
  sounder.style.setProperty('--p', (sample.s / stages.length).toFixed(4));
  ocean?.update(sample, motionPaused);
  requestAnimationFrame(paint);
}
requestAnimationFrame(paint);
function updateMotionButton() { $('#motion').setAttribute('aria-pressed', String(motionPaused)); $('#motion').textContent = motionPaused ? 'Resume motion' : 'Pause motion'; }
updateMotionButton();
$('#motion').onclick = () => { motionPaused = !motionPaused; updateMotionButton(); };
reduced.addEventListener('change', event => { motionPaused = event.matches; updateMotionButton(); });

let selected = 'manta';
function showCreature(id, open = true) {
  selected = id;
  const c = creatures[id];
  $('#guide-content').innerHTML = `<div class="guide-tabs" role="group" aria-label="Choose a creature">${Object.entries(creatures).map(([key, value]) => `<button data-select="${key}" aria-pressed="${key === id}">${value.name}</button>`).join('')}</div><p class="guide-depth">${c.habitat}</p><h2>${c.name}</h2><p><i>${c.latin}</i></p><h3>${c.note}</h3><p>${c.text}</p><p class="guide-fact">${c.fact}</p><a class="guide-source" href="${c.source}" target="_blank" rel="noopener">Read more about this creature</a>`;
  $('#guide-content').querySelectorAll('[data-select]').forEach(button => button.onclick = () => { showCreature(button.dataset.select, false); $('#guide-content').querySelector(`[data-select="${selected}"]`).focus(); });
  if (open) $('#guide').showModal();
}
$('#guide-open').onclick = () => showCreature(selected);
// Creature labels are created by ocean.js and move every frame, so listen on the document.
document.addEventListener('click', event => { const label = event.target.closest('[data-creature]'); if (label) showCreature(label.dataset.creature); });
$('#sources-open').onclick = () => $('#sources').showModal();
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('.dialog-close').onclick = () => dialog.close();
  dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
});

let audioContext, gain, soundOn = false;
$('#sound').onclick = async () => {
  try {
    if (!audioContext) {
      audioContext = new AudioContext();
      gain = audioContext.createGain(); gain.gain.value = 0;
      const filter = audioContext.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 260;
      const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 4, audioContext.sampleRate);
      const channel = buffer.getChannelData(0);
      let brown = 0; for (let i = 0; i < channel.length; i++) { brown = (brown + (Math.random() * 2 - 1) * .02) / 1.02; channel[i] = brown * 3.5; }
      const noise = audioContext.createBufferSource(); noise.buffer = buffer; noise.loop = true; noise.connect(filter); filter.connect(gain); gain.connect(audioContext.destination); noise.start();
      const drone = audioContext.createOscillator(); drone.frequency.value = 55;
      const droneGain = audioContext.createGain(); droneGain.gain.value = .025; drone.connect(droneGain); droneGain.connect(gain); drone.start();
    }
    await audioContext.resume(); soundOn = !soundOn;
    gain.gain.setTargetAtTime(soundOn ? .3 : 0, audioContext.currentTime, .5);
    $('#sound').setAttribute('aria-pressed', String(soundOn)); $('#sound-label').textContent = soundOn ? 'Sound on' : 'Sound off';
  } catch { $('#sound-label').textContent = 'Sound unavailable'; $('#sound').disabled = true; }
};
document.addEventListener('visibilitychange', () => { if (audioContext) document.hidden ? audioContext.suspend() : soundOn && audioContext.resume(); });

try {
  const { createOcean } = await import('./ocean.js?v=3');
  ocean = createOcean($('#ocean'));
} catch (error) {
  console.error('Ocean renderer unavailable:', error);
  $('#render-error').hidden = false;
}
$('#loading').classList.add('loaded');
setTimeout(() => $('#loading').remove(), 800);
