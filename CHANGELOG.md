# Changelog

All notable changes to Velocity Nexus are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this
project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Readability, loading feedback & mobile

**Contrast / glow**
- The shared secondary text token was `#ff00ff80` (50%-alpha magenta), which
  rendered as a dark purple at ~2:1 against the black background. It is now an
  opaque, readable lavender (`#e6b8ff`); this lifts body copy, labels and card
  text across the hero, garage, tracks, lobby and results pages to WCAG AA/AAA
  while keeping the neon identity.
- Added a dedicated `.hero-subtitle` style (readable purple, relaxed leading) for
  the hero paragraph.
- Toned down the excessive bloom on `.neon-text`, `.neon-text-pink`,
  `NeonText` (all glow intensities + flicker) and `AnimatedGradientText` so neon
  headings stay crisp instead of washing into a bright blob.

**Track preparation feedback**
- `LoadingScreen` now exposes a determinate, accessible progress bar
  (`role="progressbar"` + `aria-valuenow`/`aria-valuetext`, clamped 0–100) with a
  stage `label`.
- Failure states are explicit: a `role="alert"` panel titled
  "TRACK PREPARATION FAILED" explains the likely cause and offers RETRY plus a
  "Back to menu" link, instead of the previous low-contrast inline string.
- Callers pass a stage label ("Loading the race engine", "Preparing the track",
  "Loading track assets", "Checking graphics support").

**Mobile**
- Hero header stacks on narrow screens and the nav wraps with smaller type so the
  brand + GARAGE/TRACKS/MULTIPLAYER links no longer overflow 375px-class phones;
  hero subtitle/CTA are fluid-sized.

### Client/server split audit

**Hosting**
- Confirmed the realtime server is a standalone Node process (`server/`, Docker
  on Render/Railway) — Vercel only builds the Next.js app, which cannot hold
  persistent WebSockets. Added `GET /api/health` to the web app for uptime
  monitors; the socket server's `/health` now also reports player count.

**Environment / connectivity**
- `getSocketUrl()` now upgrades the scheme to match the page
  (`http→https`, `ws→wss` on any TLS page) so a stray `http://` value no longer
  trips mixed-content blocking. Documented that `NEXT_PUBLIC_SOCKET_URL` must be
  set for **both** the Production and Preview Vercel environments.
- Raised the client reconnect window (25 attempts, up to 8s backoff, 20s
  connect timeout) so cold-starting free-tier hosts can wake up before the
  client gives up.
- Added a clear in-game message path: an in-race `MultiplayerStatusBanner`
  (connecting / reconnecting / unreachable, with a "server may be waking up"
  hint + Retry / single-player links), richer lobby text, and human-readable
  room-action timeout errors.

**Reconnect / multiplayer integrity**
- `clientId` is now persisted in `sessionStorage`: it survives a mid-race page
  refresh (same tab) while keeping two tabs as independent racers.
- Active room membership is persisted per tab; on connect the client
  auto-rejoins (even mid-race) and restores the authoritative race phase from
  the server.
- Server: disconnect-grace timers are tracked and cancelled on reconnect / room
  teardown (no dangling timeout, no late removal of a live player).
- Server: `room_update` now carries `hostId`; host migration emits
  `host_changed`, and the next connected player is promoted. Clients update
  `isHost` accordingly.
- Client: `room_update` / `joined_room` reconcile the render roster, so a socket
  id replaced during reconnect can never linger as a ghost car.
- Room-action rate limiting added (create/join/ready/start), and per-socket
  limiter state is cleared on disconnect (no unbounded map growth).

**Server hardening**
- CORS allowlist now supports wildcard entries
  (`https://*.vercel.app`) so preview deployments work; production domain kept.
- `/health` enriched with `players`, `status`, and `timestamp`.
- Added a `ping`/ack handler used by the client for latency measurement.

**Client rendering & UX**
- Touch controls use fluid `clamp()` sizing and safe-area padding so they fit
  375px-class phones without overflowing; held inputs release on unmount.
- Pausing now silences audio (`setAudioPaused`), fixing engine loops that kept
  playing at last volume while paused.
- Audio unlocks on the first pointer/key/touch gesture (`unlockAudioOnGesture`).
- Real asset-loading overlay driven by `useProgress()` replaces the synthetic
  loader; audio context is released on unmount (StrictMode-safe deferred
  dispose).
- Latency indicator (`LatencyIndicator`) added to the race HUD and lobby.

### Testing
- Extended the multiplayer integration suite from 13 to 19 assertions: quick
  reconnect cancels the grace timer, grace expiry removes the slot (no ghost),
  host migration, and duplicate-`clientId` rejection.
- `DISCONNECT_GRACE_MS` is now env-configurable (default 30s) for fast tests.

### Docs
- README + `.env.example`: preview-env wiring, wss normalisation, health
  endpoints; `render.yaml` CORS includes preview deployments.
