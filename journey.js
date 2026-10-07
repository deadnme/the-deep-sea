export const stages = [
  { id: 'surface', name: 'Sunlight zone', short: 'Sunlight', start: 0, end: 200, light: 'Abundant' },
  { id: 'twilight', name: 'Twilight zone', short: 'Twilight', start: 200, end: 1000, light: 'Fading' },
  { id: 'midnight', name: 'Midnight zone', short: 'Midnight', start: 1000, end: 4000, light: 'None' },
  { id: 'abyss', name: 'Abyssal zone', short: 'Abyss', start: 4000, end: 6000, light: 'None' },
  { id: 'hadal', name: 'Hadal zone', short: 'Hadal', start: 6000, end: 8200, light: 'None' },
  { id: 'fishlimit', name: 'Hadal zone', short: 'Fish limit', start: 8200, end: 10800, light: 'None' },
  { id: 'challenger', name: 'Challenger Deep', short: 'Challenger', start: 10800, end: 10935, light: 'None' }
];
const KEYS = [...stages.map(s => s.start), stages.at(-1).end];
const clamp01 = v => Math.min(1, Math.max(0, v));
// "Stage position" s runs from 0 at the surface to stages.length at the floor; each stage is one unit.
export function depthToS(depth) {
  let i = 0;
  while (i < KEYS.length - 2 && depth > KEYS[i + 1]) i++;
  return i + clamp01((depth - KEYS[i]) / (KEYS[i + 1] - KEYS[i]));
}
export function sToDepth(s) {
  const i = Math.min(Math.floor(Math.max(0, s)), stages.length - 1);
  return KEYS[i] + (KEYS[i + 1] - KEYS[i]) * clamp01(s - i);
}

// Featured creatures: [id, depth in metres, share of its zone's scroll spent holding on it].
// ocean.js places these creatures at exactly these depths.
export const stops = [
  ['manta', 3, .42], ['turtle', 40, .25],
  ['jelly', 212, .42], ['squid', 650, .25],
  ['angler', 1040, .42], ['gulper', 2500, .25],
  ['dumbo', 4030, .42], ['ledge', 5000, .25],
  ['bigAmphipod', 6050, .42], ['snailfish', 6400, .3],
  ['deepest', 8336, .42], ['swarm', 9400, .25],
  ['floor', 10935, .6]
];
export const stopDepth = Object.fromEntries(stops.map(([id, depth]) => [id, depth]));

// Scroll dwell. Inside each zone, scroll is spent unevenly: around a featured creature the camera
// almost stops, so it holds the middle of the screen, and between creatures it travels quickly.
// Zone boundaries stay fixed, so each zone still starts exactly where its text starts.
const HOLD_RADIUS = .03, SAMPLES = 800, BUMP_AREA = 1.8128; // integral of exp(-x^4)
const tables = stages.map((_, i) => {
  const own = stops.map(([, d, hold]) => [depthToS(d) - i, hold]).filter(([x]) => x >= 0 && x <= 1);
  const total = 1 / (1 - own.reduce((sum, [, hold]) => sum + hold, 0));
  const bumps = own.map(([x, hold]) => [x, hold * total / (BUMP_AREA * HOLD_RADIUS)]);
  const cum = new Float64Array(SAMPLES + 1);
  for (let k = 1; k <= SAMPLES; k++) {
    const x = (k - .5) / SAMPLES;
    cum[k] = cum[k - 1] + 1 + bumps.reduce((sum, [c, a]) => sum + a * Math.exp(-(((x - c) / HOLD_RADIUS) ** 4)), 0);
  }
  return cum.map(c => c / cum[SAMPLES]);
});
export function warp(index, progress) {
  const cum = tables[index], p = clamp01(progress);
  let lo = 0, hi = SAMPLES;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cum[mid] <= p) lo = mid; else hi = mid; }
  return index + (lo + (p - cum[lo]) / Math.max(1e-9, cum[hi] - cum[lo])) / SAMPLES;
}

export function sampleJourney(scrollY, tops, maxScroll) {
  const position = Math.max(0, Math.min(scrollY, maxScroll));
  let index = 0;
  while (index < tops.length - 1 && position >= tops[index + 1]) index++;
  const end = tops[index + 1] ?? maxScroll;
  const progress = clamp01((position - tops[index]) / Math.max(1, end - tops[index]));
  const s = warp(index, progress);
  return { index, progress, s, depth: Math.round(sToDepth(s)) };
}
export const creatures = {
  manta: { name: 'Oceanic manta ray', latin: 'Mobula birostris', habitat: 'Sunlight zone', note: 'A gentle giant of open water.', text: 'Broad pectoral fins carry this filter feeder through the upper ocean. Its two cephalic fins help funnel plankton-rich water into its mouth.', fact: 'Manta rays are fish, closely related to sharks. They breathe through gills.', source: 'https://ocean.si.edu/mobula-yorae-newly-discovered-manta-ray-species' },
  jelly: { name: 'Deep-sea jellyfish', latin: 'A stylized bioluminescent jellyfish', habitat: 'Twilight zone and deeper', note: 'A pulse of light in the blue.', text: 'Many deep-sea jellyfish drift with ocean currents, using trailing tentacles to catch prey. Some produce their own light in chemical reactions inside their bodies.', fact: 'Bioluminescence can help marine animals defend themselves, find prey, or communicate.', source: 'https://oceanexplorer.noaa.gov/ocean-fact/bioluminescence/' },
  angler: { name: 'Deep-sea anglerfish', latin: 'Ceratioid anglerfish', habitat: 'Midnight zone', note: 'A hunter with its own lantern.', text: 'The female carries a modified dorsal spine above her mouth. Its glowing tip, lit by symbiotic bacteria, attracts prey in the dark water.', fact: 'The model represents a female. Male deep-sea anglerfish are generally much smaller.', source: 'https://www.mbari.org/animal/deep-sea-anglerfish/' },
  dumbo: { name: 'Dumbo octopus', latin: 'Grimpoteuthis', habitat: 'Deep ocean, including the abyss', note: 'Grace in the deepest water.', text: 'A pair of ear-like fins gives the dumbo octopus its name. Webbing connects its arms, forming a soft umbrella that helps it move above the seafloor.', fact: 'Unlike many shallow-water octopuses, cirrate octopuses such as dumbo octopuses do not have an ink sac.', source: 'https://www.nhm.ac.uk/discover/what-is-a-dumbo-octopus.html' },
  snailfish: { name: 'Mariana snailfish', latin: 'Pseudoliparis swirei', habitat: 'Upper hadal zone, about 6,000-8,000 m', note: 'A delicate fish in an extreme world.', text: 'With translucent skin and a soft body, Mariana snailfish live deep in the Mariana Trench. They feed on small crustaceans, including amphipods.', fact: 'Snailfish do not live at the bottom of Challenger Deep. The fish here appears in upper hadal waters.', source: 'https://www.nhm.ac.uk/discover/news/2023/april/deepest-ever-fish-filmed-depth-8336-metres.html' },
  amphipod: { name: 'Hadal amphipod', latin: 'Hirondellea gigas', habitat: 'Hadal trenches, including Challenger Deep', note: 'Small life. Immense resilience.', text: 'These shrimp-like crustaceans scavenge in deep ocean trenches. Food arriving from above sustains life even near the deepest seafloor.', fact: 'Amphipods are crustaceans, but they are not shrimp. This scene enlarges them so you can see their anatomy.', source: 'https://oceanexplorer.noaa.gov/explorations/16marianas/' }
};
