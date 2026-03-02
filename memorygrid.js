let ROWS, COLS, MEMORY_TIME, CURRENT_LEVEL;
let currentRow = 0;
let answerKey = [];
let gameState = 'waiting';
let countdownInterval;

function openMemoryGrid() {
    document.getElementById('library-view').style.display = 'none';
    document.getElementById('game-view').style.display = 'flex';
    document.getElementById('guide-modal').style.display = 'flex';
}

function showDifficulty() {
    document.getElementById('guide-modal').style.display = 'none';
    document.getElementById('difficulty-modal').style.display = 'flex';
    ['easy', 'medium', 'hard'].forEach(lvl => {
        document.getElementById(`best-${lvl}`).innerText = "Best: " + (localStorage.getItem(`mg-best-${lvl}`) || 0);
    });
}

function setDifficulty(level) {
    CURRENT_LEVEL = level;
    if(level === 'easy') { ROWS = 5; COLS = 3; MEMORY_TIME = 5; }
    else if(level === 'medium') { ROWS = 10; COLS = 5; MEMORY_TIME = 25; }
    else { ROWS = 20; COLS = 6; MEMORY_TIME = 60; }

    document.getElementById('difficulty-modal').style.display = 'none';
    document.getElementById('start-btn').style.display = 'block';

    const grid = document.getElementById('grid');
    grid.style.gridTemplateColumns = `repeat(${COLS}, 42px)`;
    document.getElementById('instruction').innerText = `Difficulty: ${level.toUpperCase()}`;
    initGrid();
}

function initGrid() {
    const grid = document.getElementById('grid');
    grid.innerHTML = '';
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const card = document.createElement('div');
            card.classList.add('card');
            card.id = `card-${r}-${c}`;
            grid.appendChild(card);
        }
    }
}

function startMemorizePhase() {
    if(gameState === 'memorizing') return;
    gameState = 'memorizing';
    document.getElementById('start-btn').style.display = 'none';
    document.getElementById('instruction').innerText = "Memorize the pattern...";
    answerKey = [];
    for (let r = 0; r < ROWS; r++) answerKey.push(Math.floor(Math.random() * COLS));
    for (let r = 0; r < ROWS; r++) {
        const card = document.getElementById(`card-${r}-${answerKey[r]}`);
        if (card) card.classList.add('reveal-green');
    }
    let timeLeft = MEMORY_TIME;
    document.getElementById('timer').innerText = timeLeft;
    countdownInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').innerText = (timeLeft >= 0) ? timeLeft : 0;
        if (timeLeft <= 0) { clearInterval(countdownInterval); startPlayPhase(); }
    }, 1000);
}

function startPlayPhase() {
    gameState = 'playing';
    document.getElementById('instruction').innerText = "Recall! Starting Row 1...";
    document.getElementById('timer').innerText = "RECALL";
    document.querySelectorAll('.card').forEach(card => {
        card.classList.remove('reveal-green');
        card.onclick = handleCardClick;
    });
    updateRowHighlights();
}

function updateRowHighlights() {
    document.querySelectorAll('.card').forEach(c => c.classList.remove('active-row'));
    for(let c = 0; c < COLS; c++) {
        const target = document.getElementById(`card-${currentRow}-${c}`);
        if(target) target.classList.add('active-row');
    }
}

function handleCardClick(e) {
    if (gameState !== 'playing') return;
    const [_, r, c] = e.target.id.split('-').map(Number);
    if (r !== currentRow) return;
    if (c === answerKey[r]) {
        e.target.classList.add('reveal-green');
        currentRow++;
        if (currentRow === ROWS) endGame(true);
        else {
            document.getElementById('instruction').innerText = `Correct! Row ${currentRow + 1}`;
            updateRowHighlights();
        }
    } else {
        e.target.classList.add('reveal-red');
        endGame(false);
    }
}

function endGame(win) {
    gameState = 'over';
    clearInterval(countdownInterval);
    const finalScore = currentRow;
    const bestKey = `mg-best-${CURRENT_LEVEL}`;
    const prevBest = parseInt(localStorage.getItem(bestKey)) || 0;
    let statusText = win ? "PERFECT SCORE!" : `Game Over! Score: ${finalScore}/${ROWS}`;
    if (finalScore > prevBest) { localStorage.setItem(bestKey, finalScore); statusText = "NEW RECORD! " + statusText; }
    document.getElementById('instruction').innerText = statusText;
    document.getElementById('timer').innerText = win ? "WIN" : "FAIL";
    const btn = document.getElementById('start-btn');
    btn.innerText = "MAIN MENU"; btn.style.display = 'block';
    btn.onclick = () => location.reload();
}