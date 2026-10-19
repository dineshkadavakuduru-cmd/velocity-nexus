import type { Server } from "socket.io";
import type { PlayerState, RaceSettings, Room } from "./types";
import { sanitizeRaceSettings } from "./validation";

export const GAME_TICK_RATE = 60;
export const COUNTDOWN_DURATION = 3;
export const RACE_TIMEOUT_MS = 300000;
export const RESULT_GRACE_MS = 30000;
/** How long a disconnected player's slot is held for a reconnect. */
export const DISCONNECT_GRACE_MS = Math.max(500, Number(process.env.DISCONNECT_GRACE_MS) || 30000);

export const rooms = new Map<string, Room>();
export const playerRooms = new Map<string, string>();

/**
 * Pending disconnect-grace timers, keyed by the socket id that disconnected.
 * Tracked so they can be cancelled when the player reconnects before the
 * window expires or when the room is torn down — never left dangling.
 */
export const graceTimers = new Map<string, NodeJS.Timeout>();

export const setGraceTimer = (socketId: string, timer: NodeJS.Timeout) => {
  const existing = graceTimers.get(socketId);
  if (existing) clearTimeout(existing);
  graceTimers.set(socketId, timer);
};

export const clearGraceTimer = (socketId: string): boolean => {
  const timer = graceTimers.get(socketId);
  if (!timer) return false;
  clearTimeout(timer);
  graceTimers.delete(socketId);
  return true;
};

/** Drop the bookkeeping once a grace timer has fired on its own. */
export const forgetGraceTimer = (socketId: string): void => {
  graceTimers.delete(socketId);
};

export const generateRoomCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const createRoom = (
  settings: RaceSettings,
  hostSocketId: string,
  hostName: string,
  hostClientId = "",
): Room => {
  let roomCode: string;
  do {
    roomCode = generateRoomCode();
  } while (rooms.has(roomCode));

  const room: Room = {
    roomCode,
    players: new Map(),
    settings: sanitizeRaceSettings(settings),
    status: "lobby",
    hostId: hostSocketId,
    createdAt: Date.now(),
    raceStartTime: 0,
    countdownInterval: null,
    tickInterval: null,
    finishTimeout: null,
    cleanupTimeout: null,
  };

  const host: PlayerState = {
    id: hostSocketId,
    clientId: hostClientId,
    name: hostName,
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
    isReady: true,
    isConnected: true,
    lastUpdateAt: Date.now(),
  };
  room.players.set(hostSocketId, host);
  rooms.set(roomCode, room);
  playerRooms.set(hostSocketId, roomCode);
  return room;
};

const clearTimers = (room: Room) => {
  if (room.countdownInterval) clearInterval(room.countdownInterval);
  if (room.tickInterval) clearInterval(room.tickInterval);
  if (room.finishTimeout) clearTimeout(room.finishTimeout);
  if (room.cleanupTimeout) clearTimeout(room.cleanupTimeout);
  room.countdownInterval = null;
  room.tickInterval = null;
  room.finishTimeout = null;
  room.cleanupTimeout = null;
};

/** Immediate destroy (empty room / shutdown). */
export const destroyRoom = (roomCode: string) => {
  const room = rooms.get(roomCode);
  if (!room) return;
  clearTimers(room);
  room.players.forEach((_, playerId) => {
    clearGraceTimer(playerId);
    if (playerRooms.get(playerId) === roomCode) playerRooms.delete(playerId);
  });
  rooms.delete(roomCode);
};

/**
 * Delayed destroy after race finish so clients can fetch results first.
 * Schedule with schedulePostRaceCleanup().
 */
export const schedulePostRaceCleanup = (io: Server, room: Room) => {
  if (room.cleanupTimeout) clearTimeout(room.cleanupTimeout);
  room.cleanupTimeout = setTimeout(() => {
    io.to(room.roomCode).emit("room_closed", { roomCode: room.roomCode });
    destroyRoom(room.roomCode);
  }, RESULT_GRACE_MS);
};

export const removePlayerFromRoom = (io: Server, roomCode: string, playerId: string) => {
  const room = rooms.get(roomCode);
  if (!room) return;
  clearGraceTimer(playerId);
  room.players.delete(playerId);
  if (playerRooms.get(playerId) === roomCode) playerRooms.delete(playerId);
  let hostChanged = false;
  if (room.hostId === playerId) {
    // Prefer a connected player as the new host; fall back to any remaining.
    const next =
      Array.from(room.players.entries()).find(([, p]) => p.isConnected)?.[0] ??
      (room.players.keys().next().value as string | undefined);
    if (next) {
      room.hostId = next;
      hostChanged = true;
    }
  }
  io.to(roomCode).emit("player_left", { playerId, hostId: room.hostId });
  if (room.players.size === 0) {
    destroyRoom(roomCode);
    return;
  }
  io.to(roomCode).emit("room_update", {
    players: Array.from(room.players.values()),
    settings: room.settings,
    roomCode: room.roomCode,
    hostId: room.hostId,
  });
  if (hostChanged) io.to(roomCode).emit("host_changed", { hostId: room.hostId });
};

export const broadcastGameState = (io: Server, room: Room) => {
  const players: Record<string, unknown> = {};
  room.players.forEach((player, id) => {
    players[id] = {
      position: player.position,
      rotation: player.rotation,
      velocity: player.velocity,
      steering: player.steering,
      throttle: player.throttle,
      brake: player.brake,
      nitro: player.nitro,
      currentLap: player.currentLap,
      checkpoint: player.checkpoint,
      finished: player.finished,
      finishTime: player.finishTime,
    };
  });
  io.to(room.roomCode).emit("game_state", {
    players,
    raceTime: (Date.now() - room.raceStartTime) / 1000,
    raceStatus: room.status,
  });
};

export const calculateRaceResults = (room: Room) => {
  const sorted = Array.from(room.players.values()).sort((a, b) => {
    if (a.finished && b.finished) return a.finishTime - b.finishTime;
    if (a.finished) return -1;
    if (b.finished) return 1;
    if (a.currentLap !== b.currentLap) return b.currentLap - a.currentLap;
    if (a.checkpoint !== b.checkpoint) return b.checkpoint - a.checkpoint;
    const distA = a.position.x ** 2 + a.position.z ** 2;
    const distB = b.position.x ** 2 + b.position.z ** 2;
    return distA - distB;
  });
  return sorted.map((player, idx) => ({
    id: player.id,
    name: player.name,
    finishTime: player.finished ? player.finishTime : 0,
    position: idx + 1,
  }));
};

export const startCountdown = (io: Server, room: Room) => {
  if (room.status !== "lobby") return;
  let count = COUNTDOWN_DURATION;
  room.status = "countdown";
  room.countdownInterval = setInterval(() => {
    io.to(room.roomCode).emit("countdown", { count });
    if (count <= 0 && room.countdownInterval) {
      clearInterval(room.countdownInterval);
      room.countdownInterval = null;
      room.status = "racing";
      room.raceStartTime = Date.now();
      io.to(room.roomCode).emit("race_start", { startTime: room.raceStartTime });
      room.tickInterval = setInterval(() => {
        if (room.status === "racing") {
          broadcastGameState(io, room);
        } else if (room.tickInterval) {
          clearInterval(room.tickInterval);
          room.tickInterval = null;
        }
      }, 1000 / GAME_TICK_RATE);
      room.finishTimeout = setTimeout(() => {
        if (room.status === "racing") {
          room.status = "finished";
          if (room.tickInterval) {
            clearInterval(room.tickInterval);
            room.tickInterval = null;
          }
          io.to(room.roomCode).emit("race_finish", { results: calculateRaceResults(room) });
          schedulePostRaceCleanup(io, room);
        }
      }, RACE_TIMEOUT_MS);
    }
    count--;
  }, 1000);
};
