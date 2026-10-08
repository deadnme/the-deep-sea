# Below the Surface

A true-scale, scroll-driven Three.js descent from the sea surface to the floor of the Challenger Deep.

**Live:** https://deadnme.github.io/the-deep-sea/

Every metre of depth gets the same amount of scrolling, so the 200 m of sunlit water pass in a couple of
screens and the hadal trench takes dozens. On the way down, the water darkens, a submersible lamp switches on,
marine snow thickens, and the trench walls close in below 6,000 m.

| Zone | Depth |
| --- | --- |
| Sunlight (epipelagic) | 0 - 200 m |
| Twilight (mesopelagic) | 200 - 1,000 m |
| Midnight (bathypelagic) | 1,000 - 4,000 m |
| Abyssal (abyssopelagic) | 4,000 - 6,000 m |
| Hadal (hadopelagic) | 6,000 m to the floor |
| Challenger Deep | ~10,935 m |

About 35 animals sit at depths where they are found, from green sea turtles to hadal amphipods. Each has a
label that follows it and opens the field guide. Between them are human landmarks and records: the deepest
freedive and scuba dive, the Titanic and the Bismarck, Alvin's limit, the deepest known wreck, and the fish limit.

- The instrument bar shows depth (metres or feet), pressure and sunlight. Autopilot sinks at 32 m/s and fast-forwards through empty water.
- The depth gauge on the right is a slider: click, drag, or use the arrow and Page keys to jump.
- Sound is opt-in, synthesized locally, and darkens with depth.
- Pause motion stops all animation, and reduced-motion preferences are respected.

Type is Bricolage Grotesque (SIL Open Font License), self-hosted in `fonts/`. Headlines grow narrower and
heavier as the pressure rises. All creatures are procedural three.js illustrations and are not to scale.
Depths and records are linked to sources in the site's About dialog. Inspired by Neal Agarwal's
[The Deep Sea](https://neal.fun/deep-sea/).
