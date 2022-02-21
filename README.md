# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.volar)

use keys on each row for each fret:
fret, key, piano key
01: Q (C)
02: W (D)
03: E (E)
04: A (F)
05: S (G)
06: D (A)
07: Z (B)
08: X (C)
09: C (D)
10: Q (E)
11: W (F)
12: E (G)
13: A (A)
14: S (B)
15: D (C)
16: Z (D)
17: X (E)
18: C (F)
19: Q (G)
20: W (A)
21: E (B)

1. Purple -> Blue -> Green -> Yellow -> Orange -> 22. Red

6 columns for clicks ( 1 column per string )

3 columns for keys

targets for chords ?
[o x o]
[x o o]
[o o x]

[1, 2, 3]

[Q, W, E] [r]
[A, S, D] [f]
[Z, X, C] [v]

[shift] = sharp ?
[ctrl] = flat ?

todo: computed for current valid key combination. target click event will add points if currently pressed key combination is valid.
todo: disable notes until they reach a certain point
todo: create click area / section
todo: add sounds for notes
todo: play midi file over top. mute if a note is missed until the next note is played
todo: need to update current tempo.
todo: need to set delay based on divisions value, note duration relative to divisions (or check note type for whole, half, quarter, eigth). divisions is per quarter note. tempo is quarter notes per minute.
todo: make target invisible on click

Click Click Boom?
