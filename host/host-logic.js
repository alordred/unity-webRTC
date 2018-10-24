"use strict";
var display = new SumoDisplay();
var roomSet = false;
var loadComplete = false;
var gameState = new GameState();
var roomKey = "(not-set)";

window.addEventListener("loadComplete", function (e) {
    loadComplete = true;
    if (roomSet) {
        gameInstance.SendMessage('UIManager', 'SetRoomCode', this.roomKey);
    }
}, false);

window.onbeforeunload = () => display.close();

display.onPlayerCreated = playerId => {
    // Add players to gameState, and track result
    // Used to determine if we can disconnect from the game
    let addPlayerResult = this.gameState.addPlayer(playerId);

    display.send({
            type: "playerAdded",
            payload: addPlayerResult
        }
        , playerId);

};

display.onPlayerConnected = playerId => {
    // sample: sending private message to peer
    display.send(`HOST says: Hello from host to ${playerId}!`, playerId)

    // sample: Broadcast info to all clients about a new player has joined the game
    display.broadcast(`HOST says: ${playerId} has joined the room.`)
};

display.onPlayerDisconnected = playerId => {
    this.gameState.dropPlayer(playerId);

    // sample: Broadcast info to all clients about a new player has joined the game
    display.broadcast(`HOST says: ${playerId} has left the room.`)
};

display.onPlayerData = data => {
    // remember to parse the json string to js object
    const playerData = JSON.parse(data);

    this.gameState.handleData(playerData);
};

display.onRoomCreatedSuccess = roomKey => {
    this.roomKey = roomKey;
    roomSet = true;

    if (loadComplete) {
        gameInstance.SendMessage('UIManager', 'SetRoomCode', this.roomKey);
    }
};

display.onRoomCreatedFail = roomKey => {
    // retry
    display.start(generateRoomId());
};

display.start(generateRoomId());


function generateRoomId() {
    // Temp fix method to auto-generate roomIDs, until we implement a firebase function
    // Or game sessions manager server
    // Use by generating and checking if doc already exists, and regenerate if it does
    // Collision space is 35^roomIdLength
    var roomId = "";
    var charSet = "abcdefghijklmnopqrstuvwxyz0123456789";
    var charSetLength = charSet.length;
    var roomIdLength = 5;

    for (var i = 0; i < roomIdLength; i++) {
        roomId += charSet.charAt(Math.floor(Math.random() * charSetLength));
    }
    return roomId;
}

// Handlers for message passing from unity->display
// We do this here since this is the only component with reference to (gameInstance, display, gameState)
//  [otherwise it might be better to have the listeners in gameState]
window.addEventListener('success', function(e){console.log("windowSuccess", e)}, false);
window.addEventListener('failure', function(e){console.log("windowFailure", e)}, false);

window.addEventListener('restartRoom', function(e){
    roomSet = false;
    display.restart(generateRoomId());
    gameState.restart();
    }, false
);

window.addEventListener('gameStart', function(e){
    gameState.blockAddPlayers();
    }, false
);

window.addEventListener('gameStop', function(e){
    gameState.unblockAddPlayers();
    }, false
);

window.addEventListener('gameChanged', function(e){
    // gameChangeDetails format
    /*
        {
			game: "Flappy Sumo / Sumo Ring",
			mode: "shake / tilt",
		}
    */
    let gameChangeDetails = e.detail;
    display.broadcast({
        type: "gameChanged",
        payload: gameChangeDetails
    })
    }, false
);














