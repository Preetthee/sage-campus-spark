import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { DEFAULT_SETTINGS, computeMetrics } from "./analytics";
import { advance, createCampus } from "./simulator";
import type { CampusMetrics, CampusState, Settings } from "./types";

interface SageContextValue {
  state: CampusState;
  metrics: CampusMetrics;
  settings: Settings;
  running: boolean;
  setRunning: (v: boolean) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  acknowledge: (id: string) => void;
}

const SageContext = createContext<SageContextValue | null>(null);

export function SageProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CampusState>(() => createCampus());
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setState((prev) => advance(prev)), settings.tickMs);
    return () => window.clearInterval(id);
  }, [running, settings.tickMs]);

  const metrics = useMemo(() => computeMetrics(state, settings), [state, settings]);

  const value = useMemo<SageContextValue>(
    () => ({
      state,
      metrics,
      settings,
      running,
      setRunning,
      updateSettings: (patch) => setSettings((prev) => ({ ...prev, ...patch })),
      acknowledge: (id) =>
        setState((prev) => ({
          ...prev,
          alerts: prev.alerts.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)),
        })),
    }),
    [state, metrics, settings, running],
  );

  return <SageContext.Provider value={value}>{children}</SageContext.Provider>;
}

export function useSage() {
  const ctx = useContext(SageContext);
  if (!ctx) throw new Error("useSage must be used inside SageProvider");
  return ctx;
}