# SAGE Discord Bot — Critical Alerts + Status + AI Q&A

Yes, this works. The bot itself runs on your machine (Node script you start with `npm run bot`), and SAGE exposes a small set of endpoints it talks to. Because the campus simulator currently lives entirely in the browser, we add a snapshot store in Lovable Cloud so Discord always has data to report, even with no dashboard tab open.

## How it fits together

```text
Dashboard tab ──push snapshot every 30s──> Lovable Cloud (campus_snapshots)
      │                                            ▲
      └──new critical alert──> /api/public/discord/alert ──webhook──> Discord channel
                                                   │
Discord user: /status, /waste, /ask ──> local bot ──> /api/public/discord/*
```

## What gets built

### 1. Backend (Lovable Cloud)
- Enable Lovable Cloud (database + secrets).
- `campus_snapshots` table: timestamp, live load kW, waste %, efficiency score, cost today, per-building rows, top waste rooms, active alert counts. Only the latest row matters; older rows are kept for history.
- `discord_alert_log` table so the same alert is never posted twice.

### 2. Push from the dashboard
- The simulator store pushes a snapshot every 30 seconds while any tab is open.
- When an alert reaches critical severity, it is sent once to the alert endpoint.
- A "Discord" panel in Settings: enable/disable, choose minimum severity to post (critical only by default), quiet hours, and a "Send test message" button.

### 3. Endpoints the bot calls
All under `/api/public/discord/*`, each protected by a shared `SAGE_BOT_TOKEN` header so only your bot can call them:
- `GET /status` — campus summary (load, waste %, efficiency, cost, worst building).
- `GET /waste` — top waste rooms with kW and suggested action.
- `GET /alerts` — active alerts, newest first.
- `POST /ask` — free-text question answered by the Energy Guardian using Lovable AI over the latest snapshot.
- `POST /alert` — internal: dashboard posts a critical alert, server forwards it to the Discord webhook.

### 4. The local bot (`bot/` folder in this project)
- `discord.js` client with slash commands: `/status`, `/waste`, `/alerts`, `/ask <question>`.
- Replies as rich embeds, colour-coded by severity (green / amber / red).
- Reads `DISCORD_BOT_TOKEN`, `DISCORD_APP_ID`, `SAGE_API_URL`, `SAGE_BOT_TOKEN` from a local `bot/.env`.
- `bot/register-commands.js` to register the slash commands once.
- `bot/README.md` with step-by-step setup: create the Discord application, enable the bot user, copy token + application ID, invite it to your server with the right scopes, create the alerts channel webhook, fill in `.env`, run the register script, then `node bot/index.js`.

### 5. Alert delivery
Critical alerts go to Discord via an incoming webhook URL stored as a Cloud secret — no bot uptime needed for alerts, so they still fire when your local bot is off.

## Notes
- Secrets stored server-side: `DISCORD_WEBHOOK_URL`, `SAGE_BOT_TOKEN`. Nothing sensitive ships to the browser.
- The bot folder is not deployed with the site; it is a local dev tool, excluded from the app build.
- Alerts and status reflect the last pushed snapshot; if the dashboard has been closed a while, responses state how stale the data is.
