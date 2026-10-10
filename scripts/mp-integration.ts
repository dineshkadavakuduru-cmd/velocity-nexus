// End-to-end multiplayer integration test.
//
// Boots the compiled Socket.IO server on an isolated port and drives it with
// real socket.io-client connections. No mocks: these are the exact events the
// browser client emits/receives.
//
//   npm run server:build && npx tsx scripts/mp-integration.ts
//
// Covers: invalid/unknown room codes, room capacity, create/join/room_update,
// in-race movement synchronization, disconnect signalling and reconnect
// re-association (same client identity reclaims its slot).
import assert from "node:assert";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { io, type Socket } from "socket.io-client";

const PORT = Number(process.env.MP_TEST_PORT) || 3299;
const URL = `http://127.0.0.1:${PORT}`;

const sockets: Socket[] = [];
let passed = 0;
const ok = (name: string, fn: () => void) => {
  fn();
  passed++;
  console.log("ok - " + name);
};

const waitForServer = async (timeoutMs = 20000) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${URL}/health`);
      if (res.ok) return (await res.json()) as { ok: boolean; rooms: number };
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("server did not become healthy");
};

const connect = (): Socket => {
  const s = io(URL, { transports: ["websocket"], forceNew: true, reconnection: false, timeout: 5000 });
  sockets.push(s);
  return s;
};

const nextEvent = <T = unknown>(s: Socket, event: string, timeoutMs = 6000): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      s.off(event, onEvent);
      reject(new Error(`timed out waiting for "${event}"`));
    }, timeoutMs);
    const onEvent = (data: T) => {
      clearTimeout(timer);
      resolve(data);
    };
    s.once(event, onEvent);
  });

const waitForEvent = <T = unknown>(s: Socket, event: string, predicate: (d: T) => boolean, timeoutMs = 6000) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      s.off(event, onEvent);
      reject(new Error(`timed out waiting for "${event}" matching predicate`));
    }, timeoutMs);
    const onEvent = (data: T) => {
      if (predicate(data)) {
        clearTimeout(timer);
        s.off(event, onEvent);
        resolve();
      }
    };
    s.on(event, onEvent);
  });

const withTimeout = <T>(p: Promise<T>, ms: number, label: string): Promise<T> =>
  Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`timed out: ${label}`)), ms)),
  ]);

type Player = { id: string; name: string; isReady: boolean; isConnected: boolean };
type RoomCreated = { roomCode: string; players: Player[]; isHost: boolean };
type JoinedRoom = { success: boolean; roomCode: string; players: Player[]; playerId: string };
type RoomUpdate = { players: Player[]; roomCode: string };

async function main() {
  // Hard watchdog so a hung await can never leave an orphaned server/listener.
  const watchdog = setTimeout(() => {
    console.error("\nGLOBAL TIMEOUT: integration test did not finish in 60s");
    process.exit(2);
  }, 60000);
  watchdog.unref();

  // Run the compiled server in-process so there is no orphaned child to manage.
  process.env.PORT = String(PORT);
  process.env.ALLOWED_ORIGINS = "*";
  await import(pathToFileURL(path.join(__dirname, "..", "server", "dist", "index.js")).href);

  const health = await waitForServer();
  ok("GET /health returns ok", () => assert.strictEqual(health.ok, true));

  // --- invalid / unknown room codes ---
  {
    const a = connect();
    await nextEvent(a, "connect");
    a.emit("join_room", { roomCode: "bad!", playerName: "X" });
    const msg = await nextEvent<string>(a, "error");
    ok("malformed room code -> Invalid room code", () => assert.match(msg, /Invalid room code/));

    a.emit("join_room", { roomCode: "ZZZZZZ", playerName: "X" });
    const msg2 = await nextEvent<string>(a, "error");
    ok("valid-but-unknown room code -> Room not found", () => assert.match(msg2, /Room not found/));
    a.close();
  }

  // --- create + join + live room_update ---
  const host = connect();
  await nextEvent(host, "connect");
  const createdPromise = nextEvent<RoomCreated>(host, "room_created");
  host.emit("create_room", {
    settings: { trackId: "neon-tokyo", carId: "phantom-gt", laps: 3, maxPlayers: 8 },
    playerName: "Host",
    clientId: "client-host",
  });
  const created = await createdPromise;
  ok("host creates room and gets 6-char code", () => assert.match(created.roomCode, /^[A-Z2-9]{6}$/));
  ok("host is flagged host and present in player list", () => {
    assert.strictEqual(created.isHost, true);
    assert.strictEqual(created.players.length, 1);
    assert.strictEqual(created.players[0].name, "Host");
  });

  const guest = connect();
  await nextEvent(guest, "connect");
  const updateAfterJoin = waitForEvent(host, "room_update", (d: RoomUpdate) => d.players.length === 2);
  const joinedPromise = nextEvent<JoinedRoom>(guest, "joined_room");
  guest.emit("join_room", { roomCode: created.roomCode, playerName: "Guest", clientId: "client-guest" });
  const joined = await joinedPromise;
  ok("guest joins with room code", () => {
    assert.strictEqual(joined.success, true);
    assert.strictEqual(joined.roomCode, created.roomCode);
    assert.strictEqual(joined.players.length, 2);
  });
  await updateAfterJoin;
  ok("host receives room_update showing both players", () => assert.ok(true));

  // --- room capacity ---
  {
    const capHost = connect();
    await nextEvent(capHost, "connect");
    const c = await withTimeout(
      new Promise<RoomCreated>((resolve) => {
        capHost.once("room_created", resolve);
        capHost.emit("create_room", { settings: { maxPlayers: 2 }, playerName: "H" });
      }),
      6000,
      "capHost create_room",
    );
    const p2 = connect();
    await nextEvent(p2, "connect");
    const j2 = nextEvent<JoinedRoom>(p2, "joined_room");
    p2.emit("join_room", { roomCode: c.roomCode, playerName: "P2" });
    await j2;
    const p3 = connect();
    await nextEvent(p3, "connect");
    p3.emit("join_room", { roomCode: c.roomCode, playerName: "P3" });
    const msg = await nextEvent<string>(p3, "error");
    ok("third player into a 2-slot room -> Room is full", () => assert.match(msg, /Room is full/));
    capHost.close();
    p2.close();
    p3.close();
  }

  // --- in-race movement synchronization ---
  const raceStart = nextEvent<{ startTime: number }>(guest, "race_start", 10000);
  guest.emit("ready_state", { roomCode: created.roomCode, isReady: true });
  await raceStart;
  ok("countdown completes and race_start fires", () => assert.ok(true));

  const syncedState = withTimeout(
    new Promise<{ players: Record<string, { position: { x: number } }> }>((resolve) => {
      guest.on("game_state", (d: { players: Record<string, { position: { x: number } }> }) => {
        if (d.players[created.players[0].id]?.position?.x === 5) resolve(d);
      });
    }),
    6000,
    "movement sync game_state",
  );
  host.emit("player_update", {
    roomCode: created.roomCode,
    position: { x: 5, y: 1, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    steering: 0,
    throttle: 1,
    brake: false,
    nitro: false,
    currentLap: 1,
    checkpoint: 0,
  });
  await syncedState;
  ok("guest receives host position via game_state", () => assert.ok(true));

  // --- disconnect signalling ---
  const disconnectSeen = waitForEvent(
    host,
    "room_update",
    (d: RoomUpdate) => d.players.some((p) => p.name === "Guest" && p.isConnected === false),
  );
  guest.close();
  await disconnectSeen;
  ok("disconnect marks the player isConnected=false (slot held for grace)", () => assert.ok(true));

  // --- reconnect re-association (same client identity reclaims its slot) ---
  {
    const reHost = connect();
    await nextEvent(reHost, "connect");
    const c = await withTimeout(
      new Promise<RoomCreated>((resolve) => {
        reHost.once("room_created", resolve);
        reHost.emit("create_room", { settings: { maxPlayers: 8 }, playerName: "ReHost" });
      }),
      6000,
      "reHost create_room",
    );
    const reGuest = connect();
    await nextEvent(reGuest, "connect");
    const firstJoin = nextEvent<JoinedRoom>(reGuest, "joined_room");
    reGuest.emit("join_room", { roomCode: c.roomCode, playerName: "ReGuest", clientId: "stable-1" });
    const firstId = (await firstJoin).playerId;

    reGuest.close(); // simulated network drop; slot held during grace
    await new Promise((r) => setTimeout(r, 500));

    const reGuest2 = connect();
    await nextEvent(reGuest2, "connect");
    const joined2 = nextEvent<JoinedRoom>(reGuest2, "joined_room");
    reGuest2.emit("join_room", { roomCode: c.roomCode, playerName: "ReGuest", clientId: "stable-1" });
    const back = await joined2;
    ok("reconnect reclaims the held slot with no duplicate ghost row", () => {
      assert.strictEqual(back.players.length, 2);
      assert.ok(!back.players.some((p) => p.id === firstId), "stale socket id still present");
      const me = back.players.find((p) => p.id === back.playerId);
      assert.ok(me && me.name === "ReGuest");
    });
    ok("reconnected socket is the room's live player id", () =>
      assert.strictEqual(back.playerId, reGuest2.id));
    reHost.close();
    reGuest2.close();
  }

  console.log(`\n${passed} multiplayer integration assertions passed.`);
}

main()
  .catch((err) => {
    console.error("\nINTEGRATION TEST FAILED:\n", err);
    process.exitCode = 1;
  })
  .finally(() => {
    sockets.forEach((s) => s.close());
    process.exit(process.exitCode ?? 0);
  });
