const WebSocket = require("ws");

function broadcastUpdate(wss, data) {
  const payload = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

function switchTeam(nickname, targetTeam, opposingTeam) {
  console.log(`Switch team ${nickname}`);
  const opposingIndex = opposingTeam.indexOf(nickname);
  if (opposingIndex > -1) opposingTeam.splice(opposingIndex, 1);
  if (!targetTeam.includes(nickname)) targetTeam.push(nickname);
}

function switchLeader(nickname, targetTeam, opposingTeam) {
  const opposingIndex = opposingTeam.indexOf(nickname);
  if (opposingIndex > -1) opposingTeam.splice(opposingIndex, 1); // Remove leader from opposing team
  if (!targetTeam.includes(nickname)) targetTeam.push(nickname); // Ensure leader is in the target team
}

module.exports = { broadcastUpdate, switchTeam, switchLeader };
