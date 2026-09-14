import { Vector3, Quaternion, PlayerState } from "@/types";

export const lerp = (a: number, b: number, t: number): number => {
  return a + (b - a) * Math.min(1, Math.max(0, t));
};

export const lerpVector3 = (a: Vector3, b: Vector3, t: number): Vector3 => {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    z: lerp(a.z, b.z, t),
  };
};

export const lerpQuaternion = (a: Quaternion, b: Quaternion, t: number): Quaternion => {
  const result = {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    z: lerp(a.z, b.z, t),
    w: lerp(a.w, b.w, t),
  };
  const len = Math.sqrt(result.x ** 2 + result.y ** 2 + result.z ** 2 + result.w ** 2);
  if (len > 0) {
    result.x /= len;
    result.y /= len;
    result.z /= len;
    result.w /= len;
  }
  return result;
};

export const slerpQuaternion = (a: Quaternion, b: Quaternion, t: number): Quaternion => {
  let dot = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;

  if (dot < 0) {
    b = { x: -b.x, y: -b.y, z: -b.z, w: -b.w };
    dot = -dot;
  }

  if (dot > 0.9995) {
    return {
      x: lerp(a.x, b.x, t),
      y: lerp(a.y, b.y, t),
      z: lerp(a.z, b.z, t),
      w: lerp(a.w, b.w, t),
    };
  }

  const theta = Math.acos(Math.min(1, Math.max(-1, dot)));
  const sinTheta = Math.sin(theta);
  const ratioA = Math.sin((1 - t) * theta) / sinTheta;
  const ratioB = Math.sin(t * theta) / sinTheta;

  return {
    x: a.x * ratioA + b.x * ratioB,
    y: a.y * ratioA + b.y * ratioB,
    z: a.z * ratioA + b.z * ratioB,
    w: a.w * ratioA + b.w * ratioB,
  };
};

interface InterpolationState {
  previous: PlayerState | null;
  current: PlayerState | null;
  interpolationFactor: number;
  lastUpdateTime: number;
}

interface InterpolationBuffer {
  [playerId: string]: InterpolationState;
}

const interpolationBuffer: InterpolationBuffer = {};
const BUFFER_MS = 100;

export const setPlayerStateSnapshot = (playerId: string, state: PlayerState): void => {
  const now = Date.now();
  const existing = interpolationBuffer[playerId];

  if (existing) {
    existing.previous = existing.current;
    existing.current = state;
    existing.lastUpdateTime = now;
  } else {
    interpolationBuffer[playerId] = {
      previous: state,
      current: state,
      interpolationFactor: 1,
      lastUpdateTime: now,
    };
  }
};

export const getInterpolatedPlayerState = (playerId: string, now: number = Date.now()): Vector3 => {
  const entry = interpolationBuffer[playerId];
  if (!entry || !entry.previous || !entry.current) {
    return { x: 0, y: 0, z: 0 };
  }

  const timeDiff = now - entry.lastUpdateTime;
  const t = Math.min(1, Math.max(0, timeDiff / BUFFER_MS));

  return lerpVector3(
    { x: entry.previous.position.x, y: entry.previous.position.y, z: entry.previous.position.z },
    { x: entry.current.position.x, y: entry.current.position.y, z: entry.current.position.z },
    t
  );
};

export const getInterpolatedRotation = (playerId: string, now: number = Date.now()): Quaternion => {
  const entry = interpolationBuffer[playerId];
  if (!entry || !entry.previous || !entry.current) {
    return { x: 0, y: 0, z: 0, w: 1 };
  }

  const timeDiff = now - entry.lastUpdateTime;
  const t = Math.min(1, Math.max(0, timeDiff / BUFFER_MS));

  return slerpQuaternion(
    { x: entry.previous.rotation.x, y: entry.previous.rotation.y, z: entry.previous.rotation.z, w: entry.previous.rotation.w },
    { x: entry.current.rotation.x, y: entry.current.rotation.y, z: entry.current.rotation.z, w: entry.current.rotation.w },
    t
  );
};

export const clearInterpolationBuffer = (playerId?: string): void => {
  if (playerId) {
    delete interpolationBuffer[playerId];
  } else {
    Object.keys(interpolationBuffer).forEach((key) => delete interpolationBuffer[key]);
  }
};

export const predictPlayerPosition = (
  current: Vector3,
  velocity: Vector3,
  deltaTime: number
): Vector3 => {
  return {
    x: current.x + velocity.x * deltaTime,
    y: current.y + velocity.y * deltaTime,
    z: current.z + velocity.z * deltaTime,
  };
};

export const reconcilePosition = (
  predicted: Vector3,
  serverAuth: Vector3,
  threshold: number = 2
): { corrected: Vector3; needsCorrection: boolean } => {
  const distance = Math.sqrt(
    (predicted.x - serverAuth.x) ** 2 +
    (predicted.y - serverAuth.y) ** 2 +
    (predicted.z - serverAuth.z) ** 2
  );

  if (distance > threshold) {
    return { corrected: serverAuth, needsCorrection: true };
  }

  return { corrected: predicted, needsCorrection: false };
};

export const interpolateNumber = (from: number, to: number, factor: number): number => {
  return lerp(from, to, Math.min(1, Math.max(0, factor)));
};

export const smoothDamp = (current: number, target: number, velocity: { value: number }, smoothTime: number, deltaTime: number = 1 / 60): number => {
  const omega = 2 / smoothTime;
  const x = omega * deltaTime;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const delta = current - target;
  velocity.value = (velocity.value + omega * velocity.value * exp) + delta * omega * omega * exp;
  const result = current + (velocity.value + delta) * exp;
  if (Math.abs(velocity.value + result - target) < 0.0001) {
    velocity.value = 0;
  }
  return result;
};

export type { InterpolationBuffer };
