const wavesurfer = WaveSurfer.create({
  container: "#waveform",
  waveColor: "rgb(200, 0, 200)",
  progressColor: "rgb(100, 0, 100)",
  cursorWidth: 1,
  url: "sing.mp3",
});

const marks = { 0: 0.0 };

addEventListener("keydown", function (event) {
  if (event.key === " ") {
    wavesurfer.playPause();
  } else if (event.key === "ArrowDown" || event.key === "Down") {
    const percentage = wavesurfer.getCurrentTime() / wavesurfer.getDuration();
    addMark(percentage);
  } else if (event.key == "ArrowLeft") {
    const percentage = wavesurfer.getCurrentTime() / wavesurfer.getDuration();
    const prevMark = Object.entries(marks).reduce((prev, curr) => {
      return curr[1] < percentage ? curr : prev;
    });
    wavesurfer.seekTo(prevMark[1]);
  } else if (event.key == "ArrowRight") {
    const percentage = wavesurfer.getCurrentTime() / wavesurfer.getDuration();
    for (let mark in marks) {
      if (marks[mark] > percentage) {
        wavesurfer.seekTo(marks[mark]);
        break;
      }
    }
  } else if (event.key == "ArrowUp" || event.key === "Up") {
    const percentage = wavesurfer.getCurrentTime() / wavesurfer.getDuration();
    console.log(marks);
    const closestMark = Object.entries(marks).reduce((prev, curr) => {
      return Math.abs(curr[1] - percentage) < Math.abs(prev[1] - percentage)
        ? curr
        : prev;
    });

    console.log(closestMark);
    delete marks[closestMark[0]];
    this.document.getElementById("marks").removeChild(
      this.document.getElementById(`mark${closestMark[0]}`)
    );
  }
});

function addMark(percentage) {
  if (!Object.values(marks).includes(percentage)) {
    let keys = Object.keys(marks);
    let keyNums = keys.map((key) => Number(key));
    let maxKey = Math.max(...keyNums);
    const id = maxKey + 1;
    const mark = document.createElement("div");
    mark.classList.add("mark");
    mark.style.left = `${percentage * 100}%`;
    mark.id = `mark${id}`;
    document.querySelector("#marks").appendChild(mark);
    marks[id * 1] = percentage;
  }
}
