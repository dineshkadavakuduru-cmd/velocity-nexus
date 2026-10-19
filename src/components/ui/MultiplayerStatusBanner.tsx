"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { COLORS } from "@/lib/constants";
import {
  ConnectionState,
  getConnectionState,
  hasSocketUrl,
  onConnectionStateChange,
} from "@/lib/socket";

const COPY: Record<ConnectionState, { label: string; hint: string; color: string }> = {
  CONNECTING: {
    label: "Connecting to race server…",
    hint: "Setting up a realtime connection.",
    color: COLORS.neonOrange,
  },
  CONNECTED: { label: "Connected", hint: "", color: COLORS.neonGreen },
  RECONNECTING: {
    label: "Connection lost — reconnecting…",
    hint: "Your slot is held briefly; hang tight.",
    color: COLORS.neonOrange,
  },
  DISCONNECTED: {
    label: "Disconnected from race server",
    hint: "Attempting to restore the connection.",
    color: COLORS.accent,
  },
  SERVER_OFFLINE: {
    label: "Race server unreachable",
    hint: "It may be starting up (idle free hosts sleep). Retrying automatically — you can also retry or play single-player.",
    color: COLORS.accent,
  },
};

/**
 * In-game connection banner. Rendered during a multiplayer race so an
 * unreachable or cold-starting server is obvious instead of a frozen track.
 */
export const MultiplayerStatusBanner = ({ visible = true }: { visible?: boolean }) => {
  const [state, setState] = useState<ConnectionState>(getConnectionState);

  useEffect(() => {
    setState(getConnectionState());
    return onConnectionStateChange(setState);
  }, []);

  if (!visible || !hasSocketUrl() || state === "CONNECTED") return null;
  const copy = COPY[state];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed top-16 left-1/2 -translate-x-1/2 z-[140] max-w-md w-[92%] px-4 py-2 rounded-xl text-center"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        style={{ background: "rgba(0,0,0,0.82)", border: `1px solid ${copy.color}` }}
        role="status"
        aria-live="polite"
      >
        <div className="font-display font-bold text-sm" style={{ color: copy.color }}>
          {copy.label}
        </div>
        {copy.hint && <div className="text-xs text-secondary mt-0.5">{copy.hint}</div>}
        {state === "SERVER_OFFLINE" && (
          <div className="mt-2 flex items-center justify-center gap-3 text-xs">
            <button
              onClick={() => window.location.reload()}
              className="underline underline-offset-4 text-secondary hover:text-foreground"
            >
              Retry
            </button>
            <span className="text-secondary">·</span>
            <a href="/race?mode=single" className="underline underline-offset-4 text-secondary hover:text-foreground">
              Single-player
            </a>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default MultiplayerStatusBanner;
