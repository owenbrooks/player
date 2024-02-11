const wavesurfer = WaveSurfer.create({
  container: "#waveform",
  waveColor: "rgb(200, 0, 200)",
  progressColor: "rgb(100, 0, 100)",
  cursorWidth: 1,
  url: "sing.mp3",
});

const marks = [{ id: 0, time: 0.0 }];

function findClosestIndex(arr, target) {
  let closest = 0;
  let closestDist = Math.abs(arr[0] - target);
  for (let i = 1; i < arr.length; i++) {
    const dist = Math.abs(arr[i] - target);
    if (dist < closestDist) {
      closest = i;
      closestDist = dist;
    }
  }
  return closest;
}

addEventListener("keydown", function (event) {
  if (event.key === " ") {
    wavesurfer.playPause();
  } else if (event.key === "ArrowDown" || event.key === "Down") {
    const percentage = wavesurfer.getCurrentTime() / wavesurfer.getDuration();
    addMark(percentage);
  } else if (event.key == "ArrowLeft") {
    const percentage = wavesurfer.getCurrentTime() / wavesurfer.getDuration();
    if (marks.length === 0) return;
    if (marks.length === 1 && marks[0].time < percentage) {
      wavesurfer.seekTo(marks[0].time);
      return;
    }
    let closestMark = null;
    for (let mark of marks) {
      if (mark.time < percentage) {
        closestMark = mark;
      } else {
        break;
      }
    }
    if (closestMark !== null) {
      wavesurfer.seekTo(closestMark.time);
    }
  } else if (event.key == "ArrowRight") {
    const percentage = wavesurfer.getCurrentTime() / wavesurfer.getDuration();
    if (marks.length === 0) return;
    if (marks.length === 1 && marks[0].time > percentage) {
      wavesurfer.seekTo(marks[0].time);
      return;
    }
    let closestMark = null;
    for (let mark of [...marks].reverse()) {
      if (mark.time > percentage) {
        closestMark = mark;
      } else {
        break;
      }
    }
    if (closestMark !== null) {
      wavesurfer.seekTo(closestMark.time);
    }
  } else if (event.key == "ArrowUp" || event.key === "Up") {
    // TODO this is broken
    if (marks.length === 0) return;
    const percentage = wavesurfer.getCurrentTime() / wavesurfer.getDuration();
    
    // Find closest mark
    const distances = marks.map((mark) => Math.abs(mark.time - percentage));
    let closestIndex = 0;
    let closestDist = distances[0];
    for (let index = 0; index < distances.length; index++) {
      if (distances[index] < closestDist) {
        closestIndex = index;
        closestDist = distances[index];
      } 
    }

    // Remove from DOM
    const closestMarkId = marks[closestIndex].id;
    console.log(closestIndex, marks[closestIndex])
    this.document
      .getElementById("marks")
      .removeChild(this.document.getElementById(`mark${closestMarkId}`));
    // Remove from state
    marks.splice(closestIndex, 1);
  }
});

function addMark(percentage) {
  if (!marks.map((mark) => mark.time).includes(percentage)) {
    let newId;
    if (marks.length === 0) {
      newId = 0;
    } else {
      const ids = marks.map((mark) => mark.id);
      let maxId = Math.max(...ids);
      newId = maxId + 1;
    }

    // Record new mark in state
    marks.push({ id: newId, time: percentage });
    marks.sort((a, b) => a.time - b.time);

    // Create new mark in the DOM
    const mark = document.createElement("div");
    mark.classList.add("mark");
    mark.style.left = `${percentage * 100}%`;
    mark.id = `mark${newId}`;
    document.querySelector("#marks").appendChild(mark);

  }
}
