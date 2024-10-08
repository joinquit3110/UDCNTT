// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

let teams = {
    A: [],
    B: [],
    Admin: []
};

let boardStates = {
    A: {},
    B: {}
};

let gameSettings = {
    carrier: 1,
    battleship: 1,
    cruiser: 1,
    submarine: 1,
    destroyer: 1
};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('setPlayerName', (playerName) => {
        socket.playerName = playerName;
        console.log('Player name set:', playerName);
    });

    socket.on('joinTeam', ({ playerName, team }) => {
        socket.team = team;
        teams[team].push(playerName);
        console.log(`Player ${playerName} joined team ${team}`);
        io.emit('updatePlayerList', teams);
        socket.emit('gameSettingsUpdated', gameSettings);
    });

    socket.on('updateGameSettings', (updatedSettings) => {
        gameSettings = { ...updatedSettings };
        console.log('Game settings updated:', gameSettings);
        io.emit('gameSettingsUpdated', gameSettings);
    });

    socket.on('startGame', () => {
        console.log('Game started with settings:', gameSettings);
        io.emit('gameStarted', gameSettings);
    });

    socket.on('updateBoard', ({ team, row, col, selected }) => {
        if (!boardStates[team]) {
            boardStates[team] = {};
        }
        if (!boardStates[team][row]) {
            boardStates[team][row] = {};
        }
        boardStates[team][row][col] = selected;
        console.log(`Board updated for team ${team} at row ${row}, col ${col}, selected: ${selected}`);
        io.emit('boardUpdate', { team, row, col, selected });
    });

    socket.on('disconnect', () => {
        if (socket.playerName && socket.team) {
            teams[socket.team] = teams[socket.team].filter(player => player !== socket.playerName);
            console.log(`Player ${socket.playerName} disconnected from team ${socket.team}`);
            io.emit('updatePlayerList', teams);
        }
    });

    socket.on('requestBoardState', (team) => {
        if (boardStates[team]) {
            socket.emit('boardStateUpdate', { team, board: boardStates[team] });
        }
    });
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});