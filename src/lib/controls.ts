import { Controls, DEFAULT_CONTROLS } from "@/lib/constants";

type KeyState = Record<string, boolean>;
type GamepadState = Gamepad | null;

interface InputState {
  keys: KeyState;
  gamepad: GamepadState;
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  handbrake: boolean;
  nitro: boolean;
  camera: boolean;
  pause: boolean;
  steering: number;
  throttle: number;
  brake: boolean;
}

const inputState: InputState = {
  keys: {},
  gamepad: null,
  forward: false,
  backward: false,
  left: false,
  right: false,
  handbrake: false,
  nitro: false,
  camera: false,
  pause: false,
  steering: 0,
  throttle: 0,
  brake: false,
};

let controls: Controls = DEFAULT_CONTROLS;

export const setControls = (newControls: Controls): void => {
  controls = newControls;
};

export const getControls = (): Controls => controls;

const keyHandlers = new Map<string, () => void>();

export const initControls = (): void => {
  if (typeof window === "undefined") return;

  window.addEventListener("keydown", (e) => {
    inputState.keys[e.code] = true;
    if (keyHandlers.has(e.code)) {
      keyHandlers.get(e.code)!();
    }
  });

  window.addEventListener("keyup", (e) => {
    inputState.keys[e.code] = false;
  });

  window.addEventListener("blur", () => {
    Object.keys(inputState.keys).forEach((k) => {
      inputState.keys[k] = false;
    });
    resetInput();
  });

  window.addEventListener("gamepadconnected", (e) => {
    inputState.gamepad = navigator.getGamepads()[(e as GamepadEvent & { gamepadIndex: number }).gamepadIndex] as Gamepad;
  });

  window.addEventListener("gamepaddisconnected", () => {
    inputState.gamepad = null;
  });

  setInterval(() => {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    if (gamepads && gamepads[0]) {
      inputState.gamepad = gamepads[0];
    }
  }, 100);
};

const resetInput = (): void => {
  inputState.forward = false;
  inputState.backward = false;
  inputState.left = false;
  inputState.right = false;
  inputState.handbrake = false;
  inputState.nitro = false;
  inputState.camera = false;
  inputState.pause = false;
  inputState.steering = 0;
  inputState.throttle = 0;
  inputState.brake = false;
};

export const getInputState = (): InputState => {
  inputState.forward = !!inputState.keys[controls.forward];
  inputState.backward = !!inputState.keys[controls.backward];
  inputState.left = !!inputState.keys[controls.left];
  inputState.right = !!inputState.keys[controls.right];
  inputState.handbrake = !!inputState.keys[controls.handbrake];
  inputState.nitro = !!inputState.keys[controls.nitro];
  inputState.camera = !!inputState.keys[controls.camera];
  inputState.pause = !!inputState.keys[controls.pause];

  if (inputState.gamepad) {
    const gp = inputState.gamepad;
    if (gp.axes && gp.axes[0] !== undefined) {
      const axisX = gp.axes[0];
      inputState.steering = Math.abs(axisX) > 0.1 ? axisX : 0;
    }
    if (gp.axes && gp.axes[1] !== undefined) {
      const axisY = gp.axes[1];
      if (axisY < -0.1) {
        inputState.forward = true;
      }
      if (axisY > 0.1) {
        inputState.backward = true;
      }
    }
    if (gp.buttons && gp.buttons.length > 0) {
      inputState.handbrake = gp.buttons[0]?.pressed ?? false;
    }
    if (gp.buttons && gp.buttons.length > 1) {
      inputState.nitro = gp.buttons[1]?.pressed ?? false;
    }
    if (gp.buttons && gp.buttons.length > 2) {
      inputState.camera = gp.buttons[2]?.pressed ?? false;
    }
    if (gp.buttons && gp.buttons.length > 9) {
      inputState.pause = gp.buttons[9]?.pressed ?? false;
    }
  }

  const rawSteer = Number(inputState.left) - Number(inputState.right);
  if (inputState.steering === 0) {
    inputState.steering = rawSteer;
  }

  const rawThrottle = Number(inputState.forward);
  inputState.throttle = rawThrottle;
  inputState.brake = inputState.backward || inputState.handbrake;

  return { ...inputState };
};

export const isKeyPressed = (key: string): boolean => {
  return !!inputState.keys[key];
};

export const onPress = (key: string, callback: () => void): void => {
  if (inputState.keys[key]) {
    if (!keyHandlers.has(key)) {
      keyHandlers.set(key, callback);
    }
  }
};

export const resetControls = (): void => {
  resetInput();
  inputState.keys = {};
  inputState.gamepad = null;
};

export type { InputState };
