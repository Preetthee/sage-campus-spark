import "dotenv/config";
import { REST, Routes, SlashCommandBuilder } from "discord.js";

const commands = [
  new SlashCommandBuilder().setName("status").setDescription("Live campus energy status from SAGE"),
  new SlashCommandBuilder().setName("waste").setDescription("Rooms wasting the most energy right now"),
  new SlashCommandBuilder().setName("alerts").setDescription("Active SAGE energy alerts"),
  new SlashCommandBuilder()
    .setName("ask")
    .setDescription("Ask the SAGE Energy Guardian about campus energy")
    .addStringOption((option) =>
      option.setName("question").setDescription("Your question").setRequired(true).setMaxLength(400),
    ),
].map((c) => c.toJSON());

const token = process.env.DISCORD_BOT_TOKEN;
const appId = process.env.DISCORD_APP_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !appId) {
  console.error("DISCORD_BOT_TOKEN and DISCORD_APP_ID must be set in bot/.env");
  process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(token);

const route = guildId
  ? Routes.applicationGuildCommands(appId, guildId)
  : Routes.applicationCommands(appId);

await rest.put(route, { body: commands });
console.log(
  guildId
    ? `Registered ${commands.length} commands in guild ${guildId} (available immediately).`
    : `Registered ${commands.length} global commands (may take up to an hour to appear).`,
);
