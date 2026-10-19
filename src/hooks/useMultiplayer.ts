"use client";

import { useEffect, useCallback, useRef } from "react";
import type { Socket } from "socket.io-client";
import { useGameStore } from "@/stores/gameStore";
import { useLobbyStore } from "@/stores/lobbyStore";
import { PlayerState, RaceSettings, RaceStatus } from "@/types";
import { setPlayerStateSnapshot, getInterpolatedPlayerState, getInterpolatedRotation } from "@/lib/interpolation";
import {
  connectSocket,
  disconnectSocket as destroySocket,
  emitWithResponse,
  getClientId,
  getConnectionState,
  hasSocketUrl,
  initSocket,
  onConnectionStateChange,
} from "@/lib/socket";
import { clearActiveRoom, getActiveRoom, setActiveRoom } from "@/lib/session";

const UPDATE_THROTTLE_MS = 50;
/** Cold-starting free-tier hosts can take ~30-60s to answer the first join. */
const ROOM_ACTION_TIMEOUT_MS = 25000;
/** Errors that mean the held/persisted slot is gone for good. */
const FATAL_ROOM_ERRORS = /Room not found|Race already in progress|Room is full|Already connected from another session/i;

/** Turn low-level socket errors into an actionable in-game message. */
const describeRoomError = (err: unknown): string => {
  const message = err instanceof Error ? err.message : String(err);
  if (/did not respond in time|timeout/i.test(message)) {
    return "The multiplayer server is not answering. It may be starting up (free hosts sleep when idle) — wait a moment and retry.";
  }
  if (/unavailable|not configured/i.test(message)) {
    return "Multiplayer is unavailable right now. Try single-player, or retry in a moment.";
  }
  return message || "Something went wrong reaching the multiplayer server.";
};

export const useMultiplayer = () => {
  const raceStatus = useGameStore((s) => s.raceStatus);
  const raceTime = useGameStore((s) => s.raceTime);
  const players = useGameStore((s) => s.players);
  const localPlayerId = useGameStore((s) => s.localPlayerId);
  const countdown = useGameStore((s) => s.countdown);

  const roomCode = useLobbyStore((s) => s.roomCode);
  const settings = useLobbyStore((s) => s.settings);
  const lobbyConnected = useLobbyStore((s) => s.isConnected);
  const lobbyHost = useLobbyStore((s) => s.isHost);

  const listenersBoundRef = useRef(false);
  const hasConnectedRef = useRef(false);
  const lastUpdateSentRef = useRef(0);

  const bindListeners = useCallback((s: Socket) => {
    if (listenersBoundRef.current) return;
    listenersBoundRef.current = true;
    const lobby = useLobbyStore.getState;
    const game = useGameStore.getState;

    s.on("connect", () => {
      const ls = lobby();
      ls.setIsConnected(true);
      ls.setIsLoading(false);
      // Prefer the in-memory room (same-page reconnect); otherwise fall back to
      // the tab-persisted room so a mid-race refresh can rejoin too.
      const active = ls.roomCode
        ? { roomCode: ls.roomCode, playerName: ls.playerName }
        : getActiveRoom();
      if (active?.roomCode && (hasConnectedRef.current || !ls.roomCode)) {
        if (!ls.roomCode) ls.setPlayerName(active.playerName || "Racer");
        setActiveRoom({ roomCode: active.roomCode, playerName: active.playerName || "Racer" });
        s.emit("join_room", {
          roomCode: active.roomCode,
          playerName: active.playerName || "Racer",
          clientId: getClientId(),
        });
      } else {
        ls.setError(null);
      }
      hasConnectedRef.current = true;
    });

    s.on("disconnect", () => {
      lobby().setIsConnected(false);
    });

    s.on("error", (message: string) => {
      const text = typeof message === "string" ? message : "Server error";
      const ls = lobby();
      // The slot is unrecoverable — drop the persisted room so we don't keep
      // retrying a join that can never succeed. Reset first (it clears error),
      // then surface the message so the user actually sees it.
      if (FATAL_ROOM_ERRORS.test(text)) {
        clearActiveRoom();
        if (/Room not found|Race already in progress|Room is full/i.test(text)) {
          ls.resetLobby();
        }
      }
      ls.setError(text);
      ls.setIsLoading(false);
    });

    s.on("room_update", (data: { players: PlayerState[]; settings: RaceSettings; roomCode: string; hostId: string }) => {
      const ls = lobby();
      const gs = game();
      ls.setRoomCode(data.roomCode);
      ls.setPlayers(data.players);
      ls.setSettings(data.settings);
      if (data.hostId) ls.setIsHost(data.hostId === gs.localPlayerId);
      // Reconcile the render store with the authoritative roster so a socket id
      // that was replaced during a reconnect never lingers as a ghost car.
      const incoming = new Set(data.players.map((p) => p.id));
      Object.keys(gs.players).forEach((id) => {
        if (id !== gs.localPlayerId && !incoming.has(id)) gs.removePlayer(id);
      });
      data.players.forEach((p) => {
        setPlayerStateSnapshot(p.id, p);
        if (!gs.players[p.id]) gs.addPlayer(p);
      });
    });

    s.on("joined_room", (data: {
      success: boolean;
      roomCode: string;
      players: PlayerState[];
      settings: RaceSettings;
      isHost: boolean;
      playerId: string;
      hostId?: string;
      status?: RaceStatus;
    }) => {
      // Fires for a normal join and for a reconnect-driven rejoin; idempotent.
      const ls = lobby();
      const gs = game();
      ls.setRoomCode(data.roomCode);
      ls.setPlayers(data.players);
      ls.setSettings(data.settings);
      ls.setIsHost(data.hostId ? data.hostId === data.playerId : data.isHost);
      ls.setIsLoading(false);
      gs.setLocalPlayerId(data.playerId);
      // Restore the race phase after a refresh so the loop resumes mid-race.
      if (data.status) gs.setRaceStatus(data.status);
      // Drop any stale roster entries (old socket id) before re-seeding.
      const incoming = new Set(data.players.map((p) => p.id));
      Object.keys(gs.players).forEach((id) => {
        if (id !== data.playerId && !incoming.has(id)) gs.removePlayer(id);
      });
      const me = data.players.find((p) => p.id === data.playerId);
      if (me) {
        gs.addPlayer(me);
        setPlayerStateSnapshot(me.id, me);
      }
      setActiveRoom({ roomCode: data.roomCode, playerName: ls.playerName || "Racer" });
    });

    s.on("host_changed", (data: { hostId: string }) => {
      const gs = game();
      lobby().setIsHost(data.hostId === gs.localPlayerId);
    });

    s.on("player_joined", (player: PlayerState) => {
      lobby().addPlayer(player);
      setPlayerStateSnapshot(player.id, player);
    });

    s.on("player_left", (data: { playerId: string; hostId?: string }) => {
      const playerId = typeof data === "string" ? data : data?.playerId;
      if (!playerId) return;
      lobby().removePlayer(playerId);
      game().removePlayer(playerId);
      if (data && "hostId" in data && data.hostId) {
        lobby().setIsHost(data.hostId === game().localPlayerId);
      }
    });

    s.on("room_closed", () => {
      clearActiveRoom();
      lobby().resetLobby();
      lobby().setError("Room was closed by the server");
    });

    s.on("countdown", (data: { count: number }) => {
      game().setCountdown(data.count);
      game().setRaceStatus("countdown");
    });

    s.on("race_start", () => {
      game().setRaceStatus("racing");
    });

    s.on("game_state", (data: {
      players: Record<string, Omit<PlayerState, "id" | "name">>;
      raceTime: number;
      raceStatus: RaceStatus;
    }) => {
      game().setRaceTime(data.raceTime);
      game().setRaceStatus(data.raceStatus);
      Object.entries(data.players).forEach(([id, state]) => {
        game().setPlayerState(id, {
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
        setPlayerStateSnapshot(id, { id, name: id, ...state } as PlayerState);
      });
    });

    s.on("race_finish", (data: { results: Array<{ id: string; name: string; finishTime: number; position: number }> }) => {
      game().setRaceStatus("finished");
      game().setRaceResults(data.results);
    });

    s.on("chat_message", (data: { playerId: string; playerName: string; message: string; timestamp: number }) => {
      lobby().addChatMessage({
        playerId: data.playerId,
        playerName: data.playerName,
        message: data.message,
        timestamp: data.timestamp,
      });
    });
  }, []);

  const connect = useCallback(() => {
    if (!hasSocketUrl()) {
      useLobbyStore.getState().setIsConnected(false);
      return null;
    }
    const s = connectSocket();
    if (!s) return null;
    useLobbyStore.getState().setIsLoading(true);
    bindListeners(s);
    if (s.connected) useLobbyStore.getState().setIsLoading(false);
    return s;
  }, [bindListeners]);

  // Keep lobby isConnected in sync with the socket connection state machine.
  // Unbind on unmount so hot-reloads / navigation never stack listeners.
  useEffect(() => {
    const unsub = onConnectionStateChange((state) => {
      useLobbyStore.getState().setIsConnected(state === "CONNECTED");
      if (state === "CONNECTED" || state === "SERVER_OFFLINE" || state === "DISCONNECTED") {
        useLobbyStore.getState().setIsLoading(false);
      }
    });
    // Sync initial state on mount.
    useLobbyStore.getState().setIsConnected(getConnectionState() === "CONNECTED");
    return () => {
      unsub();
      listenersBoundRef.current = false;
    };
  }, []);

  // Auto-connect when a socket URL is configured so the lobby shows the
  // real state instead of sitting on DISCONNECTED.
  useEffect(() => {
    if (hasSocketUrl()) {
      connect();
    }
  }, [connect]);

  const createRoom = useCallback(async (playerName: string, raceSettings: RaceSettings) => {
    const lobby = useLobbyStore.getState();
    const game = useGameStore.getState();
    if (!hasSocketUrl()) {
      lobby.setError("Multiplayer server URL is not configured");
      return;
    }
    const s = connect();
    if (!s) {
      lobby.setError("Multiplayer is currently unavailable. Please try single-player or try again later.");
      return;
    }
    lobby.setIsLoading(true);
    lobby.setError(null);
    try {
      lobby.setPlayerName(playerName);
      const data = await emitWithResponse<{
        roomCode: string; players: PlayerState[]; settings: RaceSettings; isHost: boolean; playerId: string;
      }>("create_room", { settings: raceSettings, playerName, clientId: getClientId() }, "room_created", ROOM_ACTION_TIMEOUT_MS);
      lobby.setRoomCode(data.roomCode);
      lobby.setPlayers(data.players);
      lobby.setSettings(data.settings);
      lobby.setIsHost(true);
      const me = data.players.find((p) => p.id === data.playerId) ?? data.players[0];
      if (me) {
        game.setLocalPlayerId(me.id);
        game.addPlayer(me);
      }
      setActiveRoom({ roomCode: data.roomCode, playerName });
      lobby.setIsLoading(false);
    } catch (err) {
      lobby.setError(describeRoomError(err));
      lobby.setIsLoading(false);
    }
  }, [connect]);

  const joinRoom = useCallback(async (code: string, playerName: string) => {
    const lobby = useLobbyStore.getState();
    const game = useGameStore.getState();
    if (!hasSocketUrl()) {
      lobby.setError("Multiplayer is currently unavailable. Please try single-player or try again later.");
      return;
    }
    const s = connect();
    if (!s) {
      lobby.setError("Multiplayer is currently unavailable. Please try single-player or try again later.");
      return;
    }
    lobby.setIsLoading(true);
    lobby.setError(null);
    try {
      lobby.setPlayerName(playerName);
      const data = await emitWithResponse<{
        success: boolean; roomCode: string; players: PlayerState[]; settings: RaceSettings; isHost: boolean; playerId: string; hostId?: string;
      }>("join_room", { roomCode: code.toUpperCase(), playerName, clientId: getClientId() }, "joined_room", ROOM_ACTION_TIMEOUT_MS);
      if (!data.success) throw new Error("Failed to join room");
      lobby.setRoomCode(data.roomCode);
      lobby.setPlayers(data.players);
      lobby.setSettings(data.settings);
      lobby.setIsHost(data.hostId ? data.hostId === data.playerId : data.isHost);
      game.setLocalPlayerId(data.playerId);
      const me = data.players.find((p) => p.id === data.playerId);
      if (me) game.addPlayer(me);
      setActiveRoom({ roomCode: data.roomCode, playerName });
      lobby.setIsLoading(false);
    } catch (err) {
      lobby.setError(describeRoomError(err));
      lobby.setIsLoading(false);
    }
  }, [connect]);

  const leaveRoom = useCallback(() => {
    const lobby = useLobbyStore.getState();
    const s = initSocket();
    if (s?.connected && lobby.roomCode) {
      s.emit("leave_room");
    }
    clearActiveRoom();
    lobby.resetLobby();
  }, []);

  const setPlayerReady = useCallback((ready: boolean) => {
    useLobbyStore.getState().setReady(ready);
    if (!hasSocketUrl()) return;
    const s = initSocket();
    const code = useLobbyStore.getState().roomCode;
    if (s?.connected && code) {
      s.emit("ready_state", { roomCode: code, isReady: ready });
    }
  }, []);

  const startRace = useCallback(() => {
    if (!hasSocketUrl()) return;
    const s = initSocket();
    const code = useLobbyStore.getState().roomCode;
    if (s?.connected && code) {
      s.emit("start_race", { roomCode: code });
    }
  }, []);

  const sendChatMessage = useCallback((message: string) => {
    const trimmed = message.trim().slice(0, 200);
    if (!trimmed) return;
    if (!hasSocketUrl()) return;
    const s = initSocket();
    const code = useLobbyStore.getState().roomCode;
    if (s?.connected && code) {
      s.emit("chat_message", { roomCode: code, message: trimmed });
    }
  }, []);

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
    // Read live store state to avoid stale-closure gating.
    const liveStatus = useGameStore.getState().raceStatus;
    if (liveStatus !== "racing") return;
    const now = Date.now();
    if (now - lastUpdateSentRef.current < UPDATE_THROTTLE_MS) return;
    lastUpdateSentRef.current = now;
    const s = initSocket();
    const code = useLobbyStore.getState().roomCode;
    if (s?.connected && code) {
      s.emit("player_update", { ...update, roomCode: code });
    }
  }, []);

  const disconnect = useCallback(() => {
    destroySocket();
    listenersBoundRef.current = false;
    useLobbyStore.getState().setIsConnected(false);
  }, []);

  const localPlayer = Object.values(players).find((p: PlayerState) => p.id === localPlayerId);
  const remotePlayers = Object.values(players).filter((p: PlayerState) => p.id !== localPlayerId);

  return {
    isConnected: lobbyConnected && hasSocketUrl(),
    roomCode,
    players,
    remotePlayers,
    localPlayer,
    settings,
    isHost: lobbyHost,
    raceStatus,
    raceTime,
    countdown,
    createRoom,
    joinRoom,
    leaveRoom,
    setPlayerReady,
    startRace,
    sendChatMessage,
    sendPlayerUpdate,
    disconnect,
    connect,
    getInterpolatedPosition: getInterpolatedPlayerState,
    getInterpolatedRotation,
  };
};
