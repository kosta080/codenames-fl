const path = require("path");
const WebSocket = require("ws");
const mainRoutes = require("./mainRoutes");
const Word = require("./Word");
const setupWebSocketHandlers = require("./handlers");

const wss = new WebSocket.Server({ noServer: true });
const activeUsers = [];
const redTeamUsers = [];
const blueTeamUsers = [];
let redLeader = null;
let blueLeader = null;

let words = [];
for (let i = 0; i < 10; i++) {
  const randomWord = Math.random().toString(36).substring(2, 7);
  words.push(new Word(i, randomWord, []));
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
