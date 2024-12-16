//server.js
const path = require("path");
const WebSocket = require("ws");
const mainRoutes = require("./mainRoutes");
const { Word, loadWords } = require("./Word");
const generateMap = require("./map");
const setupWebSocketHandlers = require("./handlers");
const { broadcastUpdate } = require("./helpers");

const wss = new WebSocket.Server({ noServer: true });
const wordFilePath = path.join(__dirname, "words.txt");

let activeUsers = [];
let redTeamUsers = [];
let blueTeamUsers = [];
let redLeader = { name: null };
let blueLeader = { name: null };
let turn = {blueTurn: false, redTurn: false};
let wordList = [];
let map = [];
let words = [];

function ResetGame(){
  map = generateMap();
  activeUsers = [];
  redTeamUsers = [];
  blueTeamUsers = [];
  redLeader = { name: null };
  blueLeader = { name: null };
  turn = {blueTurn: false, redTurn: false};
  wordList = loadWords(wordFilePath);
  map = generateMap();
  words = [];
  for (let i = 0; i <= 24; i++) {
    if (i >= wordList.length) 
      throw new Error("Not enough unique words in the list to fill the game.");
    words.push(new Word(i, wordList[i], map[i], []));
  }
  console.log("Game reset successfully.");
  
  // Broadcast updated state to all clients
  console.log("3---> "+ activeUsers);
  broadcastUpdate(wss, {type: "updateUsers", activeUsers, redLeader, blueLeader, redTeamUsers, blueTeamUsers, turn });
  broadcastUpdate(wss, { type: "updateWords", words });
}


setupWebSocketHandlers(wss, words, activeUsers, redTeamUsers, blueTeamUsers, redLeader, blueLeader, turn, ResetGame);

ResetGame();

mainRoutes.listen({ port: process.env.PORT || 3000, host: "0.0.0.0" }, (err, address) => {
  if (err) process.exit(1);
  console.log(`Server running at ${address}`);
  mainRoutes.server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });
});




const repl = require("repl");
function PrintUsers() {
  console.log(activeUsers);
  console.log(redTeamUsers);
  console.log(blueTeamUsers);
  console.log(redLeader);
  console.log(blueLeader);
}

const replServer = repl.start(">> ");
replServer.context.PrintUsers = PrintUsers;