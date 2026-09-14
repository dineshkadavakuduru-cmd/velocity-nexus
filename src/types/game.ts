export type VehicleConfig = {
  id: string;
  name: string;
  model: string;
  description: string;
  color: string;
  topSpeed: number;
  acceleration: number;
  handling: number;
  braking: number;
  nitro: number;
  grip: number;
  mass: number;
  enginePower: number;
  gears: number[];
  idleRpm: number;
  maxRpm: number;
  gearRatios: number[];
  finalDrive: number;
  tireGrip: number;
  aerodynamics: number;
  driftModifier: number;
};

export type TrackConfig = {
  id: string;
  name: string;
  model: string;
  environment: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Expert";
  laps: number;
  length: number;
  weather: "clear" | "rain" | "fog" | "storm";
  timeOfDay: "day" | "night" | "sunset" | "dawn";
  thumbnail: string;
  description: string;
  checkpoints: Vector3[];
  startPositions: Vector3[];
};

export type Vector3 = {
  x: number;
  y: number;
  z: number;
};

export type Quaternion = {
  x: number;
  y: number;
  z: number;
  w: number;
};

export type PlayerState = {
  id: string;
  name: string;
  position: Vector3;
  rotation: Quaternion;
  velocity: Vector3;
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
  color?: string;
  isHost?: boolean;
  isGhost?: boolean;
};

export type RaceStatus = "lobby" | "countdown" | "racing" | "finished";

export type RaceSettings = {
  trackId: string;
  carId: string;
  laps: number;
  weather: "clear" | "rain" | "fog" | "storm";
  timeOfDay: "day" | "night" | "sunset" | "dawn";
  aiCount: number;
  maxPlayers: number;
};

export type SocketEvents = {
  // Room events
  create_room: (data: { settings: RaceSettings }) => void;
  join_room: (data: { roomCode: string; playerName: string }) => { success: boolean; roomCode: string; players: PlayerState[]; settings: RaceSettings; isHost: boolean };
  leave_room: () => void;
  room_update: (data: { players: PlayerState[]; settings: RaceSettings; roomCode: string }) => void;
  // Game events
  player_update: (data: { position: Vector3; rotation: Quaternion; velocity: Vector3; steering: number; throttle: number; brake: boolean; nitro: boolean; currentLap: number; checkpoint: number }) => void;
  game_state: (data: { players: Record<string, Omit<PlayerState, "id" | "name">>; raceTime: number; raceStatus: RaceStatus }) => void;
  countdown: (data: { count: number }) => void;
  race_start: (data: { startTime: number }) => void;
  race_finish: (data: { results: Array<{ id: string; name: string; finishTime: number; position: number }> }) => void;
  // Chat
  chat_message: (data: { playerId: string; message: string; timestamp: number }) => void;
  ready_state: (data: { playerId: string; isReady: boolean }) => void;
  start_race: () => void;
};

export type QualityPreset = "Ultra" | "High" | "Medium" | "Low";

export type Controls = {
  forward: string;
  backward: string;
  left: string;
  right: string;
  handbrake: string;
  nitro: string;
  camera: string;
  pause: string;
};

export type DamageZone = "front" | "rear" | "left" | "right";

export type DamageState = Record<DamageZone, number>;
