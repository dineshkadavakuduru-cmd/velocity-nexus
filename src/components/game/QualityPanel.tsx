"use client";

import { useSettingsStore } from "@/stores/settingsStore";
import { COLORS } from "@/lib/constants";
import type { QualityPreset } from "@/types";

const PRESETS: QualityPreset[] = ["Low", "Medium", "High", "Ultra"];

/**
 * Quality settings with real effect toggles. Everything here maps to an
 * actual rendering switch in GameCanvas / PostProcessing — no placebo UI.
 */
export const QualityPanel = () => {
  const quality = useSettingsStore((s) => s.quality);
  const setQuality = useSettingsStore((s) => s.setQuality);
  const postProcessing = useSettingsStore((s) => s.postProcessing);
  const setPostProcessing = useSettingsStore((s) => s.setPostProcessing);
  const bloom = useSettingsStore((s) => s.postProcessing);
  const shadows = useSettingsStore((s) => s.shadows);
  const setShadows = useSettingsStore((s) => s.setShadows);

  return (
    <div
      className="rounded-xl px-4 py-3 text-xs"
      style={{ background: "rgba(0,0,0,0.65)", border: `1px solid ${COLORS.border}` }}
    >
      <div className="font-display font-bold tracking-widest mb-2" style={{ color: COLORS.textSecondary }}>
        QUALITY
      </div>
      <div className="flex gap-2 mb-3">
        {(["Low", "Medium", "High"] as QualityPreset[]).map((p) => (
          <button
            key={p}
            onClick={() => setQuality(p)}
            className="px-3 py-1 rounded-full font-bold"
            style={{
              border: `1px solid ${quality === p ? COLORS.primary : COLORS.border}`,
              color: quality === p ? COLORS.primary : COLORS.textSecondary,
              background: quality === p ? `${COLORS.primary}15` : "transparent",
            }}
          >
            {p.toUpperCase()}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 cursor-pointer mb-2">
        <input
          type="checkbox"
          checked={postProcessing}
          onChange={(e) => setPostProcessing(e.target.checked)}
        />
        <span>Bloom + post-processing {bloom ? "on" : "off"}</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={shadows}
          onChange={(e) => setShadows(e.target.checked)}
        />
        <span>Shadows {shadows ? "on" : "off"}</span>
      </label>
      {PRESETS.includes(quality) && quality === "Ultra" && (
        <p className="mt-2 text-secondary">Ultra enables stats overlay for debugging.</p>
      )}
    </div>
  );
};

export default QualityPanel;
