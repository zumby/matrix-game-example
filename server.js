// server.js
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Define the payoff matrix
const payoffMatrix = [
  [{ player: 0, monster: 0 }, { player: 0, monster: 0 }, { player: -1, monster: 0 }],    // Player chooses Heal
  [{ player: 0, monster: 0 }, { player: -1, monster: -1 }, { player: -2, monster: -1 }],   // Player chooses Attack
  [{ player: 0, monster: -1 }, { player: -1, monster: -2 }, { player: -2, monster: -2 }]   // Player chooses Heavy Attack
];

const initialHealth = 25;
let playerHealth = initialHealth;
let monsterHealth = initialHealth;

// Handle socket connections
io.on('connection', (socket) => {
  console.log('A user connected');

  // Send the payoff matrix and initial health to the client
  socket.emit('initialData', { payoffMatrix, playerHealth, monsterHealth });

  // Handle player moves
  socket.on('playerMove', (playerMove) => {
    console.log(`Player chose: ${playerMove}`);

    // Simulate the Monster's move (for simplicity, you can make this random)
    const monsterMove = Math.floor(Math.random() * 3);

    // Map move indices to move names
    const moveNames = ['Heal', 'Attack', 'Heavy Attack'];
    const playerMoveName = moveNames[playerMove];
    const monsterMoveName = moveNames[monsterMove];

    // Send the chosen moves to the client
    socket.emit('moves', { playerMove: playerMoveName, monsterMove: monsterMoveName });

    // Get the payoff tuple based on the payoff matrix
    const payoff = payoffMatrix[playerMove][monsterMove];

    // Update health points
    playerHealth += payoff.player;
    monsterHealth += payoff.monster;

    // Send the Monster's move, payoffs, and updated health to the client
    socket.emit('monsterMove', {
      monsterMove: monsterMoveName,
      playerMove: playerMoveName,
      playerPayoff: payoff.player,
      monsterPayoff: payoff.monster,
      playerHealth,
      monsterHealth,
    });

    // Check for game end conditions
    if (playerHealth <= 0 || monsterHealth <= 0) {
      // Game over, determine the winner
      const winner = playerHealth > monsterHealth ? 'Player' : 'Monster';
      socket.emit('gameOver', { winner, playerHealth, monsterHealth });
    }
  });

  // Handle reset event
  socket.on('reset', () => {
    // Reset health values
    playerHealth = initialHealth;
    monsterHealth = initialHealth;

    // Send the updated health values to the client
    socket.emit('initialData', { payoffMatrix, playerHealth, monsterHealth });
  });

  // Handle disconnections
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});
