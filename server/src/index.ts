import { Server } from "socket.io";
import { createServer } from "http";
import { setupSocketServer } from "./handlers";
import { rooms } from "./rooms";

const PORT = Number(process.env.PORT) || 3001;

/**
 * Comma-separated list of allowed browser origins, e.g.
 * ALLOWED_ORIGINS=https://gt-umber-alpha.vercel.app,http://localhost:3000
 * Defaults to localhost dev + production web app. "*" is only allowed when
 * explicitly set (never in production).
 */
const parseOrigins = (): string | string[] => {
  const raw = process.env.ALLOWED_ORIGINS;
  if (raw && raw.trim() === "*") {
    console.warn("WARNING: CORS allows all origins (ALLOWED_ORIGINS=*)");
    return "*";
  }
  if (raw && raw.trim() !== "") {
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return ["http://localhost:3000", "https://gt-umber-alpha.vercel.app"];
};

const httpServer = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, rooms: rooms.size, uptime: process.uptime() }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const io = new Server(httpServer, {
  cors: {
    origin: parseOrigins(),
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
