// ---------------------------------------------------------------
const modules = {};

export class Card {
  constructor(value, suit) {
    this.value = value;
    this.suit = suit;
  }
  specialPower = () => {
    switch (this.value) {
      case 1:
        return game.chooseNext();
      case 2:
        return game.next();
      case 7:
        return game.playMinor();
      case 8:
        return game.blocked();
      case 10:
        return game.clean()
      default:
        return false;
    }
  };
}

// ---------------------------------------------------------------

export class Deck {
  constructor() {
    this.cards = [];
    this.pile = [];
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
  discard(card) {
    this.discardedPile.push(card);
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
    this.score = 0;
  }
  drawCard(deck) {
    if (this.hand <= 3)
    this.hand.push(deck.draw());
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
  }

  get currentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  nextTurn() {
    this.currentPlayerIndex =
      (this.currentPlayerIndex + 1) % this.players.length;
  }

  start() {
    this.deck.shuffle();

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

modules.exports = { Card, Deck, Player, Game };