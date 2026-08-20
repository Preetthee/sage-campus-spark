import "dotenv/config";
import { Client, EmbedBuilder, Events, GatewayIntentBits } from "discord.js";

import { ageLabel, sage } from "./sage-client.js";

const GREEN = 0x22c55e;
const AMBER = 0xf59e0b;
const RED = 0xef4444;

function healthColor(wastePct) {
  if (wastePct >= 25) return RED;
  if (wastePct >= 12) return AMBER;
  return GREEN;
}

function money(currency, value) {
  return `${currency} ${Math.round(value).toLocaleString("en-US")}`;
}

async function handleStatus(interaction) {
  const { snapshot, worstBuilding } = await sage.status();
  const embed = new EmbedBuilder()
    .setTitle(`⚡ ${snapshot.campusName} — live energy status`)
    .setColor(healthColor(snapshot.wastePct))
    .addFields(
      { name: "Live load", value: `${snapshot.liveKw.toFixed(2)} kW`, inline: true },
      {
        name: "Waste",
        value: `${snapshot.wasteKw.toFixed(2)} kW (${snapshot.wastePct.toFixed(1)}%)`,
        inline: true,
      },
      { name: "Efficiency", value: `${snapshot.efficiency}/100`, inline: true },
      { name: "Cost today", value: money(snapshot.currency, snapshot.dailyCost), inline: true },
      { name: "CO₂ today", value: `${snapshot.co2Daily.toFixed(1)} kg`, inline: true },
      {
        name: "Occupancy",
        value: `${snapshot.occupancy} people · ${snapshot.activeRooms}/${snapshot.totalRooms} rooms active`,
        inline: true,
      },
      {
        name: "Devices",
        value: `${snapshot.devicesOnline}/${snapshot.devicesTotal} online`,
        inline: true,
      },
      {
        name: "Open alerts",
        value: `🔴 ${snapshot.criticalAlerts} critical · 🟠 ${snapshot.warningAlerts} warning`,
        inline: true,
      },
      ...(worstBuilding
        ? [
            {
              name: "Worst block",
              value: `${worstBuilding.name} — ${worstBuilding.wastePct.toFixed(1)}% waste`,
              inline: true,
            },
          ]
        : []),
    )
    .setFooter({ text: `Snapshot ${ageLabel(snapshot.createdAt)} · SAGE` })
    .setTimestamp(new Date(snapshot.createdAt));

  await interaction.editReply({ embeds: [embed] });
}

async function handleWaste(interaction) {
  const data = await sage.waste();
  const rooms = data.rooms.slice(0, 6);

  const lines = rooms.length
    ? rooms.map((room, index) => {
        const action = room.idle
          ? "empty room still drawing power — switch off"
          : room.occupancy < 6
            ? "low occupancy for the load — consolidate the class"
            : "high load for the occupancy — check AC setpoint";
        return `**${index + 1}. ${room.code} · ${room.building}** — ${room.wasteKw.toFixed(
          2,
        )} kW wasted of ${room.kw.toFixed(2)} kW (${room.occupancy} present)\n↳ ${action}`;
      })
    : ["No measurable waste right now — nice."];

  const embed = new EmbedBuilder()
    .setTitle(`♻️ Top energy waste — ${data.campusName}`)
    .setDescription(lines.join("\n"))
    .setColor(healthColor(data.wastePct))
    .setFooter({
      text: `Campus waste ${data.wasteKw.toFixed(2)} kW (${data.wastePct.toFixed(
        1,
      )}%) · snapshot ${ageLabel(data.createdAt)}`,
    });

  await interaction.editReply({ embeds: [embed] });
}

async function handleAlerts(interaction) {
  const data = await sage.alerts();
  const alerts = data.alerts.slice(0, 8);

  const embed = new EmbedBuilder()
    .setTitle(`🚨 Active alerts — ${data.campusName}`)
    .setColor(data.critical > 0 ? RED : data.warning > 0 ? AMBER : GREEN)
    .setDescription(
      alerts.length
        ? alerts
            .map((a) => {
              const icon = a.severity === "critical" ? "🔴" : a.severity === "warning" ? "🟠" : "🟢";
              const room = a.room ? ` · ${a.room}` : "";
              return `${icon} **${a.title}**${room}\n↳ ${a.detail} (${a.wasteKw.toFixed(2)} kW)`;
            })
            .join("\n")
        : "All clear — no active alerts.",
    )
    .setFooter({
      text: `${data.critical} critical · ${data.warning} warning · snapshot ${ageLabel(data.createdAt)}`,
    });

  await interaction.editReply({ embeds: [embed] });
}

async function handleAsk(interaction) {
  const question = interaction.options.getString("question", true);
  const { answer, snapshotAt } = await sage.ask(question, interaction.user.username);

  const embed = new EmbedBuilder()
    .setTitle("🤖 SAGE Energy Guardian")
    .setColor(GREEN)
    .setDescription(`**${question}**\n\n${answer}`)
    .setFooter({ text: `Answered from telemetry ${ageLabel(snapshotAt)} · Lovable AI` });

  await interaction.editReply({ embeds: [embed] });
}

const handlers = {
  status: handleStatus,
  waste: handleWaste,
  alerts: handleAlerts,
  ask: handleAsk,
};

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error("DISCORD_BOT_TOKEN is missing — copy bot/.env.example to bot/.env and fill it in.");
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (ready) => {
  console.log(`SAGE bot online as ${ready.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const handler = handlers[interaction.commandName];
  if (!handler) return;

  await interaction.deferReply();
  try {
    await handler(interaction);
  } catch (error) {
    console.error(`/${interaction.commandName} failed:`, error);
    await interaction.editReply(`⚠️ ${error.message || "Something went wrong talking to SAGE."}`);
  }
});

await client.login(token);
