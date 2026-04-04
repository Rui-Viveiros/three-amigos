import { Card, Deck, Player, Game, POWER } from "./three-amigos.js";

// DOM Elements
const setupScreen = document.getElementById("setup-screen");
const gameScreen = document.getElementById("game-screen");
const playerNamesDiv = document.getElementById("player-names");
const startGameBtn = document.getElementById("start-game-btn");
const currentPlayerNameEl = document.getElementById("current-player-name");
const opponentsArea = document.getElementById("opponents-area");
const pileEl = document.getElementById("pile");
const deckCountEl = document.getElementById("deck-count");
const deckEl = document.getElementById("deck");
const currentHandEl = document.getElementById("current-hand");
const currentFaceUpEl = document.getElementById("current-face-up");
const currentFaceDownEl = document.getElementById("current-face-down");
const statusMessageEl = document.getElementById("status-message");
const endTurnBtn = document.getElementById("end-turn-btn");
const newGameBtn = document.getElementById("new-game-btn");
const winModal = document.getElementById("win-modal");
const winnerNameEl = document.getElementById("winner-name");
const playAgainBtn = document.getElementById("play-again-btn");
const pickupBtn = document.getElementById("pickup-btn");

let game = null;
let selectedCards = []; // For multi-card play

// Suit symbols
const suitSymbols = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠"
};

// Setup: Player count selection
document.querySelectorAll(".player-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".player-btn").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    const count = parseInt(btn.dataset.count);
    showPlayerNameInputs(count);
  });
});

function showPlayerNameInputs(count) {
  playerNamesDiv.innerHTML = "";
  playerNamesDiv.classList.remove("hidden");

  for (let i = 0; i < count; i++) {
    const div = document.createElement("div");
    div.className = "player-name-input";
    div.innerHTML = `<input type="text" placeholder="Player ${i + 1}" data-index="${i}" />`;
    playerNamesDiv.appendChild(div);
  }

  startGameBtn.classList.remove("hidden");
}

startGameBtn.addEventListener("click", startGame);

function startGame() {
  const inputs = playerNamesDiv.querySelectorAll("input");
  const names = [];

  inputs.forEach((input) => {
    const name = input.value.trim() || `Player ${parseInt(input.dataset.index) + 1}`;
    names.push(name);
  });

  const deck = new Deck().shuffle();
  game = new Game(names, deck);
  game.start();

  setupScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  winModal.classList.add("hidden");

  renderGame();
}

newGameBtn.addEventListener("click", () => {
  game.newGame();
  game.start();
  selectedCards = [];
  renderGame();
  setStatus("");
});

playAgainBtn.addEventListener("click", () => {
  game.newGame();
  game.start();
  selectedCards = [];
  winModal.classList.add("hidden");
  renderGame();
  setStatus("");
});

pickupBtn.addEventListener("click", () => {
  if (game && game.board.length > 0) {
    game.pickUpBoard();
    setStatus(`${game.currentPlayer.name} picked up the pile!`, "error");
    renderGame();
  } else if (game && game.board.length === 0) {
    setStatus("Pile is empty!", "error");
  }
});

endTurnBtn.addEventListener("click", () => {
  if (game) {
    // End current turn and move to next player
    game.resetTurnRestrictions();
    game.nextTurn();
    selectedCards = [];
    renderGame();
    setStatus(`${game.currentPlayer.name}'s turn.`);
  }
});

function renderGame() {
  if (!game) return;

  // Current player info
  const player = game.currentPlayer;
  currentPlayerNameEl.textContent = player.name;

  // Render opponents
  renderOpponents();

  // Render pile
  renderPile();

  // Render deck
  deckCountEl.textContent = game.deck.size;

  // Render current player cards
  renderCurrentPlayerCards();
}

function renderOpponents() {
  opponentsArea.innerHTML = "";
  const currentIdx = game.players.indexOf(game.currentPlayer);

  game.players.forEach((p, idx) => {
    if (idx === currentIdx) return;

    const div = document.createElement("div");
    div.className = "opponent";
    
    // Show hand as face-down, faceUp visible, faceDown hidden
    const faceUpCards = p.faceUp.map(() => `<div class="card face-up-placeholder"></div>`).join("");
    const faceDownCount = p.faceDown.length;
    
    div.innerHTML = `
      <div class="opponent-name">${p.name}</div>
      <div class="opponent-cards">
        ${p.hand.map(() => `<div class="card face-down"></div>`).join("")}
        ${faceUpCards}
        <div class="card face-down" style="opacity:0.5">${faceDownCount}</div>
      </div>
    `;
    opponentsArea.appendChild(div);
  });
}

function renderPile() {
  pileEl.innerHTML = "";
  // Only show the last card (top of pile)
  if (game.board.length > 0) {
    const topCard = game.board[game.board.length - 1];
    const cardEl = createCardElement(topCard, false);
    pileEl.appendChild(cardEl);
  }
}

function createCardElement(card, clickable = true, pile = "hand", index = 0) {
  const div = document.createElement("div");
  div.className = `card ${card.suit}`;
  if (!clickable) div.classList.add("pile-card");

  if (clickable) {
    div.dataset.pile = pile;
    div.dataset.index = index;
    div.addEventListener("click", () => handleCardClick(card, pile, index));
  }

  if (card) {
    div.innerHTML = `
      <span class="card-value">${getDisplayValue(card.value)}</span>
      <span class="card-suit">${suitSymbols[card.suit]}</span>
    `;
  }

  return div;
}

function getDisplayValue(value) {
  switch (value) {
    case 1: return "A";
    case 11: return "J";
    case 12: return "Q";
    case 13: return "K";
    default: return value;
  }
}

function renderCurrentPlayerCards() {
  const player = game.currentPlayer;

  // Hand section
  currentHandEl.innerHTML = "";
  const canPlayHand = game.canPlay("hand");
  player.hand.forEach((card, idx) => {
    const isValid = game.isValidPlay(card);
    const cardEl = createCardElement(card, true, "hand", idx);
    if (!isValid || !canPlayHand) cardEl.classList.add("disabled");
    currentHandEl.appendChild(cardEl);
  });

  // FaceUp section
  currentFaceUpEl.innerHTML = "";
  const canPlayFaceUp = player.faceUp.length > 0 && game.canPlay("faceUp");
  player.faceUp.forEach((card, idx) => {
    const isValid = game.isValidPlay(card);
    const cardEl = createCardElement(card, true, "faceUp", idx);
    if (!isValid || !canPlayFaceUp) cardEl.classList.add("disabled");
    currentFaceUpEl.appendChild(cardEl);
  });

  // FaceDown section - ONE random card revealed when faceUp is empty
  currentFaceDownEl.innerHTML = "";
  const canPlayFaceDown = player.faceDown.length > 0 && game.canPlay("faceDown");
  
  if (player.faceUp.length === 0 && player.faceDown.length > 0) {
    // Randomly pick ONE face-down card to reveal and play
    const randomIdx = Math.floor(Math.random() * player.faceDown.length);
    const card = player.faceDown[randomIdx];
    const cardEl = createCardElement(card, true, "faceDown", randomIdx);
    if (!canPlayFaceDown) cardEl.classList.add("disabled");
    currentFaceDownEl.appendChild(cardEl);
  } else if (player.faceDown.length > 0) {
    // Show placeholder cards for hidden face-down cards
    for (let i = 0; i < player.faceDown.length; i++) {
      const div = document.createElement("div");
      div.className = "card face-down";
      div.innerHTML = `<span class="card-value">?</span><span class="card-suit">?</span>`;
      currentFaceDownEl.appendChild(div);
    }
  }

  // Update card count
  const totalCards = player.hand.length + player.faceUp.length + player.faceDown.length;
  document.querySelector(".card-count").textContent = `${totalCards} cards remaining`;
}

function handleCardClick(card, pile, index) {
  if (!game) return;

  // Check if it's a valid play
  if (!game.isValidPlay(card)) {
    setStatus("Invalid play! Card must be >= top of pile.", "error");
    return;
  }

  // Check turn order: must play from hand first
  const player = game.currentPlayer;
  if (pile === "faceUp" && player.hand.length > 0) {
    setStatus("Play from hand first!", "error");
    return;
  }
  if (pile === "faceDown" && player.faceUp.length > 0) {
    setStatus("Play face-up cards first!", "error");
    return;
  }

  // Check if card has CHOOSE_NEXT power
  if (card.specialPower() === POWER.CHOOSE_NEXT) {
    game.board.push(card);
    player.playCard(pile, index);
    game.applyCardPower(card);
    game.promptChooseNext();
    setStatus(`${player.name} played ${getDisplayValue(card.value)}${suitSymbols[card.suit]} - Choose next player!`, "success");
    showPlayerSelection();
    renderGame();
    return;
  }

  // Normal play
  const result = game.playAndAdvance(pile, index);

  if (result) {
    const powerName = getPowerName(card.specialPower());
    if (powerName) {
      setStatus(`${player.name} played ${getDisplayValue(card.value)}${suitSymbols[card.suit]} - ${powerName}`, "success");
    } else {
      setStatus(`${player.name} played ${getDisplayValue(card.value)}${suitSymbols[card.suit]}`, "success");
    }

    // Check for pile cleanup message
    if (game.board.length === 0) {
      setStatus("Pile cleaned! Play again!", "success");
    }

    // Check for win
    const winner = game.checkWin();
    if (winner) {
      showWinModal(winner);
      return;
    }

    renderGame();
  }
}

function getPowerName(power) {
  switch (power) {
    case POWER.CHOOSE_NEXT: return "Choose next player";
    case POWER.NEXT: return "Next player plays";
    case POWER.PLAY_MINOR: return "Must play 2-6";
    case POWER.BLOCKED: return "Next player blocked";
    case POWER.CLEAN: return "Pile cleared!";
    default: return null;
  }
}

function showPlayerSelection() {
  // For simplicity, just cycle through players when CHOOSE_NEXT is played
  // In a full implementation, this would show a UI to pick
  const otherPlayers = game.players.filter(p => p !== game.currentPlayer);
  if (otherPlayers.length > 0) {
    const nextIdx = game.players.indexOf(otherPlayers[0]);
    game.chooseNext(nextIdx);
  }
}

function setStatus(message, type = "") {
  statusMessageEl.textContent = message;
  statusMessageEl.className = "status-message";
  if (type) statusMessageEl.classList.add(type);
}

function showWinModal(winner) {
  winnerNameEl.textContent = `${winner.name} Wins!`;
  winModal.classList.remove("hidden");
}
