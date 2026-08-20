# SAGE Discord bot

Brings SAGE campus energy intelligence into Discord:

- **Critical alerts** are pushed automatically by SAGE to a channel webhook (no bot needed).
- **`/status`** — live load, waste, cost, CO₂, occupancy, alerts.
- **`/waste`** — the rooms wasting the most energy right now, with a recommended action.
- **`/alerts`** — every active alert with severity.
- **`/ask <question>`** — ask the AI Energy Guardian about the live campus data.

The bot runs on your own machine (or any Node host). It never touches the database directly — it calls
your SAGE deployment over HTTPS with a shared token.

---

## 1. Create the Discord app

1. Go to https://discord.com/developers/applications → **New Application**, name it `SAGE`.
2. Open **Bot** → **Reset Token** → copy the token (this is `DISCORD_BOT_TOKEN`).
3. Still on **Bot**, leave all privileged intents **off** — slash commands don't need them.
4. Open **General Information** → copy **Application ID** (this is `DISCORD_APP_ID`).
5. Open **Installation** (or OAuth2 → URL Generator), select scopes `bot` + `applications.commands`,
   permissions `Send Messages` and `Embed Links`, then open the generated URL and invite the bot to
   your server.

## 2. Create the alert webhook

1. In Discord, pick the channel for alerts → **Edit Channel** → **Integrations** → **Webhooks** →
   **New Webhook** → **Copy Webhook URL**.
2. In Lovable, that URL is stored as the `DISCORD_WEBHOOK_URL` secret (already requested during setup).
   You can verify it from SAGE → **Settings → Discord bot → Send test message**.

## 3. Configure the shared token

SAGE protects its bot endpoints with the `SAGE_BOT_TOKEN` secret. Use that exact same value in
`bot/.env` below — requests with any other value are rejected with 401.

## 4. Run the bot locally

```bash
cd bot
cp .env.example .env      # then fill in the values
npm install
npm run register          # registers the slash commands
npm start
```

Set `DISCORD_GUILD_ID` in `.env` to your server's ID while testing — guild commands appear instantly,
global ones can take up to an hour.

`SAGE_API_URL` should be your published SAGE URL, e.g. `https://sage-campus-spark.lovable.app`.

## How the data gets there

The SAGE dashboard pushes a telemetry snapshot to Lovable Cloud every 30 seconds while it's open, and
the bot reads the most recent snapshot. So the bot keeps answering after you close the tab — it just
reports the age of the snapshot in the footer. If SAGE has never been opened, commands reply with a
"no telemetry yet" message.

## Endpoints the bot uses

| Command   | Endpoint                          | Method |
| --------- | --------------------------------- | ------ |
| `/status` | `/api/public/discord/status`      | GET    |
| `/waste`  | `/api/public/discord/waste`       | GET    |
| `/alerts` | `/api/public/discord/alerts`      | GET    |
| `/ask`    | `/api/public/discord/ask`         | POST   |

All requests send the header `x-sage-bot-token: <SAGE_BOT_TOKEN>`.

## Troubleshooting

- **`Unauthorized`** — `SAGE_BOT_TOKEN` in `bot/.env` doesn't match the secret in SAGE.
- **Commands don't show up** — run `npm run register` again, and set `DISCORD_GUILD_ID` for instant registration.
- **`no telemetry yet`** — open the SAGE dashboard once with Settings → Discord integration enabled.
- **No alerts arriving** — check quiet hours and the minimum severity in SAGE → Settings → Discord bot.
