const path = require("path");
const fastify = require("fastify")({ logger: false });
const WebSocket = require("ws");

const activeUsers = [];
let redLeader = null;
let blueLeader = null;
const wss = new WebSocket.Server({ noServer: true });

// Static files and templating
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

// Routes
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

  // Send the current user list to the newly connected client
  ws.send(JSON.stringify({ type: "updateUsers", activeUsers }));

  // Broadcast active users to all clients
  function broadcastActiveUsers() {
    console.log("Broadcasting active users:", activeUsers);
    const data = JSON.stringify({ type: "updateUsers", activeUsers });
    console.log("sending data to " + wss.clients.count + "clients");
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        console.log("Sending data to client:", data);
        client.send(data);
      }
    });
  }
  

  ws.on("message", (message) => {
    console.log("Received WebSocket message:", message);
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
          broadcastActiveUsers(); // Broadcast updated list
        } else {
          console.log("Nickname already exists:", nickname);
        }
      }

      if (data.type === "leave") {
        const { nickname } = data;
        console.log(`User leaving: ${nickname}`);
        const index = activeUsers.indexOf(nickname);
        if (index > -1) {
          activeUsers.splice(index, 1);
          broadcastActiveUsers();
        }
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
      broadcastActiveUsers();
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
