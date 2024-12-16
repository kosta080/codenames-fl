//handlers.js
const { broadcastUpdate, switchTeam, switchLeader, checkVotes, getUserTeam } = require("./helpers");

function setupWebSocketHandlers(wss, words, activeUsers, redTeamUsers, blueTeamUsers, redLeader, blueLeader, turn, ResetGame) {
  wss.on("connection", (ws) => {
    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message);
        const { type, nickname, buttonId } = data;

        if (type === "join") {
          if (!activeUsers.includes(nickname)) activeUsers.push(nickname);
          ws.nickname = nickname;
        } 
        else if (type === "leaveRoom") {
          const index = activeUsers.indexOf(nickname);
          if (index > -1) activeUsers.splice(index, 1);
        }
        else if (type === "leaveTeam") {
          console.log(nickname);
          let index = -1;
          index = redTeamUsers.indexOf(nickname);
          if (index > -1) redTeamUsers.splice(index, 1);
          index = blueTeamUsers.indexOf(nickname);  
          if (index > -1) blueTeamUsers.splice(index, 1);
        }
        else if (type === "restartGame") {
          ResetGame();
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
          broadcastUpdate(wss, { type: "updateWordsAnim", words });
        }
        else if (type === "redTurn") {
          turn.blueTurn = false;
          turn.redTurn = true;
        }
        else if (type === "blueTurn") {
          turn.blueTurn = true;
          turn.redTurn = false;
        }


        if (type != "heartbeat" && type != "restartGame") {
          console.log("1---> "+ activeUsers);
          broadcastUpdate(wss, { type: "updateUsers", activeUsers, redLeader, blueLeader, redTeamUsers, blueTeamUsers, turn });
          broadcastUpdate(wss, { type: "updateWords", words });
        }
        
      } 
      catch (err) {
        console.error("Error parsing message", err);
      }
    });

    ws.on("close", () => {
      if (!ws.nickname) {
        console.warn("Closing connection without a nickname set.");
        return;
      }
      console.log(ws.nickname + " Left");
      const index = activeUsers.indexOf(ws.nickname);
      if (index > -1) activeUsers.splice(index, 1);
      console.log("2---> "+ activeUsers);
      if (redLeader.name === ws.nickname)
        redLeader.name = null;
      if (blueLeader.name === ws.nickname)
        blueLeader.name = null;
      broadcastUpdate(wss, { type: "updateUsers", activeUsers, redLeader, blueLeader });
    });
  });
}

module.exports = setupWebSocketHandlers;
