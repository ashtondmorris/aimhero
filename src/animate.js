import anime from "animejs";

export function translate(duration = 5000, stagger = 250, callback) {
  return anime({
    targets: "#board .block",
    top: "1600px",
    easing: "linear",
    duration: duration,
    display: "none",
    delay: anime.stagger(stagger),
    complete: callback,
  });
}

export function noteTimeline(callback) {
  return anime.timeline({
    autoplay: false,
    complete: callback,
    begin: () => {
      console.log("begin");
    },
    easing: "linear",
  });
}

export function fadeBulletHole(element, callback) {
  anime({
    targets: element,
    easing: "linear",
    duration: 2500,
    translateY: "800",
    scale: 0,
    complete: callback,
  });
}
