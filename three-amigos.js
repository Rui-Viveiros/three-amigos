// ---------------------------------------------------------------
const modules = {};

export class Card {
  constructor(value, suit, x, y) {
    this.value = value;
    this.suit = suit;
    this.x = x;
    this.y = y;
    this.width = 80;
    this.height = 120;
    this.faceUp = true;
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
        game.clean();
        return game.play();
      default:
        return false;
    }
  };
}

// ---------------------------------------------------------------

export class Deck {
  constructor() {
    this.cards = [];
    this.discardPile = [];
    this._build();
  }
  _build() {
    const suits = ["hearts", "diamonds", "clubs", "spades"];
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

    for (const suit of suits) {
      for (const value of values) {
        this.cards.push(new Card(value, suit, 0, 0));
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

  peek() {
    return this.cards[this.cards.length - 1];
  }
  reset() {
    this.cards.length = 0;
    this._build();
    return this.shuffle();
  }
  discard(card) {
    this.discardPile.push(card);
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