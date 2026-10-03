import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { PlayerState, RaceSettings } from "@/types";
import { DEFAULT_RACE_SETTINGS } from "@/lib/constants";

export type ChatMessage = {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
};

interface LobbyState {
  roomCode: string | null;
  players: PlayerState[];
  settings: RaceSettings;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  error: string | null;
  isLoading: boolean;
  messages: ChatMessage[];

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
  addChatMessage: (message: Omit<ChatMessage, "id">) => void;
  clearChat: () => void;
  resetLobby: () => void;
}

let chatSeq = 0;

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
    messages: [],

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

    addChatMessage: (message) =>
      set((prev) => ({
        messages: [...prev.messages.slice(-99), { ...message, id: `${message.timestamp}-${chatSeq++}` }],
      })),

    clearChat: () => set({ messages: [] }),

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
        messages: [],
      }),
  }))
);
