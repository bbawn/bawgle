// Timer management

function secondsToTimeDisplay(sec) {
    m = Math.floor(sec / 60);
    s = sec % 60;
    return "" + Math.floor(m / 10) + (m % 10) + ":" + 
                Math.floor(s / 10) + (s % 10);
}

const DURATION_MS = 180000;

var intervalTimer;
var tickMs;
var runTimeMs = 0;
var paused = null;      /* tri-state: null, true, false */

var updateClock = function(ms) {
    var clockStr = secondsToTimeDisplay(Math.floor(ms / 1000));

    document.getElementById("status").innerHTML = clockStr;
}

var intervalCallback = function() {
    var now = Date.now();

    runTimeMs += (now - tickMs);
    tickMs = now;
    if (runTimeMs < DURATION_MS) {
        updateClock(DURATION_MS - runTimeMs);
    } else {
        clearInterval(intervalTimer);
        document.getElementById("play-form").submit();
    }
}

function togglePlay() {
    /* First play click (no pause yet) */
    if (paused == null) {
        paused = false;
    }
    if (!paused) {
        tickMs = Date.now();
        document.getElementById("word-entry-top").disabled = false;
        document.getElementById("playing-icon").innerHTML = "pause";
        intervalTimer = setInterval(intervalCallback, 1000);
        paused = true;
    } else {
        document.getElementById("word-entry-top").disabled = true;
        document.getElementById("playing-icon").innerHTML = "play_arrow";
        clearInterval(intervalTimer);
        paused = false;
    }
}

// Word entry management
function wordEntryKeypress(event) {
  if (event.keyCode == 13) {
    addUserWord();
  }
}

function addUserWord() {
  var ul = document.getElementById("user-word-list");
  var li = document.createElement("li");
  var input = document.createElement("input");
  var wordEntryTop = document.getElementById('word-entry-top');

  if (wordEntryTop.value === '') {
    return;
  }

  input.value = wordEntryTop.value;
  wordEntryTop.value = '';
  input.className = 'word-entry';
  var delButton = document.createElement('button');
  delButton.className = 'word-entry-delete';
  var delSpan = document.createElement('span');
  delSpan.className ='material-icons md-18';
  delSpan.textContent='remove_circle';

  delButton.appendChild(delSpan);
  li.appendChild(input);
  li.appendChild(delButton);
  ul.appendChild(li);

  // New li goes after top one, simulate insertAfter
  ul.insertBefore(li, wordEntryTop.parentNode.nextSibling);
  delButton.onclick = function(ev) {
    ul.removeChild(li);
  }
}

function resetWordSelection() {
  var gridCells = document.getElementsByClassName('grid-cell');

  addUserWord();
  for (var i = 0; i < gridCells.length; i++) {
    gridCells[i].removeAttribute('selected');
  }
}

function addGridCellLetter(gridCell) {
  var wordEntryTop = document.getElementById('word-entry-top');
  wordEntryTop.value += gridCell.textContent.toLowerCase();
  gridCell.setAttribute('selected', '');
}


function gridCellDown(ev) {
  if (! ev.ctrlKey) {
    resetWordSelection();
  }

  if (! ev.target.parentNode.getAttribute('selected')) {
    addGridCellLetter(ev.target.parentNode);
  }
}

function gridCellEnter(ev) {
  if ((ev.buttons === 1) &&
      (ev.target.parentNode.getAttribute('selected') !== '')) {
    addGridCellLetter(ev.target.parentNode);
  }
}

function submitSolve() {
  var words = '';
  var ul = document.getElementById("user-word-list");
  var wordEntries = document.getElementsByClassName('word-entry');

  for (var i = 0; i < wordEntries.length; i++) {
    words += wordEntries[i].value + ' ';
  }
  var input = document.getElementById("words");
  input.value = words;
}
    
document.addEventListener("DOMContentLoaded", function(event) {

    /* Initially empty status strings means status should be clock */
    if (document.getElementById("status").innerHTML == "") {
        updateClock(DURATION_MS);
        var wordEntry = document.getElementById("word-entry-top")
        if (wordEntry) {
            wordEntry.disabled = true;
        }
    }
});

