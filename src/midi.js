import MidiPlayer from "midi-player-js";
export class MyMidiPlayer {
  constructor() {
    // this._audioContext;
    // this._safeAudioContext;
    this._midi = null;
    this._player = null;
  }

  async setPlayer() {
    // this._audioContext =
    //   window.AudioContext || window.webkitAudioContext || false;
    // this._safeAudioContext = new this._audioContext();
    this._player = new MidiPlayer.Player((event) => {
      // console.log(event);
      if (event.name === "Controller Change") {
        this.onControllerChange(event);
      } else if (event.name === "Note on") {
        this.onNoteOnEvent(event);
      } else if (event.name === "Note off") {
        this.onNoteOffEvent(event);
      }
    });
  }

  onControllerChange(event) {
    // console.log("onControllerChange event", event);
  }

  onNoteOnEvent(event) {
    // console.log("onNoteOnEvent event", event);
  }

  onNoteOffEvent(event) {
    // console.log("onNoteOffEvent event", event);
  }

  async setMidi(midiUrl) {
    // "../assets/chopin_etude_rev.mid"
    this._midi = await fetch(midiUrl).then((response) =>
      response.arrayBuffer()
    );
    console.log("this._midi", this._midi);
    this._player.loadArrayBuffer(this._midi);
  }

  play() {
    console.log(
      "player?",
      this._player.bytesProcessed(),
      this._player.getSongTime(),
      this._player.tracks
    );
    if (this._player.isPlaying()) {
      console.log("stop");
      this._player.stop();
    }
    console.log("play");
    this._player.play();
  }

  stop() {
    this._player.stop();
  }

  get player() {
    return this._player;
  }
}
