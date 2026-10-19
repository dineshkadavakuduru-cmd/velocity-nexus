import { Server } from "socket.io";
import { createServer } from "http";
import { setupSocketServer } from "./handlers";
import { rooms } from "./rooms";

const PORT = Number(process.env.PORT) || 3001;

/**
 * Comma-separated list of allowed browser origins, e.g.
 * ALLOWED_ORIGINS=https://gt-umber-alpha.vercel.app,https://*.vercel.app,http://localhost:3000
 *
 * Entries may contain a single "*" wildcard so preview deployments work, e.g.
 * `https://*.vercel.app`. Defaults to localhost dev + the production web app.
 * "*" only allows every origin when explicitly set (never recommended).
 */
const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseOrigins = (): RegExp[] | "*" => {
  const raw = process.env.ALLOWED_ORIGINS;
  if (raw && raw.trim() === "*") {
    console.warn("WARNING: CORS allows all origins (ALLOWED_ORIGINS=*)");
    return "*";
  }
  const list = (
    raw && raw.trim() !== ""
      ? raw.split(",")
      : ["http://localhost:3000", "https://gt-umber-alpha.vercel.app", "https://*.vercel.app"]
  )
    .map((s) => s.trim())
    .filter(Boolean);

  return list.map((entry) => {
    if (!entry.includes("*")) return new RegExp(`^${escapeRegExp(entry)}$`);
    // Escape everything, then turn the escaped "\*" back into a wildcard that
    // does not cross a dot, so `https://*.vercel.app` also matches `gt-foo.vercel.app`.
    return new RegExp(`^${escapeRegExp(entry).replace(/\\\*/g, "[^.]*")}$`);
  });
};

const allowedOrigins = parseOrigins();
const allowAllOrigins = allowedOrigins === "*";

const httpServer = createServer((req, res) => {
  if (req.url === "/health" || req.url?.startsWith("/health?")) {
    res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
    res.end(
      JSON.stringify({
        ok: true,
        status: "ok",
        rooms: rooms.size,
        players: Array.from(rooms.values()).reduce((n, r) => n + r.players.size, 0),
        uptime: Math.round(process.uptime()),
        timestamp: Date.now(),
      }),
    );
    return;
  }
  res.writeHead(404);
  res.end();
});

const io = new Server(httpServer, {
  cors: {
    origin: allowAllOrigins
      ? true
      : (origin, callback) => {
          // Non-browser clients (native apps, integration tests) send no Origin.
          if (!origin) return callback(null, true);
          const ok = (allowedOrigins as RegExp[]).some((re) => re.test(origin));
          callback(null, ok);
        },
    methods: ["GET", "POST"],
  },
});

setupSocketServer(io);

httpServer.listen(PORT, () => {
  console.log(`Velocity Nexus server listening on port ${PORT}`);
});

const shutdown = () => {
  console.log("Shutting down...");
  io.close(() => {
    httpServer.close(() => process.exit(0));
  });
  setTimeout(() => process.exit(0), 5000).unref();
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
