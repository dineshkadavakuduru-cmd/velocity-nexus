"use client";

/** Best-effort WebGL availability probe (WebGL2 preferred, WebGL1 fallback). */
export const isWebGLAvailable = (): boolean => {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ??
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl");
    if (!gl) return false;
    // Some privacy-hardened browsers return a context that immediately loses.
    if (typeof (gl as WebGLRenderingContext).getParameter !== "function") return false;
    return true;
  } catch {
    return false;
  }
};

export const WEBGL_FALLBACK_MESSAGE =
  "Your browser/device cannot run the 3D racing experience.";
