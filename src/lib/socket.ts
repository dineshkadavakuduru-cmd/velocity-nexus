import { io, Socket } from "socket.io-client";

export type ConnectionState = "CONNECTING" | "CONNECTED" | "RECONNECTING" | "DISCONNECTED" | "SERVER_OFFLINE";

let socket: Socket | null = null;
let connectionState: ConnectionState = "DISCONNECTED";
const stateListeners = new Set<(state: ConnectionState) => void>();

/** Round-trip time to the multiplayer server, in ms (null until measured). */
let latencyMs: number | null = null;
const latencyListeners = new Set<(ms: number | null) => void>();
let latencyInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Resolve the Socket.IO server URL.
 *
 * The scheme is upgraded to match the page: an `https://` page cannot open a
 * plain `http://`/`ws://` socket (mixed-content block), so http->https and
 * ws->wss are forced when the page itself is served over TLS. This keeps
 * `NEXT_PUBLIC_SOCKET_URL` working whether it is written as http(s) or ws(s).
 */
export const getSocketUrl = (): string | null => {
  const raw = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (!raw || raw.trim() === "") return null;
  let url = raw.trim().replace(/\/+$/, "");

  const pageIsHttps =
    typeof window !== "undefined" && window.location.protocol === "https:";

  if (pageIsHttps) {
    url = url.replace(/^http:\/\//i, "https://").replace(/^ws:\/\//i, "wss://");
  } else {
    url = url.replace(/^https:\/\//i, "http://").replace(/^wss:\/\//i, "ws://");
  }
  // Socket.IO accepts a ws(s):// URL; normalise it to the http(s) form it
  // prefers internally so the same string works for the /health probe too.
  url = url.replace(/^wss:\/\//i, "https://").replace(/^ws:\/\//i, "http://");
  return url;
};

const SESSION_CLIENT_ID_KEY = "vn-client-id";

/**
 * Stable per-browser-session identity so a socket that reconnects (including
 * one after a mid-race page refresh) reclaims the slot held for it during the
 * disconnect grace window instead of showing up as a duplicate ghost car.
 *
 * sessionStorage is deliberate: it survives a reload in the same tab but is
 * scoped per tab, so two tabs are treated as two distinct racers.
 */
let clientId: string | null = null;
export const getClientId = (): string => {
  if (clientId) return clientId;
  try {
    const existing = globalThis.sessionStorage?.getItem(SESSION_CLIENT_ID_KEY);
    if (existing) {
      clientId = existing;
      return clientId;
    }
  } catch {
    /* storage unavailable (privacy mode / SSR) */
  }
  const fallback = `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  let generated = fallback;
  try {
    generated = globalThis.crypto?.randomUUID?.() ?? fallback;
  } catch {
    generated = fallback;
  }
  clientId = generated;
  try {
    globalThis.sessionStorage?.setItem(SESSION_CLIENT_ID_KEY, generated);
  } catch {
    /* non-fatal */
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

export const getLatency = (): number | null => latencyMs;

export const onLatencyChange = (listener: (ms: number | null) => void): (() => void) => {
  latencyListeners.add(listener);
  if (latencyMs !== null) listener(latencyMs);
  return () => latencyListeners.delete(listener);
};

const setLatency = (ms: number | null) => {
  latencyMs = ms;
  latencyListeners.forEach((listener) => listener(ms));
};

const pingOnce = (s: Socket) => {
  if (!s.connected) return;
  const sentAt = Date.now();
  s.timeout(4000).emit("ping", (_err: unknown) => {
    // Acknowledged within the timeout: record the round trip.
    if (!_err) setLatency(Date.now() - sentAt);
  });
};

const startLatencyMonitor = (s: Socket) => {
  if (latencyInterval) return;
  pingOnce(s);
  latencyInterval = setInterval(() => pingOnce(s), 5000);
};

const stopLatencyMonitor = () => {
  if (latencyInterval) clearInterval(latencyInterval);
  latencyInterval = null;
  setLatency(null);
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
      // Generous window so a cold-starting free-tier host (~30-60s) can come
      // back before the client declares the server offline.
      reconnectionAttempts: 25,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
      autoConnect: false,
      timeout: 20000,
    });

    socket.io.on("reconnect_attempt", () => {
      setConnectionState("RECONNECTING");
    });

    socket.on("connect", () => {
      setConnectionState("CONNECTED");
      startLatencyMonitor(socket!);
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
  stopLatencyMonitor();
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
