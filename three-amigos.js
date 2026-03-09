const game = {
  play() {
    console.log("Play a card");
  },
  chooseNext() {
    console.log("Choose the next player to play");
  },
  next() {
    console.log("Move to the next player");
  },
  playMinor() {
    console.log("Play a minor card");
  },
  blocked() {
    console.log("Block the next player");
  },
  clean() {
    console.log("Clean the board");
  },
};

// ---------------------------------------------------------------

class Card {
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
