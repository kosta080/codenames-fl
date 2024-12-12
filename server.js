const path = require("path");
const WebSocket = require("ws");
const mainRoutes = require("./mainRoutes");
const { Word, loadWords } = require("./Word");
const generateMap = require("./map");
const setupWebSocketHandlers = require("./handlers");

const wss = new WebSocket.Server({ noServer: true });
const activeUsers = [];
const redTeamUsers = [];
const blueTeamUsers = [];
let redLeader = {name: null};
let blueLeader = {name: null};

const wordFilePath = path.join(__dirname, "words.txt");
const wordList = loadWords(wordFilePath);
const map = generateMap();

let words = [];
for (let i = 0; i <= 24; i++) {
  if (i >= wordList.length) {
    throw new Error("Not enough unique words in the list to fill the game.");
  }
  words.push(new Word(i, wordList[i], map[i], []));
  
}

setupWebSocketHandlers(wss, words, activeUsers, redTeamUsers, blueTeamUsers, redLeader, blueLeader);

mainRoutes.listen({ port: process.env.PORT || 3000, host: "0.0.0.0" }, (err, address) => {
  if (err) process.exit(1);
  console.log(`Server running at ${address}`);
  mainRoutes.server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });
});
