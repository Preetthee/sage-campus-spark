const baseUrl = (process.env.SAGE_API_URL || "").replace(/\/$/, "");
const token = process.env.SAGE_BOT_TOKEN || "";

async function call(path, options = {}) {
  if (!baseUrl) throw new Error("SAGE_API_URL is not set");
  if (!token) throw new Error("SAGE_BOT_TOKEN is not set");

  const res = await fetch(`${baseUrl}/api/public/discord/${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      "x-sage-bot-token": token,
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`SAGE returned a non-JSON response (${res.status})`);
  }

  if (!res.ok) {
    if (body.error === "no_data") {
      throw new Error(
        "SAGE has no telemetry yet. Open the SAGE dashboard once so it can push a snapshot.",
      );
    }
    throw new Error(body.error || `SAGE request failed (${res.status})`);
  }
  return body;
}

export const sage = {
  status: () => call("status"),
  waste: () => call("waste"),
  alerts: () => call("alerts"),
  ask: (question, asker) =>
    call("ask", { method: "POST", body: JSON.stringify({ question, asker }) }),
};

export function ageLabel(iso) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 90) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 90) return `${minutes} min ago`;
  return `${Math.round(minutes / 60)} h ago`;
}
