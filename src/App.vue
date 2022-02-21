<template>
  <div
    id="main"
    style="
      width: 100%;
      justify-content: center;
      display: flex;
      height: 100%;
      margin-top: -8px;
      margin-bottom: -8px;
      overflow: hidden;
    "
  >
    <div style="position: absolute; overflow: hidden">
      <!-- <audio class="gunshot" src="src/M416.mp3"></audio> -->
      <audio id="songaudio" class="midi" src="src/nocturne_midi.mid"></audio>
    </div>
    <!-- <div
      id="bullet-holes"
      class="bullet-holes"
      style="position: absolute; height: 100%; width: 100%; overflow: hidden"
    ></div> -->
    <!-- <div
      style="
        position: absolute;
        height: 100%;
        width: 100%;
        overflow: hidden;
        pointer-events: none;
        z-index: 4;
      "
    >
      <div class="cursor rounded">
        <div class="inner-dot"></div>
      </div>
    </div> -->
    <div style="position: absolute; left: 0" class="no-select">
      <v-btn @click="loadObjects">Load Objects</v-btn>
      <v-btn @click="startGame">Start New</v-btn>
      <div>Score: {{ points }} / {{ quantity }}</div>
      <!-- <div>
        Bullets: {{ bulletsInClip }} /
        {{ clipSize }}
      </div> -->
      <input type="file" name="songFile" id="songFile" />
    </div>
    <div id="board" class="board">
      <div
        class="ma-0 pa-0"
        :id="object.id"
        :key="object.id + 'key'"
        v-for="object in tempCurrentTargets"
        :style="object.style"
        :class="object.class"
        @mousedown="clickedTarget(object)"
      >
        <div style="background-color: #ffffff44">
          <!-- should be 3 chord rows -->
          <v-row
            class="ma-0 pa-0"
            v-for="(chordRow, index) in object.chord"
            :key="object.id + chordRow[0][0] + 'chord' + index"
          >
            <!-- should be 3 note columns per row -->
            <v-col
              class="ma-0 pa-0"
              cols="4"
              v-for="(note, i) in chordRow"
              :key="object.id + note + 'note' + i"
              style="border: 1px solid #999999"
            >
              <v-icon large :color="note != 0 ? 'black' : 'transparent'"
                >mdi-circle</v-icon
              >
            </v-col>
          </v-row>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  noteTimeline,
  // fadeBulletHole
} from "./animate";
import { midi } from "./midi";

export default {
  data() {
    return {
      midiUrl: "src/nocturne_midi.mid",
      midiPlayer: null,
      playing: false,
      pageSize: 5, // size of page of created objects. must be at least 20.
      currentTargetIndex: 0, // index of current target. This is the target to click next, and the target that will be removed from view next.
      tempCurrentTargets: [],
      divisions: null,
      keyDown: {
        q: false,
        w: false,
        e: false,
        a: false,
        s: false,
        d: false,
        z: false,
        x: false,
        c: false,
      },
      songXML: null,
      songFile: null,
      blocksAnimation: null,
      currentTargetMax: 0,
      finished: false,
      tempo: 60, // beats per minute
      duration: 4000, // time for target to go from top to bottom of board
      hitRadius: 10,
      points: 0,
      quantity: 100,
      size: 90,
      cursorRounded: null,
      mouseDown: false,
      lastX: 0,
      lastY: 0,
      clipSize: 400,
      bulletsInClip: 400,
      createdObjects: [],
      currentTarget: null,
      reloading: false,
      stringToColor: {
        1: "#772277",
        2: "#442299",
        3: "#225533",
        4: "#cccc22",
        5: "#dd8800",
        6: "#771111",
      },
      fretToKey: {
        1: { key: "q", chordIndex: [0, 0] },
        2: { key: "w", chordIndex: [0, 1] },
        3: { key: "e", chordIndex: [0, 2] },
        4: { key: "a", chordIndex: [1, 0] },
        5: { key: "s", chordIndex: [1, 1] },
        6: { key: "d", chordIndex: [1, 2] },
        7: { key: "z", chordIndex: [2, 0] },
        8: { key: "x", chordIndex: [2, 1] },
        9: { key: "c", chordIndex: [2, 2] },
        10: { key: "q", chordIndex: [0, 0] },
        11: { key: "w", chordIndex: [0, 1] },
        12: { key: "e", chordIndex: [0, 2] },
        13: { key: "a", chordIndex: [1, 0] },
        14: { key: "s", chordIndex: [1, 1] },
        15: { key: "d", chordIndex: [1, 2] },
        16: { key: "z", chordIndex: [2, 0] },
        17: { key: "x", chordIndex: [2, 1] },
        18: { key: "c", chordIndex: [2, 2] },
        19: { key: "q", chordIndex: [0, 0] },
        20: { key: "w", chordIndex: [0, 1] },
        21: { key: "e", chordIndex: [0, 2] },
      },
    };
  },
  watch: {
    // mouseDown() {
    //   let x = setInterval(() => {
    //     if (this.mouseDown) {
    //       this.fire();
    //     } else {
    //       clearInterval(x);
    //     }
    //   }, 86); // mimic M416 fire rate
    // },

    divisions() {
      console.log("divisions updated", this.divisions);
    },

    async validObjects() {
      console.log("valid objects");
      let delay;
      if (this.validObjects.length > 0) {
        this.tempCurrentTargets = this.validObjects.slice(0, this.pageSize);
        await this.$nextTick();
        if (this.blocksAnimation && this.tempCurrentTargets.length > 0) {
          this.tempCurrentTargets.forEach((object) => {
            if (!object.hasAnimation) {
              // start this long before the previous object's animation ends (ex: 4000 - 3000 = 1000 or 1 second before previous animation ends)
              delay = "-=".concat(object.duration - object.prevNoteDelay);

              if (object.id == "target0") {
                this.blocksAnimation.add(
                  {
                    targets: object.anim.targets,
                    top: object.anim.top,
                    complete: object.anim.complete,
                    begin: object.anim.begin,
                    duration: object.anim.duration,
                  },
                  1000
                );
              } else {
                this.blocksAnimation.add(
                  {
                    targets: object.anim.targets,
                    top: object.anim.top,
                    complete: object.anim.complete,
                    begin: object.anim.begin,
                    duration: object.anim.duration,
                  },
                  delay
                );
              }
              object.hasAnimation = true;
            }
          });
        }
      }
    },
  },
  computed: {
    part() {
      if (!this.songXML) {
        return null;
      }
      let ret = this.songXML.querySelector("part#P1");
      return ret;
    },

    measures() {
      if (!this.part) {
        return null;
      }
      let ret = Array.from(this.part.children);
      return ret;
    },

    song() {
      let song = [];
      if (!this.measures) {
        return null;
      }

      this.measures.forEach((partMeasure) => {
        let measureObject = { measure: { notes: [] } };

        let measureNotes = Array.from(partMeasure?.children ?? [])?.filter(
          (pm) => {
            return pm?.localName == "note";
          }
        );

        let attributes = Array.from(partMeasure?.children ?? [])?.filter(
          (pm) => {
            return pm?.localName == "attributes";
          }
        )?.[0];

        let divisions = Array.from(attributes?.children ?? [])?.filter(
          (attrs) => {
            return attrs.localName == "divisions";
          }
        )?.[0]?.textContent;

        // this should only be true once per part(?).
        if (divisions) {
          this.divisions = divisions;
        }

        let direction = Array.from(partMeasure?.children ?? [])?.filter(
          (pm) => {
            return pm?.localName == "direction";
          }
        )?.[0];

        let sound = Array.from(direction?.children ?? [])?.filter((dirs) => {
          return dirs?.localName == "sound";
        })?.[0]?.attributes?.[0]?.value;

        if (sound) {
          this.tempo = sound;
        }

        for (let i = 0; i < measureNotes.length; i++) {
          let measureNote = measureNotes?.[i];

          let noteDuration = Array.from(measureNote?.children ?? [])?.filter(
            (section) => {
              return section.localName == "duration";
            }
          )?.[0]?.textContent;

          let noteType = Array.from(measureNote?.children ?? [])?.filter(
            (section) => {
              return section.localName == "type";
            }
          )?.[0]?.textContent;

          let noteNotations = Array.from(measureNote?.children ?? [])?.filter(
            (section) => {
              return section?.localName == "notations";
            }
          )?.[0];

          let noteTechnical = Array.from(noteNotations?.children ?? [])?.[0];

          let noteTechnicalChildren = Array.from(noteTechnical?.children ?? []);

          let noteChord = Array.from(measureNote?.children ?? [])?.filter(
            (section) => {
              return section?.localName == "chord";
            }
          )?.length;

          let fretStringChord = {
            fret: noteTechnicalChildren?.[0]?.textContent,
            string: noteTechnicalChildren?.[1]?.textContent,
            chord: Boolean(noteChord),
            duration: parseInt(noteDuration),
            tempo: parseInt(this.tempo),
            type: noteType,
          };

          // if this note is part of a chord, combine this note with the previous note in an Array to form the chord.
          // else, push the single note onto the list.
          if (fretStringChord?.chord) {
            // get previous note
            let prevNote =
              measureObject.measure.notes[
                measureObject.measure.notes.length - 1
              ];
            // if the previous note is already an Array, push new note in.
            // this will only happen if the previous note is already a chord with multiple single notes.
            // else, convert the previous note to a chord consisting of the previous note and the new note.
            if (prevNote.length) {
              prevNote.push(fretStringChord);
            } else {
              measureObject.measure.notes[
                measureObject.measure.notes.length - 1
              ] = [prevNote, fretStringChord];
            }
          } else if (fretStringChord.fret && fretStringChord.string) {
            measureObject.measure.notes.push(fretStringChord);
          }
        }

        if (measureObject.measure.notes.length) {
          song.push(measureObject);
        }
      });
      console.log("song", song);
      return song;
    },

    validObjects() {
      return this.createdObjects.filter((o) => {
        return o != undefined;
      });
    },
  },
  mounted() {
    this.initialize();
  },
  methods: {
    initialize() {
      this.midiPlayer = midi(this.midiUrl);
      // this.cursorRounded = document.querySelector(".rounded");
      // this.cursorRounded.style["pointer-events"] = "none";
      // this.cursorRounded.style["z-index"] = 1;
      this.createdObjects = [];
      // this.currentTargetMax = this.duration / this.stagger;
      // window.addEventListener("mousemove", this.moveCursor);
      // window.addEventListener("drag", this.moveCursor);
      // window.addEventListener("mousedown", this.mousedownHandler);
      // window.addEventListener("mouseup", this.mouseUpHandler);
      window.addEventListener("keydown", this.keyDownHandler);
      window.addEventListener("keyup", this.keyUpHandler);
      this.loadSongXML();
    },

    computeDelay(noteType, tempo) {
      let multiplier;
      switch (noteType) {
        case "whole":
          multiplier = 4;
          break;
        case "half":
          multiplier = 2;
          break;
        case "quarter":
          multiplier = 1;
          break;
        case "eighth":
          multiplier = 0.5;
          break;
        case "sixteenth":
          multiplier = 0.25;
          break;
      }
      // this will give correct delay for quarter notes only (if tempo is set correctly)
      // if the note is a whole note, multiply this by 4
      // if the note is a half, multiply by 2
      // if the note is an eighth, divide by 2
      // if the note is a sixteenth, divide by 4
      // then, this will give you the correct delay before the next note.
      return (multiplier * (1000 * 60)) / tempo;
    },

    loadSongXML() {
      let that = this;
      let parser, xmlDoc, fr;
      document.getElementById("songFile")?.addEventListener("change", (el) => {
        fr = new FileReader();
        fr.onload = (f) => {
          parser = new DOMParser();
          xmlDoc = parser.parseFromString(f.target.result, "text/xml");

          that.songFile = f;
          that.songXML = xmlDoc;
        };
        fr.readAsText(el.target.files[0]);
      });
    },

    loadObjects() {
      if (this.blocksAnimation) {
        delete this.blocksAnimation;
      }
      this.blocksAnimation = noteTimeline(this.animationCompleteCallback);
      this.createdObjects = [];
      this.createObjects();
    },

    // Actions
    startGame() {
      if (this.song) {
        console.log("start game");
        this.finished = false;
        this.points = 0;
        this.bulletsInClip = this.clipSize;
        this.startAnimations();
        // this.updateTargetList(); // todo: reimplement after we get timing set properly
      } else {
        console.log("no song");
      }
    },

    reload() {
      this.reloading = true;
      window.setTimeout(() => {
        this.bulletsInClip = this.clipSize;
        this.reloading = false;
      }, 1000);
    },

    // fire() {
    //   this.mouseDown = true;
    //   let mouseY = this.lastY - 8;
    //   let mouseX = this.lastX - 8;
    //   let height = this.hitRadius * 2;
    //   let width = this.hitRadius * 2;
    //   let main;
    //   let bulletHole;

    //   if (this.bulletsInClip > 0 && !this.reloading) {
    //     // this.playGunShot();
    //     main = document.getElementById("bullet-holes");
    //     bulletHole = document.createElement("div");
    //     bulletHole.setAttribute(
    //       "style",
    //       "z-index: 5; background-color: black; border-radius: 50%; pointer-events: none; position: absolute; left: " +
    //         mouseX +
    //         "px; top: " +
    //         mouseY +
    //         "px; height:" +
    //         height +
    //         "px; width:" +
    //         width +
    //         "px;"
    //     );
    //     bulletHole.setAttribute("class", "bullet-hole");
    //     main.appendChild(bulletHole);
    //     this.bulletsInClip--;
    //     this.checkIsHit(mouseX, mouseY);
    //     fadeBulletHole(bulletHole, this.fadeBulletHoleCallback);
    //   }
    // },

    startAnimations() {
      console.log("start animations");
      if (this.blocksAnimation) {
        console.log("play");
        this.blocksAnimation.play();
      }
    },

    createObjects() {
      let size = this.size;
      let left;
      let top;
      let object;

      // for each measure in song
      for (let i = 0; i < this.song.length; i++) {
        // for each note in measure
        for (let x = 0; x < this.song[i].measure.notes.length; x++) {
          let note = this.song[i].measure.notes[x];
          let string;
          let delay;
          let tempo;
          let type;
          let frets = [];
          object = {};

          // map the note to the chord shape
          /**
           * [
           * [Q: 1, 10, 19, W: 2, 11, 20, E: 3, 12, 21],
           * [A: 4, 13, S: 5, 14, D: 6, 15],
           * [Z: 7, 16, X: 8, 17, C: 9, 18]
           * ]
           */
          let chordShape = [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
          ];

          // if chord else single note
          if (note.length) {
            // innerText = innerText.concat("chord: \n");
            note.forEach((n) => {
              frets.push(n.fret);
              let ftok = this.fretToKey[parseInt(n.fret)];
              if (ftok) {
                chordShape[ftok.chordIndex[0]][ftok.chordIndex[1]] = ftok.key;
              }
            });
            string = parseInt(note[0].string);
            delay = note[0].duration;
            tempo = note[0].tempo;
            type = note[0].type;
          } else {
            frets.push(note.fret);
            let ftok = this.fretToKey[parseInt(note.fret)];
            if (ftok) {
              chordShape[ftok.chordIndex[0]][ftok.chordIndex[1]] = ftok.key;
            }
            string = parseInt(note.string);
            delay = note.duration;
            tempo = note.tempo;
            type = note.type;
          }

          left = (string + 1) * size * 2 + "px;";
          // top = -200 + "px;";
          top = 0 + "px;";

          object.class = "block";
          object.style = "left: "
            .concat(left)
            .concat(" height: ")
            .concat(size)
            .concat("px; width: ")
            .concat(size)
            .concat(
              "px; display: flex; align-items: center; justify-content: center; position: absolute; top:"
            )
            .concat(top)
            .concat("background-color: ")
            .concat(this.stringToColor[string])
            .concat("; border-radius: 4px;");

          object.chord = chordShape;
          object.id = "target" + this.createdObjects.length;
          object.string = string;
          object.delay = delay;
          object.tempo = tempo;
          object.type = type;

          if (this.createdObjects.length > 0) {
            let prevObject =
              this.createdObjects[this.createdObjects.length - 1];
            let prevNoteDelay = this.computeDelay(
              prevObject.type,
              prevObject.tempo
            );
            object.prevNoteDelay = prevNoteDelay;
          } else {
            object.prevNoteDelay = null;
          }

          object.duration = this.duration;
          let objects = this.createdObjects.length + 1;
          let begin =
            objects % this.pageSize == 0
              ? this.startNextPage
              : this.addNextNote;

          object.anim = {
            targets: "#target".concat(this.createdObjects.length),
            top: "1000px", // set to 1600
            duration: this.duration,
            begin: begin, // add the startNextPage animation to the last object of the page
          };
          object.hasAnimation = false;
          this.createdObjects.push(object);
        }
      }
    },

    addNextNote() {
      this.currentTargetIndex += 1;
      let pushIndex = this.currentTargetIndex + (this.pageSize - 1);
      // console.log("push index", pushIndex);
      this.tempCurrentTargets.push(this.createdObjects[pushIndex]);
    },

    async startNextPage(e) {
      // console.log("told to start", e);
      this.addNextNote();
      await this.$nextTick();
      let newNoteTimeline = noteTimeline(this.animationCompleteCallback);
      let objects = this.tempCurrentTargets.slice(-this.pageSize);
      let delay;
      objects.forEach((o, index) => {
        // since we have no knowledge of the previous animation's timeline, we need to set an absolute delay for the first item of the new timeline animation
        if (index == 0) {
          newNoteTimeline.add({
            targets: o.anim.targets,
            top: o.anim.top,
            begin: o.anim.begin,
            duration: o.anim.duration,
            delay: o.delay,
          });
        } else {
          delay = "-=".concat(o.duration - o.prevNoteDelay);
          newNoteTimeline.add(
            {
              targets: o.anim.targets,
              top: o.anim.top,
              begin: o.anim.begin,
              duration: o.anim.duration,
            },
            delay
          );
        }

        o.hasAnimation = true;
      });
      newNoteTimeline.play();
    },

    // Handlers
    clickedTarget(e) {
      e.target.style["visibility"] = "hidden";
      console.log("pressed", e);
    },

    keyDownHandler(e) {
      if (e.key == "r") {
        this.reload();
      }

      if (e.key == "q" && !this.keyDown["q"]) {
        console.log("q");
        this.keyDown["q"] = true;
      }

      if (e.key == "w" && !this.keyDown["w"]) {
        console.log("w");
        this.keyDown["w"] = true;
      }

      if (e.key == "e" && !this.keyDown["e"]) {
        console.log("e");
        this.keyDown["e"] = true;
      }

      if (e.key == "a" && !this.keyDown["a"]) {
        console.log("a");
        this.keyDown["a"] = true;
      }

      if (e.key == "s" && !this.keyDown["s"]) {
        console.log("s");
        this.keyDown["s"] = true;
      }

      if (e.key == "d" && !this.keyDown["d"]) {
        console.log("d");
        this.keyDown["d"] = true;
      }

      if (e.key == "z" && !this.keyDown["z"]) {
        console.log("z");
        this.keyDown["z"] = true;
      }

      if (e.key == "x" && !this.keyDown["x"]) {
        console.log("x");
        this.keyDown["x"] = true;
      }

      if (e.key == "c" && !this.keyDown["c"]) {
        console.log("c");
        this.keyDown["c"] = true;
      }
    },

    keyUpHandler(e) {
      if (e.key == "q") {
        console.log("q");
        this.keyDown["q"] = false;
      }

      if (e.key == "w") {
        console.log("w");
        this.keyDown["w"] = false;
      }

      if (e.key == "e") {
        console.log("e");
        this.keyDown["e"] = false;
      }

      if (e.key == "a") {
        console.log("a");
        this.keyDown["a"] = false;
      }

      if (e.key == "s") {
        console.log("s");
        this.keyDown["s"] = false;
      }

      if (e.key == "d") {
        console.log("d");
        this.keyDown["d"] = false;
      }

      if (e.key == "z") {
        console.log("z");
        this.keyDown["z"] = false;
      }

      if (e.key == "x") {
        console.log("x");
        this.keyDown["x"] = false;
      }

      if (e.key == "c") {
        console.log("c");
        this.keyDown["c"] = false;
      }
    },

    // mouseUpHandler(e) {
    //   this.mouseDown = false;
    // },

    // mousedownHandler(e) {
    //   this.fire();
    // },

    // moveCursor(e) {
    //   let mouseY = e.clientY - 100;
    //   let mouseX = e.clientX - 100;

    //   this.lastY = e.clientY;
    //   this.lastX = e.clientX;

    //   this.cursorRounded.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
    // },

    // Callbacks
    async animationCompleteCallback() {
      if (!this.playing) {
        if (this.midiPlayer) {
          this.midiPlayer.play();
        }
        this.playing = true;
      }

      window.setTimeout(() => {
        this.tempCurrentTargets.splice(0, this.pageSize);
      }, 1000);
    },

    // fadeBulletHoleCallback() {
    //   let main = document.getElementById("bullet-holes");
    //   if (main.children.length > 0) {
    //     main.removeChild(main.children[0]);
    //   }
    // },
  },
};
</script>

<style scoped>
.board {
  height: 100vh;
  width: 100%;
  background-color: #334066;
  overflow: hidden;
}

/* .rounded {
  width: 200px;
  height: 200px;
  background-color: #ffffff00;
  border: 2px solid black;
  border-radius: 50% !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

.inner-dot {
  width: 8px;
  height: 8px;
  filter: blur(2px);
  background-color: rgba(255, 0, 0, 0.705);
  border-radius: 50%;
} */

.line {
  width: 100%;
  background-color: white;
  position: relative;
  top: 0px;
  height: 5px;
}

.bottom-line {
  width: 100%;
  background-color: white;
  position: relative;
  bottom: 0px;
  height: 5px;
}

.no-select {
  -webkit-touch-callout: none; /* iOS Safari */
  -webkit-user-select: none; /* Safari */
  -khtml-user-select: none; /* Konqueror HTML */
  -moz-user-select: none; /* Old versions of Firefox */
  -ms-user-select: none; /* Internet Explorer/Edge */
  user-select: none; /* Non-prefixed version, currently
                                  supported by Chrome, Edge, Opera and Firefox */
}
</style>
