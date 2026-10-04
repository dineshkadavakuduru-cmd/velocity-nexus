"use client";

/** Shared touch-input state so on-screen controls feed the same pipeline as keyboard. */
export interface TouchInputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  handbrake: boolean;
  nitro: boolean;
}

export const touchInput: TouchInputState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  handbrake: false,
  nitro: false,
};

export const setTouchInput = (patch: Partial<TouchInputState>): void => {
  Object.assign(touchInput, patch);
};

export const resetTouchInput = (): void => {
  touchInput.forward = false;
  touchInput.backward = false;
  touchInput.left = false;
  touchInput.right = false;
  touchInput.handbrake = false;
  touchInput.nitro = false;
};

export const isTouchDevice = (): boolean => {
  if (typeof window === "undefined") return false;
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia("(pointer: coarse)").matches
  );
};
