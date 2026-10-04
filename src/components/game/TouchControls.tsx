"use client";

import { useEffect, useState } from "react";
import { isTouchDevice, setTouchInput } from "@/lib/touch";
import { COLORS } from "@/lib/constants";

const btnStyle: React.CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: 9999,
  border: `1px solid ${COLORS.border}`,
  background: "rgba(10, 10, 10, 0.55)",
  color: COLORS.textPrimary,
  fontWeight: 800,
  fontSize: 12,
  letterSpacing: 1,
  touchAction: "none",
  userSelect: "none",
  WebkitUserSelect: "none",
};

const bindHold = (key: "forward" | "backward" | "left" | "right" | "handbrake" | "nitro") => ({
  onPointerDown: (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setTouchInput({ [key]: true });
  },
  onPointerUp: (e: React.PointerEvent) => {
    e.preventDefault();
    setTouchInput({ [key]: false });
  },
  onPointerCancel: () => setTouchInput({ [key]: false }),
  onPointerLeave: () => setTouchInput({ [key]: false }),
  onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
});

/** On-screen driving controls. Rendered only on touch-capable devices. */
export const TouchControls = ({ onPause }: { onPause?: () => void }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(isTouchDevice());
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] pointer-events-none">
      <div className="flex items-end justify-between px-4 pb-5">
        <div className="flex gap-3 pointer-events-auto">
          <button aria-label="Steer left" style={btnStyle} {...bindHold("left")}>
            ◀
          </button>
          <button aria-label="Steer right" style={btnStyle} {...bindHold("right")}>
            ▶
          </button>
        </div>

        <div className="flex gap-3 pointer-events-auto items-end">
          {onPause && (
            <button
              aria-label="Pause"
              style={{ ...btnStyle, width: 48, height: 48 }}
              onClick={onPause}
            >
              II
            </button>
          )}
          <button aria-label="Drift" style={{ ...btnStyle, borderColor: COLORS.secondary }} {...bindHold("handbrake")}>
            DRIFT
          </button>
          <button aria-label="Nitro" style={{ ...btnStyle, borderColor: COLORS.primary }} {...bindHold("nitro")}>
            NITRO
          </button>
          <button aria-label="Brake" style={{ ...btnStyle, borderColor: COLORS.accent }} {...bindHold("backward")}>
            BRAKE
          </button>
          <button aria-label="Accelerate" style={{ ...btnStyle, width: 76, height: 76, borderColor: COLORS.neonGreen }} {...bindHold("forward")}>
            GAS
          </button>
        </div>
      </div>
    </div>
  );
};

export default TouchControls;
