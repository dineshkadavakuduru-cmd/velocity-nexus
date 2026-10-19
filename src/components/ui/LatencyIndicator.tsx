"use client";

import { useEffect, useState } from "react";
import { COLORS } from "@/lib/constants";
import {
  ConnectionState,
  getConnectionState,
  getLatency,
  hasSocketUrl,
  onConnectionStateChange,
  onLatencyChange,
} from "@/lib/socket";

const qualityColor = (ms: number, state: ConnectionState): string => {
  if (state !== "CONNECTED") return COLORS.textMuted;
  if (ms < 80) return COLORS.neonGreen;
  if (ms < 180) return COLORS.neonOrange;
  return COLORS.accent;
};

const qualityLabel = (ms: number): string => {
  if (ms < 80) return "good";
  if (ms < 180) return "fair";
  return "poor";
};

/**
 * Small always-on latency pill. Reflects the Socket.IO round-trip measured by
 * the client-side heartbeat; greyed out while not connected.
 */
export const LatencyIndicator = ({ className = "" }: { className?: string }) => {
  const [latency, setLatency] = useState<number | null>(getLatency());
  const [state, setState] = useState<ConnectionState>(getConnectionState);

  useEffect(() => {
    const offLatency = onLatencyChange(setLatency);
    const offState = onConnectionStateChange(setState);
    return () => {
      offLatency();
      offState();
    };
  }, []);

  if (!hasSocketUrl()) return null;

  const connected = state === "CONNECTED";
  const color = connected && latency !== null ? qualityColor(latency, state) : COLORS.textMuted;
  const text = connected ? (latency === null ? "— ms" : `${latency} ms`) : state === "RECONNECTING" ? "reconnecting" : "offline";

  return (
    <div
      className={`px-3 py-1 rounded-full text-xs font-display font-bold flex items-center gap-2 ${className}`}
      style={{ background: "rgba(0,0,0,0.65)", border: `1px solid ${COLORS.border}`, color: COLORS.textSecondary }}
      title={connected && latency !== null ? `Latency: ${qualityLabel(latency)}` : "Multiplayer latency"}
      role="status"
      aria-live="off"
    >
      <span className="inline-block w-2 h-2 rounded-full" style={{ background: color }} />
      <span>{text}</span>
    </div>
  );
};

export default LatencyIndicator;
