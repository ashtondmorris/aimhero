import MidiPlayer from "midi-player-js";

export function midi(url) {
  let p = new MidiPlayer.Player((e) => {
    console.log("url", url);
    console.log("e", e);
  });
  try {
    p.loadFile(url);
  } catch (e) {
    console.log("error", e);
  }
  return p;
}
