const { broadcastUpdate, switchTeam, switchLeader, checkVotes, getUserTeam } = require("./helpers");

function setupWebSocketHandlers(wss, words, activeUsers, redTeamUsers, blueTeamUsers, redLeader, blueLeader, turn) {
  wss.on("connection", (ws) => {
    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message);
        const { type, nickname, buttonId } = data;

        if (type === "join") {
          if (!activeUsers.includes(nickname)) activeUsers.push(nickname);
        } 
        else if (type === "leave") {
          const index = activeUsers.indexOf(nickname);
          if (index > -1) activeUsers.splice(index, 1);
        } 
        else if (type === "redLeader") {
          switchLeader(nickname, redTeamUsers, blueTeamUsers, redLeader, blueLeader);
        }
        else if (type === "blueLeader") {
          switchLeader(nickname, blueTeamUsers, redTeamUsers, blueLeader, redLeader);
        }
        else if (type === "redJoin"){
          switchTeam(nickname, redTeamUsers, blueTeamUsers, redLeader, blueLeader);
        }
        else if (type === "blueJoin") {
          switchTeam(nickname, blueTeamUsers, redTeamUsers, redLeader, blueLeader);
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

          let userTeam = getUserTeam(nickname, redTeamUsers, blueTeamUsers);
          if (userTeam ==="RedTeam") {
            checkVotes(words, redTeamUsers);
          } else {
            checkVotes(words, blueTeamUsers);
          }
        }
        else if (type === "redTurn") {
          turn.blueTurn = false;
          turn.redTurn = true;
        }
        else if (type === "blueTurn") {
          turn.blueTurn = true;
          turn.redTurn = false;
        }


        if (type != "heartbeat") {
          broadcastUpdate(wss, { type: "updateUsers", activeUsers, redLeader, blueLeader, redTeamUsers, blueTeamUsers, turn });
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
