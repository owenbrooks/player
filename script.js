const inputElement = document.getElementById("filepicker");
inputElement.addEventListener("change", handleFiles, false);
function handleFiles() {
  const fileList = this.files;
  const fileUrl = URL.createObjectURL(fileList[0]);
  wavesurfer = WaveSurfer.create({
    container: "#waveform",
    waveColor: "rgb(200, 0, 200)",
    progressColor: "rgb(100, 0, 100)",
    cursorWidth: 1,
    url: fileUrl,
  });

  // Show waveform
  const waveformContainer = document.getElementById("waveform-container");
  waveformContainer.style.display = '';
}

const marks = [{ id: 0, time: 0.0 }];

addEventListener("keydown", function (event) {
  if (event.key === " ") {
    wavesurfer.playPause();
  } else if (event.key === "ArrowDown" || event.key === "Down") {
    const playhead = wavesurfer.getCurrentTime() / wavesurfer.getDuration();
    addMark(playhead);
  } else if (event.key == "ArrowLeft") {
    const playhead = wavesurfer.getCurrentTime() / wavesurfer.getDuration();
    seekToPreviousMark(playhead);
  } else if (event.key == "ArrowRight") {
    const playhead = wavesurfer.getCurrentTime() / wavesurfer.getDuration();
    seekToNextMark(playhead);
  } else if (event.key == "ArrowUp" || event.key === "Up") {
    if (marks.length === 0) return;
    const playhead = wavesurfer.getCurrentTime() / wavesurfer.getDuration();
    removeClosestMark(playhead);
  }
});

function seekToPreviousMark(playhead) {
  if (marks.length === 0) return;
  if (marks.length === 1 && marks[0].time < playhead) {
    wavesurfer.seekTo(marks[0].time);
    return;
  }
  let closestMark = null;
  for (let mark of marks) {
    if (mark.time < playhead) {
      closestMark = mark;
    } else {
      break;
    }
  }
  if (closestMark !== null) {
    wavesurfer.seekTo(closestMark.time);
  }
}

function seekToNextMark(playhead) {
  if (marks.length === 0) return;
  let closestMark = null;
  for (let mark of [...marks].reverse()) {
    if (mark.time > playhead) {
      closestMark = mark;
    } else {
      break;
    }
  }
  if (closestMark !== null) {
    wavesurfer.seekTo(closestMark.time);
  }
}

function addMark(percentage) {
  if (!marks.map((mark) => mark.time).includes(percentage)) {
    // Compute new mark id
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

function removeClosestMark(playhead) {
  // Find closest mark to current position
  const distances = marks.map((mark) => Math.abs(mark.time - playhead));
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
  this.document
    .getElementById("marks")
    .removeChild(this.document.getElementById(`mark${closestMarkId}`));
  // Remove from state
  marks.splice(closestIndex, 1);
}