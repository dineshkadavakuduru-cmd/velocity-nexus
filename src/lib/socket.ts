import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocketUrl = (): string | null => {
  const url = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (!url || url.trim() === "") return null;
  return url.trim();
};

export const hasSocketUrl = (): boolean => getSocketUrl() !== null;

/** Single shared socket instance. Lazy-created, never duplicated. */
export const initSocket = (): Socket | null => {
  const socketUrl = getSocketUrl();
  if (!socketUrl) return null;
  if (!socket) {
    socket = io(socketUrl, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: false,
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
  if (!s) return Promise.reject(new Error("Multiplayer server URL is not configured"));
  if (!s.connected) s.connect();
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
