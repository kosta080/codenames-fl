const { broadcastUpdate, switchTeam, switchLeader } = require("./helpers");

function setupWebSocketHandlers(wss, words, activeUsers, redTeamUsers, blueTeamUsers, redLeader, blueLeader) {
  wss.on("connection", (ws) => {
    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message);
        const { type, nickname, buttonId } = data;

        if (type === "join") {
          if (!activeUsers.includes(nickname)) activeUsers.push(nickname);
          broadcastUpdate(wss, { type: "updateUsers", activeUsers, redLeader, blueLeader, redTeamUsers, blueTeamUsers });
          broadcastUpdate(wss, { type: "updateWords", words });
        } 
        else if (type === "leave") {
          const index = activeUsers.indexOf(nickname);
          if (index > -1) activeUsers.splice(index, 1);
          broadcastUpdate(wss, { type: "updateUsers", activeUsers, redLeader, blueLeader, redTeamUsers, blueTeamUsers });
        } 
        else if (type === "redLeader") {
          switchLeader(nickname, redTeamUsers, blueTeamUsers, redLeader, blueLeader);
          broadcastUpdate(wss, { type: "updateUsers", activeUsers, redLeader, blueLeader, redTeamUsers, blueTeamUsers });
        }
        else if (type === "blueLeader") {
          switchLeader(nickname, blueTeamUsers, redTeamUsers, blueLeader, redLeader);
          broadcastUpdate(wss, { type: "updateUsers", activeUsers, redLeader, blueLeader, redTeamUsers, blueTeamUsers });
        }
        else if (type === "redJoin"){
          switchTeam(nickname, redTeamUsers, blueTeamUsers, redLeader, blueLeader);
          broadcastUpdate(wss, { type: "updateUsers", activeUsers, redLeader, blueLeader, redTeamUsers, blueTeamUsers });
        }
        else if (type === "blueJoin") {
          switchTeam(nickname,blueTeamUsers, redTeamUsers, redLeader, blueLeader);
          broadcastUpdate(wss, { type: "updateUsers", activeUsers, redLeader, blueLeader, redTeamUsers, blueTeamUsers });
        } 
        else if (type === "buttonClick") {
          words.forEach((word, index) => {
            if (index !== buttonId && word.voters.includes(nickname)) {
              word.voters = word.voters.filter(voter => voter !== nickname);
            }
          });

          if (!words[buttonId].voters.includes(nickname)) {
            words[buttonId].voters.push(nickname);
          }

          broadcastUpdate(wss, { type: "updateWords", words });
        }
      } 
      catch (err) {
        console.error("Error parsing message", err);
      }
    });

    ws.on("close", () => {
      const index = activeUsers.indexOf(ws.nickname);
      if (index > -1) activeUsers.splice(index, 1);
      broadcastUpdate(wss, { type: "updateUsers", activeUsers, redLeader, blueLeader });
    });
  });
}

module.exports = setupWebSocketHandlers;
