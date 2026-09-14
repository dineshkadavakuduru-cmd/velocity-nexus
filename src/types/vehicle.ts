import { VehicleConfig } from "./game";

export type EngineConfig = {
  torqueCurve: Array<{ rpm: number; torque: number }>;
  idleRpm: number;
  maxRpm: number;
  redline: number;
  revLimiter: boolean;
};

export type TransmissionConfig = {
  gears: number;
  ratios: number[];
  finalDrive: number;
  shiftTime: number;
  shiftQuality: number;
};

export type SuspensionConfig = {
  rideHeight: number;
  springRate: number;
  damperRate: number;
  bumpForce: number;
  reboundForce: number;
};

export type WheelConfig = {
  position: [number, number, number];
  radius: number;
  width: number;
  grip: number;
  steering: boolean;
  drive: boolean;
};

export type SoundKey =
  | "engineIdle"
  | "engineLow"
  | "engineMid"
  | "engineHigh"
  | "tireScreech"
  | "crash"
  | "nitro"
  | "countdownBeep"
  | "raceStart"
  | "victory"
  | "defeat"
  | "ambient1"
  | "ambient2"
  | "wind";

export type VehicleSoundConfig = {
  engineLayerCount: number;
  engineLayers: SoundKey[];
  tireScreechThreshold: number;
  crashIntensityThreshold: number;
};

export type VehicleType = VehicleConfig & {
  engine: EngineConfig;
  transmission: TransmissionConfig;
  suspension: SuspensionConfig;
  wheels: WheelConfig[];
  sounds: VehicleSoundConfig;
};

export type { VehicleConfig };
