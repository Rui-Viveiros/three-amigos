import { Card, Deck, Player, Game } from "./three-amigos.js";

document.querySelector("button").addEventListener("click", () => {
    const numPlayers = parseInt(prompt("Enter number of players (2-4):"), 10);
    const playerNames = [];

    for (let i = 0; i < numPlayers; i++) {
        const name = prompt(`Enter name for Player ${i + 1}:`);
        playerNames.push(name);
    }

    const gameInstance = new Game(playerNames, new Deck());
    gameInstance.start();
});