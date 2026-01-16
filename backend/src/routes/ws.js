const rooms = new Map();

module.exports = async function wsRoutes(fastify, options) {
  fastify.get("/ws", { websocket: true }, (socket, req) => {
    handleConnection(fastify, socket, req);
  });
};

function handleConnection(fastify, socket, req) {
  let currentRoomId = null;

  socket.on("message", async (message) => {
    try {
      const parsed = JSON.parse(message);
      const { type, payload } = parsed;

      if (type === "JOIN") {
        currentRoomId = await handleJoin(fastify, socket, payload);
        return;
      }

      if (!currentRoomId) {
        socket.send(JSON.stringify({ error: "Not joined to a room" }));
        return;
      }

      const room = rooms.get(currentRoomId);
      if (room) {
        await handleMessage(fastify, room, type, payload);
      }
    } catch (err) {
      fastify.log.error(err);
      socket.send(JSON.stringify({ error: "Internal Error" }));
    }
  });

  socket.on("close", () => {
    if (currentRoomId && rooms.has(currentRoomId)) {
      const room = rooms.get(currentRoomId);
      if (room) {
        room.connections.delete(socket);
        if (room.connections.size === 0) {
          rooms.delete(currentRoomId);
        }
        fastify.log.info(`Client disconnected from room ${currentRoomId}`);
      }
    }
  });
}

async function handleJoin(fastify, socket, payload) {
  const { roomId } = payload;

  if (!roomId) {
    socket.send(JSON.stringify({ error: "Missing roomId" }));
    socket.close();
    return null;
  }

  try {
    // Validate room exists in DB
    const [rows] = await fastify.mysql.query(
      "SELECT id FROM rooms WHERE slug = ?",
      [roomId]
    );

    if (rows.length === 0) {
      fastify.log.warn(`Connection attempt to non-existent room: ${roomId}`);
      socket.send(JSON.stringify({ error: "Room not found" }));
      socket.close();
      return null;
    }

    const dbRoomId = rows[0].id;

    if (!rooms.has(roomId)) {
      // Fetch existing members
      const [members] = await fastify.mysql.query(
        "SELECT id, nickname, is_vacation, has_won FROM members WHERE room_id = ?",
        [dbRoomId]
      );

      const users = members.map((m) => ({
        id: m.id.toString(),
        name: m.nickname,
        isVacation: !!m.is_vacation,
        hasWon: !!m.has_won,
      }));
      rooms.set(roomId, { id: dbRoomId, users, connections: new Set() });
    }

    const room = rooms.get(roomId);
    room.connections.add(socket);

    fastify.log.info(`Client joined room ${roomId}`);

    // Send current state
    socket.send(
      JSON.stringify({
        type: "ROOM_STATE",
        payload: room.users,
      })
    );

    return roomId;
  } catch (err) {
    fastify.log.error("Database error checking room", err);
    socket.send(JSON.stringify({ error: "Database error" }));
    socket.close();
    return null;
  }
}

async function handleMessage(fastify, room, type, payload) {
  switch (type) {
    case "ADD_USER":
      try {
        const [result] = await fastify.mysql.query(
          "INSERT INTO members (room_id, nickname) VALUES (?, ?)",
          [room.id, payload.name]
        );
        const newUser = {
          id: result.insertId.toString(),
          name: payload.name,
          isVacation: false,
          hasWon: false,
        };
        room.users.push(newUser);
        // Broadcast the full updated list as requested
        broadcast(room, "ROOM_STATE", room.users);
      } catch (err) {
        fastify.log.error("Failed to add user to DB", err);
      }
      break;

    case "USER_VACATION":
      {
        const userIndex = room.users.findIndex((u) => u.id === payload.id);
        if (userIndex !== -1) {
          const isVacation = payload.isVacation;
          room.users[userIndex].isVacation = isVacation;

          try {
            await fastify.mysql.query(
              "UPDATE members SET is_vacation = ? WHERE id = ?",
              [isVacation, payload.id]
            );
          } catch (err) {
            fastify.log.error("Failed to update vacation status in DB", err);
          }

          broadcast(room, "USER_UPDATED", room.users[userIndex]);
        }
      }
      break;

    case "USER_WON":
      {
        const userIndex = room.users.findIndex((u) => u.id === payload.id);
        if (userIndex !== -1) {
          const hasWon = payload.hasWon;
          room.users[userIndex].hasWon = hasWon;

          try {
            await fastify.mysql.query(
              "UPDATE members SET has_won = ? WHERE id = ?",
              [hasWon, payload.id]
            );
          } catch (err) {
            fastify.log.error("Failed to update won status in DB", err);
          }

          broadcast(room, "USER_UPDATED", room.users[userIndex]);
        }
      }
      break;

    case "DELETE_USER":
      try {
        await fastify.mysql.query("DELETE FROM members WHERE id = ?", [
          payload.id,
        ]);
        room.users = room.users.filter((u) => u.id !== payload.id);
        broadcast(room, "ROOM_STATE", room.users);
      } catch (err) {
        fastify.log.error("Failed to delete user from DB", err);
      }
      break;

    case "DRAW":
      let eligibleUsers = room.users.filter((u) => !u.isVacation && !u.hasWon);
      const presentUsers = room.users.filter((u) => !u.isVacation);

      if (eligibleUsers.length === 0 && presentUsers.length > 0) {
        // Reset cycle
        try {
          await fastify.mysql.query(
            "UPDATE members SET has_won = 0 WHERE room_id = ?",
            [room.id]
          );
          room.users.forEach((u) => (u.hasWon = false));
          eligibleUsers = presentUsers;
          broadcast(room, "ROOM_STATE", room.users);
        } catch (err) {
          fastify.log.error("Failed to reset lottery cycle", err);
        }
      }

      if (eligibleUsers.length > 0) {
        broadcast(room, "LOTTERY_STARTED", {});
        setTimeout(async () => {
          const randomIndex = Math.floor(Math.random() * eligibleUsers.length);
          const winner = eligibleUsers[randomIndex];

          // Update winner in DB and local state
          try {
            await fastify.mysql.query(
              "UPDATE members SET has_won = 1 WHERE id = ?",
              [winner.id]
            );
            const userInRoom = room.users.find((u) => u.id === winner.id);
            if (userInRoom) {
              userInRoom.hasWon = true;
            }
          } catch (err) {
            fastify.log.error("Failed to mark winner in DB", err);
          }

          broadcast(room, "WINNER_SELECTED", winner);
          broadcast(room, "ROOM_STATE", room.users); // Update state for potential UI indicators
        }, 3000);
      }
      break;

    default:
      console.warn(`Unknown message type: ${type}`);
  }
}

function broadcast(room, type, payload) {
  const message = JSON.stringify({ type, payload });
  for (const socket of room.connections) {
    if (socket.readyState === 1) {
      // OPEN
      socket.send(message);
    }
  }
}
