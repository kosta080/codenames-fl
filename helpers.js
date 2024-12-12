const WebSocket = require("ws");

function broadcastUpdate(wss, data) {
  const payload = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

function switchTeam(nickname, targetTeam, opposingTeam, redLeader, blueLeader) {
  console.log(`Switch team ${nickname}`);
  console.log(opposingTeam);
  console.log(targetTeam);

  if (redLeader.name == nickname) {
    redLeader.name = null;
  }
  if (blueLeader.name == nickname) {
    blueLeader.name = null;
  }

  const opposingIndex = opposingTeam.indexOf(nickname);
  if (opposingIndex > -1) opposingTeam.splice(opposingIndex, 1);
  if (!targetTeam.includes(nickname)) targetTeam.push(nickname);
}

function switchLeader(nickname, targetTeam, opposingTeam, leaderObjectTo, leaderObjectFrom) {
  leaderObjectTo.name = nickname;
  leaderObjectFrom.name = null;
  const opposingIndex = opposingTeam.indexOf(nickname);
  if (opposingIndex > -1) opposingTeam.splice(opposingIndex, 1); 
  if (!targetTeam.includes(nickname)) targetTeam.push(nickname);
}

module.exports = { broadcastUpdate, switchTeam, switchLeader };
