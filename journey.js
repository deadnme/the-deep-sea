// One linear scale for the whole descent: every metre gets the same scroll distance.
export const FLOOR = 10935;
const CREATURE_Z = 15;          // creatures sit on (or near) the plane 15 units in front of the camera
const METRES_PER_SCREEN = 110;  // on landscape screens; the tuning knob for the length of the page
const visible = fov => 2 * CREATURE_Z * Math.tan(fov * Math.PI / 360);
export const K = visible(55) / METRES_PER_SCREEN;   // world units per metre
export const yAt = depth => -depth * K;

// Pixels per metre are chosen so the z = -15 plane scrolls exactly with the page.
// Portrait screens get a wider lens, so they see more water per screen.
export function layout(width, height) {
  const fov = width < height ? 68 : 55;
  return { fov, ppm: height * K / visible(fov), half: height / 2 };
}

export const zones = [
  { id: 'surface', name: 'Sunlight zone', start: 0, end: 200, light: 'Abundant' },
  { id: 'twilight', name: 'Twilight zone', start: 200, end: 1000, light: 'Fading' },
  { id: 'midnight', name: 'Midnight zone', start: 1000, end: 4000, light: 'None' },
  { id: 'abyss', name: 'Abyssal zone', start: 4000, end: 6000, light: 'None' },
  { id: 'hadal', name: 'Hadal zone', start: 6000, end: FLOOR, light: 'None' }
];
export const zoneAt = depth => zones.findLast(z => depth >= z.start) ?? zones[0];

// Every creature in the scene. x/z place it in the water (x is for wide screens; narrow screens
// squeeze it towards the middle). Entries without `name` are unlabelled extras.
// `ground` puts a flat rock of that radius under the animal; `floor` sets it on the Challenger Deep floor.
export const creatures = [
  // Sunlight zone
  { id: 'turtle', depth: 22, x: 5, z: -17, model: 'turtle', name: 'Green sea turtle', latin: 'Chelonia mydas', range: 'Coastal and surface waters', fact: 'It breathes air, so every dive ends back at the surface. Adults graze on seagrass and algae.' },
  { id: 'sardines', depth: 62, x: 6, z: -21, model: 'sardines', labelY: 3, name: 'Pacific sardines', latin: 'Sardinops sagax', range: 'Upper sunlit waters', fact: 'When predators circle, a school packs into a tight, spinning ball.' },
  { id: 'manta', depth: 100, x: 2.5, z: -17, model: 'manta', labelY: 2.5, name: 'Oceanic manta ray', latin: 'Mobula birostris', range: 'Surface waters, diving much deeper', fact: 'Manta rays are fish, closely related to sharks. They breathe through gills and filter plankton from the water.', source: 'https://ocean.si.edu/mobula-yorae-newly-discovered-manta-ray-species' },
  { id: 'moonjelly', depth: 140, x: 5.5, z: -15, model: 'moonJelly', name: 'Moon jellyfish', latin: 'Aurelia aurita', range: 'Mostly near the surface', fact: 'It has no brain, heart or bones. A simple net of nerves keeps the bell pulsing.' },
  { depth: 150, x: 6.5, z: -24, model: 'moonJelly', args: [.8] },
  { id: 'tuna', depth: 182, x: 4, z: -21, model: 'tuna', labelY: 2.5, name: 'Yellowfin tuna', latin: 'Thunnus albacares', range: 'Upper 250 m, mostly', fact: 'Its swimming muscles run warmer than the water around it, which helps it hunt fast.' },
  // Twilight zone
  { id: 'jelly', depth: 262, x: 3, z: -15, model: 'jellyDeep', labelY: 2, name: 'Deep-sea jellyfish', latin: 'A stylized bioluminescent jellyfish', range: 'Twilight zone and deeper', fact: 'Many deep-sea jellyfish make their own light in chemical reactions inside their bodies.', source: 'https://oceanexplorer.noaa.gov/ocean-fact/bioluminescence/' },
  { id: 'hatchetfish', depth: 384, x: 5, z: -18, model: 'hatchetfish', labelY: 2.2, name: 'Silver hatchetfish', latin: 'Argyropelecus', range: 'Roughly 100 to 600 m', fact: 'Lights along its belly match the faint glow from above, hiding its silhouette from hunters below.' },
  { id: 'lanternfish', depth: 470, x: 4, z: -18, model: 'lanternfish', labelY: 2.6, name: 'Lanternfish', latin: 'Myctophidae', range: 'Twilight zone by day', fact: 'Many rise towards the surface at night to feed, then sink back into the dark by morning.' },
  { id: 'siphonophore', depth: 540, x: 2, z: -22, model: 'siphonophore', name: 'Siphonophore', latin: 'Siphonophorae', range: 'Open water, many depths', fact: 'It looks like one animal but is a colony of many small, specialised bodies working together.' },
  { id: 'squid', depth: 640, x: 2, z: -22, model: 'squid', labelY: 2, name: 'Giant squid', latin: 'Architeuthis dux', range: 'About 300 to 1,000 m', fact: 'Its eyes are among the largest in the animal kingdom, up to about 27 cm across.' },
  { id: 'barreleye', depth: 730, x: 5, z: -15, model: 'barreleye', labelY: 1.4, name: 'Barreleye', latin: 'Macropinna microstoma', range: 'About 600 to 800 m', fact: 'Its eyes sit inside a clear, fluid-filled head and can turn to look straight up.', source: 'https://www.mbari.org/animal/barreleye/' },
  { id: 'vampire', depth: 820, x: 2, z: -15, model: 'vampire', labelY: 1.8, name: 'Vampire squid', latin: 'Vampyroteuthis infernalis', range: 'Oxygen-poor water, roughly 600 to 1,200 m', fact: 'Despite the name, it eats marine snow: drifting scraps of dead plankton and mucus.' },
  { id: 'atolla', depth: 900, x: 5, z: -16, model: 'atolla', name: 'Atolla jellyfish', latin: 'Atolla wyvillei', range: 'Twilight and midnight zones', fact: 'When attacked it flashes a spinning ring of blue light, which may call in a bigger predator.' },
  { id: 'sixgill', depth: 965, x: 3, z: -19, model: 'sixgill', labelY: 1.4, name: 'Bluntnose sixgill shark', latin: 'Hexanchus griseus', range: 'Usually 180 to 1,100 m', fact: 'Most sharks have five gill slits. This ancient line has six.' },
  // Midnight zone
  { id: 'angler', depth: 1060, x: 3, z: -15, model: 'angler', yaw: -.3, labelY: 2.4, name: 'Deep-sea anglerfish', latin: 'Ceratioid anglerfish', range: 'Midnight zone', fact: 'The female carries a glowing lure, lit by bacteria, above her mouth. Males are much smaller.', source: 'https://www.mbari.org/animal/deep-sea-anglerfish/' },
  { id: 'whale', depth: 1200, x: 0, z: -34, model: 'whale', labelY: 3, name: 'Sperm whale', latin: 'Physeter macrocephalus', range: 'Surface to about 2,000 m', fact: 'It dives into the dark to hunt squid, and a single dive can last more than an hour.' },
  { id: 'goblin', depth: 1440, x: 3, z: -18, model: 'goblin', labelY: 1.3, name: 'Goblin shark', latin: 'Mitsukurina owstoni', range: 'Usually below 100 m, filmed near 2,000 m', fact: 'Its jaws shoot forward from under that long snout to snatch prey.' },
  { id: 'isopod', depth: 1640, x: 4, z: -15, model: 'isopod', ground: 4, labelY: 1, name: 'Giant isopod', latin: 'Bathynomus giganteus', range: 'About 300 to 2,300 m', fact: 'A distant relative of the woodlouse. It can go months without a meal.' },
  { id: 'loosejaw', depth: 1860, x: 3, z: -14, model: 'dragonfish', yaw: -.4, labelY: 1, name: 'Stoplight loosejaw', latin: 'Malacosteus niger', range: 'Deep midwater', fact: 'It shines a red light that most deep-sea animals cannot see, like a hidden flashlight.' },
  { id: 'greenland', depth: 2180, x: 2, z: -20, model: 'greenland', labelY: 1.8, name: 'Greenland shark', latin: 'Somniosus microcephalus', range: 'Surface to about 2,200 m', fact: 'It may live for centuries, longer than any other vertebrate we know of.' },
  { id: 'gulper', depth: 2340, x: 3, z: -16, model: 'gulper', yaw: .3, name: 'Gulper eel', latin: 'Eurypharynx pelecanoides', range: 'About 500 to 3,000 m', fact: 'Its huge, loose mouth works like a net, though it mostly catches small crustaceans.' },
  { id: 'vent', depth: 2540, x: 3, z: -17, model: 'vent', ground: 4.5, labelY: 3.2, name: 'Giant tube worms', latin: 'Riftia pachyptila', range: 'Hydrothermal vents, about 2,500 m', fact: 'They have no mouth or gut. Bacteria inside them make food from the chemicals in vent water.' },
  { id: 'beaked', depth: 2992, x: 0, z: -24, model: 'beaked', labelY: 1.8, name: "Cuvier's beaked whale", latin: 'Ziphius cavirostris', range: 'Dives deeper than any other mammal', fact: 'One tagged off California reached 2,992 m, the deepest mammal dive on record.', source: 'https://www.nhm.ac.uk/discover/secrets-of-deep-diving-whales.html' },
  { id: 'fangtooth', depth: 3240, x: 4, z: -14, model: 'fangtooth', yaw: -2.6, labelY: 1, name: 'Fangtooth', latin: 'Anoplogaster cornuta', range: 'About 500 to 5,000 m', fact: 'For its size, it has some of the largest teeth of any fish.' },
  { depth: 3800, x: 4, z: -21, model: 'titanic', yaw: -2.2 },   // the wreck beside the RMS Titanic mark
  // Abyssal zone
  { id: 'dumbo', depth: 4100, x: 3, z: -15, model: 'dumbo', labelY: 1.6, name: 'Dumbo octopus', latin: 'Grimpoteuthis', range: 'Deep ocean, including the abyss', fact: 'Ear-like fins give it its name. Unlike shallow-water octopuses, it has no ink sac.', source: 'https://www.nhm.ac.uk/discover/what-is-a-dumbo-octopus.html' },
  { id: 'tripod', depth: 4420, x: 4, z: -18, model: 'tripod', ground: 5, yaw: -.3, labelY: 1.2, name: 'Tripod fish', latin: 'Bathypterois grallator', range: 'Abyssal seafloor', fact: 'It stands on three long fin rays, facing the current, waiting for food to drift into reach.' },
  { id: 'seapig', depth: 5020, x: 2, z: -17, model: 'seaPig', ground: 7, yaw: .6, labelY: 1, name: 'Sea pig', latin: 'Scotoplanes', range: 'Abyssal seafloor', fact: 'A sea cucumber that walks across the mud on water-filled legs.' },
  { depth: 5020, x: 4.5, z: -19.5, model: 'seaPig', yaw: 2 },
  { id: 'supergiant', depth: 5480, x: 4, z: -13, model: 'bigAmphipod', labelY: 1.2, name: 'Supergiant amphipod', latin: 'Alicella gigantea', range: 'Abyssal and hadal depths', fact: 'Most amphipods are a few millimetres long. This one grows to about 34 cm.' },
  // Hadal zone
  { id: 'deepoctopus', depth: 6957, x: 3, z: -15, model: 'dumbo', args: [.35], labelY: 1.2, name: 'Dumbo octopus at 6,957 m', latin: 'Grimpoteuthis', range: 'Filmed in the Java Trench, 2019', fact: 'The deepest octopus ever filmed. Octopuses may live across almost the whole seafloor.' },
  { id: 'snailfish', depth: 7300, x: 3, z: -14, model: 'snailfish', labelY: 1.2, name: 'Mariana snailfish', latin: 'Pseudoliparis swirei', range: 'Upper hadal zone, about 6,000 to 8,000 m', fact: 'A soft, translucent fish that feeds on amphipods. Snailfish do not live at the very bottom of the trench.', source: 'https://www.nhm.ac.uk/discover/news/2023/april/deepest-ever-fish-filmed-depth-8336-metres.html' },
  { depth: 7520, x: 7, z: -19, model: 'snailfish', args: [.25], yaw: 2.6 },
  { depth: 7700, x: 1, z: -20, model: 'snailfish', args: [.25], yaw: .4 },
  { id: 'deepest', depth: 8336, x: 3, z: -14, model: 'snailfish', args: [.4], labelY: 1.2, name: 'Snailfish at 8,336 m', latin: 'Pseudoliparis', range: 'Izu-Ogasawara Trench, 2022', fact: 'The deepest fish ever filmed. Below about 8,200 m, fish bodies may not cope with the pressure.' },
  { id: 'hirondellea', depth: 9400, x: 3, z: -15, model: 'swarm', labelY: 2, name: 'Hirondellea gigas', latin: 'Hadal amphipods', range: 'Deep trenches, down to the floor', fact: 'Swarms of these scavengers find any food that sinks into the trench within hours.' },
  { depth: 10300, x: 5, z: -17, model: 'swarm', args: [90, 2.5] },
  // Challenger Deep floor
  { id: 'amphipod', depth: FLOOR, x: .5, z: -11, floor: 1.1, model: 'amphipod', labelY: .9, name: 'Hadal amphipod', latin: 'Hirondellea gigas', range: 'Hadal trenches, including Challenger Deep', fact: 'Amphipods are crustaceans, but not shrimp. This one is enlarged so you can see it.', source: 'https://oceanexplorer.noaa.gov/explorations/16marianas/' },
  { id: 'xeno', depth: FLOOR, x: -1.5, z: -8.5, floor: .3, model: 'xeno', labelY: .8, name: 'Xenophyophore', latin: 'Xenophyophorea', range: 'Abyssal and hadal seafloor', fact: 'A giant single cell that can grow to about 10 cm across.' },
  ...[[-6, -21], [3.5, -17], [5, -20], [0, -23]].map(([x, z]) => ({ depth: FLOOR, x, z, floor: .3, model: 'xeno' })),
  { id: 'cucumber', depth: FLOOR, x: -2.5, z: -14, floor: .3, model: 'cucumber', yaw: 2.4, labelY: .9, name: 'Sea cucumber', latin: 'Holothuroidea', range: 'Down to the deepest trenches', fact: 'Sea cucumbers roam even the deepest trench floors, sifting the sediment for food.' },
  { depth: FLOOR, x: 4, z: -22, floor: 1.4, model: 'swarm', args: [120, 2.5] }
];
