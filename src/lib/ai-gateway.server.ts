import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const LOVABLE_AIG_RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

export function createLovableAiGatewayRunIdFetch(initialRunId?: string) {
  let runId = initialRunId?.trim() || undefined;
  let resolveRunId: (value: string | undefined) => void = () => {};
  let runIdResolved = false;
  const runIdReady = new Promise<string | undefined>((resolve) => {
    resolveRunId = resolve;
  });

  const publishRunId = (value?: string) => {
    const nextRunId = value?.trim() || undefined;
    if (!runId && nextRunId) runId = nextRunId;
    if (!runIdResolved) {
      runIdResolved = true;
      resolveRunId(runId);
    }
  };
  if (runId) publishRunId(runId);

  return {
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (runId && !headers.has(LOVABLE_AIG_RUN_ID_HEADER)) {
        headers.set(LOVABLE_AIG_RUN_ID_HEADER, runId);
      }
      try {
        const response = await fetch(input, { ...init, headers });
        publishRunId(response.headers.get(LOVABLE_AIG_RUN_ID_HEADER) ?? undefined);
        return response;
      } catch (error) {
        publishRunId(undefined);
        throw error;
      }
    },
    getRunId: () => runId,
    waitForRunId: () => (runId ? Promise.resolve(runId) : runIdReady),
  };
}

export function createLovableAiGatewayProvider(
  lovableApiKey: string,
  initialRunId?: string,
  options?: { structuredOutputs?: boolean },
) {
  const runIdFetch = createLovableAiGatewayRunIdFetch(initialRunId);

  const provider = createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    supportsStructuredOutputs: options?.structuredOutputs ?? false,
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
    fetch: runIdFetch.fetch as typeof fetch,
  });

  return Object.assign(provider, {
    getRunId: runIdFetch.getRunId,
    waitForRunId: runIdFetch.waitForRunId,
  });
}

/**
 * Creates a provider backed by an OpenAI-compatible endpoint. The credentials
 * deliberately stay in server environment variables and never reach the browser.
 */
export function createExternalAiProvider() {
  const apiKeys = [
    process.env["AI_API_KEY"],
    ...(process.env["AI_API_FALLBACK_KEYS"]?.split(",") ?? []),
  ]
    .map((key) => key?.trim())
    .filter((key): key is string => Boolean(key));
  const baseURL = process.env["AI_API_BASE_URL"]?.replace(/\/$/, "");
  if (apiKeys.length === 0 || !baseURL) {
    throw new Error("Missing AI_API_KEY or AI_API_BASE_URL for the external AI provider");
  }

  return createOpenAICompatible({
    name: "external-ai",
    baseURL,
    apiKey: apiKeys[0],
    fetch: createFailoverFetch(apiKeys),
  });
}

function createFailoverFetch(apiKeys: string[]): typeof fetch {
  let activeKeyIndex = 0;

  return async (input, init) => {
    const source = input instanceof Request ? new Request(input, init) : new Request(input, init);

    for (let index = activeKeyIndex; index < apiKeys.length; index++) {
      const request = source.clone();
      const headers = new Headers(request.headers);
      headers.set("Authorization", `Bearer ${apiKeys[index]}`);
      const response = await fetch(request, { headers });

      if (![403, 429].includes(response.status) || index === apiKeys.length - 1) return response;
      activeKeyIndex = index + 1;
    }

    throw new Error("No external AI API key is available");
  };
}

export function getLovableAiGatewayRunId(request: Request) {
  return request.headers.get(LOVABLE_AIG_RUN_ID_HEADER)?.trim() || undefined;
}
