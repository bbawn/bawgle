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
        document.getElementById("words").disabled = false;
        document.getElementById("playing-icon").innerHTML = "pause";
        intervalTimer = setInterval(intervalCallback, 1000);
        paused = true;
    } else {
        document.getElementById("words").disabled = true;
        document.getElementById("playing-icon").innerHTML = "play_arrow";
        clearInterval(intervalTimer);
        paused = false;
    }
}
    
document.addEventListener("DOMContentLoaded", function(event) {

    /* Initially empty status strings means status should be clock */
    if (document.getElementById("status").innerHTML == "") {
        updateClock(DURATION_MS);
        var wordsTextArea = document.getElementById("words")
        if (wordsTextArea) {
            wordsTextArea.disabled = true;
        }
    }
});

