# SAGE — Smart AI for Green Energy

SAGE is a campus-energy intelligence dashboard for Varendra University. It simulates classroom occupancy and device use, identifies energy waste, provides reports and recommendations, and includes an optional Discord bot for campus-energy questions.

## Requirements

- Node.js 20 or later
- npm 10 or later

## Run locally

Clone the repository, install its locked dependencies, then launch the dashboard and local API together:

```bash
git clone <repository-url>
cd sage-campus-spark
npm install
npm run dev:all
```

Open the frontend URL shown by Vite (normally `http://localhost:3000`). The backend runs at `http://localhost:4000`.

### Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev:all` | Run the frontend and backend together. |
| `npm run dev:frontend` | Run only the Vite/TanStack frontend. |
| `npm run dev:backend` | Run only the local telemetry API on port 4000. |
| `npm run build` | Create a production frontend build. |
| `npm run discord:setup` | Configure the Discord bot interactively. |
| `npm run discord:register` | Register the Discord slash commands. |
| `npm run discord:start` | Start the Discord bot. |

## Local backend and data

The standalone Node backend is in [`backend/server.js`](backend/server.js). At startup it deterministically generates **365 days** of campus-energy records using the same four-building context as the dashboard simulator. No database or hosted service is required for local development.

| Endpoint | Description |
| --- | --- |
| `GET /api/health` | Backend health check and generated-record count. |
| `GET /api/analytics/year` | All 365 daily energy records. |
| `GET /api/analytics/summary` | Annual totals, recent consumption, and the highest-waste day. |

Vite proxies `/api` requests to port 4000. The Energy Analytics weekly chart automatically uses the backend data when it is available; it falls back to the live browser simulation if the backend is not running.

## Discord bot

The Discord bot is optional and uses the same local 365-day data. It has these commands:

- `/status` — current campus-energy summary
- `/waste` — rooms with the highest current waste
- `/alerts` — active alerts
- `/worst-date` — date with the most energy wasted in the stored year
- `/ask <question>` — ask a historical or current energy question; for example, “which date had the most waste?”

### Configure it

1. In the [Discord Developer Portal](https://discord.com/developers/applications), open your existing application.
2. Copy its **Application ID** from **General Information** and its **Bot Token** from **Bot**.
3. Leave privileged gateway intents disabled; slash commands do not require them.
4. Under **Installation** (or OAuth2 URL Generator), invite the bot with `bot` and `applications.commands` scopes. Give it `Send Messages` and `Embed Links` permissions.
5. Run the interactive setup, which asks for the token, application ID, optional test-server/Guild ID, and a secure shared API key:

   ```bash
   npm run discord:setup
   ```

   Values are saved only in gitignored `bot/.env`. Never commit that file or share the Bot Token.

6. Start or restart the backend so it reads `bot/.env`, register the commands, then start the bot:

   ```bash
   npm run dev:backend
   npm run discord:register
   npm run discord:start
   ```

Set a Guild ID during setup for immediate command registration while testing. Global commands can take up to an hour to appear.

## Project structure

```text
backend/                 Local HTTP API and one-year telemetry generator
bot/                     Discord slash-command bot and setup helper
src/lib/sage/            Browser simulation, metrics, recommendations and types
src/routes/              Dashboard pages and TanStack Start routes
src/routes/analytics.tsx Frontend consumer of local historical data
```

## Notes

- The browser simulator remains live and interactive for demonstrations.
- The local backend is intentionally self-contained; its seeded historical data is repeatable after every clone.
- This project remains connected to Lovable. Avoid force-pushing or rewriting published git history.
