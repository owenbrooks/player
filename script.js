let marks = [{ id: 0, time: 0.0 }];
let fileName = "";
let wavesurfer = undefined;
let isPlaying = false;
let currentSpeed = 1.0;
let unsubscribeFn = null;
let warmedUp = false;

main();

function main() {
  initialiseServiceWorker();
  initialiseVolume();
  initialiseFilePicker();
  initialiseKeyboardControls();
}

function initialiseServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service_worker.js');
  }
}

function initialiseVolume() {
  if (isRunningiOS()) {
    // Volume cannot be controlled on iOS: https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/Device-SpecificConsiderations/Device-SpecificConsiderations.html
    // "On iOS devices, the audio level is always under the user’s physical control. The volume property is not settable in JavaScript. Reading the volume property always returns 1."
    document.getElementById("volume-controls").style.display = "none";
  }

  // Load volume and speed settings if we have any saved
  const volume = localStorage.getItem("volume");
  if (volume) {
    document.getElementById("volume").value = volume;
  }
}

function initialiseFilePicker() {
  const inputElement = document.getElementById("filepicker");
  inputElement.addEventListener("change", handleFilePicker, false);
}

function initialiseKeyboardControls() {
  addEventListener("keydown", handleKeypress);
}

function handleKeypress(event) {
  if (event.key === " ") {
    event.preventDefault(); // stop space from scrolling the page or opening file input
    playpause();
  } else if (event.key === "Enter") { //|| event.key === "ArrowDown" || event.key === "Down") {
    handleMarkAdd();
  } else if (event.key === "ArrowLeft") {
    seekToPreviousMark();
    event.preventDefault(); // stop arrow from changing volume
  } else if (event.key === "ArrowRight") {
    seekToNextMark();
    event.preventDefault(); // stop arrow from changing volume
  } else if (event.key === "Delete" || event.key === "Backspace") {
    handleMarkRemove();
  }
}

function handleDrop(event) {
  event.preventDefault();
  if (event.dataTransfer.files.length > 0) {
    const file = event.dataTransfer.files[0];
    handleFile(file);
  }
}

function handleDragOver(event) {
  event.preventDefault();
  const dropzoneOverlay = document.getElementById("dropzone-overlay");
  dropzoneOverlay.style.display = "block";
}

function handleDragEnter(event) {
  event.preventDefault();
}

function handleDragLeave(event) {
  const dropzoneOverlay = document.getElementById("dropzone-overlay");
  dropzoneOverlay.style.display = "none";
}

function handleDragEnd(event) {
  const dropzoneOverlay = document.getElementById("dropzone-overlay");
  dropzoneOverlay.style.display = "none";
}

function handleFilePicker() {
  const fileList = this.files;
  const file = fileList[0];
  handleFile(file);
}

function handleFile(file) {
  fileName = file.name;
  const fileUrl = URL.createObjectURL(file);

  // Remove previous waveform if there was one
  if (wavesurfer !== undefined) {
    if (unsubscribeFn) {
      unsubscribeFn();
    }
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
  unsubscribeFn = wavesurfer.on("finish", handleFinish);

  // Load marks if we have any saved
  loadMarks(fileName);

  // Set volume based on current inputs
  const volumeInput = document.getElementById("volume");
  handleVolumeChange(volumeInput);
  // Note: setting speed here doesn't seem to work, so we set it when playing

  // Show waveform
  const waveformContainer = document.getElementById("waveform-container");
  waveformContainer.style.display = "";
  const uploadPrompt = document.getElementById("upload-container");
  uploadPrompt.style.display = "none";

  const dropzoneOverlay = document.getElementById("dropzone-overlay");
  dropzoneOverlay.style.display = "none";

  // Show the other file picker button
  const secondaryPicker = document.getElementById("secondary-filepicker");
  secondaryPicker.style.display = "grid";
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

// Speed control
function handleSpeedChange(elem) {
  const newSpeed = parseFloat(elem.value);
  updateSpeed(newSpeed);
};

function updateSpeed(value) {
  currentSpeed = value;
  wavesurfer?.setPlaybackRate(currentSpeed);
}

function handleVolumeChange(inputElement) {
  const maxVolume = 100;
  const newVolume = inputElement.value;
  const volumeFraction = newVolume / maxVolume;
  wavesurfer?.setVolume(volumeFraction);
  localStorage.setItem("volume", newVolume);
}

function handleFinish() {
  setPlaying(false);
}

function setPlaying(shouldPlay) {
  if (!wavesurfer) {
    return;
  }
  isPlaying = shouldPlay;
  if (shouldPlay) {
    wavesurfer.play();
  } else {
    wavesurfer.pause();
  }
  updateSpeed(currentSpeed);
  updatePlayIcon();
}

function playpause() {
  setPlaying(!isPlaying);
}

function updatePlayIcon() {
  const play_icon = document.getElementById("play-icon");
  const pause_icon = document.getElementById("pause-icon");

  if (isPlaying) {
    play_icon.style.display = "none";
    pause_icon.style.display = "flex";
  } else {
    play_icon.style.display = "block";
    pause_icon.style.display = "none";
  }
}

function seekToPreviousMark() {
  if (!wavesurfer) {
    return;
  }
  if (!warmedUp) {
    warmUpPlayer();
  }
  const playhead = wavesurfer.getCurrentTime() / wavesurfer.getDuration();
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

function warmUpPlayer() {
  // We need to do this at least once before the first time we seek,
  // otherwise wavesurfer doesn't start playback from the right place
  // It must be in response to a user input, not automatic
  // See https://github.com/katspaugh/wavesurfer.js/discussions/3896#discussioncomment-12247248
  wavesurfer.play();
  wavesurfer.pause();
  if (isPlaying) {
    wavesurfer.play();
  }
  warmedUp = true;
}

function seekToNextMark() {
  if (!wavesurfer) {
    return;
  }
  if (!warmedUp) {
    warmUpPlayer();
  }
  const playhead = wavesurfer.getCurrentTime() / wavesurfer.getDuration();
  const epsilon = 0.00001;
  if (marks.length === 0) return;
  let closestMark = null;
  for (let mark of [...marks].reverse()) {
    if (mark.time - epsilon > playhead) {
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
  if (!wavesurfer) {
    return;
  }
  const markTime = markdiv.style.left.slice(0, -1) / 100;
  wavesurfer.seekTo(markTime);
}

function handleMarkAdd() {
  if (!wavesurfer) {
    return;
  }
  const playhead = wavesurfer.getCurrentTime() / wavesurfer.getDuration();
  addMark(playhead);
  saveMarks();
}

function handleMarkRemove() {
  if (!wavesurfer) {
    return;
  }
  if (marks.length === 0) return;
  const playhead = wavesurfer.getCurrentTime() / wavesurfer.getDuration();
  removeClosestMark(playhead);
  saveMarks();
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

  // We prevent deletion of the mark at the beginning
  if (closestIndex === 0) {
    return;
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

// Sourced from https://stackoverflow.com/a/9039885
function isRunningiOS() {
  return [
    'iPad Simulator',
    'iPhone Simulator',
    'iPod Simulator',
    'iPad',
    'iPhone',
    'iPod'
  ].includes(navigator.platform)
    // iPad on iOS 13 detection
    || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
}
