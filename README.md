# Velocity Nexus

Browser 3D arcade racer (Next.js + Three.js) with single-player vs AI and
real-time multiplayer rooms over Socket.IO.

- Live: https://gt-umber-alpha.vercel.app/
- Repo: https://github.com/dineshkadavakuduru-cmd/velocity-nexus

## Features

- 6 procedural supercars with distinct specs (top speed, grip, nitro, drift)
- 3 tracks: Neon Tokyo (night/rain), Dubai Highway (sunset), Monaco Coast (day)
- Single-player vs 5 AI + multiplayer rooms for up to 8 players
- Drift scoring, nitro boost, damage model, 3 camera-affecting quality presets
- Lobby with room codes, ready states, live chat, countdown + synced race clock

## Controls

| Action     | Key              |
| ---------- | ---------------- |
| Accelerate | ArrowUp          |
| Brake      | ArrowDown        |
| Steer      | ArrowLeft/Right  |
| Handbrake  | Space            |
| Nitro      | Shift            |
| Camera     | C                |
| Pause      | Escape           |

## Quickstart

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev          # web on http://localhost:3000
```

Multiplayer needs the socket server too (second terminal):

```powershell
cd server; npm install; npm run dev   # socket on http://localhost:3001
```

`.env.local` controls the mode: `NEXT_PUBLIC_SOCKET_URL=http://localhost:3001`
for local multiplayer, empty value = single-player only (no connection attempt).

## Production deploy

Web (Vercel, automatic on push to `main`) + socket server (separate host)
is the only supported topology — Vercel cannot hold the persistent
Socket.IO process in `server/`.

1. Deploy `server/` via `Dockerfile` (Railway / Render / Fly):
   production runs `node dist/index.js`, binds `$PORT`, exposes `/health`.
2. Set server env: `ALLOWED_ORIGINS=https://gt-umber-alpha.vercel.app`
   (comma-separated; never `*` in production).
3. Set Vercel web env: `NEXT_PUBLIC_SOCKET_URL=https://<your-server-host>`.

## Scripts

| Command              | What it does                              |
| -------------------- | ----------------------------------------- |
| `npm run dev`        | Next.js dev server                        |
| `npm run build`      | Production build (fails on type errors)   |
| `npm run lint`       | ESLint + `tsc --noEmit`                   |
| `npm run lint:fix`   | ESLint autofix                            |
| `npm run typecheck`  | `tsc --noEmit`                            |
| `npm run assets:check` | Fail if a referenced public asset is missing |
| `npm run test:smoke`| `tsx` smoke test (config/stores/validation) |
| `npm run sounds:generate` | Regenerate placeholder `.wav` audio |
| `npm run server:dev`| Socket server with watch                  |
| `npm run server:build` / `server:start` | Build / run compiled server |

CI (`.github/workflows/deploy.yml`) runs lint + typecheck + assets + smoke +
build on every push/PR to `main`. Vercel's Git integration does the deploy.

## Structure

```text
src/app/            routes: / /garage /tracks /lobby /race /results
src/components/game  Canvas, Vehicle, Track, AI, effects, camera
src/components/ui    HUD (gauge, laps, nitro, minimap, countdown…)
src/components/lobby RoomCreator, PlayerList, ChatBox, ReadyButton
src/components/screens Hero, Garage, Loading…
src/stores/         gameStore, lobbyStore (+chat), settingsStore (zustand)
src/lib/            socket (single client), constants, physics, audio
server/src/         index (bootstrap) / rooms / handlers / validation / types
scripts/            check-assets.cjs, generate-sounds.cjs, smoke.ts
public/sounds/      synthesized placeholder audio (see README inside)
```

Stack: Next 16, React 19, Three.js + @react-three/fiber/drei/cannon,
Socket.IO 4, zustand 5, Tailwind 4, Howler.

## Audio / assets

Cars and tracks render procedurally; `model` fields in
`src/lib/constants.ts` are reserved identifiers for future GLB assets.
Sounds are placeholders — drop real recordings over the same filenames in
`public/sounds/` (engine, screech, crash, nitro, beeps, ambient, wind).

## Troubleshooting

- "Multiplayer server unavailable" in lobby: `NEXT_PUBLIC_SOCKET_URL` empty
  or server down — check the value and `GET /health` on the server host.
- Room code rejected: codes are 6 chars, no `0`/`1` (ambiguous).
- Port clash locally: web `:3000`, server `:3001` — free them or set `$PORT`.
- Stale game state after refresh: `/race` resets the store on mount; `/results`
  visited directly shows a "no race recorded" notice.
