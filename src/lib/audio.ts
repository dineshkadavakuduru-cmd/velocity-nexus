import { Howl, HowlOptions, Howler } from "howler";

type SoundName =
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

interface EngineSoundLayer {
  sound: Howl;
  minRpm: number;
  maxRpm: number;
}

interface AudioManager {
  engineLayers: EngineSoundLayer[];
  engineVolume: number;
  currentRpm: number;
  currentGear: number;
  spatial: Record<string, Howl>;
}

const audioManager: AudioManager = {
  engineLayers: [],
  engineVolume: 0,
  currentRpm: 0,
  currentGear: 0,
  spatial: {},
};

const soundConfig: Record<SoundName, { src: string; loop?: boolean; volume?: number; pool?: number }> = {
  engineIdle: { src: "/sounds/engine-idle.mp3", loop: true, volume: 0 },
  engineLow: { src: "/sounds/engine-rev.mp3", loop: true, volume: 0 },
  engineMid: { src: "/sounds/engine-mid.mp3", loop: true, volume: 0 },
  engineHigh: { src: "/sounds/engine-high.mp3", loop: true, volume: 0 },
  tireScreech: { src: "/sounds/tire-screech.mp3", loop: true, volume: 0, pool: 5 },
  crash: { src: "/sounds/crash.mp3", loop: false, volume: 1 },
  nitro: { src: "/sounds/nitro.mp3", loop: true, volume: 0 },
  countdownBeep: { src: "/sounds/countdown-beep.mp3", loop: false, volume: 1 },
  raceStart: { src: "/sounds/race-start.mp3", loop: false, volume: 1 },
  victory: { src: "/sounds/victory.mp3", loop: false, volume: 1 },
  defeat: { src: "/sounds/defeat.mp3", loop: false, volume: 1 },
  ambient1: { src: "/sounds/ambient-music-1.mp3", loop: true, volume: 0.5 },
  ambient2: { src: "/sounds/ambient-music-2.mp3", loop: true, volume: 0.5 },
  wind: { src: "/sounds/wind.mp3", loop: true, volume: 0 },
};

const activeSounds: Record<string, Howl> = {};

export const isAudioSupported = (): boolean => {
  return typeof Howler !== "undefined" && typeof window !== "undefined";
};

export const initAudio = async (): Promise<void> => {
  try {
    if (!isAudioSupported()) {
      console.warn("Audio not supported in this environment");
      return;
    }

    Howler.autoUnlock = true;
    Howler.autoSuspend = false;

    const config = soundConfig;
    for (const [name, cfg] of Object.entries(config)) {
      try {
        const options: HowlOptions = {
          src: [cfg.src],
          loop: cfg.loop ?? false,
          volume: cfg.volume ?? 1,
          preload: true,
          onloaderror: (soundId: number, err: unknown) => {
            console.warn(`Failed to load sound "${name}":`, err);
          },
        };
        if (cfg.pool) {
          (options as unknown as Record<string, unknown>).pool = cfg.pool;
        }
        const howl = new Howl(options);
        howl.on("loaderror", (_err, err) => {
          console.warn(`Load error for sound "${name}":`, err);
        });
        howl.on("playerror", (_err, err) => {
          console.warn(`Play error for sound "${name}":`, err);
        });
        activeSounds[name] = howl;
      } catch (error) {
        console.warn(`Could not create sound "${name}":`, error);
      }
    }

    const engineLayerEntries = ["engineIdle", "engineLow", "engineMid", "engineHigh"] as const;
    const validLayers: EngineSoundLayer[] = [];
    for (const key of engineLayerEntries) {
      const sound = activeSounds[key];
      if (sound) {
        const ranges: Record<string, { minRpm: number; maxRpm: number }> = {
          engineIdle: { minRpm: 0, maxRpm: 2500 },
          engineLow: { minRpm: 2000, maxRpm: 5000 },
          engineMid: { minRpm: 4500, maxRpm: 7000 },
          engineHigh: { minRpm: 6500, maxRpm: 8500 },
        };
        const range = ranges[key];
        validLayers.push({ sound, minRpm: range.minRpm, maxRpm: range.maxRpm });
      }
    }
    audioManager.engineLayers = validLayers;

    console.log("Audio system initialized", { loadedSounds: Object.keys(activeSounds).length });
  } catch (error) {
    console.error("Failed to initialize audio:", error);
  }
};

export const playOneShot = (name: SoundName, volume: number = 1): Howl | null => {
  try {
    const sound = activeSounds[name];
    if (sound && !sound.playing()) {
      sound.volume(volume);
      sound.play();
      return sound;
    }
    return null;
  } catch (error) {
    console.warn(`Failed to play sound "${name}":`, error);
    return null;
  }
};

export const playLoop = (name: SoundName, volume: number = 1): void => {
  try {
    const sound = activeSounds[name];
    if (sound) {
      sound.volume(volume);
      sound.loop(true);
      sound.play();
    }
  } catch (error) {
    console.warn(`Failed to play loop "${name}":`, error);
  }
};

export const stopSound = (name: SoundName): void => {
  try {
    const sound = activeSounds[name];
    if (sound) {
      sound.stop();
    }
  } catch (error) {
    console.warn(`Failed to stop sound "${name}":`, error);
  }
};

export const setSoundVolume = (name: SoundName, volume: number): void => {
  try {
    const sound = activeSounds[name];
    if (sound) {
      sound.volume(Math.max(0, Math.min(1, volume)));
    }
  } catch (error) {
    console.warn(`Failed to set volume for sound "${name}":`, error);
  }
};

export const updateEngineSound = (rpm: number, gear: number, throttle: number): void => {
  try {
    audioManager.currentRpm = rpm;
    audioManager.currentGear = gear;

    const minRpm = 700;
    const maxRpm = 8500;
    const rpmRatio = Math.max(0, Math.min(1, (rpm - minRpm) / (maxRpm - minRpm)));

    const engineVolume = 0.3 + rpmRatio * 0.5;
    audioManager.engineVolume = engineVolume;

    audioManager.engineLayers.forEach((layer) => {
      let blend = 0;
      if (rpm >= layer.minRpm && rpm <= layer.maxRpm) {
        const range = layer.maxRpm - layer.minRpm;
        const pos = rpm - layer.minRpm;
        blend = pos / range;
      } else if (rpm > layer.maxRpm) {
        blend = 0.5;
      } else if (rpm < layer.minRpm && layer === audioManager.engineLayers[0]) {
        blend = 1;
      }

      blend = Math.max(0, Math.min(1, blend));
      layer.sound.volume(engineVolume * blend * throttle);
      if (blend > 0 && !layer.sound.playing()) {
        layer.sound.play();
      }
    });
  } catch (error) {
    console.warn("Failed to update engine sound:", error);
  }
};

export const playSpatialSound = (name: SoundName, x: number, y: number, z: number, volume: number = 1): Howl | null => {
  try {
    const sound = playOneShot(name, volume);
    if (sound) {
      const howlSounds = (sound as unknown as { _sounds: Array<{ pan: { set: (args: [number, number, number]) => void } }> })._sounds;
      if (howlSounds && howlSounds[0]) {
        howlSounds[0].pan.set([x, y, z]);
      }
    }
    return sound;
  } catch (error) {
    console.warn(`Failed to play spatial sound "${name}":`, error);
    return null;
  }
};

export const setMasterVolume = (volume: number): void => {
  try {
    Howler.volume(Math.max(0, Math.min(1, volume)));
  } catch (error) {
    console.warn("Failed to set master volume:", error);
  }
};

export const getActiveSounds = (): Record<string, Howl> => {
  return activeSounds;
};

export type { SoundName };
