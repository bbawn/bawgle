function removeAllChildren(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

/* Return random permutation of array using Fisher-Yates */
function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

function generateLetters() {
  var letters = '';
  var cubes = ['eeeeam', 'oooutt', 'setcpi', 'asairf', 'yrrphi',
               'hhldro', 'cpilet', 'eeumga', 'eeeeaa', 'hrlond',
               'sssune', 'thhodn', 'afirys', 'menang', 'fiyspr',
               'deannn', 'rrvgwo', 'sctncw', 'ddornl', 'faaars',
               'ciietl', 'tttoem', 'iiiett', 'touown', 'kzxqbj'];

  // [range(cubes.length)]
  var indexes = Array.apply(null, Array(cubes.length)).map(
    function(_, i) {return i;});

  shuffleArray(indexes);
  for (var i = 0; i < indexes.length; i++) {
    letters += cubes[i][Math.floor(Math.random() * (cubes[i].length))];
  }

  return letters;
}

/* Return map for of given array of user words. Element value is 0 if the word 
 * is not in the given answer object, otherwise 1.
 */
function validateWords(answers, userWords) {
  var words = {};

  for (var i = 0; i < userWords.length; i++) {
    var w = userWords[i].toLowerCase();
    if (w in answers) {
      words[w] = 1;
    } else {
      words[w] = 0;
    }
  }

  return words;
}

function makeWordAnchor(word, crossOut) {
  var wordAnchorBase = 'http://wiktionary.org/wiki/';
  var a = document.createElement('a');
  a.href = wordAnchorBase + word;

  if (crossOut) {
    var del = document.createElement('del');
    del.textContent = word;
    a.appendChild(del);
  } else {
    a.textContent = word;
  }

  return a;
}

function makeUserWordLi(word, valid) {
  var li = document.createElement('li');

  li.appendChild(makeWordAnchor(word, !valid));

  return li;
}

function makeAnswerWordLi(word, count) {
  var li = document.createElement('li');

  var displayWord = (count > 1 ? word + '(' + count + ')' : word);
  li.appendChild(makeWordAnchor(displayWord, false));

  return li;
}

function displayLetter(letter) {
  if (letter == 'q') {
    letter = 'qu';
  }
  return letter.toUpperCase();
}

function makeGrid(rank, letters) {
  var grid = document.createElement('div');

  grid.id = 'grid';
  grid.className = 'noselect';

  for (var i = 0; i < rank; i++) {
    var row = document.createElement('div');

    row.id = 'r' + i;
    row.className = 'grid-row';
    grid.appendChild(row);
    for (var j = 0; j < rank; j++) {
      var cellDiv = document.createElement('div');
      var cellSpan = document.createElement('span');

      cellDiv.appendChild(cellSpan);
      row.appendChild(cellDiv);

      cellDiv.className = 'grid-cell';
      cellDiv.id = 'c' + i + '-' + j;
      cellSpan.onmousedown = gridCellDown;
      cellSpan.onmouseenter = gridCellEnter;
      cellSpan.textContent = displayLetter(letters[i * rank + j]);
    }
  }

  return grid;
}

function secondsToTimeDisplay(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return '' + Math.floor(m / 10) + (m % 10) + ':' +
                Math.floor(s / 10) + (s % 10);
}

function wordEntryKeypress(event) {
  if (event.keyCode == 13) {
    addUserWord();
  }
}

function addUserWord() {
  var ul = document.getElementById('user-word-list');
  var li = document.createElement('li');
  var input = document.createElement('input');
  var wordEntryTop = document.getElementById('word-entry-top');

  if (!wordEntryTop || wordEntryTop.value === '') {
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
  };
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
  if (wordEntryTop) {
    wordEntryTop.value += gridCell.textContent.toLowerCase();
    gridCell.setAttribute('selected', '');
  }
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

function setClockDisplay(ms) {
  var clockStr = secondsToTimeDisplay(Math.floor(ms / 1000));
  document.getElementById('status').innerHTML = clockStr;
}

var Clock = function(onTickArg, onExpireArg) {
  this.onTick = onTickArg;
  this.onExpire = onExpireArg;
  this.intervalTimer;
  this.lastTickMs;
  this.paused = undefined;
  this.runTimeMs = 0;
  this.durationMs = 180000;
  var that = this;

  this.pause = function() {
    this.paused = true;
    clearInterval(this.intervalTimer);
  };

  this.run = function() {
    if (this.paused === undefined) {
      this.runTimeMs = 0;
    }
    this.lastTickMs = Date.now();
    this.paused = false;
    this.intervalTimer = setInterval(this.intervalCallback, 1000);
  };

  this.cancel = function() {
    this.paused = undefined;
    clearInterval(this.intervalTimer);
  };

  this.intervalCallback = function() {
    var now = Date.now();

    that.runTimeMs += (now - that.lastTickMs);
    that.lastTickMs = now;
    if (that.runTimeMs < that.durationMs) {
        that.onTick();
    } else {
        clearInterval(that.intervalTimer);
        that.onExpire();
    }
  };
};


/* Use state design pattern to manage state machine for the game.
 * See http://www.dofactory.com/javascript/state-design-pattern
 * The state machine is:
 *
 * State        Transitions to
 * -----        --------------
 * Start        Playing, Solving
 * Playing      Paused, Start, Solving
 * Paused       Playing, Start, Solving
 * Solving      Start (necessary?), Solved
 * Solved       Start
 */

var GameContext = function() {
  this.rank = 5;             // XXX move to config object?
  this.letters = '';
  this.userWords = [];       // PERF: would set or object be better?
  this.solutionWords = {};   // key: word, value: count
  this.userScore = undefined;           // XXX move calc to client?
  this.solutionScore = undefined;       // XXX move calc to client?
  this.currentState = new StartState();
  var that = this;

  this.changeState = function(state) {
    this.currentState = state;
    this.currentState.go();
  };

  this.start = function() {
    this.currentState.go();
  };

  var onTick = function() {
    var remainingMs = that.clock.durationMs - that.clock.runTimeMs;
    setClockDisplay(remainingMs);
  };

  var onExpire = function() {
    that.changeState(new SolvingState());
  };
  this.clock = new Clock(onTick, onExpire);
};

var StartState = function() {
  this.go = function() {
    var centerPanelDiv = document.getElementById('center-panel');
    var playingButton = document.getElementById('playing');
    var solveButton = document.getElementById('solve');
    var yourWordsLabel = document.getElementById('your-words-label');
    var userWordList = document.getElementById('user-word-list');
    var grid = document.getElementById('grid');
    var solutionLabel = document.getElementById('solution-label');
    var solutionWordList = document.getElementById('solution-word-list');

    playingButton.onclick = function() {
      game.changeState(new PlayingState());
    };
    document.getElementById('playing-icon').innerHTML = 'play_arrow';
    solveButton.disabled = false;
    setClockDisplay(game.clock.durationMs);
    game.letters = generateLetters();
    if (grid) {
      centerPanelDiv.removeChild(grid);
    }
    centerPanelDiv.appendChild(makeGrid(game.rank, game.letters));
    playingButton.disabled = false;
    yourWordsLabel.textContent = 'Your words:';
    removeAllChildren(userWordList);
    var li = document.createElement('li');
    var wordEntryInput = document.createElement('input');
    wordEntryInput.id = 'word-entry-top';
    wordEntryInput.className = 'word-entry';
    wordEntryInput.type = 'text';
    wordEntryInput.disabled = true;
    wordEntryInput.onkeypress = wordEntryKeypress;
    li.appendChild(wordEntryInput);
    userWordList.appendChild(li);

    solutionLabel.innerHTML = '';
    removeAllChildren(solutionWordList);
  };
};

var PlayingState = function() {
  this.go = function() {
    var playingButton = document.getElementById('playing');
    var wordEntry = document.getElementById('word-entry-top');
    game.clock.run();
    playingButton.onclick = function() {
      game.changeState(new PausedState());
    };
    wordEntry.disabled = false;
    wordEntry.focus();

    // TODO also enable grid mouse actions
    document.getElementById('playing-icon').innerHTML = 'pause';
  };
};

var PausedState = function() {
  this.go = function() {
    var playingButton = document.getElementById('playing');
    game.clock.pause();
    playingButton.onclick = function() {
      game.changeState(new PlayingState());
    };
    document.getElementById('word-entry-top').disabled = true;
    document.getElementById('grid').disabled = true;
    document.getElementById('playing-icon').innerHTML = 'play_arrow';
  };
};

var SolvingState = function() {
  this.go = function() {
    var wordEntries = document.getElementsByClassName('word-entry');
    var statusHeader = document.getElementById('status');

    statusHeader.textContent = 'Solving...';
    game.clock.cancel();
    resetWordSelection();

    game.userWords = [];
    for (var i = 0; i < wordEntries.length; i++) {
      if (wordEntries[i].value !== '') {
        game.userWords.push(wordEntries[i].value);
      }
    }
    game.userWords = game.userWords.sort();

    // XXX is this the best way to construct the URL?
    var url = new URL('/api', document.location.origin);

    url.searchParams.append('words', game.userWords.join(' '));
    url.searchParams.append('letters', game.letters);
    url.searchParams.append('solve', '1'); // XXX remove

    fetch(url).then(function(response) {

      // State changed during fetch, drop response
      if (game.currentState.constuctor === SolvingState) {
        return;
      }

      // TODO - should alert() or something user-visible...
      if (! response.ok) {
        console.log('Network request for ' + url + 'failed with response ' +
                    response.status + ': ' + response.statusText);
      }
      response.json().then(function(json) {
        game.solutionWords = json.answers; // XXX change server
        game.userScore = json.word_score;
        game.solutionScore = json.answer_score;
        game.changeState(new SolvedState);
      });
    });
  };
};

var SolvedState = function() {
  this.go = function() {
    var playingButton = document.getElementById('playing');
    var solveButton = document.getElementById('solve');
    var yourWordsLabel = document.getElementById('your-words-label');
    var userWordList = document.getElementById('user-word-list');
    var statusHeader = document.getElementById('status');

    // Header
    document.getElementById('playing-icon').innerHTML = 'play_arrow';
    playingButton.disabled = true;
    solveButton.disabled = true;

    // User word panel TODO: sort on server??
    yourWordsLabel.textContent = 'Your words (' +
      game.userWords.length + '):';

    // Validate user words
    validatedWords = validateWords(game.solutionWords, game.userWords);
    removeAllChildren(userWordList);
    for (var i = 0; i < game.userWords.length; i++) {
      var li = makeUserWordLi(game.userWords[i], 
                              validatedWords[game.userWords[i]]);
      userWordList.appendChild(li);
    };
    statusHeader.textContent = 'Your score: ' + game.userScore +
                               ' out of ' + game.solutionScore;

    var answerLabel = document.getElementById('solution-label');
    var answerWordList = document.getElementById('solution-word-list');
    answerLabel.textContent = 'Solution (' +
      Object.getOwnPropertyNames(game.solutionWords).length +
      '):';

    // Answer word panel TODO: sort on server??
    var sortedWords = Object.keys(game.solutionWords).sort();
    for (var i = 0; i < sortedWords.length; i++) {
      var li = makeAnswerWordLi(sortedWords[i], 
                                game.solutionWords[sortedWords[i]]);
      answerWordList.appendChild(li);
    }
  };
};

function initialize() {
  var newButton = document.getElementById('new');
  var solveButton = document.getElementById('solve');

  newButton.onclick = function() {
    game.changeState(new StartState());
  };
  solveButton.onclick = function() {
    game.changeState(new SolvingState());
  };

  game.start();
}

var game = new GameContext();
document.addEventListener('DOMContentLoaded', function(event) {
  initialize();
});

