const path = require("path");
const fastify = require("fastify")({ logger: false });
const WebSocket = require("ws");

const activeUsers = [];
const redTeamUsers = [];
const blueTeamUsers = [];
let redLeader = null;
let blueLeader = null;
const wss = new WebSocket.Server({ noServer: true });


class Word {
  constructor(index, spell, voters) {
    this.index = index;
    this.spell = spell;
    this.voters = voters;
  }
}
let words = [];
for (let i = 0; i < 10; i++) {
  const randomWord = Math.random().toString(36).substring(2, 7);
  words.push(new Word(i, randomWord, []));
}

fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "public"),
  prefix: "/",
});

fastify.register(require("@fastify/formbody"));

fastify.register(require("@fastify/view"), {
  engine: { handlebars: require("handlebars") },
});

const seo = require("./src/seo.json");

if (seo.url === "glitch-default") {
  seo.url = `https://${process.env.PROJECT_DOMAIN}.glitch.me`;
}

fastify.get("/", (request, reply) => {
  console.log("GET / - Serving index page");
  return reply.view("/src/pages/index.hbs", { seo });
});

fastify.post("/join", (request, reply) => {
  const { nickname } = request.body;
  console.log(`POST /join - Nickname: ${nickname}`);
  if (!nickname || nickname.trim() === "") {
    console.error("Nickname is required");
    return reply.view("/src/pages/index.hbs", { error: "Nickname is required", seo });
  }

  // Redirect to the room page
  reply.redirect(`/room?nickname=${encodeURIComponent(nickname)}`);
});

fastify.get("/room", (request, reply) => {
  const nickname = request.query.nickname;
  console.log(`GET /room - Nickname: ${nickname}`);
  if (!nickname) {
    console.error("No nickname provided, redirecting to /");
    return reply.redirect("/");
  }
  reply.view("/src/pages/room.hbs", { nickname, seo });
});

// WebSocket handling
wss.on("connection", (ws) => {
  console.log("New WebSocket connection established. Total clients:", wss.clients.size);

  // Send the current user list and leader info to the newly connected client
  ws.send(JSON.stringify({ type: "updateUsers", activeUsers, redLeader, blueLeader }));

  // Broadcast active users and leader information to all clients
  function broadcastUpdate() {
    console.log("Broadcasting update. Active Users:", activeUsers);
    const data = JSON.stringify({
      type: "updateUsers",
      activeUsers: activeUsers || [],
      redLeader: redLeader || null,
      blueLeader: blueLeader || null,
      redTeamUsers: redTeamUsers || [],
      blueTeamUsers: blueTeamUsers || [], // Always send these arrays
    });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        console.log("Sending data to client:", data);
        client.send(data);
      }
    });
  }
  
  


  ws.on("message", (message) => {
    //console.log("Received WebSocket message:", message);
    try {
      const data = JSON.parse(message);

      if (data.type === "join") {
        const { nickname } = data;
        console.log(`User joined: ${nickname}`);
        console.log("Current active users before adding:", activeUsers);

        const normalizedNickname = nickname.trim().toLowerCase();
        if (!activeUsers.some((user) => user.toLowerCase() === normalizedNickname)) {
          console.log("---> Adding nickname:", nickname);
          activeUsers.push(nickname);
          ws.nickname = nickname; // Associate nickname with the WebSocket instance
          console.log("Active users after join:", activeUsers);
          broadcastUpdate(); // Broadcast updated list and leader info
        } else {
          console.log("Nickname already exists:", nickname);
        }
      }
      
      if (data.type === "heartbeat") {
        //console.log(`Heartbeat received from: ${ws.nickname || "unknown"}`);
        //ws.send(JSON.stringify({ type: "heartbeat_ack" }));
      }

      if (data.type === "leave") {
        const { nickname } = data;
        console.log(`User leaving: ${nickname}`);
        const index = activeUsers.indexOf(nickname);
        if (index > -1) {
          activeUsers.splice(index, 1);
          // Reset leadership if the leader leaves
          //if (redLeader === nickname) redLeader = null;
          //if (blueLeader === nickname) blueLeader = null;
          broadcastUpdate();
        }
      }

      if (data.type === "redLeader") {
        const { nickname } = data;
        console.log(`${nickname} wants to become Red Leader.`);
        redLeader = nickname; // Assign Red Leader
        switchTeam(nickname, redTeamUsers, blueTeamUsers, "red", "blue");
        broadcastUpdate();
      }
      if (data.type === "blueLeader") {
        const { nickname } = data;
        console.log(`${nickname} wants to become Blue Leader.`);
        blueLeader = nickname; // Assign Blue Leader
        switchTeam(nickname, blueTeamUsers, redTeamUsers, "blue", "red");
        broadcastUpdate();
      }
      
      if (data.type === "redJoin") {
        const { nickname } = data;
        console.log(`${nickname} wants to join red.`);
        switchTeam(nickname, redTeamUsers, blueTeamUsers, "red", "blue");
        broadcastUpdate();
      }

      if (data.type === "blueJoin") {
        const { nickname } = data;
        console.log(`${nickname} wants to join blue.`);
        switchTeam(nickname, blueTeamUsers, redTeamUsers, "blue", "red");
        broadcastUpdate();
      }
      
      if (data.type === "buttonClick") {
        const { buttonId, nickname } = data;
        console.log(`Button ${buttonId} clicked by ${nickname}`);

        // Example: Broadcast the button click event to all clients
        const broadcastData = JSON.stringify({type: "buttonClick", buttonId, nickname});
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(broadcastData);
          }
        });
      }
      
      
    } catch (err) {
      console.error("Invalid WebSocket message:", err.message);
    }
    
    
  });
  
  

  ws.on("close", () => {
    console.log("WebSocket connection closed");
    const index = activeUsers.indexOf(ws.nickname);
    if (index > -1) {
      console.log(`Removing user: ${ws.nickname}`);
      activeUsers.splice(index, 1);
      // Reset leadership if the leader leaves
      // if (redLeader === ws.nickname) redLeader = null;
      // if (blueLeader === ws.nickname) blueLeader = null;
      broadcastUpdate();
    }
  });
});

// Attach WebSocket server
fastify.listen(
  { port: process.env.PORT, host: "0.0.0.0" },
  function (err, address) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Your app is listening on ${address}`);
    fastify.server.on("upgrade", (request, socket, head) => {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    });
  }
);



function switchTeam(nickname, targetTeam, opposingTeam, targetTeamName, opposingTeamName) {
  // Remove from opposing team if present
  const opposingIndex = opposingTeam.indexOf(nickname);
  if (opposingIndex > -1) {
    opposingTeam.splice(opposingIndex, 1);
    console.log(`${nickname} removed from ${opposingTeamName} team.`);
  }

  // Add to target team if not already present
  if (!targetTeam.includes(nickname)) {
    targetTeam.push(nickname);
    console.log(`${nickname} added to ${targetTeamName} team.`);
  }
}
