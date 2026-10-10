import type { Server, Socket } from "socket.io";
import type { PlayerState } from "./types";
import {
  DISCONNECT_GRACE_MS,
  broadcastGameState,
  calculateRaceResults,
  createRoom,
  destroyRoom,
  playerRooms,
  removePlayerFromRoom,
  rooms,
  schedulePostRaceCleanup,
  startCountdown,
} from "./rooms";
import {
  clampPlayerUpdate,
  isPlausibleMovement,
  sanitizeChatMessage,
  sanitizeClientId,
  sanitizePlayerName,
  sanitizeRaceSettings,
  validateRoomCode,
} from "./validation";

/** Sliding-window per-socket rate limiter. */
const makeRateLimiter = (maxEvents: number, windowMs: number) => {
  const stamps = new Map<string, number[]>();
  return (socketId: string): boolean => {
    const now = Date.now();
    const arr = (stamps.get(socketId) ?? []).filter((t) => now - t < windowMs);
    if (arr.length >= maxEvents) {
      stamps.set(socketId, arr);
      return false;
    }
    arr.push(now);
    stamps.set(socketId, arr);
    return true;
  };
};

const allowPlayerUpdate = makeRateLimiter(90, 1000);
const allowChat = makeRateLimiter(2, 1000);

const log = (socketId: string, roomCode: string | undefined, msg: string) => {
  console.log(`[socket=${socketId}]${roomCode ? `[room=${roomCode}]` : ""} ${msg}`);
};

const emitRoomUpdate = (io: Server, roomCode: string) => {
  const room = rooms.get(roomCode);
  if (!room) return;
  io.to(roomCode).emit("room_update", {
    players: Array.from(room.players.values()),
    settings: room.settings,
    roomCode: room.roomCode,
  });
};

export const setupSocketServer = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    log(socket.id, undefined, "connected");

    socket.on("create_room", (data: { settings?: unknown; playerName?: unknown; clientId?: unknown }) => {
      const settings = sanitizeRaceSettings(data?.settings);
      const name = sanitizePlayerName(data?.playerName);
      const clientId = sanitizeClientId(data?.clientId);
      if (playerRooms.has(socket.id)) {
        socket.emit("error", "Already in a room");
        return;
      }
      const room = createRoom(settings, socket.id, name, clientId);
      socket.join(room.roomCode);
      log(socket.id, room.roomCode, `room created by "${name}"`);
      socket.emit("room_created", {
        roomCode: room.roomCode,
        players: Array.from(room.players.values()),
        settings: room.settings,
        isHost: true,
        playerId: socket.id,
      });
    });

    socket.on("join_room", (data: { roomCode?: unknown; playerName?: unknown; clientId?: unknown }) => {
      const code = validateRoomCode(data?.roomCode);
      if (!code) {
        socket.emit("error", "Invalid room code");
        return;
      }
      const room = rooms.get(code);
      if (!room) {
        socket.emit("error", "Room not found");
        return;
      }
      const clientId = sanitizeClientId(data?.clientId);

      // Reconnect: a socket presenting the same clientId reclaims the slot
      // held for it during the disconnect grace window instead of spawning a
      // duplicate ghost. Does not consume extra capacity and works even after
      // the race has started.
      if (clientId) {
        for (const [existingId, existing] of room.players) {
          if (existing.clientId !== clientId) continue;
          if (existing.isConnected && existingId !== socket.id) {
            socket.emit("error", "Already connected from another session");
            return;
          }
          room.players.delete(existingId);
          if (playerRooms.get(existingId) === code) playerRooms.delete(existingId);
          if (room.hostId === existingId) room.hostId = socket.id;
          existing.id = socket.id;
          existing.isConnected = true;
          existing.lastUpdateAt = Date.now();
          room.players.set(socket.id, existing);
          playerRooms.set(socket.id, code);
          socket.join(code);
          log(socket.id, code, `rejoined as "${existing.name}"`);
          socket.emit("joined_room", {
            success: true,
            roomCode: room.roomCode,
            players: Array.from(room.players.values()),
            settings: room.settings,
            isHost: room.hostId === socket.id,
            playerId: socket.id,
          });
          emitRoomUpdate(io, code);
          return;
        }
      }

      if (room.players.size >= room.settings.maxPlayers) {
        socket.emit("error", "Room is full");
        return;
      }
      if (room.status !== "lobby") {
        socket.emit("error", "Race already in progress");
        return;
      }
      const name = sanitizePlayerName(data?.playerName);
      socket.join(code);
      playerRooms.set(socket.id, code);
      const player: PlayerState = {
        id: socket.id,
        clientId,
        name,
        position: { x: 0, y: 1, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        velocity: { x: 0, y: 0, z: 0 },
        steering: 0,
        throttle: 0,
        brake: false,
        nitro: false,
        currentLap: 1,
        checkpoint: 0,
        finished: false,
        finishTime: 0,
        carId: room.settings.carId,
        isAI: false,
        isReady: false,
        isConnected: true,
        lastUpdateAt: Date.now(),
      };
      room.players.set(socket.id, player);
      log(socket.id, code, `joined as "${name}"`);
      emitRoomUpdate(io, code);
      socket.emit("joined_room", {
        success: true,
        roomCode: room.roomCode,
        players: Array.from(room.players.values()),
        settings: room.settings,
        isHost: false,
        playerId: socket.id,
      });
      socket.to(code).emit("player_joined", player);
    });

    socket.on("leave_room", () => {
      const roomCode = playerRooms.get(socket.id);
      if (!roomCode) return;
      socket.leave(roomCode);
      log(socket.id, roomCode, "left room");
      removePlayerFromRoom(io, roomCode, socket.id);
    });

    socket.on("ready_state", (data: { roomCode?: unknown; isReady?: unknown }) => {
      const roomCode = validateRoomCode(data?.roomCode) ?? playerRooms.get(socket.id);
      if (!roomCode) return;
      const room = rooms.get(roomCode);
      if (!room || room.status !== "lobby") return;
      const player = room.players.get(socket.id);
      if (!player) return;
      player.isReady = data?.isReady === true;
      room.players.set(socket.id, player);
      emitRoomUpdate(io, roomCode);
      const allReady =
        room.players.size >= 2 && Array.from(room.players.values()).every((p) => p.isReady);
      if (allReady) startCountdown(io, room);
    });

    socket.on("start_race", (data: { roomCode?: unknown }) => {
      const roomCode = validateRoomCode(data?.roomCode) ?? playerRooms.get(socket.id);
      if (!roomCode) return;
      const room = rooms.get(roomCode);
      if (!room || room.hostId !== socket.id) {
        socket.emit("error", "Only the host can start the race");
        return;
      }
      const allReady = Array.from(room.players.values()).every((p) => p.isReady);
      if (!allReady) {
        socket.emit("error", "Not all players are ready");
        return;
      }
      startCountdown(io, room);
    });

    socket.on("player_update", (data: Record<string, unknown>) => {
      if (!allowPlayerUpdate(socket.id)) return;
      const roomCode = validateRoomCode((data as { roomCode?: unknown })?.roomCode) ?? playerRooms.get(socket.id);
      if (!roomCode) return;
      const room = rooms.get(roomCode);
      if (!room || room.status !== "racing") return;
      const player = room.players.get(socket.id);
      if (!player) return;
      const update = clampPlayerUpdate(data);
      if (!update) return;
      if (!isPlausibleMovement(player.position, update.position, player.currentLap, update.currentLap)) {
        log(socket.id, roomCode, `rejected implausible update (lap ${player.currentLap}->${update.currentLap})`);
        // Resync cheater/desynced client with authoritative snapshot.
        socket.emit("game_state", {
          players: { [player.id]: { ...player } },
          raceTime: (Date.now() - room.raceStartTime) / 1000,
          raceStatus: room.status,
        });
        return;
      }
      Object.assign(player, update, { lastUpdateAt: Date.now() });
      if (update.currentLap >= room.settings.laps && !player.finished) {
        player.finished = true;
        player.finishTime = (Date.now() - room.raceStartTime) / 1000;
        const everyoneFinished = Array.from(room.players.values()).every((p) => p.finished);
        if (everyoneFinished) {
          room.status = "finished";
          if (room.tickInterval) {
            clearInterval(room.tickInterval);
            room.tickInterval = null;
          }
          io.to(roomCode).emit("race_finish", { results: calculateRaceResults(room) });
          schedulePostRaceCleanup(io, room);
        }
      }
      room.players.set(socket.id, player);
      void broadcastGameState;
    });

    socket.on("chat_message", (data: { roomCode?: unknown; message?: unknown }) => {
      if (!allowChat(socket.id)) {
        socket.emit("error", "Chat rate limit exceeded");
        return;
      }
      const roomCode = validateRoomCode(data?.roomCode) ?? playerRooms.get(socket.id);
      if (!roomCode) return;
      const room = rooms.get(roomCode);
      if (!room) return;
      const player = room.players.get(socket.id);
      if (!player) return;
      const message = sanitizeChatMessage(data?.message);
      if (!message) return;
      io.to(roomCode).emit("chat_message", {
        playerId: socket.id,
        playerName: player.name,
        message,
        timestamp: Date.now(),
      });
    });

    socket.on("disconnect", () => {
      log(socket.id, playerRooms.get(socket.id), "disconnected");
      const roomCode = playerRooms.get(socket.id);
      if (!roomCode) return;
      const room = rooms.get(roomCode);
      if (!room) {
        playerRooms.delete(socket.id);
        return;
      }
      const player = room.players.get(socket.id);
      if (player) {
        player.isConnected = false;
        room.players.set(socket.id, player);
        emitRoomUpdate(io, roomCode);
      }
      // Grace period: keep slot + mapping so a quick reconnect can rejoin.
      setTimeout(() => {
        const current = rooms.get(roomCode);
        if (!current) return;
        const p = current.players.get(socket.id);
        if (p && !p.isConnected) {
          log(socket.id, roomCode, "disconnect grace expired, removing");
          removePlayerFromRoom(io, roomCode, socket.id);
        }
      }, DISCONNECT_GRACE_MS);
    });
  });
};

export { destroyRoom };
