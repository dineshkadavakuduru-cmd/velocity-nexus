import type { PlayerUpdate, RaceSettings } from "./types";

export const MAX_PLAYER_NAME_LENGTH = 20;
export const MAX_CHAT_MESSAGE_LENGTH = 200;
export const MAX_POSITION_ABS = 10000;
export const MAX_VELOCITY_ABS = 500;
/** Max plausible movement between 60Hz updates (m). Anything larger = teleport/cheat. */
export const MAX_STEP_DISTANCE = 60;
/** Max lap jump allowed in a single update. */
export const MAX_LAP_STEP = 1;

const finite = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);

export const sanitizePlayerName = (raw: unknown): string => {
  if (typeof raw !== "string") return "Player";
  const cleaned = raw.replace(/<[^>]*>/g, "").replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, MAX_PLAYER_NAME_LENGTH);
  return cleaned.length > 0 ? cleaned : "Player";
};

export const validateRoomCode = (raw: unknown): string | null => {
  if (typeof raw !== "string") return null;
  const code = raw.trim().toUpperCase();
  return /^[A-Z2-9]{6}$/.test(code) ? code : null;
};

export const sanitizeChatMessage = (raw: unknown): string | null => {
  if (typeof raw !== "string") return null;
  const cleaned = raw.replace(/<[^>]*>/g, "").trim().slice(0, MAX_CHAT_MESSAGE_LENGTH);
  return cleaned.length > 0 ? cleaned : null;
};

const clampNum = (n: unknown, min: number, max: number, fallback: number): number => {
  if (!finite(n)) return fallback;
  return Math.min(max, Math.max(min, n as number));
};

const clampVec3 = (v: unknown, maxAbs: number): { x: number; y: number; z: number } | null => {
  if (typeof v !== "object" || v === null) return null;
  const { x, y, z } = v as Record<string, unknown>;
  if (!finite(x) || !finite(y) || !finite(z)) return null;
  return {
    x: clampNum(x, -maxAbs, maxAbs, 0),
    y: clampNum(y, -maxAbs, maxAbs, 0),
    z: clampNum(z, -maxAbs, maxAbs, 0),
  };
};

export const clampPlayerUpdate = (raw: unknown): PlayerUpdate | null => {
  if (typeof raw !== "object" || raw === null) return null;
  const d = raw as Record<string, unknown>;
  const position = clampVec3(d.position, MAX_POSITION_ABS);
  const velocity = clampVec3(d.velocity, MAX_VELOCITY_ABS);
  if (!position || !velocity) return null;
  const rotation = d.rotation as Record<string, unknown> | undefined;
  const rx = finite(rotation?.x) ? (rotation.x as number) : 0;
  const ry = finite(rotation?.y) ? (rotation.y as number) : 0;
  const rz = finite(rotation?.z) ? (rotation.z as number) : 0;
  const rw = finite(rotation?.w) ? (rotation.w as number) : 1;
  const mag = Math.hypot(rx, ry, rz, rw) || 1;
  return {
    position,
    rotation: { x: rx / mag, y: ry / mag, z: rz / mag, w: rw / mag },
    velocity,
    steering: clampNum(d.steering, -1, 1, 0),
    throttle: clampNum(d.throttle, -1, 1, 0),
    brake: d.brake === true,
    nitro: d.nitro === true,
    currentLap: Math.max(1, Math.min(20, Math.floor(Number(d.currentLap)) || 1)),
    checkpoint: Math.max(0, Math.min(100, Math.floor(Number(d.checkpoint)) || 0)),
  };
};

/** Reject impossible teleports / lap jumps. Returns true if update is plausible. */
export const isPlausibleMovement = (
  prev: { x: number; y: number; z: number },
  next: { x: number; y: number; z: number },
  prevLap: number,
  nextLap: number,
): boolean => {
  const dx = next.x - prev.x;
  const dy = next.y - prev.y;
  const dz = next.z - prev.z;
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (dist > MAX_STEP_DISTANCE && nextLap <= prevLap) return false;
  if (nextLap > prevLap + MAX_LAP_STEP) return false;
  if (nextLap < prevLap) return false;
  return true;
};

export const sanitizeRaceSettings = (raw: unknown): RaceSettings => {
  const d = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const str = (v: unknown, fallback: string): string =>
    typeof v === "string" && v.length > 0 ? v.slice(0, 64) : fallback;
  return {
    trackId: str(d.trackId, "neon-tokyo"),
    carId: str(d.carId, "phantom-gt"),
    laps: Math.max(1, Math.min(10, Math.floor(Number(d.laps)) || 3)),
    weather: str(d.weather, "clear"),
    timeOfDay: str(d.timeOfDay, "day"),
    aiCount: Math.max(0, Math.min(7, Math.floor(Number(d.aiCount)) || 0)),
    maxPlayers: Math.max(2, Math.min(8, Math.floor(Number(d.maxPlayers)) || 8)),
  };
};
