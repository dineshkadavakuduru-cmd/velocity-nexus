import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const getSocketUrl = (): string | null => {
  const url = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (!url || url.trim() === "") {
    return null;
  }
  return url;
};

export const initSocket = (url?: string): Socket | null => {
  const socketUrl = url ?? getSocketUrl();

  if (!socketUrl) {
    return null;
  }

  if (!socket) {
    socket = io(socketUrl, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("Connected to server:", socket?.id);
    });

    socket.on("disconnect", (reason: string) => {
      console.log("Disconnected:", reason);
    });

    socket.on("connect_error", (error: Error) => {
      console.error("Connection error:", error.message);
    });
  }
  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const emitEvent = (event: string, data: unknown) => {
  if (socket && socket.connected) {
    socket.emit(event, data);
  }
};

export const onEvent = (event: string, callback: (...args: unknown[]) => void) => {
  if (socket) {
    socket.on(event, callback);
  }
};

export const offEvent = (event: string, callback?: (...args: unknown[]) => void) => {
  if (socket) {
    if (callback) {
      socket.off(event, callback);
    } else {
      socket.off(event);
    }
  }
};
