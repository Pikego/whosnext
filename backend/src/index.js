"use strict";

module.exports = async (fastify, opts) => {
  // Plugins
  fastify.register(require("@fastify/mysql"), {
    promise: true,
    connectionString: process.env.DATABASE_URL || "mysql://db:db@db/db",
  });
  fastify.register(require("@fastify/websocket"));
  fastify.register(require("@fastify/cors"));
  // Routes
  fastify.register(require("./routes/rooms"), { prefix: "/api/rooms" });
  fastify.register(require("./routes/ws"));
};
