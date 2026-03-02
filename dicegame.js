let diceBalance = parseInt(localStorage.getItem('bj-balance')) || 100;
let diceBetValue = 0;
let diceSelectedOption = null;

function openDiceGame() {
    document.getElementById('library-view').style.display = 'none';
    document.getElementById('blackjack-view').style.display = 'none';
    document.getElementById('dice-view').style.display = 'flex';
    updateDiceStats();
    resetDiceUI();
}

function updateDiceStats() {
    document.getElementById('dice-balance').innerText = Math.floor(diceBalance);
    localStorage.setItem('bj-balance', diceBalance);
}

function selectDiceOption(opt) {
    diceSelectedOption = opt;
    document.querySelectorAll('.opt-btn').forEach(btn => btn.classList.remove('selected'));
    document.getElementById('opt-' + opt).classList.add('selected');
}

function diceAddChip(val) {
    if (diceBetValue + val <= diceBalance) {
        diceBetValue += val;
        document.getElementById('dice-bet-display').innerText = diceBetValue;
    }
}

function diceClearBet() {
    diceBetValue = 0;
    document.getElementById('dice-bet-display').innerText = "0";
}

function rollDice() {
    if (diceBetValue <= 0 || !diceSelectedOption) return;
    
    diceBalance -= diceBetValue;
    updateDiceStats();
    
    const d1 = document.getElementById('die-1');
    const d2 = document.getElementById('die-2');
    d1.classList.add('die-rolling');
    d2.classList.add('die-rolling');
    document.getElementById('roll-btn').disabled = true;

    setTimeout(() => {
        const v1 = Math.floor(Math.random() * 6) + 1;
        const v2 = Math.floor(Math.random() * 6) + 1;
        const total = v1 + v2;

        d1.classList.remove('die-rolling');
        d2.classList.remove('die-rolling');
        
        renderDie(d1, v1);
        renderDie(d2, v2);
        
        const statusEl = document.getElementById('dice-status');
        let won = false;
        let mult = 0;

        if (diceSelectedOption === 'under' && total < 7) { won = true; mult = 2; }
        else if (diceSelectedOption === 'seven' && total === 7) { won = true; mult = 5; }
        else if (diceSelectedOption === 'over' && total > 7) { won = true; mult = 2; }

        if (won) {
            const winAmt = diceBetValue * mult;
            diceBalance += winAmt;
            statusEl.innerText = `TOTAL ${total}: +$${winAmt}!`;
            statusEl.style.color = "#fca311";
        } else {
            statusEl.innerText = `TOTAL ${total}: LOST`;
            statusEl.style.color = "#f87171";
        }

        if (diceBalance <= 0) {
            document.getElementById('bankrupt-dice').style.display = 'flex';
        }

        diceBetValue = 0;
        document.getElementById('dice-bet-display').innerText = "0";
        document.getElementById('roll-btn').disabled = false;
        updateDiceStats();
    }, 800);
}

function renderDie(el, val) {
    el.innerHTML = '';
    const dotsMap = {
        1: [4], 2: [0, 8], 3: [0, 4, 8],
        4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 3, 6, 2, 5, 8]
    };
    for(let i=0; i<9; i++) {
        const cell = document.createElement('div');
        if(dotsMap[val].includes(i)) {
            const dot = document.createElement('div');
            dot.className = 'dot';
            cell.appendChild(dot);
        }
        el.appendChild(cell);
    }
}

function resetDiceUI() {
    renderDie(document.getElementById('die-1'), 1);
    renderDie(document.getElementById('die-2'), 6);
    document.getElementById('dice-status').innerText = "PICK OPTION & ROLL";
    document.getElementById('dice-status').style.color = "white";
    diceClearBet();
    diceSelectedOption = null;
    document.querySelectorAll('.opt-btn').forEach(btn => btn.classList.remove('selected'));
}
