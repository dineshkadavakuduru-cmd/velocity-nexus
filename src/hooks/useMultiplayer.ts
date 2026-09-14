"use client";

import { useEffect, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useGameStore } from "@/stores/gameStore";
import { useLobbyStore } from "@/stores/lobbyStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { PlayerState, RaceSettings, RaceStatus, SocketEvents } from "@/types";
import { GAME_CONSTANTS } from "@/lib/constants";
import { setPlayerStateSnapshot, getInterpolatedPlayerState, getInterpolatedRotation } from "@/lib/interpolation";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;

let socket: Socket | null = null;

const hasSocketUrl = (): boolean => {
  return !!SOCKET_URL && SOCKET_URL.trim() !== "";
};

const getSocket = (): Socket => {
  if (!hasSocketUrl()) {
    throw new Error("No socket URL configured");
  }
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

export const useMultiplayer = () => {
  const {
    players,
    localPlayerId,
    raceStatus,
    raceTime,
    setPlayerState,
    setLocalPlayerId,
    setRaceStatus,
    setRaceTime,
    setCountdown,
    addPlayer: addPlayerToState,
    removePlayer: removePlayerFromState,
  } = useGameStore();

  const {
    roomCode,
    setRoomCode,
    setPlayers,
    addPlayer,
    removePlayer,
    updatePlayer,
    setSettings,
    setIsHost,
    setReady,
    setIsConnected,
    setError,
    setIsLoading,
    settings,
  } = useLobbyStore();

  const settingsStore = useSettingsStore();

  const isConnectedRef = useRef(false);

  const connect = useCallback(() => {
    if (!hasSocketUrl()) {
      setIsConnected(false);
      return null;
    }

    const s = getSocket();
    if (isConnectedRef.current) return s;

    setIsLoading(true);

    s.on("connect", () => {
      isConnectedRef.current = true;
      setIsConnected(true);
      setIsLoading(false);
      setError(null);
    });

    s.on("disconnect", (reason: string) => {
      isConnectedRef.current = false;
      setIsConnected(false);
    });

    s.on("error", (message: string) => {
      setError(message);
      setIsLoading(false);
    });

    s.on("room_update", (data: { players: PlayerState[]; settings: RaceSettings; roomCode: string; isHost: boolean }) => {
      setRoomCode(data.roomCode);
      setPlayers(data.players);
      setSettings(data.settings);
      setIsHost(data.isHost);
      data.players.forEach((p) => setPlayerStateSnapshot(p.id, p));
    });

    s.on("player_joined", (player: PlayerState) => {
      addPlayer(player);
      setPlayerStateSnapshot(player.id, player);
    });

    s.on("player_left", (playerId: string) => {
      removePlayer(playerId);
      removePlayerFromState(playerId);
    });

    s.on("countdown", (data: { count: number }) => {
      setCountdown(data.count);
      setRaceStatus("countdown");
    });

    s.on("race_start", (data: { startTime: number }) => {
      setRaceStatus("racing");
    });

    s.on("game_state", (data: {
      players: Record<string, Omit<PlayerState, "id" | "name">>;
      raceTime: number;
      raceStatus: RaceStatus;
    }) => {
      setRaceTime(data.raceTime);
      setRaceStatus(data.raceStatus);
      Object.entries(data.players).forEach(([id, state]) => {
        setPlayerState(id, {
          position: state.position,
          rotation: state.rotation,
          velocity: state.velocity,
          steering: state.steering,
          throttle: state.throttle,
          brake: state.brake,
          nitro: state.nitro,
          currentLap: state.currentLap,
          checkpoint: state.checkpoint,
          finished: state.finished,
        });
        setPlayerStateSnapshot(id, {
          id,
          name: id,
          ...state,
        } as PlayerState);
      });
    });

    s.on("race_finish", (data: { results: Array<{ id: string; name: string; finishTime: number; position: number }> }) => {
      setRaceStatus("finished");
      useGameStore.getState().setRaceResults(data.results);
    });

    s.on("chat_message", (data: { playerId: string; playerName: string; message: string; timestamp: number }) => {
      console.log("Chat:", data);
    });

    s.connect();
    return s;
  }, [
    addPlayer, removePlayer, setRoomCode, setPlayers, setSettings, setIsHost,
    setIsConnected, setError, setIsLoading, setPlayerState, localPlayerId,
    addPlayerToState, removePlayerFromState, setRaceStatus, setRaceTime, setCountdown,
  ]);

  const createRoom = useCallback((playerName: string, raceSettings: RaceSettings) => {
    if (!hasSocketUrl()) {
      setError("Multiplayer server URL is not configured");
      return;
    }

    const s = connect();
    if (!s) return;

    setIsLoading(true);
    setError(null);

    s.emit("create_room", { settings: raceSettings });

    s.once("room_created", (data: { roomCode: string; players: PlayerState[]; settings: RaceSettings; isHost: boolean }) => {
      setRoomCode(data.roomCode);
      setPlayers(data.players);
      setSettings(data.settings);
      setIsHost(true);
      setIsLoading(false);
    });
  }, [connect, setRoomCode, setPlayers, setSettings, setIsHost, setIsLoading, setError]);

  const joinRoom = useCallback((roomCode: string, playerName: string) => {
    if (!hasSocketUrl()) {
      setError("Multiplayer server URL is not configured");
      return;
    }

    const s = connect();
    if (!s) return;

    setIsLoading(true);
    setError(null);

    s.emit("join_room", { roomCode, playerName });

    s.once("joined_room", (data: { success: boolean; roomCode: string; players: PlayerState[]; settings: RaceSettings; isHost: boolean; playerId: string }) => {
      if (data.success) {
        setRoomCode(data.roomCode);
        setPlayers(data.players);
        setSettings(data.settings);
        setIsHost(data.isHost);
        setLocalPlayerId(data.playerId);
        setIsLoading(false);
      } else {
        setError("Failed to join room");
        setIsLoading(false);
      }
    });
  }, [connect, setRoomCode, setPlayers, setSettings, setIsHost, setLocalPlayerId, setIsLoading, setError]);

  const setPlayerReady = useCallback((ready: boolean) => {
    if (!hasSocketUrl()) {
      setReady(ready);
      return;
    }

    const s = getSocket();
    if (s && roomCode) {
      s.emit("ready_state", { roomCode, isReady: ready });
    }
    setReady(ready);
  }, [roomCode, setReady]);

  const startRace = useCallback(() => {
    if (!hasSocketUrl()) return;

    const s = getSocket();
    if (s && roomCode) {
      s.emit("start_race", { roomCode });
    }
  }, [roomCode]);

  const sendChatMessage = useCallback((message: string) => {
    if (!hasSocketUrl()) return;

    const s = getSocket();
    if (s && roomCode) {
      s.emit("chat_message", { roomCode, message });
    }
  }, [roomCode]);

  const sendPlayerUpdate = useCallback((update: {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number; w: number };
    velocity: { x: number; y: number; z: number };
    steering: number;
    throttle: number;
    brake: boolean;
    nitro: boolean;
    currentLap: number;
    checkpoint: number;
  }) => {
    if (!hasSocketUrl()) return;

    const s = getSocket();
    if (s && roomCode && raceStatus === "racing") {
      s.emit("player_update", { ...update, roomCode });
    }
  }, [roomCode, raceStatus]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    isConnectedRef.current = false;
    setIsConnected(false);
  }, [setIsConnected]);

  const getInterpolatedPosition = useCallback((playerId: string) => {
    return getInterpolatedPlayerState(playerId);
  }, []);

  const getInterpolatedRotation = useCallback((playerId: string) => {
    return getInterpolatedRotation(playerId);
  }, []);

  const localPlayer = Object.values(players).find((p: PlayerState) => p.id === localPlayerId);
  const remotePlayers = Object.values(players).filter((p: PlayerState) => p.id !== localPlayerId);

  return {
    isConnected: useLobbyStore.getState().isConnected && hasSocketUrl(),
    roomCode,
    players,
    remotePlayers,
    localPlayer,
    settings,
    isHost: useLobbyStore.getState().isHost,
    raceStatus,
    raceTime,
    countdown: useGameStore.getState().countdown,
    createRoom,
    joinRoom,
    setPlayerReady,
    startRace,
    sendChatMessage,
    sendPlayerUpdate,
    disconnect,
    getInterpolatedPosition,
    getInterpolatedRotation,
    connect,
  };
};

export { getSocket as getSocketInstance };
