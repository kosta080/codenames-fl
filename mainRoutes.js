const fastify = require("fastify")();
const path = require("path");
const seo = require("./src/seo.json");

if (seo.url === "glitch-default") {
  seo.url = `https://${process.env.PROJECT_DOMAIN}.glitch.me`;
}

fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "./public"),
  prefix: "/",
});

fastify.register(require("@fastify/formbody"));

fastify.register(require("@fastify/view"), {
  engine: { handlebars: require("handlebars") },
});

fastify.get("/", (request, reply) => reply.view("/src/pages/index.hbs", { seo }));

fastify.post("/join", (request, reply) => {
  const { nickname } = request.body;
  if (!nickname || nickname.trim() === "") {
    return reply.view("/src/pages/index.hbs", { error: "Nickname is required", seo });
  }
  reply.redirect(`/room?nickname=${encodeURIComponent(nickname)}`);
});

fastify.get("/room", (request, reply) => {
  const nickname = request.query.nickname;
  if (!nickname) return reply.redirect("/");
  reply.view("/src/pages/room.hbs", { nickname, seo });
});

module.exports = fastify;
