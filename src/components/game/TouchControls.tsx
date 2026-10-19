"use client";

import { useEffect, useState } from "react";
import { isTouchDevice, setTouchInput } from "@/lib/touch";
import { COLORS } from "@/lib/constants";

/**
 * Fluid sizing so the pads fit a 375px-wide phone without overflowing while
 * staying comfortably tappable (>=44px) on larger screens.
 */
const btnStyle: React.CSSProperties = {
  width: "clamp(46px, 11vw, 64px)",
  height: "clamp(46px, 11vw, 64px)",
  borderRadius: 9999,
  border: `1px solid ${COLORS.border}`,
  background: "rgba(10, 10, 10, 0.55)",
  color: COLORS.textPrimary,
  fontWeight: 800,
  fontSize: 11,
  letterSpacing: 0.5,
  touchAction: "none",
  userSelect: "none",
  WebkitUserSelect: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
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

  // Release any held input if the controls unmount mid-press.
  useEffect(() => {
    return () => setTouchInput({ forward: false, backward: false, left: false, right: false, handbrake: false, nitro: false });
  }, []);

  if (!visible) return null;

  const gap = "clamp(6px, 1.5vw, 12px)";

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] pointer-events-none" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex items-end justify-between gap-2 px-2 sm:px-4 pb-3 sm:pb-5">
        <div className="flex pointer-events-auto" style={{ gap }}>
          <button aria-label="Steer left" style={{ ...btnStyle, width: "clamp(46px, 11vw, 64px)", height: "clamp(46px, 11vw, 64px)" }} {...bindHold("left")}>
            ◀
          </button>
          <button aria-label="Steer right" style={{ ...btnStyle, width: "clamp(46px, 11vw, 64px)", height: "clamp(46px, 11vw, 64px)" }} {...bindHold("right")}>
            ▶
          </button>
        </div>

        <div className="flex pointer-events-auto items-end" style={{ gap }}>
          {onPause && (
            <button
              aria-label="Pause"
              style={{ ...btnStyle, width: "clamp(40px, 9vw, 48px)", height: "clamp(40px, 9vw, 48px)" }}
              onClick={onPause}
            >
              II
            </button>
          )}
          <button aria-label="Drift" style={{ ...btnStyle, width: "clamp(46px, 11vw, 64px)", height: "clamp(46px, 11vw, 64px)", borderColor: COLORS.secondary }} {...bindHold("handbrake")}>
            DRIFT
          </button>
          <button aria-label="Nitro" style={{ ...btnStyle, width: "clamp(46px, 11vw, 64px)", height: "clamp(46px, 11vw, 64px)", borderColor: COLORS.primary }} {...bindHold("nitro")}>
            NITRO
          </button>
          <button aria-label="Brake" style={{ ...btnStyle, width: "clamp(46px, 11vw, 64px)", height: "clamp(46px, 11vw, 64px)", borderColor: COLORS.accent }} {...bindHold("backward")}>
            BRAKE
          </button>
          <button aria-label="Accelerate" style={{ ...btnStyle, width: "clamp(58px, 14vw, 76px)", height: "clamp(58px, 14vw, 76px)", borderColor: COLORS.neonGreen }} {...bindHold("forward")}>
            GAS
          </button>
        </div>
      </div>
    </div>
  );
};

export default TouchControls;
