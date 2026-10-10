import { io, Socket } from "socket.io-client";

export type ConnectionState = "CONNECTING" | "CONNECTED" | "RECONNECTING" | "DISCONNECTED" | "SERVER_OFFLINE";

let socket: Socket | null = null;
let connectionState: ConnectionState = "DISCONNECTED";
const stateListeners = new Set<(state: ConnectionState) => void>();

export const getSocketUrl = (): string | null => {
  const url = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (!url || url.trim() === "") return null;
  return url.trim();
};

/**
 * Stable per-browser identity. Kept for the lifetime of the page so that a
 * reconnected socket can present it and reclaim its held player slot instead
 * of appearing as a duplicate. Not used for anything else.
 */
let clientId: string | null = null;
export const getClientId = (): string => {
  if (clientId) return clientId;
  const fallback = `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  try {
    clientId = globalThis.crypto?.randomUUID?.() ?? fallback;
  } catch {
    clientId = fallback;
  }
  return clientId;
};

export const hasSocketUrl = (): boolean => getSocketUrl() !== null;

const setConnectionState = (state: ConnectionState) => {
  connectionState = state;
  stateListeners.forEach((listener) => listener(state));
};

export const getConnectionState = (): ConnectionState => connectionState;

export const onConnectionStateChange = (listener: (state: ConnectionState) => void): (() => void) => {
  stateListeners.add(listener);
  return () => stateListeners.delete(listener);
};

/** Single shared socket instance. Lazy-created, never duplicated. */
export const initSocket = (): Socket | null => {
  const socketUrl = getSocketUrl();
  if (!socketUrl) {
    setConnectionState("SERVER_OFFLINE");
    return null;
  }
  if (!socket) {
    socket = io(socketUrl, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      autoConnect: false,
      timeout: 10000,
    });

    socket.io.on("reconnect_attempt", () => {
      setConnectionState("RECONNECTING");
    });

    socket.on("connect", () => {
      setConnectionState("CONNECTED");
    });

    socket.on("disconnect", (reason) => {
      if (reason === "io server disconnect") {
        setConnectionState("DISCONNECTED");
      } else {
        setConnectionState("RECONNECTING");
      }
    });

    socket.io.on("reconnect", () => {
      setConnectionState("CONNECTED");
    });

    socket.io.on("reconnect_failed", () => {
      setConnectionState("SERVER_OFFLINE");
    });
  }
  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  setConnectionState("DISCONNECTED");
};

export const connectSocket = () => {
  const s = initSocket();
  if (s && !s.connected) {
    setConnectionState("CONNECTING");
    s.connect();
  }
  return s;
};

/**
 * Emit an event and wait for a single response event (or timeout).
 * Rejects on timeout so callers can clear loading state + surface errors.
 */
export const emitWithResponse = <T>(
  emitEvent: string,
  payload: unknown,
  responseEvent: string,
  timeoutMs = 8000,
): Promise<T> => {
  const s = initSocket();
  if (!s) return Promise.reject(new Error("Multiplayer is currently unavailable. Please try again later."));
  if (!s.connected) {
    setConnectionState("CONNECTING");
    s.connect();
  }
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      s.off(responseEvent, onResponse);
      reject(new Error("Server did not respond in time"));
    }, timeoutMs);
    const onResponse = (data: T) => {
      clearTimeout(timer);
      resolve(data);
    };
    s.once(responseEvent, onResponse as (...args: unknown[]) => void);
    s.emit(emitEvent, payload);
  });
};

export const emitEvent = (event: string, data: unknown) => {
  if (socket && socket.connected) {
    socket.emit(event, data);
  }
};

export const onEvent = (event: string, callback: (...args: unknown[]) => void) => {
  socket?.on(event, callback);
};

export const offEvent = (event: string, callback?: (...args: unknown[]) => void) => {
  if (!socket) return;
  if (callback) socket.off(event, callback);
  else socket.off(event);
};

/** Health check for the multiplayer backend (Socket.IO server exposes GET /health). */
export const checkServerHealth = async (): Promise<{ ok: boolean; rooms?: number; uptime?: number }> => {
  const url = getSocketUrl();
  if (!url) return { ok: false };
  try {
    const base = url.replace(/^ws/, "http").replace(/\/socket\.io.*$/, "").replace(/\/$/, "");
    const healthUrl = `${base}/health`;
    const response = await fetch(healthUrl, { method: "GET", signal: AbortSignal.timeout(5000) });
    if (response.ok) {
      return await response.json();
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
};
