// client.js
const socket = io();
let playerName = "";
let team = "";
let gameStarted = false;

function submitName() {
    console.log("submitName called");
    playerName = document.getElementById("playerName").value.trim();
    if (playerName) {
        console.log("Player name set to:", playerName);
        socket.emit('setPlayerName', playerName);
        document.getElementById("playerNameInput").style.display = "none";
        document.getElementById("chooseTeam").style.display = "block";
    }
}

function selectTeam(selectedTeam) {
    console.log("selectTeam called with team:", selectedTeam);
    if (selectedTeam === 'Admin') {
        adminLogin();
    } else {
        team = selectedTeam;
        socket.emit('joinTeam', { playerName, team });
        console.log("Player joined team:", team);
        document.getElementById("chooseTeam").style.display = "none";
        document.getElementById("teamScreen").style.display = "block";
        document.getElementById("teamTitle").innerText = `Welcome to Team ${team}, ${playerName}!`;
    }
}

function adminLogin() {
    console.log("adminLogin called");
    const password = prompt("Please enter the admin password:");
    if (password === "3110") {
        console.log("Admin login successful");
        socket.emit('joinTeam', { playerName, team: 'Admin' });
        document.getElementById("adminScreen").style.display = "block";
        document.getElementById("chooseTeam").style.display = "none";
        document.getElementById("teamScreen").style.display = "none";
    } else {
        console.log("Admin login failed");
        alert("Incorrect password. Try again.");
    }
}

function goBack() {
    console.log("goBack called");
    document.getElementById("adminScreen").style.display = "none";
    document.getElementById("chooseTeam").style.display = "block";
}

socket.on('updatePlayerList', (teams) => {
    console.log("updatePlayerList called with teams:", teams);
    const teamAList = document.getElementById("teamAList");
    const teamBList = document.getElementById("teamBList");
    
    teamAList.innerHTML = '';
    teamBList.innerHTML = '';

    teams.A.forEach(player => {
        console.log("Adding player to Team A list:", player);
        const li = document.createElement("li");
        li.textContent = player;
        teamAList.appendChild(li);
    });

    teams.B.forEach(player => {
        console.log("Adding player to Team B list:", player);
        const li = document.createElement("li");
        li.textContent = player;
        teamBList.appendChild(li);
    });

    document.getElementById('teamAPlayersList').textContent = teams.A.join(', ');
    document.getElementById('teamBPlayersList').textContent = teams.B.join(', ');
});

function startGame() {
    console.log("startGame called");
    gameStarted = true;
    document.getElementById("adminScreen").style.display = "none";
    document.getElementById("gameArea").style.display = "block";

    displayGameSettingsOnce();
    createBoardWithAxes("teamABoard");
    createBoardWithAxes("teamBBoard");
}

function displayGameSettingsOnce() {
    console.log("displayGameSettingsOnce called");
    const settingsHTML = `
        <h3>Game Settings:</h3>
        <p>Carrier: ${initialGameSettings.carrier}</p>
        <p>Battleship: ${initialGameSettings.battleship}</p>
        <p>Cruiser: ${initialGameSettings.cruiser}</p>
        <p>Submarine: ${initialGameSettings.submarine}</p>
        <p>Destroyer: ${initialGameSettings.destroyer}</p>
    `;
    
    let settingsContainer = document.getElementById("gameSettingsDisplay");
    if (!settingsContainer) {
        console.log("Creating new settings container");
        const newSettingsContainer = document.createElement("div");
        newSettingsContainer.id = "gameSettingsDisplay";
        newSettingsContainer.style.marginBottom = "20px";
        newSettingsContainer.innerHTML = settingsHTML;
        document.body.insertBefore(newSettingsContainer, document.getElementById("gameArea"));
    } else {
        settingsContainer.innerHTML = settingsHTML;
        settingsContainer.style.display = "block";
    }
}

function createBoardWithAxes(boardId) {
    console.log("createBoardWithAxes called for board:", boardId);
    const board = document.getElementById(boardId);
    board.innerHTML = '';

    const gridSize = 10;
    const axisContainer = document.createElement("div");
    axisContainer.style.display = "grid";
    axisContainer.style.gridTemplateColumns = `30px repeat(${gridSize}, 30px)`;
    axisContainer.style.gridTemplateRows = `repeat(${gridSize + 1}, 30px)`;
    axisContainer.style.position = "relative";

    for (let i = gridSize; i >= 0; i--) {
        console.log("Creating Y axis label for:", i);
        const yAxisLabel = document.createElement("div");
        yAxisLabel.classList.add("axis-label");
        yAxisLabel.style.gridRow = gridSize - i + 2;
        yAxisLabel.style.gridColumn = 1;
        yAxisLabel.style.alignSelf = "center";
        yAxisLabel.style.marginRight = "5px";
        yAxisLabel.textContent = i > 0 ? i : "";
        axisContainer.appendChild(yAxisLabel);
    }

    for (let j = 1; j <= gridSize; j++) {
        console.log("Creating X axis label for:", j);
        const xAxisLabel = document.createElement("div");
        xAxisLabel.classList.add("axis-label");
        xAxisLabel.style.gridRow = gridSize + 2;
        xAxisLabel.style.gridColumn = j + 1;
        xAxisLabel.style.justifySelf = "center";
        xAxisLabel.style.marginTop = "5px";
        xAxisLabel.textContent = j;
        axisContainer.appendChild(xAxisLabel);
    }

    for (let i = 1; i <= gridSize; i++) {
        for (let j = 1; j <= gridSize; j++) {
            console.log("Creating cell at row:", i, "column:", j);
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.style.gridRow = gridSize - i + 2;
            cell.style.gridColumn = j + 1;
            cell.dataset.row = gridSize - i + 1;
            cell.dataset.col = j;
            if (team !== 'Admin') {
                cell.classList.add("no-pointer-events");
            } else {
                cell.addEventListener('click', () => {
                    cell.classList.toggle('selected');
                    const selected = cell.classList.contains('selected');
                    cell.style.backgroundColor = selected ? 'lightblue' : '';
                    socket.emit('updateBoard', { team, row: cell.dataset.row, col: cell.dataset.col, selected });
                });
            }
            axisContainer.appendChild(cell);
        }
    }

    board.appendChild(axisContainer);
}

let initialGameSettings = {
    carrier: 1,
    battleship: 1,
    cruiser: 1,
    submarine: 1,
    destroyer: 1
};

function showApplyButton() {
    console.log("showApplyButton called");
    const carrierCount = parseInt(document.getElementById("carrierCount").value) || 0;
    const battleshipCount = parseInt(document.getElementById("battleshipCount").value) || 0;
    const cruiserCount = parseInt(document.getElementById("cruiserCount").value) || 0;
    const submarineCount = parseInt(document.getElementById("submarineCount").value) || 0;
    const destroyerCount = parseInt(document.getElementById("destroyerCount").value) || 0;

    const hasChanged = (
        carrierCount !== initialGameSettings.carrier ||
        battleshipCount !== initialGameSettings.battleship ||
        cruiserCount !== initialGameSettings.cruiser ||
        submarineCount !== initialGameSettings.submarine ||
        destroyerCount !== initialGameSettings.destroyer
    );

    console.log("Game settings changed:", hasChanged);
    document.getElementById("applyButton").style.display = hasChanged ? "inline-block" : "none";
}

function applyGameSettings() {
    console.log("applyGameSettings called");
    const carrierCount = parseInt(document.getElementById("carrierCount").value) || 0;
    const battleshipCount = parseInt(document.getElementById("battleshipCount").value) || 0;
    const cruiserCount = parseInt(document.getElementById("cruiserCount").value) || 0;
    const submarineCount = parseInt(document.getElementById("submarineCount").value) || 0;
    const destroyerCount = parseInt(document.getElementById("destroyerCount").value) || 0;

    const updatedSettings = {
        carrier: carrierCount,
        battleship: battleshipCount,
        cruiser: cruiserCount,
        submarine: submarineCount,
        destroyer: destroyerCount
    };

    console.log("Updated game settings:", updatedSettings);
    socket.emit('updateGameSettings', updatedSettings);

    initialGameSettings = { ...updatedSettings };
    document.getElementById("applyButton").style.display = "none";
    alert("Game settings applied successfully!");
}

socket.on('gameSettingsUpdated', (settings) => {
    console.log("gameSettingsUpdated received:", settings);
    initialGameSettings = settings;
    displayGameSettingsOnce();
});