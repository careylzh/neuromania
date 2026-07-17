# Neuromania (v3 — HTML5 port)

A web port of *Neuromania*, Team Pivotato's anti-drug RPG built in Adobe Flash
for SGCC 2014. The original `.fla` sources, ActionScript 3 classes and design
documents live in `../Pivotato SGCC 2014 /`.

Play a day in the life of Cody, a bullied 16-year-old invited to Ecster's
birthday party. Every time drugs come knocking, the game dives inside his
brain for a **MindPlay** battle: bad neurons chain toward good thoughts, and
you — his consciousness — cut the bad chains and wire up the good ones.

## Controls

| Key | Overworld | MindPlay |
| --- | --- | --- |
| Arrow keys | Walk | Move consciousness |
| E | Talk / read signs / enter | (also builds, like W) |
| Q (hold) | — | Cut bad chains you touch |
| W (hold) | — | Build good links between white neurons |

## Tech

Plain HTML5 Canvas 2D + vanilla JS. No build step, no dependencies, no
plugins — just open `index.html` over HTTP (or visit the GitHub Pages site).

All sprites, maps, sounds and the Wendy font are the original 2014 assets,
recovered from the project folders and from inside the `.fla` archives.
The MindPlay chain mechanics are a faithful port of `badNeuron.as`,
`goodNeuron.as`, `chain.as` and `gChainM.as`; the dialogue comes verbatim
from the original game design documents.

*LIFE DOES NOT REWIND. SAY NO TO DRUGS.*
