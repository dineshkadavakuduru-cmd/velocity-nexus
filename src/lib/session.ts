"use client";

/**
 * Persists the "active room" for the current tab so that reloading the page
 * (e.g. a mid-race refresh) can automatically rejoin the same room with the
 * same client identity and reclaim the held slot instead of dropping out.
 *
 * sessionStorage (not localStorage) so two tabs stay independent racers.
 */
export type ActiveRoom = { roomCode: string; playerName: string };

const KEY = "vn-active-room";

export const getActiveRoom = (): ActiveRoom | null => {
  try {
    const raw = globalThis.sessionStorage?.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ActiveRoom>;
    if (typeof parsed?.roomCode !== "string" || parsed.roomCode.length === 0) return null;
    return { roomCode: parsed.roomCode, playerName: typeof parsed.playerName === "string" ? parsed.playerName : "Racer" };
  } catch {
    return null;
  }
};

export const setActiveRoom = (room: ActiveRoom): void => {
  try {
    globalThis.sessionStorage?.setItem(KEY, JSON.stringify(room));
  } catch {
    /* storage unavailable — rejoin is best-effort */
  }
};

export const clearActiveRoom = (): void => {
  try {
    globalThis.sessionStorage?.removeItem(KEY);
  } catch {
    /* non-fatal */
  }
};
