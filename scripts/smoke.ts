// Minimal smoke test: `npx tsx scripts/smoke.ts` (also `npm run test:smoke`).
// Covers config data, store logic, socket fallback, and server validation
// without a browser or network connection.
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.join(__dirname, "..");
const load = (rel: string) => import(pathToFileURL(path.join(root, rel)).href);

let passed = 0;
const ok = (name: string, fn: () => void) => {
  fn();
  passed++;
  console.log("ok - " + name);
};

async function main() {
  // --- routes exist ---
  for (const r of ["page.tsx", "garage/page.tsx", "tracks/page.tsx", "lobby/page.tsx", "race/page.tsx", "results/page.tsx"]) {
    ok("route src/app/" + r, () => assert.ok(fs.existsSync(path.join(root, "src", "app", r)), r));
  }

  // --- game config ---
  const constants = await load("src/lib/constants.ts");
  ok("6 cars with unique ids", () => {
    assert.strictEqual(constants.CAR_CONFIGS.length, 6);
    assert.strictEqual(new Set(constants.CAR_CONFIGS.map((c: { id: string }) => c.id)).size, 6);
  });
  ok("3 tracks with checkpoints + grid", () => {
    assert.strictEqual(constants.TRACK_CONFIGS.length, 3);
    for (const t of constants.TRACK_CONFIGS) {
      assert.strictEqual(t.checkpoints.length, 10, t.id);
      assert.strictEqual(t.startPositions.length, 8, t.id);
      assert.ok(t.thumbnail.endsWith(".jpg"), t.id);
    }
  });
  ok("quality presets", () => {
    for (const q of ["Ultra", "High", "Medium", "Low"]) assert.ok(constants.QUALITY_PRESETS[q], q);
  });

  // --- game store ---
  const { useGameStore } = await load("src/stores/gameStore.ts");
  ok("resetRace + results flow", () => {
    const g = useGameStore.getState();
    g.resetRace();
    assert.strictEqual(useGameStore.getState().raceStatus, "lobby");
    assert.strictEqual(useGameStore.getState().raceFinished, false);
    g.setRaceResults([{ id: "a", name: "You", finishTime: 60, position: 1 }]);
    assert.strictEqual(useGameStore.getState().raceFinished, true);
    g.setSelectedCar("hyperion");
    assert.strictEqual(useGameStore.getState().selectedCarId, "hyperion");
    g.resetRace();
  });
  ok("game players add/remove", () => {
    const g = useGameStore.getState();
    const p = { id: "p1", name: "P1" };
    g.addPlayer(p as never);
    assert.ok(useGameStore.getState().players["p1"]);
    g.removePlayer("p1");
    assert.ok(!useGameStore.getState().players["p1"]);
  });

  // --- lobby store ---
  const { useLobbyStore } = await load("src/stores/lobbyStore.ts");
  ok("lobby dedupe + chat cap", () => {
    const l = useLobbyStore.getState();
    l.resetLobby();
    l.addPlayer({ id: "x", name: "X" } as never);
    l.addPlayer({ id: "x", name: "X" } as never);
    assert.strictEqual(useLobbyStore.getState().players.length, 1);
    for (let i = 0; i < 150; i++) {
      l.addChatMessage({ playerId: "x", playerName: "X", message: "m" + i, timestamp: i });
    }
    assert.ok(useLobbyStore.getState().messages.length <= 100);
    l.resetLobby();
    assert.strictEqual(useLobbyStore.getState().messages.length, 0);
  });

  // --- socket single-player fallback (no network attempted) ---
  delete process.env.NEXT_PUBLIC_SOCKET_URL;
  const socket = await load("src/lib/socket.ts");
  ok("no socket url -> single-player fallback", () => {
    assert.strictEqual(socket.hasSocketUrl(), false);
    assert.strictEqual(socket.initSocket(), null);
  });

  // --- server validation ---
  const validation = await load("server/src/validation.ts");
  ok("player name sanitized", () => {
    assert.strictEqual(validation.sanitizePlayerName("<b>Alice</b>   "), "Alice");
    assert.strictEqual(validation.sanitizePlayerName(""), "Player");
  });
  ok("room codes validated", () => {
    assert.strictEqual(validation.validateRoomCode("ABCD23"), "ABCD23");
    assert.strictEqual(validation.validateRoomCode("bad!"), null);
    assert.strictEqual(validation.validateRoomCode("ABCDEF1"), null); // 0/1 excluded
  });
  ok("movement plausibility", () => {
    const a = { x: 0, y: 0, z: 0 };
    assert.strictEqual(validation.isPlausibleMovement(a, { x: 5, y: 0, z: 0 }, 1, 1), true);
    assert.strictEqual(validation.isPlausibleMovement(a, { x: 5000, y: 0, z: 0 }, 1, 1), false);
    assert.strictEqual(validation.isPlausibleMovement(a, { x: 1, y: 0, z: 0 }, 1, 5), false);
  });
  ok("player update clamped", () => {
    const u = validation.clampPlayerUpdate({
      position: { x: 999999, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      steering: 5,
      throttle: -5,
      brake: 1,
      nitro: 0,
      currentLap: 99,
      checkpoint: -3,
    });
    assert.ok(u);
    assert.ok(u.position.x <= 10000);
    assert.strictEqual(u.steering, 1);
    assert.strictEqual(u.throttle, -1);
  });

  console.log(`\n${passed} smoke assertions passed.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
