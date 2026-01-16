module.exports = async function roomRoutes(fastify, options) {
  const { nanoid } = await import("nanoid");

  fastify.post("/", async (request, reply) => {
    const roomId = nanoid();
    const connection = await fastify.mysql.getConnection();
    try {
      await connection.query("INSERT INTO rooms (slug) VALUES (?)", [roomId]);
      fastify.log.info(`Created room: ${roomId}`);
      return { roomId, message: "Room created successfully" };
    } finally {
      connection.release();
    }
  });
};
