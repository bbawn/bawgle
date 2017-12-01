function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

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

/* Return validity map for given array of user words. Element value is 0 if 
 * the word is not in the given answer object, otherwise 1.
 */
function validateWords(answers, userWords) {
  var words = {};

  for (var i = 0; i < userWords.length; i++) {
    var w = userWords[i];
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
  a.target = '_blank';
  a.rel = 'noopener noreferrer';

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

  li.className = 'word-item list-group-item';
  li.appendChild(makeWordAnchor(word, !valid));

  return li;
}

function makeAnswerWordLi(word, count) {
  var li = document.createElement('li');
  var displayWord = (count > 1 ? word + '(' + count + ')' : word);

  li.className = 'word-item list-group-item';
  li.appendChild(makeWordAnchor(displayWord, false));

  return li;
}

function makeWordEntryLi(word, inputId, buttonText, placeholder, onButtonClick) {
  var li = document.createElement('li');
  var divOuter = document.createElement('div');
  var divAddon = document.createElement('div');
  var input = document.createElement('input');

  input.value = word;
  input.type = 'text';
  input.className = 'form-control word-entry';
  input.id = inputId;
  if (placeholder) {
    input.placeholder = placeholder;
  }
  divAddon.className = "word-item-addon input-group-addon";
  divAddon.textContent = buttonText;
  divAddon.onclick = onButtonClick;
  divOuter.className = "input-group mb-2 mb-sm-0";
  li.className = "word-item list-group-item";

  divOuter.appendChild(divAddon);
  divOuter.appendChild(input);
  li.appendChild(divOuter);

  return li;
}

function displayLetter(letter) {
  return letter.toUpperCase();
}

function makeGrid(rank, letters) {
  var grid = document.createElement('table');

  grid.id = 'grid';
  grid.className = 'noselect';
  for (var i = 0; i < rank; i++) {
    var row = document.createElement('tr');

    row.id = 'r' + i;
    row.className = 'grid-row';
    grid.appendChild(row);
    for (var j = 0; j < rank; j++) {
      var cell = document.createElement('td');
      var cellSpan = document.createElement('span');

      cell.appendChild(cellSpan);
      row.appendChild(cell);

      cell.className = 'grid-cell';
      cell.id = 'c' + i + '-' + j;
      cellSpan.className = 'grid-content';
      cellSpan.textContent = displayLetter(letters[i * rank + j]);
    }
  }

  return grid;
}

function touchStart(ev) {
  var elt = document.elementFromPoint(ev.touches[0].clientX, ev.touches[0].clientY);
  pointerStart(ev, elt);
}

function mouseStart(ev) {
  var elt = document.elementFromPoint(ev.clientX, ev.clientY);
  pointerStart(ev, elt);
}

function pointerStart(ev, elt) {
  var grid = document.getElementById('grid');
  if (grid.contains(elt)) {

    /* Disable text selection, touch scrolling. Careful, we need
     * to do this anywhere in grid, not just in grid-content
     * hotspots.
     */
    ev.preventDefault();
  }
  if (! ev.ctrlKey) {
    addUserWord();
  }

  if (elt.classList.contains('grid-content') && 
      (grid.getAttribute('enabled') === '')) {
    addGridCellLetter(elt.parentNode);
  }
}

function touchMove(ev) {
  var elt = document.elementFromPoint(ev.touches[0].clientX, ev.touches[0].clientY);
  var grid = document.getElementById('grid');

  if (grid.contains(elt)) {

    /* Disable text selection, touch scrolling. Careful, we need
     * to do this anywhere in grid, not just in grid-content
     * hotspots.
     */
    ev.preventDefault();
  }
  if (elt.classList.contains('grid-content') && 
      (grid.getAttribute('enabled') === '')) {
    addGridCellLetter(elt.parentNode);
  }
}

function mouseMove(ev) {
  if (ev.buttons == 1) {
    var elt = document.elementFromPoint(ev.clientX, ev.clientY);
    var grid = document.getElementById('grid');

    if (grid.contains(elt)) {

      /* Disable text selection, touch scrolling. Careful, we need
       * to do this anywhere in grid, not just in grid-content
       * hotspots.
       */
      ev.preventDefault();
    }
    if (elt && elt.classList.contains('grid-content') && 
        (grid.getAttribute('enabled') === '')) {

      /* Disable text selection */
      ev.preventDefault();
      addGridCellLetter(elt.parentNode);
    }
  }
}

/* XXX Hackish? consider Node property, e.g disabled */
function setGridState(visible, enabled) {
  var gridContents = document.getElementsByClassName('grid-content');
  var grid = document.getElementById('grid');

  if (enabled) {
    grid.setAttribute('enabled', '');
  } else {
    grid.removeAttribute('enabled');
  }

  for (var i = 0; i < gridContents.length; i++) {
    if (!visible) {
      gridContents[i].classList.add('invisible');
    } else {
      gridContents[i].classList.remove('invisible');
    }
  }
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

/* Test */
function testAddUserWord(nwords, nchar) {
  var wordEntryTop = document.getElementById('word-entry-top');
  for (var i = 0; i < nwords; i++) {
    wordEntryTop.value = (i).toString()[0].repeat(nchar);
    addUserWord();
  }    
}

function addUserWord() {
  var wordEntryTop = document.getElementById('word-entry-top');
  var ul = document.getElementById('user-word-list');

  if (!wordEntryTop || wordEntryTop.value === '') {
    return;
  }

  var li = makeWordEntryLi(wordEntryTop.value, '', '-', null,
    function(ev) { ul.removeChild(li); });

  // New li goes after top one, simulate insertAfter
  ul.insertBefore(li, wordEntryTop.parentNode.parentNode.nextSibling);
  wordEntryTop.value = '';
  wordEntryTop.focus();
  resetWordSelection();
}

function resetWordSelection() {
  var gridCells = document.getElementsByClassName('grid-cell');

  for (var i = 0; i < gridCells.length; i++) {
    gridCells[i].removeAttribute('selected');
  }
}

function addGridCellLetter(gridCell) {
  var wordEntryTop = document.getElementById('word-entry-top');
  if (wordEntryTop && (gridCell.getAttribute('selected') !== '')) {
    wordEntryTop.value += gridCell.textContent.toLowerCase();
    gridCell.setAttribute('selected', '');
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
  this.letters = [];         // array, not string because qu
  this.userWords = [];       // PERF: would set or object be better?
  this.solutionWords = {};   // key: word, value: count
  this.userScore = undefined;           // XXX move calc to client?
  this.solutionScore = undefined;       // XXX move calc to client?
  this.langCfg = new EnUsLangCfg();
  this.currentState = new StartState(this);
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
    that.changeState(new SolvingState(that));
  };
  this.clock = new Clock(onTick, onExpire);

  /* Generate a new letter sequence by simulated a real boggle
   * game: shake the grid and get a random permutation of the 
   * cubes with random face showing on each.
   */
  this.generateLettersCubes = function () {
    // TODO - redo with LangCfg
    this.letters = [];
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
      j = indexes[i];
      assert(j >= 0 && j < cubes.length);
      var letter = cubes[j][Math.floor(Math.random() * (cubes[j].length))];
      if (letter == 'q') {
        letter = 'qu';
      }
      this.letters.push(letter);
    }
    console.log('indexes: ' + indexes + ' letters: ' + this.letters);
  };

  /* Generate a new letter sequence using a random letter selection
   * with each letter's probability of selection equal to its fractional
   * occurrence rate in the language's expanded dictionary. An array with
   * the cumulative probabilities of each letter is used. A random float
   * in the range [0, 1) is chosen, the selected letter is the largest one
   * with a cumulative probabiliy less than the random value.
   * TODO: this needs tests
   */
  this.generateLettersHist = function () {
    this.letters = [];
    cumProb = 0.0;
    probs = [];
    for (var i = 0; i < this.langCfg.letters.length; i++) {
      cumProb += this.langCfg.letterFreqs[this.langCfg.letters[i]];
      probs[i] = cumProb;
    }
    for (var i = 0; i < this.rank * this.rank; i++) {
      ran = Math.random();

      /* Linear search for last cumulative prob less than random number */
      var j;
      for (j = 0; j < this.langCfg.letters.length; j++) {
        if (probs[j] > ran) {
          break;
        }
      }
      assert(j < this.langCfg.letters.length);

      this.letters.push(this.langCfg.letters[j]);
    }
  };

  this.generateLetters = this.generateLettersCubes;

};

var EnUsLangCfg = function() {
  this.letters = [
    "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
    "n", "o", "p", "qu", "r", "s", "t", "u", "v", "w", "x", "y", "z"
  ];

  this.letterEquivs = {
    "\u00e0": "a",
    "\u00e1": "a",
    "\u00e2": "a",
    "\u00e4": "a",
    "\u00e5": "a",
    "\u00e7": "c",
    "\u00e8": "e",
    "\u00e9": "e",
    "\u00ea": "e",
    "\u00eb": "e",
    "\u00ed": "i",
    "\u00ef": "i",
    "\u00f1": "n",
    "\u00f3": "o",
    "\u00f4": "o",
    "\u00f6": "o",
    "\u00fb": "u",
    "\u00fc": "u"
  };

  this.letterFreqs = {
    "a": 0.07802123447903545,
    "b": 0.019142702897246715,
    "c": 0.037520244736368544,
    "d": 0.03462227820766601,
    "e": 0.11585171855317618,
    "f": 0.012675184452042468,
    "g": 0.026404894727370884,
    "h": 0.022390498470397698,
    "i": 0.08506100413892388,
    "j": 0.002343710635234839,
    "k": 0.009589346769839842,
    "l": 0.05195825085477776,
    "m": 0.027003779017455463,
    "n": 0.07419542918841102,
    "o": 0.058548137484254095,
    "p": 0.025168256253374124,
    "qu": 0.0016980385099874032,
    "r": 0.07250242936836422,
    "s": 0.11204102933237359,
    "t": 0.06271225481374842,
    "u": 0.029349649091236277,
    "v": 0.01031923699838042,
    "w": 0.0084196508907684,
    "x": 0.002610041389238798,
    "y": 0.015588267050566852,
    "z": 0.004262731689760662
  };
}

var PlPlLangCfg = function() {
  this.letters = [
    "a",
    "\u0105",
    "b",
    "c",
    "\u0107",
    "d",
    "e",
    "\u0119",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "\u0142",
    "m",
    "n",
    "\u0144",
    "o",
    "\u00f3",
    "p",
    "r",
    "s",
    "\u015b",
    "t",
    "u",
    "w",
    "x",
    "y",
    "z",
    "\u017a",
    "\u017c"
      ];

  this.leterEquivs = {
  };

  this.letterFreqs = {
    "a": 0.0887944381920401,
    "b": 0.017749634505825687,
    "c": 0.04254508689229892,
    "d": 0.021039401462852735,
    "e": 0.0810561866818586,
    "f": 0.004577631455394563,
    "g": 0.013457855494357733,
    "h": 0.012229716590419576,
    "i": 0.09405777331120976,
    "j": 0.018539048082616787,
    "k": 0.032455065957770854,
    "l": 0.02399876132128528,
    "m": 0.03842000571066111,
    "n": 0.07132445087357693,
    "o": 0.08065911870208664,
    "p": 0.028079219407925446,
    "r": 0.04454949882971599,
    "s": 0.033399496881447936,
    "t": 0.02808519653005703,
    "u": 0.025733062090618465,
    "w": 0.045987567038443665,
    "x": 3.367264223748411e-05,
    "y": 0.048632945477421946,
    "z": 0.04707065807019623,
    "\u00f3": 0.0034612327964965123,
    "\u0105": 0.011715433139227432,
    "\u0107": 0.0008698081508052552,
    "\u0119": 0.0056482663471324555,
    "\u0142": 0.01791263655784928,
    "\u0144": 0.0027809359187717314,
    "\u015b": 0.009313793527935654,
    "\u017a": 0.0006232860830422109,
    "\u017c": 0.005199115276419998
  };
}


var StartState = function(game) {
  this.game = game;

  this.go = function() {
    var gridPanelDiv = document.getElementById('left-panel');
    var playingButton = document.getElementById('playing');
    var startButton = document.getElementById('start-button');
    var solveButton = document.getElementById('solve');
    var yourWordsLabel = document.getElementById('your-words-label');
    var userWordList = document.getElementById('user-word-list');
    var grid = document.getElementById('grid');
    var solutionLabel = document.getElementById('solution-label');
    var solutionWordList = document.getElementById('solution-word-list');
    var rightPanel = document.getElementById('right-panel');
    var startModal = document.getElementById('start-modal');

    game.userWords = [];
    game.userWords = {};
    game.userScore = undefined;
    game.solutionScore = undefined;
    game.clock.cancel();
    startButton.onclick = function() {
      game.changeState(new PlayingState(game));
    };
    playingButton.innerHTML = 'Play';
    solveButton.disabled = false;
    setClockDisplay(game.clock.durationMs);
    game.generateLetters();
    if (grid) {
      gridPanelDiv.removeChild(grid);
    }
    gridPanelDiv.appendChild(makeGrid(game.rank, game.letters));
    setGridState(false, false);
    playingButton.disabled = false;
    yourWordsLabel.textContent = 'Your words:';
    removeAllChildren(userWordList);

    var li = makeWordEntryLi('', 'word-entry-top', '+', 'Enter word', addUserWord);
    userWordList.appendChild(li);
    var wordEntryInput = document.getElementById('word-entry-top');
    wordEntryInput.disabled = true;
    wordEntryInput.onkeypress = wordEntryKeypress;

    solutionLabel.innerHTML = '';
    removeAllChildren(solutionWordList);
    rightPanel.style.display = 'none';
    startModal.style.display = 'block';
  };
};

var PlayingState = function(game) {
  this.game = game;

  this.go = function() {
    var playingButton = document.getElementById('playing');
    var wordEntry = document.getElementById('word-entry-top');
    var startModal = document.getElementById('start-modal');

    game.clock.run();
    playingButton.onclick = function() {
      game.changeState(new PausedState(game));
    };
    playingButton.innerHTML = 'Pause';
    wordEntry.disabled = false;
    wordEntry.focus();

    setGridState(true, true);
    startModal.style.display = 'none';
  };
};

var PausedState = function(game) {
  this.game = game;

  this.go = function() {
    var playingButton = document.getElementById('playing');
    game.clock.pause();
    playingButton.onclick = function() {
      game.changeState(new PlayingState(game));
    };
    playingButton.innerHTML = 'Play';
    document.getElementById('word-entry-top').disabled = true;
    document.getElementById('grid').disabled = true;
    setGridState(false, false);
  };
};

var SolvingState = function(game) {
  this.game = game;

  this.go = function() {
    var wordEntries = document.getElementsByClassName('word-entry');
    var statusHeader = document.getElementById('status');

    statusHeader.textContent = 'Solving...';
    game.clock.cancel();
    resetWordSelection();

    game.userWords = [];
    for (var i = 0; i < wordEntries.length; i++) {
      if (wordEntries[i].value !== '') {
        game.userWords.push(wordEntries[i].value.toLowerCase());
      }
    }

    // XXX is this the best way to construct the URL?
    var url = new URL('/api', document.location.origin);

    url.searchParams.append('words', game.userWords.join(' '));
    url.searchParams.append('letters', game.letters.join(' '));

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
        game.changeState(new SolvedState(game));
      });
    });
  };
};

var SolvedState = function(game) {
  this.game = game;

  this.go = function() {
    var playingButton = document.getElementById('playing');
    var solveButton = document.getElementById('solve');
    var yourWordsLabel = document.getElementById('your-words-label');
    var userWordList = document.getElementById('user-word-list');
    var statusHeader = document.getElementById('status');
    var rightPanel = document.getElementById('right-panel');

    // Header
    playingButton.innerHTML = 'Play';
    setGridState(true, false);
    playingButton.disabled = true;
    solveButton.disabled = true;

    // User word panel TODO: sort on server??
    yourWordsLabel.textContent = 'Your words (' +
      game.userWords.length + '):';

    validatedWords = validateWords(game.solutionWords, game.userWords);
    removeAllChildren(userWordList);
    var sortedWords = game.userWords.sort();
    for (var i = 0; i < sortedWords.length; i++) {
      var li = makeUserWordLi(sortedWords[i],
                              validatedWords[sortedWords[i]]);
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

    rightPanel.style.display = '';
  };
};


/* Test */
function testDisplayUserWord(nwords, nchar) {
  var userWordList = document.getElementById('user-word-list');
  for (var i = 0; i < nwords; i++) {
    var li = makeUserWordLi((i).toString()[0].repeat(nchar), nchar % 2);
    userWordList.appendChild(li);
  };
}
function testDisplayAnswerWord(nwords, nchar) {
  var answerWordList = document.getElementById('solution-word-list');
  for (var i = 0; i < nwords; i++) {
    var li = makeAnswerWordLi((i).toString()[0].repeat(nchar), nchar % 2);
    answerWordList.appendChild(li);
  }
}


var game;
function initialize() {
  var newButton = document.getElementById('new');
  var solveButton = document.getElementById('solve');
  var helpButton = document.getElementById('help');
  game = new GameContext();

  newButton.onclick = function() {
    game.changeState(new StartState(game));
  };
  solveButton.onclick = function() {
    game.changeState(new SolvingState(game));
  };
  helpButton.onclick = function() {
    location.assign('help.html');
    /* window.open('help.html'); */
  };

  document.addEventListener('touchstart', touchStart, {passive: false});
  document.addEventListener('mousedown', mouseStart, {passive: false});

  /* touchenter is, apparently, not (yet) implemented */
  document.addEventListener('touchmove', touchMove, {passive: false});
  document.addEventListener('mousemove', mouseMove, {passive: false});

  game.start();
}

document.addEventListener('DOMContentLoaded', function(event) {
  initialize();
});

