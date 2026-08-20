import { createServerFn } from "@tanstack/react-start";

import type { CampusSnapshot, SnapshotAlert } from "./shared";

export const pushSnapshot = createServerFn({ method: "POST" })
  .inputValidator((data: { snapshot: CampusSnapshot }) => data)
  .handler(async ({ data }) => {
    const { saveSnapshot } = await import("./delivery.server");
    await saveSnapshot(data.snapshot);
    return { ok: true as const };
  });

export const notifyAlerts = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      alerts: SnapshotAlert[];
      campusName: string;
      currency: string;
      tariff: number;
    }) => data,
  )
  .handler(async ({ data }) => {
    if (!process.env["DISCORD_WEBHOOK_URL"]) {
      return { ok: false as const, sent: 0, reason: "webhook_not_configured" };
    }
    const { alertEmbed, claimAlert, postToDiscord } = await import("./delivery.server");

    let sent = 0;
    for (const alert of data.alerts.slice(0, 5)) {
      if (!(await claimAlert(alert))) continue;
      await postToDiscord([alertEmbed(alert, data.campusName, data.currency, data.tariff)]);
      sent += 1;
    }
    return { ok: true as const, sent };
  });

export const sendDiscordTest = createServerFn({ method: "POST" })
  .inputValidator((data: { campusName: string }) => data)
  .handler(async ({ data }) => {
    if (!process.env["DISCORD_WEBHOOK_URL"]) {
      return { ok: false as const, reason: "webhook_not_configured" };
    }
    const { postToDiscord } = await import("./delivery.server");
    await postToDiscord([
      {
        title: "✅ SAGE is connected",
        description:
          "This channel will receive critical energy alerts from the SAGE monitoring dashboard.",
        color: 0x22c55e,
        footer: { text: `${data.campusName} · SAGE` },
        timestamp: new Date().toISOString(),
      },
    ]);
    return { ok: true as const };
  });
