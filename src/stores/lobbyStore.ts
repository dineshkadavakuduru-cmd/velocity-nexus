import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { PlayerState, RaceSettings, RaceStatus } from "@/types";
import { DEFAULT_RACE_SETTINGS } from "@/lib/constants";

interface LobbyState {
  roomCode: string | null;
  players: PlayerState[];
  settings: RaceSettings;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  error: string | null;
  isLoading: boolean;

  setRoomCode: (code: string) => void;
  setPlayers: (players: PlayerState[]) => void;
  addPlayer: (player: PlayerState) => void;
  removePlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<PlayerState>) => void;
  setSettings: (settings: Partial<RaceSettings>) => void;
  setIsHost: (isHost: boolean) => void;
  setReady: (ready: boolean) => void;
  setIsConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  resetLobby: () => void;
}

export const useLobbyStore = create<LobbyState>()(
  devtools((set) => ({
    roomCode: null,
    players: [],
    settings: { ...DEFAULT_RACE_SETTINGS },
    isHost: false,
    isReady: false,
    isConnected: false,
    error: null,
    isLoading: false,

    setRoomCode: (code) => set({ roomCode: code }),

    setPlayers: (players) => set({ players }),

    addPlayer: (player) =>
      set((prev) => {
        if (prev.players.find((p) => p.id === player.id)) {
          return prev;
        }
        return { players: [...prev.players, player] };
      }),

    removePlayer: (playerId) =>
      set((prev) => ({
        players: prev.players.filter((p) => p.id !== playerId),
      })),

    updatePlayer: (playerId, updates) =>
      set((prev) => ({
        players: prev.players.map((p) =>
          p.id === playerId ? { ...p, ...updates } : p
        ),
      })),

    setSettings: (settings) =>
      set((prev) => ({
        settings: { ...prev.settings, ...settings },
      })),

     setIsHost: (isHost) => set({ isHost }),

     setReady: (ready) => set({ isReady: ready }),

    setIsConnected: (connected) => set({ isConnected: connected }),

    setError: (error) => set({ error }),

    setIsLoading: (loading) => set({ isLoading: loading }),

    resetLobby: () =>
      set({
        roomCode: null,
        players: [],
        settings: { ...DEFAULT_RACE_SETTINGS },
        isHost: false,
        isReady: false,
        isConnected: false,
        error: null,
        isLoading: false,
      }),
  }))
);
