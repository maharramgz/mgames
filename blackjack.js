let bjBalance = parseInt(localStorage.getItem('bj-balance')) || 100;
let bjHighScore = parseInt(localStorage.getItem('bj-highscore')) || 100;
let playerHands = [[]], dealerHand = [], currentBet = 0, deck = [], activeHandIndex = 0, isSplit = false;
let handBets = []; // Track individual bets for split/double hands
let inputBetString = "10";

function openBlackjack() {
    document.getElementById('library-view').style.display = 'none';
    document.getElementById('blackjack-view').style.display = 'flex';
    document.getElementById('numpad-container').style.display = 'none';
    document.getElementById('bet-trigger-btn').style.display = 'block';
    updateBjStats();
    updateBetDisplay();
}

function toggleNumpad() {
    const pad = document.getElementById('numpad-container');
    const trigger = document.getElementById('bet-trigger-btn');
    pad.style.display = (pad.style.display === 'none' || pad.style.display === '') ? 'block' : 'none';
    trigger.style.display = (pad.style.display === 'block') ? 'none' : 'block';
}

function bjInputBet(num) {
    let nextBet = inputBetString === "0" ? num.toString() : inputBetString + num.toString();
    if (parseInt(nextBet) <= bjBalance) { inputBetString = nextBet; updateBetDisplay(); }
}

function bjClearBet() { inputBetString = "0"; updateBetDisplay(); }
function bjMaxBet() { inputBetString = bjBalance.toString(); updateBetDisplay(); }
function updateBetDisplay() { document.getElementById('bet-display').innerText = inputBetString; }

function updateBjStats() {
    document.getElementById('bj-balance').innerText = Math.floor(bjBalance);
    document.getElementById('bj-highscore').innerText = Math.floor(bjHighScore);
    if(bjBalance > bjHighScore) { bjHighScore = bjBalance; localStorage.setItem('bj-highscore', bjHighScore); }
    localStorage.setItem('bj-balance', bjBalance);
}

function createDeck() {
    const suits = ['♠','♣','♥','♦'], values = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    deck = []; for(let s of suits) for(let v of values) deck.push({s, v});
    deck.sort(() => Math.random() - 0.5);
}

function getHandValue(hand) {
    let val = 0, aces = 0;
    for(let c of hand) {
        if(['J','Q','K'].includes(c.v)) val += 10;
        else if(c.v === 'A') { val += 11; aces++; }
        else val += parseInt(c.v);
    }
    while(val > 21 && aces > 0) { val -= 10; aces--; }
    return val;
}

function showResultToast(type, text, delay = 0) {
    setTimeout(() => {
        const container = document.querySelector('.blackjack-container');
        const toast = document.createElement('div');
        toast.className = `result-toast toast-${type}`;
        toast.innerText = text;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 1600);
    }, delay);
}

function bjStartRound() {
    currentBet = parseInt(inputBetString);
    if(currentBet <= 0 || currentBet > bjBalance) return;
    bjBalance -= currentBet; 
    handBets = [currentBet]; // Initialize bet for first hand
    updateBjStats(); createDeck();
    
    playerHands = [[deck.pop(), deck.pop()]];
    dealerHand = [deck.pop(), deck.pop()];
    activeHandIndex = 0; isSplit = false;

    document.getElementById('numpad-container').style.display = 'none';
    document.getElementById('betting-area').style.display = 'none';
    renderAllHands(true);

    if(getHandValue(playerHands[0]) === 21) {
        bjFinishDealer(); 
    } else {
        document.getElementById('action-area').style.display = 'grid';
        updateActionButtons();
        document.getElementById('bj-status').innerText = "Good Luck!";
    }
}

function updateActionButtons() {
    const currentHand = playerHands[activeHandIndex];
    const canDouble = currentHand.length === 2 && bjBalance >= handBets[activeHandIndex];
    const canSplit = !isSplit && currentHand.length === 2 && currentHand[0].v === currentHand[1].v && bjBalance >= currentBet;
    
    document.getElementById('double-btn').style.display = canDouble ? 'block' : 'none';
    document.getElementById('split-btn').style.display = canSplit ? 'block' : 'none';
}

function bjPlayerSplit() {
    bjBalance -= currentBet; 
    handBets = [currentBet, currentBet]; // Two hands, two equal bets
    updateBjStats(); isSplit = true;
    const card2 = playerHands[0].pop();
    playerHands.push([card2]);
    playerHands[0].push(deck.pop()); 
    playerHands[1].push(deck.pop());
    renderAllHands(true);
    updateActionButtons();
}

function bjPlayerHit() {
    playerHands[activeHandIndex].push(deck.pop());
    renderAllHands(true);
    if(getHandValue(playerHands[activeHandIndex]) >= 21) {
        bjPlayerStand();
    } else {
        updateActionButtons(); // Double Down only available on first hit (2 cards)
    }
}

function bjPlayerDouble() {
    const betToDouble = handBets[activeHandIndex];
    bjBalance -= betToDouble;
    handBets[activeHandIndex] *= 2; // Double the bet for this hand
    updateBjStats();
    
    playerHands[activeHandIndex].push(deck.pop());
    renderAllHands(true);
    
    // Automatically stand after one card in Double Down
    setTimeout(bjPlayerStand, 600);
}

function bjPlayerStand() {
    if(isSplit && activeHandIndex === 0) {
        activeHandIndex = 1; 
        renderAllHands(true);
        updateActionButtons();
        if(getHandValue(playerHands[1]) === 21) bjFinishDealer();
    } else { bjFinishDealer(); }
}

function bjFinishDealer() {
    renderAllHands(false);
    document.getElementById('action-area').style.display = 'none';
    const allBusted = playerHands.every(h => getHandValue(h) > 21);
    if(!allBusted) {
        while(getHandValue(dealerHand) < 17) { dealerHand.push(deck.pop()); renderAllHands(false); }
    }
    let totalWinnings = 0, results = [];
    const dVal = getHandValue(dealerHand);
    
    playerHands.forEach((hand, i) => {
        const pVal = getHandValue(hand);
        const thisHandBet = handBets[i];
        const isBJ = pVal === 21 && hand.length === 2;
        let winAmount = 0, handResult = "", toastType = "lose", toastText = "";

        if(pVal > 21) {
            handResult = "Bust";
            toastText = `BUST -${thisHandBet}`;
        } else if(isBJ && (dVal !== 21 || dealerHand.length !== 2)) {
            winAmount = thisHandBet * 2.5;
            handResult = "BLACKJACK!";
            toastText = `BLACKJACK! +${winAmount}`;
            toastType = "win";
        } else if(dVal > 21 || pVal > dVal) {
            winAmount = thisHandBet * 2;
            handResult = "Win";
            toastText = `WIN +${winAmount}`;
            toastType = "win";
        } else if(pVal === dVal) {
            winAmount = thisHandBet;
            handResult = "Push";
            toastText = `PUSH (RETURNED)`;
            toastType = "push";
        } else {
            handResult = "Lose";
            toastText = `LOSE -${thisHandBet}`;
        }

        showResultToast(toastType, toastText, i * 400);
        totalWinnings += winAmount;
        results.push(handResult);
    });

    bjBalance += totalWinnings;
    document.getElementById('bj-status').innerText = results.join(" | ");
    document.getElementById('betting-area').style.display = 'block';
    document.getElementById('bet-trigger-btn').style.display = 'block';
    if (parseInt(inputBetString) > bjBalance) inputBetString = bjBalance.toString();
    updateBetDisplay(); updateBjStats();
    if(bjBalance <= 0) document.getElementById('bankrupt-screen').style.display = 'flex';
}

function renderAllHands(hideDealer) {
    const dScore = hideDealer ? getHandValue([dealerHand[1]]) : getHandValue(dealerHand);
    document.getElementById('dealer-score').innerText = dScore;
    renderHandUI('dealer-hand', dealerHand, hideDealer);
    const container = document.getElementById('player-hands-container');
    container.innerHTML = '';
    playerHands.forEach((hand, i) => {
        const wrap = document.createElement('div');
        wrap.className = `hand ${i === activeHandIndex && isSplit ? 'active-hand' : ''}`;
        const label = document.createElement('div');
        label.className = 'hand-label';
        label.innerHTML = `${isSplit ? 'HAND '+(i+1) : 'YOUR SCORE'}<br><span class="score-badge">${getHandValue(hand)}</span>`;
        container.appendChild(label);
        container.appendChild(wrap);
        hand.forEach(c => {
            let div = document.createElement('div'); div.className = 'bj-card';
            div.innerText = c.v + c.s; if(['♥','♦'].includes(c.s)) div.style.color = 'var(--red)';
            wrap.appendChild(div);
        });
    });
}

function renderHandUI(id, hand, hideFirst) {
    const el = document.getElementById(id); el.innerHTML = '';
    hand.forEach((c, i) => {
        let div = document.createElement('div'); div.className = 'bj-card';
        if(hideFirst && i === 0) { div.innerText = '?'; div.style.background = 'var(--accent)'; }
        else { div.innerText = c.v + c.s; if(['♥','♦'].includes(c.s)) div.style.color = 'var(--red)'; }
        el.appendChild(div);
    });
}

function bjResetBankroll() {
    bjBalance = 100; inputBetString = "10";
    updateBjStats(); updateBetDisplay();
    document.getElementById('bankrupt-screen').style.display = 'none';
}
