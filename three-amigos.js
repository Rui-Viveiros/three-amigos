// ---------------------------------------------------------------
const POWER = {
  CHOOSE_NEXT: 'CHOOSE_NEXT',
  NEXT: 'NEXT',
  PLAY_MINOR: 'PLAY_MINOR',
  BLOCKED: 'BLOCKED',
  CLEAN: 'CLEAN',
  NONE: false
};

export class Card {
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

export class Deck {
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

export class Player {
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

export class Game {
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
    return true;
  }

  resetTurnRestrictions() {
    this.freePlay = false;
    this.minPlayValue = 1;
    this.maxPlayValue = 13;
    this.awaitingChoiceNext = false;
    for (const player of this.players) {
      player.skipped = false;
    }
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

    // Must beat or equal the top board card
    if (this.board.length > 0) {
      const topCard = this.board[this.board.length - 1];
      if (card.value < topCard.value) {
        return false;
      }
    }

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
      player.hand.push(card);
      return false;
    }

    this.board.push(card);

    const power = card.specialPower();

    // CHOOSE_NEXT: player must pick target before turn ends
    if (power === POWER.CHOOSE_NEXT) {
      this.applyCardPower(card);
      return true;
    }

    this.applyCardPower(card);
    this.resetTurnRestrictions();
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
      player.hand.push(...drawn.filter(c => c !== undefined));
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