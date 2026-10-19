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

### Option A: Render (one-click blueprint)

1. Push this repo to GitHub, then in Render: **New → Blueprint**,
   point it at the repo. `render.yaml` builds `Dockerfile` and sets
   `ALLOWED_ORIGINS=https://gt-umber-alpha.vercel.app` for you.
2. After deploy, copy the service URL
   (e.g. `https://velocity-nexus-server.onrender.com`) and verify
   `GET <url>/health` returns `{"ok":true,…}`.
   Note: Render free web services sleep when idle — the first lobby visit
   after idle takes ~30–60s to wake (lobby shows RECONNECTING meanwhile).

### Option B: Railway (Dockerfile)

1. Railway: **New Project → Deploy from GitHub repo**,
   select this repo. The root `Dockerfile` builds `server/` only
   (`railway.json` pins the Dockerfile builder + `/health` check).
2. Set service variable
   `ALLOWED_ORIGINS=https://gt-umber-alpha.vercel.app`,
   then **Generate Domain** under service Settings → Networking.
3. Verify `GET https://<your-domain>/health` returns `{"ok":true,…}`.

### Wire the web app (both options)

```powershell
# Add for BOTH Production and Preview scopes — preview builds need it too.
vercel env add NEXT_PUBLIC_SOCKET_URL production
vercel env add NEXT_PUBLIC_SOCKET_URL preview
# paste: https://<your-server-host>  (no trailing slash)
git push origin main   # Vercel rebuilds; /lobby flips to CONNECTED
```

The client upgrades the scheme to match the page (http->https / ws->wss on any
TLS page), so a stray `http://` value will not trip mixed-content blocking.

Set `ALLOWED_ORIGINS` on the socket host to include the production domain and
Vercel previews (`https://gt-umber-alpha.vercel.app,https://*.vercel.app`); the
server matches wildcard entries.

Health checks: the socket server exposes `GET /health` (rooms, players,
uptime); the web app exposes `GET /api/health` (uptime monitor target).

Local dev is unchanged: `NEXT_PUBLIC_SOCKET_URL=http://localhost:3001`
in `.env.local` + `npm run server:dev`.

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
