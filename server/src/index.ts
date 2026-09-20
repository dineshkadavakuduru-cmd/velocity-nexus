import { Server, Socket } from "socket.io";
import { createServer } from "http";
// Types would be imported from shared types in production
type PlayerState = {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number; w: number };
  velocity: { x: number; y: number; z: number };
  steering: number;
  throttle: number;
  brake: boolean;
  nitro: boolean;
  currentLap: number;
  checkpoint: number;
  finished: boolean;
  finishTime: number;
  carId: string;
  isAI: boolean;
  isReady: boolean;
  isConnected: boolean;
};

type RaceSettings = {
  trackId: string;
  carId: string;
  laps: number;
  weather: string;
  timeOfDay: string;
  aiCount: number;
  maxPlayers: number;
};

type RaceStatus = "lobby" | "countdown" | "racing" | "finished";

type Room = {
  roomCode: string;
  players: Map<string, PlayerState>;
  settings: RaceSettings;
  status: RaceStatus;
  hostId: string;
  createdAt: number;
  raceStartTime: number;
  countdownInterval: NodeJS.Timeout | null;
};

const rooms = new Map<string, Room>();
const playerRooms = new Map<string, string>();
const GAME_TICK_RATE = 60;
const COUNTDOWN_DURATION = 3;

const generateRoomCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const createRoom = (io: Server, settings: RaceSettings, hostSocketId: string): Room => {
  let roomCode: string;
  do {
    roomCode = generateRoomCode();
  } while (rooms.has(roomCode));

  const room: Room = {
    roomCode,
    players: new Map(),
    settings: {
      ...settings,
      laps: Math.max(1, Math.min(10, settings.laps || 3)),
      maxPlayers: Math.max(2, Math.min(8, settings.maxPlayers || 8)),
    },
    status: "lobby",
    hostId: hostSocketId,
    createdAt: Date.now(),
    raceStartTime: 0,
    countdownInterval: null,
  };

  rooms.set(roomCode, room);
  return room;
};

const cleanupRoom = (io: Server, roomCode: string) => {
  const room = rooms.get(roomCode);
  if (room) {
    if (room.countdownInterval) {
      clearInterval(room.countdownInterval);
      room.countdownInterval = null;
    }
    room.players.forEach((_, playerId) => {
      playerRooms.delete(playerId);
    });
    rooms.delete(roomCode);
  }
};

const startCountdown = (io: Server, room: Room) => {
  let count = COUNTDOWN_DURATION;

  room.status = "countdown";
  room.countdownInterval = setInterval(() => {
    io.to(room.roomCode).emit("countdown", { count });

    if (count <= 0) {
      clearInterval(room.countdownInterval!);
      room.countdownInterval = null;
      room.status = "racing";
      room.raceStartTime = Date.now();
      io.to(room.roomCode).emit("race_start", { startTime: room.raceStartTime });

      const tickInterval = setInterval(() => {
        if (room.status === "racing") {
          broadcastGameState(io, room);
        } else if (room.status === "finished") {
          clearInterval(tickInterval);
        }
      }, 1000 / GAME_TICK_RATE);

      setTimeout(() => {
        if (room.status === "racing") {
          room.status = "finished";
          const results = calculateRaceResults(room);
          io.to(room.roomCode).emit("race_finish", { results });
          cleanupRoom(io, room.roomCode);
        }
      }, 300000);
    }

    count--;
  }, 1000);
};

const broadcastGameState = (io: Server, room: Room) => {
  const players: Record<string, any> = {};

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

const calculateRaceResults = (room: Room) => {
  const results: Array<{ id: string; name: string; finishTime: number; position: number }> = [];
  let position = 1;

  const sortedPlayers = Array.from(room.players.values()).sort((a, b) => {
    if (a.finished && b.finished) return a.finishTime - b.finishTime;
    if (a.finished) return -1;
    if (b.finished) return 1;

    if (a.currentLap !== b.currentLap) return b.currentLap - a.currentLap;
    if (a.checkpoint !== b.checkpoint) return b.checkpoint - a.checkpoint;

    const distA = a.position.x ** 2 + a.position.z ** 2;
    const distB = b.position.x ** 2 + b.position.z ** 2;
    return distB - distA;
  });

  sortedPlayers.forEach((player, idx) => {
    results.push({
      id: player.id,
      name: player.name,
      finishTime: player.finished ? player.finishTime : 0,
      position: idx + 1,
    });
    position++;
  });

  return results;
};

const setupSocketServer = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log("Player connected:", socket.id);

    socket.on("create_room", (data: { settings: RaceSettings }) => {
      const room = createRoom(io, data.settings, socket.id);
      socket.join(room.roomCode);
      playerRooms.set(socket.id, room.roomCode);

      const player: PlayerState = {
        id: socket.id,
        name: "Host",
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
        carId: data.settings.carId || "phantom-gt",
        isAI: false,
        isReady: true,
        isConnected: true,
      };

      room.players.set(socket.id, player);

      socket.emit("room_created", {
        roomCode: room.roomCode,
        players: Array.from(room.players.values()),
        settings: room.settings,
        isHost: true,
      });
    });

    socket.on("join_room", (data: { roomCode: string; playerName: string }) => {
      const room = rooms.get(data.roomCode);
      if (!room) {
        socket.emit("error", "Room not found");
        return;
      }

      if (room.players.size >= room.settings.maxPlayers) {
        socket.emit("error", "Room is full");
        return;
      }

      if (room.status !== "lobby") {
        socket.emit("error", "Race already in progress");
        return;
      }

      socket.join(data.roomCode);
      playerRooms.set(socket.id, data.roomCode);

      const player: PlayerState = {
        id: socket.id,
        name: data.playerName || "Player",
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
        carId: room.settings.carId || "phantom-gt",
        isAI: false,
        isReady: false,
        isConnected: true,
      };

      room.players.set(socket.id, player);

      io.to(data.roomCode).emit("room_update", {
        players: Array.from(room.players.values()),
        settings: room.settings,
        roomCode: room.roomCode,
        isHost: room.hostId === socket.id,
      });

      socket.emit("joined_room", {
        success: true,
        roomCode: room.roomCode,
        players: Array.from(room.players.values()),
        settings: room.settings,
        isHost: false,
        playerId: socket.id,
      });

      socket.to(data.roomCode).emit("player_joined", player);
    });

    socket.on("ready_state", (data: { roomCode: string; isReady: boolean }) => {
      const roomCode = playerRooms.get(socket.id) || data.roomCode;
      const room = rooms.get(roomCode);
      if (!room) return;

      const player = room.players.get(socket.id);
      if (player) {
        player.isReady = data.isReady;
        room.players.set(socket.id, player);
      }

      io.to(roomCode).emit("room_update", {
        players: Array.from(room.players.values()),
        settings: room.settings,
        roomCode: room.roomCode,
        isHost: room.hostId === socket.id,
      });

      const allReady =
        room.players.size >= 2 &&
        Array.from(room.players.values()).every((p) => p.isReady);

      if (allReady && room.status === "lobby") {
        startCountdown(io, room);
      }
    });

    socket.on("start_race", (data: { roomCode: string }) => {
      const room = rooms.get(data.roomCode);
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

    socket.on("player_update", (data: {
      roomCode: string;
      position: { x: number; y: number; z: number };
      rotation: { x: number; y: number; z: number; w: number };
      velocity: { x: number; y: number; z: number };
      steering: number;
      throttle: number;
      brake: boolean;
      nitro: boolean;
      currentLap: number;
      checkpoint: number;
    }) => {
      const roomCode = playerRooms.get(socket.id) || data.roomCode;
      const room = rooms.get(roomCode);
      if (!room || room.status !== "racing") return;

      const player = room.players.get(socket.id);
      if (!player) return;

      player.position = data.position;
      player.rotation = data.rotation;
      player.velocity = data.velocity;
      player.steering = data.steering;
      player.throttle = data.throttle;
      player.brake = data.brake;
      player.nitro = data.nitro;
      player.currentLap = data.currentLap;
      player.checkpoint = data.checkpoint;

      room.players.set(socket.id, player);
    });

    socket.on("chat_message", (data: { roomCode: string; message: string }) => {
      const roomCode = playerRooms.get(socket.id) || data.roomCode;
      const room = rooms.get(roomCode);
      if (!room) return;

      const player = room.players.get(socket.id);
      if (!player) return;

      io.to(roomCode).emit("chat_message", {
        playerId: socket.id,
        playerName: player.name,
        message: data.message,
        timestamp: Date.now(),
      });
    });

    socket.on("disconnect", () => {
      console.log("Player disconnected:", socket.id);

      const roomCode = playerRooms.get(socket.id);
      if (roomCode) {
        const room = rooms.get(roomCode);
        if (room) {
          const player = room.players.get(socket.id);
          if (player) {
            player.isConnected = false;
            room.players.set(socket.id, player);

            setTimeout(() => {
              const currentRoom = rooms.get(roomCode);
              if (currentRoom) {
                currentRoom.players.delete(socket.id);
                io.to(roomCode).emit("player_left", socket.id);

                if (currentRoom.players.size === 0) {
                  cleanupRoom(io, roomCode);
                }
              }
            }, 30000);
          }
        }
      }

      playerRooms.delete(socket.id);
    });
  });
};

export { setupSocketServer, generateRoomCode, cleanupRoom };

const PORT = process.env.PORT || 3001;

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

setupSocketServer(io);

httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
