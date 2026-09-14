import { PlayerState, RaceSettings, RaceStatus, Vector3, Quaternion } from "./game";

export type Room = {
  roomCode: string;
  players: Record<string, PlayerState>;
  settings: RaceSettings;
  status: RaceStatus;
  hostId: string;
  createdAt: number;
  raceStartTime: number;
};

export type PlayerUpdate = {
  position: Vector3;
  rotation: Quaternion;
  velocity: Vector3;
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

export type SocketServerEvents = {
  create_room: (data: { settings: RaceSettings }) => void;
  join_room: (data: { roomCode: string; playerName: string }) => void;
  leave_room: () => void;
  player_update: (data: PlayerUpdate & { roomCode: string }) => void;
  chat_message: (data: { roomCode: string; message: string }) => void;
  ready_state: (data: { roomCode: string; isReady: boolean }) => void;
  start_race: (data: { roomCode: string }) => void;
};

export type SocketClientEvents = {
  error: (message: string) => void;
  player_joined: (player: PlayerState) => void;
  player_left: (playerId: string) => void;
  room_update: (data: { players: PlayerState[]; settings: RaceSettings; roomCode: string; isHost: boolean }) => void;
  countdown: (data: { count: number }) => void;
  race_start: (data: { startTime: number }) => void;
  game_state: (data: GameState) => void;
  race_finish: (data: { results: Array<{ id: string; name: string; finishTime: number; position: number }> }) => void;
  chat_message: (data: { playerId: string; playerName: string; message: string; timestamp: number }) => void;
};

export type { PlayerState, RaceSettings, RaceStatus, Vector3, Quaternion };
