let marks = [{ id: 0, time: 0.0 }];
let fileName = "";
let wavesurfer = undefined;

const inputElement = document.getElementById("filepicker");
inputElement.addEventListener("change", handleFiles, false);

// Load volume setting if we have any saved
const volume = localStorage.getItem("volume");
if (volume) {
  document.getElementById("volume").value = volume;
}

function handleFiles() {
  const fileList = this.files;
  const file = fileList[0];
  fileName = file.name;
  const fileUrl = URL.createObjectURL(file);

  // Remove previous waveform if there was one
  if (wavesurfer !== undefined) {
    wavesurfer.destroy();
  }

  wavesurfer = WaveSurfer.create({
    container: "#waveform",
    waveColor: "#ec4899",
    progressColor: "#be185d",
    cursorWidth: 1,
    cursorColor: "white",
    url: fileUrl,
  });

  // Load marks if we have any saved
  loadMarks(fileName);

  // Set volume
  const volumeInput = document.getElementById("volume");
  handleVolumeChange(volumeInput);

  // Show waveform
  const waveformContainer = document.getElementById("waveform-container");
  waveformContainer.style.display = "";
  const uploadPrompt = document.getElementById("upload-prompt");
  uploadPrompt.style.display = "none";
}

// // For debugging / dev
// wavesurfer = WaveSurfer.create({
//   container: "#waveform",
//   waveColor: "#ec4899",
//   progressColor: "#be185d",
//   cursorWidth: 1,
//   cursorColor: "white",
//   url: "sing.mp3",
// });
// // Show waveform
// const waveformContainer = document.getElementById("waveform-container");
// waveformContainer.style.display = "";

function handleVolumeChange(inputElement) {
  const maxVolume = 100;
  const newVolume = inputElement.value;
  const volumeFraction = newVolume / maxVolume;
  wavesurfer.setVolume(volumeFraction);
  localStorage.setItem("volume", newVolume);
}

addEventListener("keydown", function (event) {
  if (event.key === " ") {
    wavesurfer.playPause();
    event.preventDefault(); // stop space from scrolling the page or opening file input
  } else if (event.key === "ArrowDown" || event.key === "Down") {
    const playhead = wavesurfer.getCurrentTime() / wavesurfer.getDuration();
    addMark(playhead);
    saveMarks();
  } else if (event.key == "ArrowLeft") {
    const playhead = wavesurfer.getCurrentTime() / wavesurfer.getDuration();
    seekToPreviousMark(playhead);
    event.preventDefault(); // stop arrow from changing volume
  } else if (event.key == "ArrowRight") {
    const playhead = wavesurfer.getCurrentTime() / wavesurfer.getDuration();
    seekToNextMark(playhead);
    event.preventDefault(); // stop arrow from changing volume
  } else if (event.key == "ArrowUp" || event.key === "Up") {
    if (marks.length === 0) return;
    const playhead = wavesurfer.getCurrentTime() / wavesurfer.getDuration();
    removeClosestMark(playhead);
    saveMarks();
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

function handleMarkClick(markdiv) {
  const markTime = markdiv.style.left.slice(0, -1) / 100;
  wavesurfer.seekTo(markTime);
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
    mark.onclick = () => handleMarkClick(mark);
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

function removeAllMarks() {
  // Remove from DOM
  for (let mark of marks) {
    if (mark.id !== 0) {
      this.document.getElementById(`mark${mark.id}`).remove();
    }
  }

  // Remove from state
  marks = [{ id: 0, time: 0.0 }];
}

function saveMarks() {
  const marksToSave = marks.slice(1); // Remove the initial mark at 0
  const marksJson = JSON.stringify(marksToSave);
  localStorage.setItem(fileName, marksJson);
}

function loadMarks(songName) {
  removeAllMarks();
  const marksJson = localStorage.getItem(songName);
  if (marksJson) {
    marks = [{ id: 0, time: 0.0 }];
    const marksToLoad = JSON.parse(marksJson);
    for (let mark of marksToLoad) {
      addMark(mark.time);
    }
  }
}
