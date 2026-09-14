export type PlayerState = {
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

export type RaceSettings = {
  trackId: string;
  carId: string;
  laps: number;
  weather: string;
  timeOfDay: string;
  aiCount: number;
  maxPlayers: number;
};

export type RaceStatus = "lobby" | "countdown" | "racing" | "finished";

export type Room = {
  roomCode: string;
  players: Map<string, PlayerState>;
  settings: RaceSettings;
  status: RaceStatus;
  hostId: string;
  createdAt: number;
  raceStartTime: number;
};

export type PlayerUpdate = {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number; w: number };
  velocity: { x: number; y: number; z: number };
  steering: number;
  throttle: number;
  brake: boolean;
  nitro: boolean;
  currentLap: number;
  checkpoint: number;
};

export type GameState = {
  players: Record<string, Omit<PlayerState, "id" | "name">>;
  raceTime: number;
  raceStatus: RaceStatus;
  countdown: number;
};

export type SocketEvents = {
  create_room: (data: { settings: RaceSettings }) => void;
  join_room: (data: { roomCode: string; playerName: string }) => void;
  leave_room: () => void;
  ready_state: (data: { roomCode: string; isReady: boolean }) => void;
  start_race: (data: { roomCode: string }) => void;
  player_update: (data: PlayerUpdate & { roomCode: string }) => void;
  chat_message: (data: { roomCode: string; message: string }) => void;
  countdown: (data: { count: number }) => void;
  race_start: (data: { startTime: number }) => void;
  game_state: (data: GameState) => void;
  race_finish: (data: { results: Array<{ id: string; name: string; finishTime: number; position: number }> }) => void;
  room_created: (data: { roomCode: string; players: PlayerState[]; settings: RaceSettings; isHost: boolean }) => void;
  joined_room: (data: { success: boolean; roomCode: string; players: PlayerState[]; settings: RaceSettings; isHost: boolean; playerId: string }) => void;
  room_update: (data: { players: PlayerState[]; settings: RaceSettings; roomCode: string; isHost: boolean }) => void;
  player_joined: (player: PlayerState) => void;
  player_left: (playerId: string) => void;
};
