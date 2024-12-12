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

function checkVotes(words, teamUsers) {
  const voteCounts = {};

  words.forEach((word, wordIndex) => {
    word.voters.forEach((voter) => {
      if (teamUsers.includes(voter)) {
        if (!voteCounts[wordIndex]) {
          voteCounts[wordIndex] = new Set();
        }
        voteCounts[wordIndex].add(voter);
      }
    });
  });

  for (const [wordIndex, voters] of Object.entries(voteCounts)) {
    if (voters.size === teamUsers.length) {
      console.log(`An agreement has been reached on word ${wordIndex}`);
      return;
    }
  }

  console.log("No agreement reached yet.");
}

function getUserTeam(nickname, redTeamUsers, blueTeamUsers) {
  let team = null;

  redTeamUsers.forEach((user) => {
    if (user === nickname) team = "RedTeam";
  });

  if (!team) {
    blueTeamUsers.forEach((user) => {
      if (user === nickname) team = "BlueTeam";
    });
  }

  return team;
}

module.exports = { broadcastUpdate, switchTeam, switchLeader, checkVotes, getUserTeam };
