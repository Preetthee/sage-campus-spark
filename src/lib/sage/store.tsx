import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { notifyAlerts, pushSnapshot } from "@/lib/discord/discord.functions";
import { severityRank } from "@/lib/discord/shared";

import { DEFAULT_SETTINGS, computeMetrics } from "./analytics";
import { advance, createCampus } from "./simulator";
import { buildSnapshot } from "./snapshot";
import type { CampusMetrics, CampusState, Settings } from "./types";

interface SageContextValue {
  state: CampusState;
  metrics: CampusMetrics;
  settings: Settings;
  running: boolean;
  discordSyncedAt: number | null;
  discordAlertsSent: number;
  setRunning: (v: boolean) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  acknowledge: (id: string) => void;
}

const SageContext = createContext<SageContextValue | null>(null);

export function SageProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CampusState>(() => createCampus());
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [running, setRunning] = useState(true);
  const [discordSyncedAt, setDiscordSyncedAt] = useState<number | null>(null);
  const [discordAlertsSent, setDiscordAlertsSent] = useState(0);

  const latest = useRef({ state, settings });
  const sentAlertIds = useRef(new Set<string>());

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setState((prev) => advance(prev)), settings.tickMs);
    return () => window.clearInterval(id);
  }, [running, settings.tickMs]);

  const metrics = useMemo(() => computeMetrics(state, settings), [state, settings]);

  latest.current = { state, settings };

  // Push a snapshot to the backend so the Discord bot can answer /status even
  // when no dashboard tab is open.
  useEffect(() => {
    if (!settings.discordEnabled) return;

    let cancelled = false;
    const send = async () => {
      const { state: s, settings: cfg } = latest.current;
      try {
        await pushSnapshot({
          data: { snapshot: buildSnapshot(s, computeMetrics(s, cfg), cfg) },
        });
        if (!cancelled) setDiscordSyncedAt(Date.now());
      } catch (error) {
        console.error("Snapshot push failed", error);
      }
    };

    void send();
    const id = window.setInterval(() => void send(), 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [settings.discordEnabled]);

  // Forward new high-severity alerts to the Discord channel exactly once.
  useEffect(() => {
    if (!settings.discordEnabled) return;

    const hour = new Date().getHours();
    const { discordQuietHours: quiet, discordQuietFrom: from, discordQuietTo: to } = settings;
    const inQuietHours = quiet && (from <= to ? hour >= from && hour < to : hour >= from || hour < to);
    if (inQuietHours) return;

    const threshold = severityRank(settings.discordMinSeverity);
    const fresh = state.alerts.filter(
      (a) =>
        !a.acknowledged &&
        severityRank(a.severity) >= threshold &&
        !sentAlertIds.current.has(a.id),
    );
    if (fresh.length === 0) return;

    for (const alert of fresh) sentAlertIds.current.add(alert.id);

    const snapshot = buildSnapshot(state, metrics, settings);
    const payload = snapshot.activeAlerts.filter((a) => fresh.some((f) => f.id === a.id));
    if (payload.length === 0) return;

    notifyAlerts({
      data: {
        alerts: payload,
        campusName: settings.campusName,
        currency: settings.currency,
        tariff: settings.tariff,
      },
    })
      .then((res) => {
        if (res.ok && res.sent > 0) setDiscordAlertsSent((n) => n + res.sent);
      })
      .catch((error) => console.error("Discord alert push failed", error));
  }, [state.alerts, settings, metrics, state]);

  const value = useMemo<SageContextValue>(
    () => ({
      state,
      metrics,
      settings,
      running,
      discordSyncedAt,
      discordAlertsSent,
      setRunning,
      updateSettings: (patch) => setSettings((prev) => ({ ...prev, ...patch })),
      acknowledge: (id) =>
        setState((prev) => ({
          ...prev,
          alerts: prev.alerts.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)),
        })),
    }),
    [state, metrics, settings, running, discordSyncedAt, discordAlertsSent],
  );

  return <SageContext.Provider value={value}>{children}</SageContext.Provider>;
}

export function useSage() {
  const ctx = useContext(SageContext);
  if (!ctx) throw new Error("useSage must be used inside SageProvider");
  return ctx;
}