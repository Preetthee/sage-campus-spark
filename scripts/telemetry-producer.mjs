const apiUrl = process.env.SAGE_API_URL ?? "http://localhost:3000";
const producerKey = process.env.SAGE_PRODUCER_KEY;
const intervalMs = 8000;
const retryDelayMs = 1000;

if (!producerKey) {
  console.error(
    "Missing SAGE_PRODUCER_KEY. Set it in the environment before starting the telemetry producer.",
  );
  process.exit(1);
}

async function advanceTelemetry() {
  try {
    const response = await fetch(`${apiUrl}/api/telemetry/advance`, {
      method: "POST",
      headers: { "x-sage-producer-key": producerKey },
    });

    if (!response.ok) {
      console.error(`Telemetry producer failed (${response.status}): ${await response.text()}`);
      return;
    }

    const result = await response.json();
    console.log(`Telemetry persisted: tick ${result.tick} at ${result.recordedAt}`);
  } catch (error) {
    console.error("Telemetry producer request failed", error);
  }
}

async function startProducer() {
  while (true) {
    try {
      const response = await fetch(`${apiUrl}/api/telemetry/advance`, {
        method: "POST",
        headers: { "x-sage-producer-key": producerKey },
      });

      if (response.status !== 502 && response.status !== 503) {
        if (!response.ok) {
          console.error(`Telemetry producer failed (${response.status}): ${await response.text()}`);
          return;
        }

        const result = await response.json();
        console.log(`Telemetry persisted: tick ${result.tick} at ${result.recordedAt}`);
        return;
      }
    } catch {
      // Vite may still be starting when concurrently launches this process.
    }

    await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
  }
}

await startProducer();
setInterval(() => void advanceTelemetry(), intervalMs);
