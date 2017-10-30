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

function calcAbsoluteTop(element) {
  var top = 0;
  for (var e = element; e; e = e.parentElement) {
    top += e.offsetTop;
  }
  return top;
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

function makeWordEntryLi(word, inputId, buttonIcon, onButtonClick) {
  var li = document.createElement('li');
  var input = document.createElement('input');
  var button = document.createElement('button');
  var buttonSpan = document.createElement('span');

  input.value = word;
  input.type = 'text';
  input.className = 'word-entry';
  input.id = inputId;
  button.className = 'word-entry-button';
  button.onclick = onButtonClick;
  buttonSpan.className ='material-icons md-18';
  buttonSpan.textContent = buttonIcon;

  button.appendChild(buttonSpan);
  li.appendChild(input);
  li.appendChild(button);

  return li;
}

function displayLetter(letter) {
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
      cellSpan.className = 'grid-content';
      cellSpan.onmousedown = gridCellDown;
      cellSpan.onmouseenter = gridCellEnter;
      cellSpan.textContent = displayLetter(letters[i * rank + j]);
    }
  }

  return grid;
}

/* XXX Hackish? consider Node property, e.g disabled */
function setGridState(visible, enabled) {
  var gridContents = document.getElementsByClassName('grid-content');
  var mouseDown = (enabled ? gridCellDown : null);
  var mouseEnter = (enabled ? gridCellEnter : null);

  for (var i = 0; i < gridContents.length; i++) {
    gridContents[i].onmousedown = mouseDown;
    gridContents[i].onmouseenter = mouseEnter;
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

  var li = makeWordEntryLi(wordEntryTop.value, '', 'remove_circle',
    function(ev) { ul.removeChild(li); });

  // New li goes after top one, simulate insertAfter
  ul.insertBefore(li, wordEntryTop.parentNode.nextSibling);
  wordEntryTop.value = '';
  wordEntryTop.focus();
}

function resetWordSelection() {
  var gridCells = document.getElementsByClassName('grid-cell');

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
    addUserWord();
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
      var letter = cubes[i][Math.floor(Math.random() * (cubes[i].length))];
      if (letter == 'q') {
        letter = 'qu';
      }
      this.letters.push(letter);
    }
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

  this.generateLetters = this.generateLettersHist;

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
    var solveButton = document.getElementById('solve');
    var yourWordsLabel = document.getElementById('your-words-label');
    var userWordList = document.getElementById('user-word-list');
    var grid = document.getElementById('grid');
    var solutionLabel = document.getElementById('solution-label');
    var solutionWordList = document.getElementById('solution-word-list');

    game.clock.cancel();
    playingButton.onclick = function() {
      game.changeState(new PlayingState(game));
    };
    document.getElementById('playing-icon').innerHTML = 'play_arrow';
    solveButton.disabled = false;
    setClockDisplay(game.clock.durationMs);
    game.generateLetters();
    if (grid) {
      gridPanelDiv.removeChild(grid);
    }
    gridPanelDiv.appendChild(makeGrid(game.rank, game.letters));
    setGridState(true, false);
    playingButton.disabled = false;
    yourWordsLabel.textContent = 'Your words:';
    removeAllChildren(userWordList);

    var li = makeWordEntryLi('', 'word-entry-top', 'add_circle', addUserWord);
    userWordList.appendChild(li);
    var wordEntryInput = document.getElementById('word-entry-top');
    wordEntryInput.disabled = true;
    wordEntryInput.onkeypress = wordEntryKeypress;

    solutionLabel.innerHTML = '';
    removeAllChildren(solutionWordList);
  };
};

var PlayingState = function(game) {
  this.game = game;

  this.go = function() {
    var playingButton = document.getElementById('playing');
    var wordEntry = document.getElementById('word-entry-top');
    game.clock.run();
    playingButton.onclick = function() {
      game.changeState(new PausedState(game));
    };
    wordEntry.disabled = false;
    wordEntry.focus();

    document.getElementById('playing-icon').innerHTML = 'pause';
    setGridState(true, true);
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
    document.getElementById('word-entry-top').disabled = true;
    document.getElementById('grid').disabled = true;
    document.getElementById('playing-icon').innerHTML = 'play_arrow';
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
        game.userWords.push(wordEntries[i].value);
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

    // Header
    document.getElementById('playing-icon').innerHTML = 'play_arrow';
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
    adjustWordPanelLayout(game)
  };
};

/* Word lists dynamically extend to bottom and left of window view port */

function adjustWordPanelLayout(game) {
  var wordPanels = document.getElementsByClassName('word-panel');
  var wordPanelTop = calcAbsoluteTop(wordPanels[0]);
  var grid = document.getElementById('grid');
  var rightPanel = document.getElementById('right-panel');
  var wordHeight = 18;
  
  // 2 px adjustment needed because sometimes vert scrollbar appears
  // when it shouldn't (XXX only on Firefox?)
  var newHeight = Math.floor((window.innerHeight - wordPanelTop) / wordHeight)
                    * wordHeight;

  // If there is a grid, don't set panel view port to height smaller than 
  // grid (avoid multiple sbs)
  if (grid) {

    // XXX for some reason grid.offsetHeight omits last row. Some arcane
    // aspect of grid-cell float layout. Hackaround it. What a mess. I 
    // don't understand layouts very well...
    var gridHeight = grid.offsetHeight * game.rank / (game.rank - 1);
    newHeight = Math.max(gridHeight, newHeight);
  }

  // TODO: calc this based on current element positions, sizes, fonts, etc
  var nUserCols = Math.max(1, Math.min(Math.ceil(game.userWords.length * wordHeight / newHeight), 2));
  var wordColWidth = 14 * 14;
  var centerPanelLeft = 36 * 14;
  var newWidth = Math.max(window.innerWidth - (centerPanelLeft + nUserCols * wordColWidth), 
                          nUserCols * wordColWidth);
  var newRightPanelLeft = centerPanelLeft + (nUserCols * wordColWidth);
        
  rightPanel.style.left = newRightPanelLeft + 'px';
  wordPanels[1].style.width = newWidth + 'px';

  for (var i = 0; i < wordPanels.length; i++) {
    wordPanels[i].style.height = newHeight + 'px';
  }

  console.log('innerHeight: ' + window.innerHeight + 
    ' innerWidth: ' + window.innerWidth +
    ' nUserCols: ' + nUserCols +
    ' wordPanelTop: ' + wordPanelTop);
}

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


function initialize() {
  var newButton = document.getElementById('new');
  var solveButton = document.getElementById('solve');
  var helpButton = document.getElementById('help');
  var game = new GameContext();

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

  game.start();

  window.onresize = function() {
    adjustWordPanelLayout(game);
  };
  adjustWordPanelLayout(game);
}

document.addEventListener('DOMContentLoaded', function(event) {
  initialize();
});

