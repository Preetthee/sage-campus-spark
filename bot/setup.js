import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const rl = createInterface({ input, output });
const ask = (label, optional = false) => rl.question(`${label}${optional ? " (optional)" : ""}: `);
console.log("SAGE Discord setup — values are saved only to bot/.env (gitignored).\n");
console.log("Developer Portal: copy Application ID from General Information and Bot Token from Bot. Enable no privileged intents; slash commands only need bot + applications.commands scopes.\n");
const token = await ask("Discord Bot Token");
const appId = await ask("Discord Application ID");
const guildId = await ask("Discord Server (Guild) ID for instant test commands", true);
const sageToken = await ask("Choose a shared SAGE_BOT_TOKEN (at least 16 characters)");
await rl.close();
if (!token || !appId || sageToken.length < 16) {
  console.error("Bot Token, Application ID and a 16+ character SAGE_BOT_TOKEN are required. Nothing was saved.");
  process.exit(1);
}
const content = `DISCORD_BOT_TOKEN=${token}\nDISCORD_APP_ID=${appId}\nDISCORD_GUILD_ID=${guildId}\nSAGE_BOT_TOKEN=${sageToken}\nSAGE_API_URL=http://localhost:4000\n`;
writeFileSync(resolve(process.cwd(), ".env"), content, { encoding: "utf8", flag: "w" });
console.log("\nSaved bot/.env. The backend reads this gitignored file automatically. Next: npm run discord:register, then npm run discord:start.");
