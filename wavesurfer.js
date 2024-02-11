const wavesurfer = WaveSurfer.create({
  container: "#waveform",
  waveColor: "rgb(200, 0, 200)",
  progressColor: "rgb(100, 0, 100)",
  cursorWidth: 3,
  url: "sing.mp3",
});

const marks = [0.0];

addEventListener("keydown", function (event) {
  if (event.key === " ") {
    wavesurfer.playPause();
  } else if (event.key === "ArrowDown" || event.key === "Down") {
    const percentage = wavesurfer.getCurrentTime() / wavesurfer.getDuration();
    addMark(percentage);
  } else if (event.key == "ArrowLeft") {
    const percentage = wavesurfer.getCurrentTime() / wavesurfer.getDuration();
    const closestPreviousMark = marks.reduce((prev, curr) => {
      return curr < percentage ? curr : prev;
    });
    wavesurfer.seekTo(closestPreviousMark);
  } else if (event.key == "ArrowRight") {
    const percentage = wavesurfer.getCurrentTime() / wavesurfer.getDuration();
    const nextMark = marks.find((mark) => mark > percentage);
    if (nextMark) {
      wavesurfer.seekTo(nextMark);
    }
  }
});

function addMark(percentage) {
  if (!marks.includes(percentage)) {
    const mark = document.createElement("div");
    mark.classList.add("mark");
    mark.style.left = `${percentage * 100}%`;
    document.querySelector("#marks").appendChild(mark);
    marks.push(percentage);
  }
}
