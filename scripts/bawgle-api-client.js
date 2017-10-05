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
        fetchSolve();
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
        document.getElementById("grid").disabled = true;
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

function fetchGame(url) {
  fetch(url).then(function(response) {
    if(response.ok) {
      response.json().then(function(json) {
        gameModel = json;
        initialize();
      });
    } else {

      // TODO - should alert() or something user-visible...
      console.log('Network request for ' + url + 'failed with response ' + response.status + ': ' + response.statusText);
    }
  });
}

// E.g. http://localhost:8080/api?words=cat+howdy+late+sole+slat+&letters=jtacrpdltphsoevtossmyoine&solve=1
function fetchSolve() {
  var wordEntries = document.getElementsByClassName('word-entry');

  words = '';
  for (var i = 0; i < wordEntries.length; i++) {
    words += wordEntries[i].value + ' ';
  }

  // XXX temp hack - clear dynamic sections
  var userWordList = document.getElementById("user-word-list");
  while (userWordList.firstChild) {
      userWordList.removeChild(userWordList.firstChild);
  }
  var centerPanelDiv = document.getElementById("center-panel"); 
  var grid = document.getElementById("grid"); 
  centerPanelDiv.removeChild(grid);

  // XXX is this the best way to construct the URL?
  var url = new URL("/api", document.location.origin);
  url.searchParams.append("words", words);
  url.searchParams.append("letters", gameModel.letters);
  url.searchParams.append("solve", "1");
 
  fetchGame(url);
}

function makeWordAnchor(word) {
  // TODO: copy from old server
  return word;
}

function makeUserWordLi(word, valid) {
  var li = document.createElement('li');

  if (!valid) {
    var del = document.createElement('del');
    li.appendChild(del);
    del.textContent = makeWordAnchor(word);
  } else {
    li.textContent = makeWordAnchor(word);
  }

  return li;
}

function makeAnswerWordLi(word, count) {
  var li = document.createElement('li');

  if (count > 1) {
    li.textContent = makeWordAnchor(word) + "(" + count + ")";
  } else {
    li.textContent = makeWordAnchor(word);
  }

  return li;
}

function makeGrid(rank, displayLetters) {
  var grid = document.createElement("div");

  grid.id = 'grid';
  grid.className = "noselect";

  for (var i = 0; i < rank; i++) {
    var row = document.createElement("div");

    row.id = "r" + i;
    row.className = "grid-row";
    grid.appendChild(row);
    for (var j = 0; j < rank; j++) {
      var cellDiv = document.createElement("div");
      var cellSpan = document.createElement("span");

      cellDiv.appendChild(cellSpan);
      row.appendChild(cellDiv);

      cellDiv.className = "grid-cell";
      cellDiv.id = "c" + i + "-" + j;
      cellSpan.onmousedown = gridCellDown;
      cellSpan.onmouseenter = gridCellEnter;
      cellSpan.textContent = displayLetters[i * rank + j];
    }
  }

  return grid;
}
    
document.addEventListener("DOMContentLoaded", function(event) {

    /* Initially empty status strings means status should be clock */
    if (document.getElementById("status").innerHTML == "") {
        updateClock(DURATION_MS);
        var wordEntry = document.getElementById("word-entry-top");
        if (wordEntry) {
            wordEntry.disabled = true;
        }
    }
});

var gameModel;

fetchGame("/api");

function initialize() {
  var playingButton = document.getElementById("playing");
  var solveButton = document.getElementById("solve");
  var yourWordsLabel = document.getElementById("your-words-label");
  var userWordList = document.getElementById("user-word-list");
  var statusHeader = document.getElementById("status"); 
  var centerPanelDiv = document.getElementById("center-panel"); 

  centerPanelDiv.appendChild(makeGrid(gameModel.rank, gameModel.display_letters));
  if (gameModel.solve) {

    // Header
    playingButton.disabled = true;
    solveButton.disabled = true;
    yourWordsLabel.textContent = "Your words (" + 
      Object.getOwnPropertyNames(gameModel.words).length + "):";

    // User word panel TODO: sort on server??
    for (var wordKey in gameModel.words) {
      var li = makeUserWordLi(wordKey, gameModel.words[wordKey]);
      userWordList.appendChild(li);
    }
    statusHeader.textContent = "Your score: " + gameModel.word_score + 
                               " out of " + gameModel.answer_score;
                            
    var answerLabel = document.getElementById("solution-label");
    var answerWordList = document.getElementById("solution-word-list");
    answerLabel.textContent = "Solution (" + 
      Object.getOwnPropertyNames(gameModel.answers).length + "):";

    // Answer word panel TODO: sort on server??
    for (var answerKey in gameModel.answers) {
      var li = makeAnswerWordLi(answerKey, gameModel.answers[answerKey]);
      answerWordList.appendChild(li);
    }
  } else {
    var solveButton = document.getElementById("solve");

    // Header
    playingButton.onclick = togglePlay;
    solveButton.onclick = fetchSolve;

    // User word panel
    yourWordsLabel.textContent = "Your words:";
    var li = document.createElement("li");
    var wordEntryInput = document.createElement("input");
    wordEntryInput.id = "word-entry-top";
    wordEntryInput.type = "text";
    wordEntryInput.disabled = true;
    wordEntryInput.onkeypress = wordEntryKeypress;
    li.appendChild(wordEntryInput);
    userWordList.appendChild(li);

    // TODO - setup status clock here??
  }
}
