// ---------------------------------------------------------------
export const POWER = {
  CHOOSE_NEXT: 'CHOOSE_NEXT',
  NEXT: 'NEXT',
  PLAY_MINOR: 'PLAY_MINOR',
  BLOCKED: 'BLOCKED',
  CLEAN: 'CLEAN',
  NONE: false
};

class Card {
  constructor(value, suit) {
    this.value = value;
    this.suit = suit;
  }
  specialPower() {
    switch (this.value) {
      case 1:  return POWER.CHOOSE_NEXT;
      case 2:  return POWER.NEXT;
      case 7:  return POWER.PLAY_MINOR;
      case 8:  return POWER.BLOCKED;
      case 10: return POWER.CLEAN;
      default: return POWER.NONE;
    }
  }
}

// ---------------------------------------------------------------

class Deck {
  constructor() {
    this.cards = [];
    this.discardedPile = [];
    this._build();
  }
  _build() {
    const suits = ["hearts", "diamonds", "clubs", "spades"];
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

    for (const suit of suits) {
      for (const value of values) {
        this.cards.push(new Card(value, suit));
      }
    }
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
    return this;
  }

  draw(count = 1) {
    if (count === 1) return this.cards.pop();
    const hand = [];
    while (count-- && this.cards.length) {
      hand.push(this.cards.pop());
    }
    return hand;
  }
  reset() {
    this.cards.length = 0;
    this._build();
    return this.shuffle();
  }
  get size() {
    return this.cards.length;
  }
}

class Player {
  constructor(name) {
    this.name = name;
    this.hand = [];
    this.faceUp = [];
    this.faceDown = [];
    this.wins = 0;
  }
  playCard(pile, index) {
    let card;
    if (pile === 'hand') {
      card = this.hand.splice(index, 1)[0];
    } else if (pile === 'faceUp') {
      card = this.faceUp.splice(index, 1)[0];
    } else if (pile === 'faceDown') {
      card = this.faceDown.splice(index, 1)[0];
    }
    return card;
  }
}

class Game {
  constructor(playerNames, deck) {
    this.players = playerNames.map((name) => new Player(name));
    this.deck = deck;
    this.currentPlayerIndex = 0;
    this.board = [];
    this.round = 1;
    this.gameOver = false;
    this.freePlay = false;
    this.minPlayValue = 1;  // inclusive lower bound
    this.maxPlayValue = 13; // inclusive upper bound
    this.awaitingChoiceNext = false;  // player must pick next
  }

  get currentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  nextTurn() {
    this.currentPlayerIndex =
      (this.currentPlayerIndex + 1) % this.players.length;
  }

  applyCardPower(card) {
    switch (card.specialPower()) {
      case POWER.CHOOSE_NEXT: return this.promptChooseNext();
      case POWER.NEXT:        return this.next();
      case POWER.PLAY_MINOR:  return this.playMinor();
      case POWER.BLOCKED:     return this.blocked();
      case POWER.CLEAN:       return this.clean();
      default:                return false;
    }
  }

  chooseNext(targetIndex) {
    if (targetIndex >= 0 && targetIndex < this.players.length) {
      this.currentPlayerIndex = targetIndex;
      this.awaitingChoiceNext = false;
      return true;
    }
    return false;
  }

  promptChooseNext() {
    this.awaitingChoiceNext = true;
  }

  next() {
    this.nextTurn();
    this.freePlay = true;
    return true;
  }

  playMinor() {
    this.nextTurn();
    this.freePlay = false;
    this.minPlayValue = 2;  // 2-6 only
    this.maxPlayValue = 6;
    return true;
  }

  blocked() {
    // Just mark the next player as skipped — do NOT advance turn
    // play() will call nextTurn() after this
    const nextIndex = (this.currentPlayerIndex + 1) % this.players.length;
    this.players[nextIndex].skipped = true;
    return true;
  }

  clean() {
    this.deck.discardedPile.push(...this.board);
    this.board = [];
    this.freePlay = true; // Play again after cleaning
    return true;
  }

  checkPileCleanup() {
    if (this.board.length < 4) return false;

    // Check last 4 cards for same value
    const lastFour = this.board.slice(-4);
    if (lastFour.every(card => card.value === lastFour[0].value)) {
      this.deck.discardedPile.push(...this.board);
      this.board = [];
      this.freePlay = true;
      console.log(`Pile cleaned! Four ${lastFour[0].value}'s played. Play again!`);
      return true;
    }
    return false;
  }

  resetTurnRestrictions() {
    this.freePlay = false;
    this.minPlayValue = 1;
    this.maxPlayValue = 13;
    this.awaitingChoiceNext = false;
    // Note: we do NOT clear skipped flags here - that's done when skipped player takes turn
  }

  isValidPlay(card) {
    const player = this.currentPlayer;

    // Check if player is blocked
    if (player.skipped) {
      return false;
    }

    // Free play bypasses value restrictions
    if (this.freePlay) {
      return true;
    }

    // Check value range
    if (card.value < this.minPlayValue || card.value > this.maxPlayValue) {
      return false;
    }

    // Ace (1) can be played on any card except 7
    if (card.value === 1) {
      if (this.board.length === 0) return true; // Ace can start pile
      const topCard = this.board[this.board.length - 1];
      if (topCard.value !== 7) return true; // Ace beats anything except 7
      return false; // Can't play Ace on 7
    }

    // Must beat or equal the top board card
    if (this.board.length > 0) {
      const topCard = this.board[this.board.length - 1];

      // When Ace (1) is on pile, only Ace or 2 can be played
      if (topCard.value === 1) {
        if (card.value !== 1 && card.value !== 2) {
          return false;
        }
        return true;
      }

      if (card.value < topCard.value) {
        return false;
      }
    }

    return true;
  }

  canPlay(pile = 'hand') {
    const player = this.currentPlayer;
    let cards;

    if (pile === 'hand') {
      cards = player.hand;
    } else if (pile === 'faceUp') {
      cards = player.faceUp;
    } else if (pile === 'faceDown') {
      if (player.faceUp.length > 0) return false;
      cards = player.faceDown;
    }

    return cards.some(card => this.isValidPlay(card));
  }

  getPlayableCards(pile = 'hand') {
    const player = this.currentPlayer;
    let cards;

    if (pile === 'hand') {
      cards = player.hand;
    } else if (pile === 'faceUp') {
      cards = player.faceUp;
    } else if (pile === 'faceDown') {
      if (player.faceUp.length > 0) return [];
      cards = player.faceDown;
    }

    return cards.filter(card => this.isValidPlay(card));
  }

  playMultiple(pile, value) {
    const player = this.currentPlayer;
    let source;

    if (pile === 'hand') source = player.hand;
    else if (pile === 'faceUp') source = player.faceUp;
    else if (pile === 'faceDown') {
      if (player.faceUp.length > 0) return false;
      source = player.faceDown;
    }

    // Find all cards of this value that are valid plays
    const matchingCards = source.filter(card => card.value === value && this.isValidPlay(card));

    if (matchingCards.length < 2) return false;

    // Remove all matching cards from source
    const playedCards = [];
    for (let i = source.length - 1; i >= 0; i--) {
      if (source[i].value === value && this.isValidPlay(source[i])) {
        playedCards.push(source.splice(i, 1)[0]);
      }
    }

    if (playedCards.length < 2) {
      // Put cards back if less than 2
      source.push(...playedCards);
      return false;
    }

    this.board.push(...playedCards);

    // Check for 4-of-a-kind cleanup when playing multiple
    if (playedCards.length === 4) {
      this.deck.discardedPile.push(...this.board);
      this.board = [];
      this.freePlay = true;
      console.log(`Four ${playedCards[0].value}'s played together! Pile cleaned!`);
      return playedCards;
    }

    return playedCards;
  }

  // Returns info about what source the player can play from
  getTurnAction() {
    const player = this.currentPlayer;

    if (player.skipped) {
      return { action: 'skip' };
    }

    if (this.canPlay('hand')) {
      return { action: 'play', pile: 'hand' };
    }

    if (player.faceUp.length > 0 && this.canPlay('faceUp')) {
      return { action: 'play', pile: 'faceUp' };
    }

    if (player.faceDown.length > 0 && this.canPlay('faceDown')) {
      return { action: 'play', pile: 'faceDown' };
    }

    return { action: 'pickup' };
  }

  takeTurn() {
    const player = this.currentPlayer;

    // Check if player was blocked (by an 8) - clear flag and skip them
    if (player.skipped) {
      console.log(`${player.name} is blocked and skips their turn.`);
      player.skipped = false; // Clear the blocked flag
      this.resetTurnRestrictions();
      this.nextTurn();
      this.drawPhase();
      return { action: 'skip' };
    }

    const turnAction = this.getTurnAction();

    if (turnAction.action === 'pickup') {
      this.pickUpBoard();
      this.drawPhase();
      return { action: 'pickup' };
    }

    // Player has valid play(s) available
    return turnAction;
  }

  playAndAdvance(pile, index) {
    const result = this.play(pile, index);
    if (!result) return false;

    // Check for pile cleanup after playing
    this.checkPileCleanup();

    // Draw back up to 3 after playing (if deck has cards and turn continues)
    this.drawPhase();

    return true;
  }

  playMultipleAndAdvance(pile, value) {
    const playedCards = this.playMultiple(pile, value);
    if (!playedCards) return false;

    // Check for pile cleanup (already handled in playMultiple for 4 cards)

    // Draw back up to 3 after playing
    this.drawPhase();

    return playedCards;
  }

  pickUpBoard() {
    const player = this.currentPlayer;
    player.hand.push(...this.board);
    this.board = [];
    this.resetTurnRestrictions();
    this.nextTurn();
    console.log(`${player.name} picks up ${player.hand.length - this.board.length} cards.`);
    return true;
  }

  play(pile, index) {
    const player = this.currentPlayer;
    const card = player.playCard(pile, index);

    if (!card) return false;

    // Can only play from faceDown when faceUp is empty
    if (pile === 'faceDown' && player.faceUp.length > 0) {
      player.faceDown.push(card);
      return false;
    }

    if (!this.isValidPlay(card)) {
      // Put card back and pick up board
      if (pile === 'hand') player.hand.push(card);
      else if (pile === 'faceUp') player.faceUp.push(card);
      else if (pile === 'faceDown') player.faceDown.push(card);
      return this.pickUpBoard();
    }

    this.board.push(card);

    const power = card.specialPower();

    // CHOOSE_NEXT: player must pick target before turn ends
    if (power === POWER.CHOOSE_NEXT) {
      this.applyCardPower(card);
      return true;
    }

    const wasBlocked = power === POWER.BLOCKED;
    const wasCleaned = power === POWER.CLEAN;
    this.applyCardPower(card);

    // Only reset restrictions if NOT blocked and NOT cleaned
    // (blocked player needs to be skipped, and cleaned player gets another turn)
    if (!wasBlocked && !wasCleaned) {
      this.resetTurnRestrictions();
    } else if (wasCleaned) {
      // Clean keeps freePlay = true, just reset other restrictions
      this.freePlay = true;
      this.minPlayValue = 1;
      this.maxPlayValue = 13;
      this.awaitingChoiceNext = false;
    }

    this.nextTurn();

    this.checkWin();

    // Draw back up to 3 after playing (if deck has cards)
    this.drawPhase();

    return true;
  }

  drawPhase() {
    const player = this.currentPlayer;
    const drawCount = 3 - player.hand.length;
    if (drawCount > 0 && this.deck.size > 0) {
      const drawn = this.deck.draw(drawCount);
      // draw() returns single card when count=1, array when count>1
      const cards = Array.isArray(drawn) ? drawn : [drawn];
      player.hand.push(...cards.filter(c => c !== undefined));
    }
  }

  checkWin() {
    for (const player of this.players) {
      if (
        player.hand.length === 0 &&
        player.faceUp.length === 0 &&
        player.faceDown.length === 0
      ) {
        this.gameOver = true;
        player.wins++;
        console.log(`${player.name} wins! (${player.wins} total wins)`);
        return player;
      }
    }
    return null;
  }

  getRankings() {
    return [...this.players].sort((a, b) => b.wins - a.wins);
  }

  newGame() {
    this.deck.reset();
    for (const player of this.players) {
      player.hand = [];
      player.faceUp = [];
      player.faceDown = [];
    }
    this.currentPlayerIndex = 0;
    this.board = [];
    this.round = 1;
    this.gameOver = false;
    this.resetTurnRestrictions();
  }

  start() {
    // Full reset before starting
    this.gameOver = false;
    this.currentPlayerIndex = 0;
    this.board = [];
    this.round = 1;
    this.resetTurnRestrictions();

    this.deck.reset();

    for (const player of this.players) {
      player.hand = [];
      player.faceUp = [];
      player.faceDown = [];
    }

    for (const player of this.players) {
      const hand = this.deck.draw(3);
      const faceUp = this.deck.draw(3);
      const faceDown = this.deck.draw(3);
      player.hand.push(...hand);
      player.faceDown.push(...faceDown);
      player.faceUp.push(...faceUp);
    }
    console.log(`Game started! ${this.players.map((p) => p.name).join(" vs ")}`);
    console.log(`${this.currentPlayer.name}'s turn.`);
  }
}

export { Card, Deck, Player, Game };