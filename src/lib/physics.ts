import { VehicleConfig, TrackConfig } from "@/types";

export interface PhysicsConfig {
  gravity: [number, number, number];
  fixedTimeStep: number;
  maxSubSteps: number;
  maxVel: number;
  friction: number;
}

export const PHYSICS_CONFIG: PhysicsConfig = {
  gravity: [0, -9.81, 0] as [number, number, number],
  fixedTimeStep: 1 / 60,
  maxSubSteps: 5,
  maxVel: 200,
  friction: 0.01,
};

export const getVehiclePhysics = (config: VehicleConfig) => {
  const mass = config.mass;

  const wheels = [
    {
      position: [-1.2, -0.5, 1.6] as [number, number, number],
      steering: true,
      drive: false,
    },
    {
      position: [1.2, -0.5, 1.6] as [number, number, number],
      steering: true,
      drive: false,
    },
    {
      position: [-1.2, -0.5, -1.6] as [number, number, number],
      steering: false,
      drive: true,
    },
    {
      position: [1.2, -0.5, -1.6] as [number, number, number],
      steering: false,
      drive: true,
    },
  ];

  const suspension = {
    radius: 0.3,
    suspensionStiffness: 15,
    suspensionCompression: 0.1,
    suspensionDamping: 0.3,
    suspensionRestLength: 0.4,
    maxSuspensionForce: 100000,
    maxSuspensionTravel: 0.5,
    customSlipStartThreshold: 0,
    customSlipFactor: 0,
    frictionSlip: config.tireGrip * 1.2,
  };

  const chassis = {
    shape: [2.2, 0.8, 5.0] as [number, number, number],
    mass: mass,
    material: "car",
  };

  return {
    mass,
    wheels,
    suspension,
    chassis,
    aerodynamics: config.aerodynamics,
    enginePower: config.enginePower,
    gearRatios: config.gearRatios,
    finalDrive: config.finalDrive,
    maxRpm: config.maxRpm,
    idleRpm: config.idleRpm,
    topSpeed: config.topSpeed,
    driftModifier: config.driftModifier,
    tireGrip: config.tireGrip,
  };
};

export const RPM_TO_SPEED = 0.03;

export const getSpeedKmh = (velocity: { x: number; y: number; z: number }): number => {
  const magnitude = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);
  return magnitude * 3.6;
};

export const getEngineRpm = (
  speedKmh: number,
  gear: number,
  gearRatios: number[],
  finalDrive: number,
  wheelRadius: number = 0.33
): number => {
  if (gear <= 0 || gear > gearRatios.length) return 800;

  const ratio = gearRatios[gear - 1];
  const rpm = (speedKmh * 1000) / (2 * Math.PI * wheelRadius * 60) * ratio * finalDrive;
  return Math.max(800, Math.min(8500, rpm));
}

export const getOptimalGear = (speedKmh: number, gearRatios: number[], finalDrive: number, wheelRadius: number = 0.33): number => {
  let optimalGear = 1;
  for (let i = gearRatios.length; i >= 1; i--) {
    const maxRpmAtGear = (gearRatios[i - 1] * finalDrive * 2 * Math.PI * wheelRadius * 8500) / (1000 / 3.6);
    const minRpmAtGear = (gearRatios[i - 1] * finalDrive * 2 * Math.PI * wheelRadius * 1000) / (1000 / 3.6);
    if (speedKmh >= minRpmAtGear && (speedKmh <= maxRpmAtGear || i === gearRatios.length)) {
      optimalGear = i;
      break;
    }
  }
  return optimalGear;
};

export const getGearRatio = (config: VehicleConfig): number => {
  if (config.gearRatios && config.gearRatios.length > 0) {
    return config.gearRatios[config.gearRatios.length - 1];
  }
  return 1;
};

export const SURFACE_GRIP: Record<string, number> = {
  asphalt: 1.0,
  grass: 0.6,
  sand: 0.4,
  metal: 0.1,
  dirt: 0.5,
};

export const getDamageMultiplier = (damage: number): number => {
  return 1 - damage * 0.5;
};
