import { TrackConfig, Vector3 } from "./game";

export type TrackSegment = {
  id: string;
  type: "straight" | "curve" | "hairpin" | "chicane" | "elevation" | "tunnel";
  start: Vector3;
  end: Vector3;
  width: number;
  surface: "asphalt" | "grass" | "sand" | "metal" | "dirt";
  bankAngle: number;
};

export type TrackFeature = {
  id: string;
  type: "boost_pad" | "slow_zone" | "shortcut" | "obstacle" | "hazard";
  position: Vector3;
  activationRadius: number;
  effect: Record<string, unknown>;
};

export type TrackLighting = {
  ambient: number;
  directional: {
    intensity: number;
    color: string;
    position: Vector3;
  };
  neonLights: Array<{
    position: Vector3;
    color: string;
    intensity: number;
  }>;
  bloomStrength: number;
};

export type TrackEnvironment = {
  fog: { enabled: boolean; density: number; color: string };
  rain: { enabled: boolean; intensity: number };
  skybox: {
    type: "clear" | "cloudy" | "storm" | "sunset";
    rotation: number;
  };
};

export type TrackData = TrackConfig & {
  segments: TrackSegment[];
  features: TrackFeature[];
  lighting: TrackLighting;
  environment: TrackEnvironment;
  collisionMesh: string;
  visualMesh: string;
};

export type { TrackConfig };
