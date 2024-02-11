const wavesurfer = WaveSurfer.create({
  container: "#waveform",
  waveColor: "rgb(200, 0, 200)",
  progressColor: "rgb(100, 0, 100)",
  cursorWidth: 3,
  url: "sing.mp3",
});

const marks = [0.0];

// const wsRegions = wavesurfer.registerPlugin(RegionsPlugin.create());
// wsRegions.addRegion({
//   start: 19,
//   content: "Marker",
//   color: randomColor(),
// });

addEventListener("keydown", function (event) {
  if (event.key === " ") {
    wavesurfer.playPause();
  }
});

addEventListener("keydown", function (event) {
  if (event.key === "ArrowDown" || event.key === "Down") {
    const time = wavesurfer.getCurrentTime();
    console.log(time);
    addMark(time);
  }
});

function addMark(time) {
  const mark = document.createElement("div");
  mark.classList.add("mark");
  mark.style.left = `${(time / wavesurfer.getDuration()) * 100}%`;
  document.querySelector("#marks").appendChild(mark);
  marks.push(time);
}
