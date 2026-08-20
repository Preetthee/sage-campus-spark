# SAGE — Smart AI for Green Energy

SAGE is a campus-energy intelligence dashboard for Varendra University. It reads persisted campus telemetry from Supabase, identifies energy waste, provides reports and recommendations, and includes an optional Discord bot for campus-energy questions.

## Requirements

- Node.js 20 or later
- npm 10 or later

## Run locally

Clone the repository, install its locked dependencies, then launch the dashboard and local API together:

```bash
git clone <repository-url>
cd sage-campus-spark
npm install
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
export SAGE_PRODUCER_KEY="a-long-random-local-secret"
npm run dev:all
```

Open the frontend URL shown by Vite (normally `http://localhost:3000`). The backend runs at `http://localhost:4000`.

Apply the Supabase migration in `supabase/migrations/` before the first run. The service-role key is server-only and must never be exposed as a `VITE_` variable.

### Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev:all` | Run the frontend and backend together. |
| `npm run dev:frontend` | Run only the Vite/TanStack frontend. |
| `npm run dev:backend` | Run only the local telemetry API on port 4000. |
| `npm run telemetry:producer` | Persist the next campus telemetry reading every 8 seconds. |
| `npm run build` | Create a production frontend build. |
| `npm run discord:setup` | Configure the Discord bot interactively. |
| `npm run discord:register` | Register the Discord slash commands. |
| `npm run discord:start` | Start the Discord bot. |

## Database telemetry

The canonical live state is stored in the `campus_telemetry` Supabase table. The server-side producer initializes the campus state and persists the next reading every **8 seconds**. The browser never generates telemetry; it polls the latest database row every 8 seconds.

The producer is a development data source until a real IoT gateway is connected. It writes through `POST /api/telemetry/advance` using the `SAGE_PRODUCER_KEY` header. A future gateway can replace this endpoint while preserving the dashboard read contract.

| Endpoint | Description |
| --- | --- |
| `GET /api/telemetry/current` | The newest persisted campus state and recording timestamp. |
| `POST /api/telemetry/advance` | Trusted producer endpoint that persists the next reading. |
| `POST /api/telemetry/acknowledge` | Persists an alert acknowledgement in the latest state. |

The frontend server handles the telemetry routes. The legacy backend remains available for the existing Discord and historical API commands while those consumers are being migrated.

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

6. Start the frontend, backend, and database producer so the bot and dashboard read current data, then register the commands and start the bot:

   ```bash
   npm run dev:all
   npm run discord:register
   npm run discord:start
   ```

Set a Guild ID during setup for immediate command registration while testing. Global commands can take up to an hour to appear.

## Project structure

```text
backend/                 Legacy local HTTP API and Discord compatibility routes
bot/                     Discord slash-command bot and setup helper
src/lib/sage/            Database adapter, metrics, recommendations and types
scripts/telemetry-producer.mjs  Server-side 8-second telemetry producer
src/routes/              Dashboard pages and TanStack Start routes
src/routes/analytics.tsx Frontend consumer of local historical data
```

## Notes

- Supabase is the source of truth for current telemetry and alert acknowledgements.
- The producer is intentionally deterministic and is a development replacement for a real IoT ingestion service.
- Dashboard refresh and producer write cadence are both 8 seconds.
- This project remains connected to Lovable. Avoid force-pushing or rewriting published git history.
