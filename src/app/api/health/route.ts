import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Web-app liveness endpoint. The realtime Socket.IO server exposes its own
 * richer /health (rooms, players, uptime); this one is for uptime monitors on
 * the Vercel deployment and reports whether multiplayer is wired up.
 */
export const GET = () => {
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL?.trim() ?? "";
  return NextResponse.json(
    {
      ok: true,
      service: "velocity-nexus-web",
      multiplayerConfigured: socketUrl.length > 0,
      uptime: Math.round(process.uptime()),
      timestamp: Date.now(),
    },
    { headers: { "cache-control": "no-store" } },
  );
};
