export const stages = [
  { id: 'surface', name: 'Sunlight zone', short: 'Sunlight', start: 0, end: 200, light: 'Abundant' },
  { id: 'twilight', name: 'Twilight zone', short: 'Twilight', start: 200, end: 1000, light: 'Fading' },
  { id: 'midnight', name: 'Midnight zone', short: 'Midnight', start: 1000, end: 4000, light: 'None' },
  { id: 'abyss', name: 'Abyssal zone', short: 'Abyss', start: 4000, end: 6000, light: 'None' },
  { id: 'hadal', name: 'Hadal zone', short: 'Hadal', start: 6000, end: 8200, light: 'None' },
  { id: 'fishlimit', name: 'Hadal zone', short: 'Fish limit', start: 8200, end: 10800, light: 'None' },
  { id: 'challenger', name: 'Challenger Deep', short: 'Challenger', start: 10800, end: 10935, light: 'None' }
];
export function sampleJourney(scrollY, tops, maxScroll) {
  const position = Math.max(0, Math.min(scrollY, maxScroll));
  let index = 0;
  while (index < tops.length - 1 && position >= tops[index + 1]) index++;
  const end = tops[index + 1] ?? maxScroll;
  const progress = Math.max(0, Math.min(1, (position - tops[index]) / Math.max(1, end - tops[index])));
  const stage = stages[index];
  return { index, progress, depth: Math.round(stage.start + (stage.end - stage.start) * progress) };
}
export const creatures = {
  manta: { name: 'Oceanic manta ray', latin: 'Mobula birostris', habitat: 'SUNLIGHT ZONE', note: 'A gentle giant of open water.', text: 'Broad pectoral fins carry this filter feeder through the upper ocean. Its two cephalic fins help funnel plankton-rich water into its mouth.', fact: 'Manta rays are fish, closely related to sharks. They breathe through gills.', source: 'https://ocean.si.edu/mobula-yorae-newly-discovered-manta-ray-species' },
  jelly: { name: 'Deep-sea jellyfish', latin: 'A stylized bioluminescent jellyfish', habitat: 'TWILIGHT AND DEEPER WATERS', note: 'A pulse of light in the blue.', text: 'Many deep-sea jellyfish drift with ocean currents, using trailing tentacles to catch prey. Some produce their own light in chemical reactions inside their bodies.', fact: 'Bioluminescence can help marine animals defend themselves, find prey, or communicate.', source: 'https://oceanexplorer.noaa.gov/ocean-fact/bioluminescence/' },
  angler: { name: 'Deep-sea anglerfish', latin: 'Ceratioid anglerfish', habitat: 'MIDNIGHT ZONE', note: 'A hunter with its own lantern.', text: 'The female carries a modified dorsal spine above her mouth. Its glowing tip, lit by symbiotic bacteria, attracts prey in the dark water.', fact: 'The model represents a female. Male deep-sea anglerfish are generally much smaller.', source: 'https://www.mbari.org/animal/deep-sea-anglerfish/' },
  dumbo: { name: 'Dumbo octopus', latin: 'Grimpoteuthis', habitat: 'DEEP OCEAN, INCLUDING THE ABYSS', note: 'Grace in the deepest water.', text: 'A pair of ear-like fins gives the dumbo octopus its name. Webbing connects its arms, forming a soft umbrella that helps it move above the seafloor.', fact: 'Unlike many shallow-water octopuses, cirrate octopuses such as dumbo octopuses do not have an ink sac.', source: 'https://www.nhm.ac.uk/discover/what-is-a-dumbo-octopus.html' },
  snailfish: { name: 'Mariana snailfish', latin: 'Pseudoliparis swirei', habitat: 'UPPER HADAL ZONE, ABOUT 6,000-8,000 M', note: 'A delicate fish in an extreme world.', text: 'With translucent skin and a soft body, Mariana snailfish live deep in the Mariana Trench. They feed on small crustaceans, including amphipods.', fact: 'Snailfish do not live at the bottom of Challenger Deep. The fish here appears in upper hadal waters.', source: 'https://www.nhm.ac.uk/discover/news/2023/april/deepest-ever-fish-filmed-depth-8336-metres.html' },
  amphipod: { name: 'Hadal amphipod', latin: 'Hirondellea gigas', habitat: 'HADAL TRENCHES, INCLUDING CHALLENGER DEEP', note: 'Small life. Immense resilience.', text: 'These shrimp-like crustaceans scavenge in deep ocean trenches. Food arriving from above sustains life even near the deepest seafloor.', fact: 'Amphipods are crustaceans, but they are not shrimp. This scene enlarges them so you can see their anatomy.', source: 'https://oceanexplorer.noaa.gov/explorations/16marianas/' }
};
